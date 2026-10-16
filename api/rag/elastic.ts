import { elastic, RAG_ALIAS, createRagIndexName } from "~/database/elastic"
import type { IndexedChunk } from "./types"
import type { RagCatalogItem } from "./types"
import { RAG_MAPPING } from "~/database/mappings/rag"

const PUBLICATION_SCAN_SIZE = 500

export async function fetchCatalogItems(catalogIndex: string): Promise<RagCatalogItem[]> {
  const records: RagCatalogItem[] = []
  let scrollId: string | undefined

  try {
    let response = await elastic.search<RagCatalogItem>({
      index: catalogIndex,
      scroll: "2m",
      size: PUBLICATION_SCAN_SIZE,
      query: {
        bool: {
          filter: [
            { term: { source: "zenodo" } },
            { term: { type: "publication" } },
            { term: { publicationType: "article" } },
          ],
        },
      },
      _source: ["id", "source", "sourceId", "title", "published", "accessRight", "publicationType", "keywords", "files"],
    })

    while (response.hits.hits.length > 0) {
      scrollId = response._scroll_id ?? scrollId
      for (const hit of response.hits.hits) {
        const source = hit._source
        if (!source) throw new Error(`Zenodo publication ${hit._id ?? "unknown"} is missing its Elasticsearch source`)
        records.push(source)
      }

      if (!response._scroll_id) break
      response = await elastic.scroll<RagCatalogItem>({ scroll_id: response._scroll_id, scroll: "2m" })
    }
  } finally {
    if (scrollId) await elastic.clearScroll({ scroll_id: scrollId })
  }

  return records
}

export async function createRagIndex(index = createRagIndexName()): Promise<string> {
  await elastic.indices.create({
    index,
    settings: RAG_MAPPING.settings,
    mappings: RAG_MAPPING.mappings,
  })

  return index
}

export async function createNextRagIndex(date = new Date()): Promise<string> {
  for (let suffix = 0; ; suffix += 1) {
    const index = createRagIndexName(date, suffix)
    if (await elastic.indices.exists({ index })) continue
    return createRagIndex(index)
  }
}

export async function promoteRagIndex(index: string): Promise<void> {
  const previousIndices = (await elastic.indices.existsAlias({ name: RAG_ALIAS }))
    ? Object.keys(await elastic.indices.getAlias({ name: RAG_ALIAS }))
    : []

  await elastic.indices.updateAliases({
    actions: [
      ...previousIndices.map((previousIndex) => ({
        remove: { index: previousIndex, alias: RAG_ALIAS },
      })),
      { add: { index, alias: RAG_ALIAS, is_write_index: true } },
    ],
  })
}

export async function refreshRagIndex(index: string): Promise<void> {
  await elastic.indices.refresh({ index })
}

export async function indexRagChunks(chunks: IndexedChunk[], index = RAG_ALIAS): Promise<void> {
  if (!chunks.length) return

  const operations = chunks.flatMap((chunk) => [{ index: { _index: index, _id: chunk.id } }, chunk])
  const result = await elastic.bulk({ operations })
  if (result.errors) {
    const failedItem = result.items.find((item) => item.index?.error)
    throw new Error(`Failed to index chunk: ${JSON.stringify(failedItem?.index?.error)}`)
  }
}