import { config } from "~/config"
import transformZenodoPublication from "./transform"
import type { DocumentChunk, ZenodoFile, ZenodoRecord } from "./types"
import { runMistralOcr, runMistralEmbeddings, EMBEDDING_BATCH_SIZE } from "./mistral"
import {
  ensureRagIndex,
  fetchZenodoRecords,
  getIndexedChecksums,
  getFileIdentity,
  indexRagChunks,
  refreshRagIndex,
  removeStaleFileVersions,
  removeStaleFiles,
} from "./elastic"

export interface IngestionResult {
  records: number
  pdfFiles: number
  indexedFiles: number
  skippedFiles: number
  indexedChunks: number
}

export interface IngestionServices {
  ensureIndex: () => Promise<void>
  refreshIndex: () => Promise<void>
  fetchRecords: (catalogIndex: string) => Promise<ZenodoRecord[]>
  getIndexedChecksums: () => Promise<Map<string, Set<string>>>
  processFile: (record: ZenodoRecord, file: ZenodoFile) => Promise<DocumentChunk[]>
  indexChunks: (chunks: DocumentChunk[]) => Promise<void>
  removeStaleFileVersions: (file: ZenodoFile, recordId: string) => Promise<void>
  removeStaleFiles: (recordId: string, currentFileIds: string[]) => Promise<void>
}

async function processFile(record: ZenodoRecord, file: ZenodoFile): Promise<DocumentChunk[]> {
  const ocr = await runMistralOcr(file.key, file.url)
  return transformZenodoPublication(record, file, ocr)
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

const ingestionServices: IngestionServices = {
  ensureIndex: ensureRagIndex,
  refreshIndex: refreshRagIndex,
  fetchRecords: fetchZenodoRecords,
  getIndexedChecksums,
  processFile,
  indexChunks,
  removeStaleFileVersions,
  removeStaleFiles,
}

export async function ingestZenodoPublications(
  options: {
    catalogIndex?: string
    forceReindex?: boolean
    onProgress?: (message: string) => void
    services?: IngestionServices
  } = {},
): Promise<IngestionResult> {
  const services = options.services ?? ingestionServices
  await services.ensureIndex()

  // fetch zenodo records from catalog index
  const records = await services.fetchRecords(options.catalogIndex ?? config.elastic.indexes.catalog)

  // fetch files checksums from rag index
  const indexedChecksums = options.forceReindex ? new Map<string, Set<string>>() : await services.getIndexedChecksums()

  let pdfFiles = 0
  let indexedFiles = 0
  let skippedFiles = 0
  let indexedChunks = 0

  for (const record of records) {
    const recordId = String(record.id)

    console.warn("Only PDF files will be ingested to RAG index")
    const files = (record.files ?? []).filter((file) => file.key.toLowerCase().endsWith(".pdf"))
    const currentFileKeys = files.map((file) => file.key)

    for (const file of files) {
      pdfFiles += 1
      const checksum = file.checksum ?? undefined
      const fileIdentity = getFileIdentity(recordId, file.key)
      if (checksum && indexedChecksums.get(fileIdentity)?.has(checksum)) {
        // remove other versions of this file
        await services.removeStaleFileVersions(file, recordId)
        skippedFiles += 1
        continue
      }

      options.onProgress?.(`OCR and indexing publication ${recordId}, file ${file.key}`)
      const chunks = await services.processFile(record, file)
      await services.indexChunks(chunks)
      await services.removeStaleFileVersions(file, recordId)
      if (checksum) {
        // add newly indexed file to cheksum mapping
        const checksums = indexedChecksums.get(fileIdentity) ?? new Set<string>()
        checksums.add(checksum)
        indexedChecksums.set(fileIdentity, checksums)
      }
      indexedFiles += 1
      indexedChunks += chunks.length
    }

    // remove other files version of this record
    await services.removeStaleFiles(recordId, currentFileKeys)
  }

  await services.refreshIndex()
  return { records: records.length, pdfFiles, indexedFiles, skippedFiles, indexedChunks }
}
