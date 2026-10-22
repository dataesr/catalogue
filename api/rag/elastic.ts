import { elastic, RAG_ALIAS, createIndexName } from "~/database/elastic"
import type { IndexedChunk } from "./types"
import { RAG_MAPPING } from "~/database/mappings/rag"

export async function createRagIndex(index: string = ""): Promise<string> {
  const ragIndex = index || (await createIndexName("catalog-rag"))
  await elastic.indices.create({
    index: ragIndex,
    settings: RAG_MAPPING.settings,
    mappings: RAG_MAPPING.mappings,
  })

  return ragIndex
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
