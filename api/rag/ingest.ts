import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { config } from "~/config"
import { runMistralOcr, runMistralEmbeddings, EMBEDDING_BATCH_SIZE } from "./mistral"
import {
  ensureRagIndex,
  fetchCatalogItems,
  getIndexedChecksums,
  getFileIdentity,
  indexRagChunks,
  refreshRagIndex,
  removeStaleFileVersions,
  removeStaleFiles,
} from "./elastic"
import transformFile from "./transform"
import type { DocumentChunk, MistralOcrDocument, RagCatalogItem } from "./types"
import type { CatalogItemFile } from "~/schemas/catalog"

export interface IngestionResult {
  records: number
  pdfFiles: number
  indexedFiles: number
  skippedFiles: number
  indexedChunks: number
  cachedOcr: number
}

export async function extractFile(
  item: RagCatalogItem,
  file: CatalogItemFile,
): Promise<{ document: MistralOcrDocument; cached: boolean }> {
  const ocrPath = join(resolve(config.rag.ocrCacheDir), String(item.sourceId), `${file.key}.json`)

  try {
    await access(ocrPath)
    const document = JSON.parse(await readFile(ocrPath, "utf8")) as MistralOcrDocument
    return { document, cached: true }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }

  // run OCR
  const document = await runMistralOcr(file.key, file.url)
  await mkdir(resolve(config.rag.ocrCacheDir, String(item.sourceId)), { recursive: true })
  await writeFile(ocrPath, JSON.stringify(document), "utf8")
  return { document, cached: false }
}

async function indexChunks(chunks: DocumentChunk[]): Promise<void> {
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
    await indexRagChunks(embeddedChunks)
  }
}

export async function ingestCatalogItems(
  options: {
    catalogIndex?: string
    forceReindex?: boolean
    onProgress?: (message: string) => void
  } = {},
): Promise<IngestionResult> {
  // create rag index
  await ensureRagIndex()

  // fetch zenodo records from catalog index
  const items = await fetchCatalogItems(options.catalogIndex ?? config.elastic.indexes.catalog)

  // fetch files checksums from rag index
  const indexedChecksums = options.forceReindex ? new Map<string, Set<string>>() : await getIndexedChecksums()

  let pdfFiles = 0
  let indexedFiles = 0
  let skippedFiles = 0
  let indexedChunks = 0
  let cachedOcr = 0

  for (const item of items) {
    const recordId = String(item.sourceId)

    console.warn("Only PDF files will be ingested to RAG index")
    const files = (item.files ?? []).filter((file) => file.key.toLowerCase().endsWith(".pdf"))
    const currentFileKeys = files.map((file) => file.key)

    for (const file of files) {
      pdfFiles += 1
      const checksum = file.checksum ?? undefined
      const fileIdentity = getFileIdentity(recordId, file.key)
      if (checksum && indexedChecksums.get(fileIdentity)?.has(checksum)) {
        // remove other versions of this file
        await removeStaleFileVersions(file, recordId)
        skippedFiles += 1
        continue
      }

      options.onProgress?.(`Transforming and indexing publication ${recordId}, file ${file.key}`)
      // OCR document
      const { document: ocr, cached } = await extractFile(item, file)
      if (cached) cachedOcr += 1
      // chunk document
      const chunks = transformFile(item, file, ocr)
      // index chunks
      await indexChunks(chunks)
      // remove old documents chunks
      await removeStaleFileVersions(file, recordId)
      if (checksum) {
        const checksums = indexedChecksums.get(fileIdentity) ?? new Set<string>()
        checksums.add(checksum)
        indexedChecksums.set(fileIdentity, checksums)
      }
      indexedFiles += 1
      indexedChunks += chunks.length
    }

    // remove other files version of this record
    await removeStaleFiles(recordId, currentFileKeys)
  }

  await refreshRagIndex()
  return { records: items.length, pdfFiles, indexedFiles, skippedFiles, indexedChunks, cachedOcr }
}
