import { splitText, toUnixEpoch } from "./utils"

export const MIN_CHUNK_LENGTH = 50
export const MAX_CHUNK_LENGTH = 3_000

export interface PublicationRecord {
  id: string | number
  doi_url?: string | null
  metadata: {
    title?: string | null
    publication_date?: string | null
    access_right?: string | null
    keywords?: string[] | null
    resource_type?: { subtype?: string | null } | null
  }
}

export interface PublicationFile {
  id: string
  key: string
}

export interface PublicationOcrTable {
  id: string
  content?: string | null
}

export interface PublicationOcrPage {
  index?: number
  markdown?: string | null
  tables?: PublicationOcrTable[]
}

export interface PublicationOcr {
  pages?: PublicationOcrPage[]
}

export interface PublicationFileMetadata {
  title: string
  reference: "zenodo"
  record_id: string
  publication_type: string
  publication_date: string
  publication_epoch: number
  file_id: string
  file_name: string
  file_format: string
  file_url: string
  file_access: string
  keywords?: string[]
}

export interface PublicationChunkMetadata extends PublicationFileMetadata {
  page_index: number
  section_index: number
  section_title: string
  section_level: number
  chunk_len: number
  chunk_type: "paragraph" | "table"
}

export interface PublicationChunk {
  id: string
  document: string
  metadata: PublicationChunkMetadata
}

const OCR_TABLE_REF = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/
const OCR_TABLE_REFS = /\[(tbl-[^\]]+\.md)\]\([^)]+\.md\)/g
const OCR_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g
const OCR_SUPERSCRIPT = /\$\^\{([^}]+)\}\$/g
const MARKDOWN_HEADING = /^(#{1,6})\s+(.*)/

function buildFileMetadata(record: PublicationRecord, file: PublicationFile): PublicationFileMetadata {
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
    file_id: file.id,
    file_name: fileName,
    file_format: fileName.includes(".") ? (fileName.split(".").pop() ?? "") : "",
    file_url: record.doi_url ?? "",
    file_access: metadata.access_right ?? "",
    ...(keywords.length > 0 ? { keywords } : {}),
  }
}

function cleanOcrMarkup(markdown: string, tables: Map<string, PublicationOcrTable>): string {
  return markdown
    .replace(OCR_TABLE_REFS, (_match, id: string) => tables.get(id)?.content ?? "")
    .replace(OCR_IMAGE_REF, "")
    .replace(OCR_SUPERSCRIPT, (_match, value: string) => (/^\d+$/.test(value) ? "" : value))
    .replace(/\n{2,}/g, "\n\n")
    .trim()
}

function transformPage(page: PublicationOcrPage, fileMetadata: PublicationFileMetadata): PublicationChunk[] {
  const fileNameWithoutExtension = fileMetadata.file_name.split(".")[0] ?? fileMetadata.file_name
  const pageIndex = (page.index ?? 0) + 1
  if (!page.markdown) return []

  const tables = new Map((page.tables ?? []).map((table) => [table.id, table]))
  const chunks: PublicationChunk[] = []
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

export function transformPublication(
  record: PublicationRecord,
  file: PublicationFile,
  ocr: PublicationOcr,
): PublicationChunk[] {
  const pages = ocr.pages ?? []
  if (pages.length === 0) return []

  const fileMetadata = buildFileMetadata(record, file)
  return pages.flatMap((page) => transformPage(page, fileMetadata))
}
