import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { config } from "~/config"
import { runMistralOcr, runMistralEmbeddings, EMBEDDING_BATCH_SIZE } from "./mistral"
import { indexRagChunks } from "./elastic"
import { elastic } from "~/database/elastic"
import transformFile from "./transform"
import type { DocumentChunk, MistralOcrDocument, RagCatalogItem } from "./types"
import type { CatalogItemFile } from "~/schemas/catalog"

const PUBLICATION_SCAN_SIZE = 500
const BOOK_IDS = ["18660928"] // L'état de l'emploi scientifque en France - Edition 2025

async function fetchCatalogItems(catalogIndex: string): Promise<RagCatalogItem[]> {
  const items: RagCatalogItem[] = []
  let scrollId: string | undefined

  try {
    let response = await elastic.search<RagCatalogItem>({
      index: catalogIndex,
      scroll: "2m",
      size: PUBLICATION_SCAN_SIZE,
      query: {
        bool: {
          filter: [{ term: { source: "zenodo" } }, { term: { type: "publication" } }],
          should: [
            { term: { publicationType: "article" } },
            {
              bool: {
                filter: [{ term: { publicationType: "book" } }, { terms: { sourceId: BOOK_IDS } }],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      _source: ["id", "source", "sourceId", "title", "published", "accessRight", "publicationType", "keywords", "files"],
    })

    while (response.hits.hits.length > 0) {
      scrollId = response._scroll_id ?? scrollId
      for (const hit of response.hits.hits) {
        const source = hit._source
        if (!source) throw new Error(`Zenodo publication ${hit._id ?? "unknown"} is missing its Elasticsearch source`)
        items.push(source)
      }

      if (!response._scroll_id) break
      response = await elastic.scroll<RagCatalogItem>({ scroll_id: response._scroll_id, scroll: "2m" })
    }
  } finally {
    if (scrollId) await elastic.clearScroll({ scroll_id: scrollId })
  }

  return items
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

export async function indexDocumentChunks(chunks: DocumentChunk[], index: string): Promise<void> {
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

export interface IngestionResult {
  fetchedItems: number
  processedFiles: number
  indexedFiles: number
  indexedChunks: number
  cachedOcr: number
}

export async function ingestCatalogItems(
  index: string,
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

  let processedFiles = 0
  let indexedFiles = 0
  let indexedChunks = 0
  let cachedOcr = 0

  for (const item of items) {
    const recordId = String(item.sourceId)

    // filter pdf files
    const files = (item.files ?? []).filter((file) => file.key.toLowerCase().endsWith(".pdf"))

    for (const file of files) {
      processedFiles += 1
      // OCR document
      const { document: ocr, cached } = await extractFile(item, file, options?.forceOcr)
      if (cached) cachedOcr += 1
      // chunk document
      const chunks = transformFile(item, file, ocr)
      // index chunks
      await indexDocumentChunks(chunks, index)
      indexedFiles += 1
      indexedChunks += chunks.length
    }
  }

  if (indexedChunks === 0) {
    throw new Error(`RAG index ${index} contains no chunks`)
  }

  return { fetchedItems: items.length, processedFiles, indexedFiles, indexedChunks, cachedOcr }
}
