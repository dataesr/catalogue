import type { CatalogItemFile } from "~/schemas/catalog"
import type {
  DocumentFileMetadata,
  DocumentChunk,
  MistralOcrPage,
  MistralOcrTable,
  MistralOcrDocument,
  RagCatalogItem,
} from "./types"

export const MIN_CHUNK_LENGTH = 50
export const MAX_CHUNK_LENGTH = 3_000

const OCR_TABLE_REF = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/
const OCR_TABLE_REFS = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/g
const OCR_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g
const OCR_SUPERSCRIPT = /\$\^\{([^}]+)\}\$/g
const MARKDOWN_HEADING = /^(#{1,6})\s+(.*)/

export function toUnixEpoch(date: string): number {
  const normalizedDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date
  const milliseconds = Date.parse(normalizedDate)
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid publication date: ${date}`)
  }
  return Math.floor(milliseconds / 1000)
}

export function splitText(text: string, maxLength: number): string[] {
  const remainingText = text.trim()
  if (remainingText.length <= maxLength) return remainingText ? [remainingText] : []

  const chunks: string[] = []
  let remaining = remainingText
  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength)
    if (splitAt < maxLength / 2) splitAt = remaining.lastIndexOf(" ", maxLength)
    if (splitAt <= 0) splitAt = maxLength

    chunks.push(remaining.slice(0, splitAt).trim())
    remaining = remaining.slice(splitAt).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

function cleanOcrMarkup(markdown: string, tables: Map<string, MistralOcrTable>): string {
  return markdown
    .replace(OCR_TABLE_REFS, (_match, id: string) => tables.get(id)?.content ?? "")
    .replace(OCR_IMAGE_REF, "")
    .replace(OCR_SUPERSCRIPT, (_match, value: string) => (/^\d+$/.test(value) ? "" : value))
    .replace(/\n{2,}/g, "\n\n")
    .trim()
}

function buildFileMetadata(item: RagCatalogItem, file: CatalogItemFile): DocumentFileMetadata {
  return {
    record_id: String(item.sourceId),
    source: item.source,
    title: item.title ?? "",
    publication_type: item.publicationType ?? "unknown",
    publication_date: item.published ?? "",
    publication_epoch: item.published ? toUnixEpoch(item.published) : 0,
    file_key: file.key,
    file_type: file.type ?? "unknown",
    file_url: file.url,
    file_access: item.accessRight ?? "closed",
    ...(file.checksum ? { file_checksum: file.checksum } : {}),
    ...(item.keywords.length > 0 ? { keywords: item.keywords } : {}),
  }
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
    const processed = cleanOcrMarkup(trimmedParagraph, tables)
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

export default function transformFile(
  item: RagCatalogItem,
  file: CatalogItemFile,
  ocr: MistralOcrDocument,
): DocumentChunk[] {
  const pages = ocr.pages ?? []
  if (pages.length === 0) return []

  const fileMetadata = buildFileMetadata(item, file)
  return pages.flatMap((page) => transformOcrPage(page, item.id, fileMetadata))
}
