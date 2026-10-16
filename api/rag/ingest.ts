import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { config } from "~/config"
import { runMistralOcr, runMistralEmbeddings, EMBEDDING_BATCH_SIZE } from "./mistral"
import { createNextRagIndex, fetchCatalogItems, indexRagChunks, promoteRagIndex, refreshRagIndex } from "./elastic"
import { elastic } from "~/database/elastic"
import transformFile from "./transform"
import type { DocumentChunk, MistralOcrDocument, RagCatalogItem } from "./types"
import type { CatalogItemFile } from "~/schemas/catalog"

export interface IngestionResult {
  index: string
  records: number
  processedFiles: number
  indexedFiles: number
  indexedChunks: number
  cachedOcr: number
}

export async function extractFile(
  item: RagCatalogItem,
  file: CatalogItemFile,
  forceOcr?: boolean,
): Promise<{ document: MistralOcrDocument; cached: boolean }> {
  const ocrPath = join(resolve(config.rag.ocrCacheDir), String(item.sourceId), `${file.key}.json`)

  if (!forceOcr) {
    try {
      await access(ocrPath)
      const document = JSON.parse(await readFile(ocrPath, "utf8")) as MistralOcrDocument
      return { document, cached: true }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }

  // run OCR
  const document = await runMistralOcr(file.key, file.url)
  await mkdir(resolve(config.rag.ocrCacheDir, String(item.sourceId)), { recursive: true })
  await writeFile(ocrPath, JSON.stringify(document), "utf8")
  return { document, cached: false }
}

async function indexChunks(chunks: DocumentChunk[], index: string): Promise<void> {
  for (let offset = 0; offset < chunks.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(offset, offset + EMBEDDING_BATCH_SIZE)
    const embeddings = await runMistralEmbeddings(batch.map((chunk) => chunk.document))
    const embeddedChunks = batch.map((chunk, index) => {
      const result = embeddings[index]
      if (!result) {
        throw new Error(`Mistral returned an invalid embedding for chunk ${chunk.id}`)
      }
      return { ...chunk, embedding: result }
    })
    await indexRagChunks(embeddedChunks, index)
  }
}

export async function ingestCatalogItems(
  options: {
    catalogIndex?: string
    forceOcr?: boolean
    onProgress?: (message: string) => void
  } = {},
): Promise<IngestionResult> {
  // fetch zenodo records from catalog index
  const items = await fetchCatalogItems(options.catalogIndex ?? config.elastic.indexes.catalog)
  if (items.length === 0) {
    throw new Error("No catalog items found to ingest")
  }
  options.onProgress?.(`Found ${items.length} catalog items to ingest`)

  const index = await createNextRagIndex()
  options.onProgress?.(`Created new RAG index ${index} for ingestion`)

  let processedFiles = 0
  let indexedFiles = 0
  let indexedChunks = 0
  let cachedOcr = 0

  for (const item of items) {
    const recordId = String(item.sourceId)

    // filter pdf files
    const files = (item.files ?? []).filter((file) => file.key.toLowerCase().endsWith(".pdf"))
    options.onProgress?.(`Processing catalog item ${recordId} with ${files.length} PDF files`)

    for (const file of files) {
      processedFiles += 1
      options.onProgress?.(`Transforming and indexing publication ${recordId}, file ${file.key})`)
      // OCR document
      const { document: ocr, cached } = await extractFile(item, file, options?.forceOcr)
      if (cached) cachedOcr += 1
      // chunk document
      const chunks = transformFile(item, file, ocr)
      // index chunks
      await indexChunks(chunks, index)
      indexedFiles += 1
      indexedChunks += chunks.length
    }
  }

  if (indexedChunks === 0) {
    throw new Error(`RAG index ${index} contains no chunks; refusing to promote an empty index`)
  }

  await refreshRagIndex(index)
  const indexedCount = (await elastic.count({ index })).count
  if (indexedCount !== indexedChunks) {
    throw new Error(`RAG index ${index} contains ${indexedCount} chunks, expected ${indexedChunks}`)
  }
  // await promoteRagIndex(index) // TODO: manual promotion for now
  return { index, records: items.length, processedFiles, indexedFiles, indexedChunks, cachedOcr }
}
