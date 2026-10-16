import type {
  DocumentFileMetadata,
  DocumentChunk,
  MistralOcrPage,
  MistralOcrTable,
  MistralOcrDocument,
  ZenodoRecord,
  ZenodoFile,
} from "./types"

export const MIN_CHUNK_LENGTH = 50
export const MAX_CHUNK_LENGTH = 3_000

const OCR_TABLE_REF = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/
const OCR_TABLE_REFS = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/g
const OCR_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g
const OCR_SUPERSCRIPT = /\$\^\{([^}]+)\}\$/g
const MARKDOWN_HEADING = /^(#{1,6})\s+(.*)/

function toUnixEpoch(date: string): number {
  const normalizedDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date
  const milliseconds = Date.parse(normalizedDate)
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid publication date: ${date}`)
  }
  return Math.floor(milliseconds / 1000)
}

function splitText(text: string, maxLength: number): string[] {
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

function buildFileMetadata(record: ZenodoRecord, file: ZenodoFile): DocumentFileMetadata {
  const metadata = record.metadata
  const publicationDate = metadata.publication_date ?? ""
  const keywords = (metadata.keywords ?? []).filter(Boolean).map((keyword) => keyword.toLowerCase())
  const fileName = file.key

  return {
    title: metadata.title ?? "",
    reference: "zenodo",
    record_id: String(record.id),
    publication_type: metadata.resource_type?.subtype ?? "",
    publication_date: publicationDate,
    publication_epoch: publicationDate ? toUnixEpoch(publicationDate) : 0,
    file_key: file.key,
    file_name: fileName,
    file_format: fileName.includes(".") ? (fileName.split(".").pop() ?? "") : "",
    file_url: record.doi_url ?? "",
    file_access: metadata.access_right ?? "",
    ...(file.checksum ? { file_checksum: file.checksum } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
  }
}

function transformOcrPage(page: MistralOcrPage, fileMetadata: DocumentFileMetadata): DocumentChunk[] {
  const fileNameWithoutExtension = fileMetadata.file_name.split(".")[0] ?? fileMetadata.file_name
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
        id: `zenodo_${fileMetadata.record_id}_${fileNameWithoutExtension}_p${pageIndex}_s${sectionIndex}_c${chunkIndex}`,
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

export default function transformZenodoPublication(
  record: ZenodoRecord,
  file: ZenodoFile,
  ocr: MistralOcrDocument,
): DocumentChunk[] {
  const pages = ocr.pages ?? []
  if (pages.length === 0) return []

  const fileMetadata = buildFileMetadata(record, file)
  return pages.flatMap((page) => transformOcrPage(page, fileMetadata))
}
