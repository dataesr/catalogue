import { s3 } from "bun"
import { join, resolve } from "node:path"
import { config } from "~/config"
import { runMistralOcr, runMistralEmbeddings, EMBEDDING_BATCH_SIZE } from "./mistral"
import { indexRagChunks } from "./elastic"
import { elastic } from "~/database/elastic"
import type { DocumentChunk, DocumentFileMetadata, MistralOcrDocument, MistralOcrPage, RagCatalogItem } from "./types"
import type { CatalogItemFile } from "~/schemas/catalog"
import { splitText, toUnixEpoch } from "./utils"

export const MIN_CHUNK_LENGTH = 50
export const MAX_CHUNK_LENGTH = 3_000

const OCR_TABLE_REF = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/
const OCR_TABLE_REFS = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/g
const OCR_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g
const OCR_SUPERSCRIPT = /\$\^\{([^}]+)\}\$/g
const MARKDOWN_HEADING = /^(#{1,6})\s+(.*)/

const PUBLICATION_SCAN_SIZE = 500
const EXTRA_BOOK_IDS = ["18660928"] // L'état de l'emploi scientifque en France - Edition 2025

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
                filter: [{ term: { publicationType: "book" } }, { terms: { sourceId: EXTRA_BOOK_IDS } }],
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

async function extractFile(
  item: RagCatalogItem,
  file: CatalogItemFile,
  forceOcr?: boolean,
): Promise<{ document: MistralOcrDocument; cached: boolean }> {
  // needs AWS_ACCESS_KEY_ID, AWS_SECRET_KEY, AWS_REGION, AWS_ENDPOINT, AWS_BUCKET env vars
  const s3path = join(resolve(config.rag.ocrCacheDir), String(item.sourceId), `${file.key}.json`)
  const s3file = s3.file(s3path)

  if (!forceOcr) {
    try {
      const exists = await s3file.exists()
      if (exists) {
        const document = (await s3file.json()) as MistralOcrDocument
        return { document, cached: true }
      }
    } catch (error) {
      throw error
    }
  }

  // run OCR
  const document = await runMistralOcr(file.key, file.url)
  await s3file.write(JSON.stringify(document), { type: "application/json" })
  return { document, cached: false }
}

function transformOcrPage(
  page: MistralOcrPage,
  catalogItemId: RagCatalogItem["id"],
  fileMetadata: DocumentFileMetadata,
): DocumentChunk[] {
  const fileNameWithoutExtension = fileMetadata.file_key.split(".")[0] ?? fileMetadata.file_key
  const pageIndex = (page.index ?? 0) + 1
  if (!page.markdown) return []

  const tables = new Map((page.tables ?? []).map((table) => [table.id, table]))
  const chunks: DocumentChunk[] = []
  let currentDocument = ""
  let currentChunkContainsTable = false
  let sectionTitle = ""
  let sectionLevel = 0
  let sectionIndex = 0
  let chunkIndex = 0

  const flushChunk = () => {
    const document = currentDocument.trim()
    const isTable = currentChunkContainsTable
    currentDocument = ""
    currentChunkContainsTable = false
    if (!document) return

    if (document.length < MIN_CHUNK_LENGTH) return

    for (const nextDocument of splitText(document, MAX_CHUNK_LENGTH)) {
      chunkIndex += 1
      chunks.push({
        id: `${fileMetadata.record_id}_${fileNameWithoutExtension}_p${pageIndex}_s${sectionIndex}_c${chunkIndex}`,
        catalog_item_id: catalogItemId,
        document: nextDocument,
        metadata: {
          ...fileMetadata,
          page_index: pageIndex,
          section_index: sectionIndex,
          section_title: sectionTitle.slice(0, 200),
          section_level: sectionLevel,
          chunk_len: nextDocument.length,
          chunk_type: isTable ? "table" : "paragraph",
        },
      })
    }
  }

  for (const paragraph of page.markdown.split(/\n\s*\n/)) {
    const trimmedParagraph = paragraph.trim()
    if (!trimmedParagraph) continue

    const lines = trimmedParagraph.split("\n")
    const headingMatch = lines[0]?.match(MARKDOWN_HEADING)

    if (headingMatch) {
      flushChunk()
      chunkIndex = 0
      sectionIndex += 1
      sectionLevel = headingMatch[1]?.length ?? 0
      const titleParts = [headingMatch[2] ?? ""]
      for (const line of lines.slice(1)) {
        const trimmedLine = line.trim()
        if (!trimmedLine) break
        titleParts.push(trimmedLine)
      }
      sectionTitle = titleParts.join(" ")
      continue
    }

    const containsTable = OCR_TABLE_REF.test(trimmedParagraph)
    const processed = trimmedParagraph
      .replace(OCR_TABLE_REFS, (_match, id: string) => tables.get(id)?.content ?? "")
      .replace(OCR_IMAGE_REF, "")
      .replace(OCR_SUPERSCRIPT, (_match, value: string) => (/^\d+$/.test(value) ? "" : value))
      .replace(/\n{2,}/g, "\n\n")
      .trim()

    if (!processed) continue

    if (containsTable && processed.length > MAX_CHUNK_LENGTH) continue

    const nextDocument = currentDocument ? `${currentDocument}\n\n${processed}` : processed
    if (nextDocument.length <= MAX_CHUNK_LENGTH) {
      currentDocument = nextDocument
      currentChunkContainsTable ||= containsTable
    } else {
      flushChunk()
      currentDocument = processed
      currentChunkContainsTable = containsTable
    }
  }

  flushChunk()
  return chunks
}

function transformFile(item: RagCatalogItem, file: CatalogItemFile, ocr: MistralOcrDocument): DocumentChunk[] {
  const pages = ocr.pages ?? []
  if (pages.length === 0) return []

  const fileMetadata = {
    record_id: String(item.sourceId),
    source: item.source,
    title: item.title ?? "",
    publication_type: item.publicationType ?? "unknown",
    publication_date: item.published ?? "",
    publication_epoch: item.published ? toUnixEpoch(item.published) : 0,
    file_key: file.key,
    file_type: file.type ?? "unknown",
    file_url: file.url.replace("/api", "").replace(/\/files.*$/, ""),
    file_access: item.accessRight ?? "closed",
    ...(file.checksum ? { file_checksum: file.checksum } : {}),
    ...(item.keywords.length > 0 ? { keywords: item.keywords } : {}),
  }

  return pages.flatMap((page) => transformOcrPage(page, item.id, fileMetadata))
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

interface IngestionResult {
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
  const items = await fetchCatalogItems(options.catalogIndex || config.elastic.indexes.catalog)
  if (items.length === 0) {
    throw new Error("No catalog items found to ingest")
  }
  options.onProgress?.(`Found ${items.length} catalog items to ingest`)

  let processedFiles = 0
  let indexedFiles = 0
  let indexedChunks = 0
  let cachedOcr = 0

  for (const item of items) {
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
