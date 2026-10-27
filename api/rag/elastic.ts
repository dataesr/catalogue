import { elastic, RAG_ALIAS, createIndexName } from "~/database/elastic"
import type { IndexedChunk } from "./types"
import { RAG_EMBEDDING_DIMENSIONS, RAG_MAPPING } from "~/database/mappings/rag"

export const INDEX_BATCH_SIZE = 100
const LOOKUP_BATCH_SIZE = 500

export async function createRagIndex(index: string = ""): Promise<string> {
  const ragIndex = index || (await createIndexName("catalog-rag"))
  await elastic.indices.create({
    index: ragIndex,
    settings: RAG_MAPPING.settings,
    mappings: RAG_MAPPING.mappings,
  })

  return ragIndex
}

export async function getPrevRagIndex(alias = RAG_ALIAS): Promise<string | undefined> {
  if (!(await elastic.indices.existsAlias({ name: alias }))) return undefined
  return Object.keys(await elastic.indices.getAlias({ name: alias }))[0]
}


export async function promoteRagIndex(index: string, alias = RAG_ALIAS): Promise<void> {
  const previousIndices = (await elastic.indices.existsAlias({ name: alias }))
    ? Object.keys(await elastic.indices.getAlias({ name: alias }))
    : []

  await elastic.indices.updateAliases({
    actions: [
      ...previousIndices.map((previousIndex) => ({
        remove: { index: previousIndex, alias: alias },
      })),
      { add: { index, alias: alias } },
    ],
  })
}

export async function indexRagChunks(chunks: IndexedChunk[], index: string): Promise<void> {
  if (!chunks.length) return

  const operations = chunks.flatMap((chunk) => [{ index: { _index: index, _id: chunk.id } }, chunk])
  const result = await elastic.bulk({ operations })
  if (result.errors) {
    const failedItem = result.items.find((item) => item.index?.error)
    throw new Error(`Failed to index chunk: ${JSON.stringify(failedItem?.index?.error)}`)
  }
}


export async function getRagIndexEmbeddings(index: string, hkeys: string[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>()

  // if no hkey field, return
  const mappings = await elastic.indices.getMapping({ index })
  const hasField = Object.values(mappings).some((entry) => Boolean(entry.mappings?.properties?.hkey))
  if (!hasField) {
    console.warn(`Index ${index} has no hkey field`)
    return embeddings
  }

  const unique = [...new Set(hkeys)]

  for (let offset = 0; offset < unique.length; offset += LOOKUP_BATCH_SIZE) {
    const slice = unique.slice(offset, offset + LOOKUP_BATCH_SIZE)
    const response = await elastic.search({
      index: index,
      size: slice.length,
      _source: false,
      query: { terms: { hkey: slice } },
      collapse: { field: "hkey" },
      fields: ["hkey", "embedding"],
    })

    for (const hit of response.hits.hits) {
      const hkey = (hit.fields?.hkey as string[] | undefined)?.[0]
      const embedding = hit.fields?.embedding as number[][] | number[] | undefined
      // dense_vector comes back as [[...]] in `fields`
      const vector = Array.isArray(embedding?.[0]) ? (embedding[0] as number[]) : (embedding as number[] | undefined)
      if (hkey && vector?.length === RAG_EMBEDDING_DIMENSIONS) embeddings.set(hkey, vector)
    }
  }

  return embeddings
}
