import { readFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { strFromU8, unzipSync } from "fflate"
import { MAX_CHUNK_LENGTH, MIN_CHUNK_LENGTH, indexDocumentChunks } from "./ingest-catalog"
import { splitText, toUnixEpoch } from "./utils"
import type { DocumentChunk, DocumentChunkMetadata } from "./types"

const EESR_ZENODO_ID = "19450708"
const DEFAULT_EESR_ARCHIVE_PATH = join(process.cwd(), "PAGE_EESR19.zip")
const EESR_SKIP_PAGES = new Set([
  "EESR19_POUR_EN_SAVOIR_PLUS",
  "EESR19_RESUME",
  "EESR19_PREFACE",
  "EESR19_MENTIONS_LEGALES",
  "EESR19_AUTRES_PUBLICATIONS",
  "EESR19_A_PROPOS",
  "EESR19_A_PROPOS_OD",
  "EESR19_Annexe_1",
  "EESR19_Annexe_2",
  "EESR19_Annexe_3",
  "EESR19_Annexe_4",
  "EESR19_Annexe_5",
  "EESR19_Annexe_6",
  "EESR19_Annexe_7",
  "EESR19_Annexe_8",
])
const CONTENT_FIELDS = ["PAGE_CHAPEAU_FR", "PAGE_TEXTE_FR", "PAGE_METHODE_FR", "PAGE_NOTES_FR"] as const

interface EesrIllustration {
  ILLUSTRATION_TYPE?: string
  ILLUSTRATION_TITRE_FR?: string
  ILLUSTRATION_SOUS_TYPE?: string
  ILLUSTRATION_TABLEAU_COLONNES_FR?: string
  ILLUSTRATION_TABLEAU_LIGNES_FR?: string
  ILLUSTRATION_TABLEAU_VALEURS_FR?: string
}

interface EesrPage {
  PAGE_NOM_DE_CODE?: string
  PAGE_COURANTE_ID?: string | number
  PAGE_NUMERO?: string | number
  PAGE_THEME_CODE?: string
  PAGE_TITRE_FR?: string
  PAGE_TITRE_EN?: string
  PAGE_CHAPEAU_FR?: string
  PAGE_TEXTE_FR?: string
  PAGE_METHODE_FR?: string
  PAGE_NOTES_FR?: string
  ILLUSTRATIONS?: EesrIllustration[]
  PUBLICATION?: {
    PUBLICATION_LIEN_SITE_COMPAGNON?: string | null
    PUBLICATION_LIEN?: string
    PUBLICATION_DATE_TRI?: string
    PUBLICATION_DATE_ANNEE?: string
    PUBLICATION_THEMATIQUES?: string
  }
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function illustrationToMarkdown(illustration: EesrIllustration): string {
  const columns = (illustration.ILLUSTRATION_TABLEAU_COLONNES_FR ?? "")
    .split("|")
    .map((column) => column.trim())
    .filter(Boolean)
  const rows = (illustration.ILLUSTRATION_TABLEAU_LIGNES_FR ?? "")
    .split("§")
    .map((row) => row.trim())
    .filter(Boolean)
  const values = (illustration.ILLUSTRATION_TABLEAU_VALEURS_FR ?? "").split("§")

  if (columns.length === 0 || rows.length === 0 || values.length === 0) return ""

  let markdown = `| ${columns.join(" | ")} |\n`
  markdown += `|${columns.map(() => "---").join("|")}|\n`
  for (const [index, row] of rows.entries()) {
    const rowValues = (values[index] ?? "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean)
    markdown += `| ${[row, ...rowValues].join(" | ")} |\n`
  }
  return markdown
}

function buildPageMetadata(page: EesrPage, fileName: string, recordId: string): DocumentChunkMetadata {
  const publication = page.PUBLICATION
  if (!publication) throw new Error(`EESR page ${fileName} is missing PUBLICATION metadata`)

  const title = page.PAGE_TITRE_FR || page.PAGE_TITRE_EN || ""
  const publicationDate =
    publication.PUBLICATION_DATE_TRI ||
    (publication.PUBLICATION_DATE_ANNEE ? `${publication.PUBLICATION_DATE_ANNEE}-01-01` : "")
  const publicationUrl = publication.PUBLICATION_LIEN_SITE_COMPAGNON || publication.PUBLICATION_LIEN || ""
  const pageUrl = `${publicationUrl}${page.PAGE_THEME_CODE ?? ""}/${normalizeText(title)}/`
  const pageNumber = Number(page.PAGE_NUMERO)
  const currentPageId = Number(page.PAGE_COURANTE_ID)
  const pageIndex = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : currentPageId
  if (!Number.isFinite(pageIndex)) throw new Error(`EESR page ${fileName} has an invalid page number`)

  const metadata: DocumentChunkMetadata = {
    title,
    source: "eesr",
    record_id: recordId,
    publication_type: "book",
    publication_date: publicationDate,
    publication_epoch: publicationDate ? toUnixEpoch(publicationDate) : 0,
    file_key: fileName,
    file_type: "json",
    file_url: pageUrl,
    file_access: "open",
    keywords: (publication.PUBLICATION_THEMATIQUES ?? "")
      .split(";")
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean),
    page_index: pageIndex,
    section_index: 0,
    section_title: title.slice(0, 200),
    section_level: 0,
    chunk_len: 0,
    chunk_type: "paragraph",
  }
  return metadata
}

function pageText(page: EesrPage): string {
  const title = page.PAGE_TITRE_FR || page.PAGE_TITRE_EN
  if (!page.PAGE_TEXTE_FR?.trim()) return ""
  return [title, ...CONTENT_FIELDS.map((field) => page[field]?.trim()).filter(Boolean)].join("\n\n")
}

export function transformEesrPage(page: EesrPage, fileName: string, recordId: string): DocumentChunk[] {
  // Skip annexes
  if (Number(page.PAGE_COURANTE_ID) <= 1 || EESR_SKIP_PAGES.has(page.PAGE_NOM_DE_CODE ?? "")) return []

  const chunks: DocumentChunk[] = []
  const pageMetadata = buildPageMetadata(page, fileName, recordId)
  const fileId = basename(fileName, ".json")

  // Add paragraphs chunks
  const text = pageText(page)
  if (!!text) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
    const combined: string[] = []
    let current = ""
    for (const paragraph of paragraphs) {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph
      if (candidate.length <= MAX_CHUNK_LENGTH) {
        current = candidate
      } else {
        if (current) combined.push(current)
        current = paragraph
      }
    }
    if (current.length >= MIN_CHUNK_LENGTH) combined.push(current)

    const documents = combined.flatMap((textChunk) => splitText(textChunk, MAX_CHUNK_LENGTH))
    chunks.push(
      ...documents.map((document, index) => ({
        id: `eesr_${fileId}_p${index + 1}`,
        catalog_item_id: `zenodo-${recordId}`,
        document,
        metadata: {
          ...pageMetadata,
          chunk_len: document.length,
          chunk_type: "paragraph" as const,
        },
      })),
    )
  }

  // Add table chunks
  for (const [index, illustration] of (page.ILLUSTRATIONS ?? []).entries()) {
    if (illustration.ILLUSTRATION_TYPE !== "Tableau") continue

    const markdown = illustrationToMarkdown(illustration)
    if (!markdown || markdown.length > MAX_CHUNK_LENGTH) continue

    const title = illustration.ILLUSTRATION_TITRE_FR ?? ""
    const tableType = illustration.ILLUSTRATION_SOUS_TYPE ?? ""
    const document = `${tableType}: ${title}\n${markdown}`.trim()
    chunks.push({
      id: `eesr_${fileId}_t${index}`,
      catalog_item_id: `zenodo-${recordId}`,
      document,
      metadata: {
        ...pageMetadata,
        chunk_len: document.length,
        chunk_type: "table",
        // table_title: title.slice(0, 200)
        // table_type: tableType,
      },
    })
  }

  return chunks
}

export function transformEesrArchive(archive: Uint8Array, recordId: string): DocumentChunk[] {
  const files = unzipSync(archive)
  const pageFiles = Object.keys(files)
    .filter((fileName) => fileName.endsWith(".json") && basename(fileName).startsWith("PAGE_EESR19_"))
    .sort()
  if (pageFiles.length === 0) throw new Error("EESR archive contains no page files")

  return pageFiles.flatMap((fileName) => {
    const pageText = strFromU8(files[fileName]!).replace(/^\uFEFF/, "")
    let page: EesrPage
    try {
      page = JSON.parse(pageText) as EesrPage
    } catch (error) {
      throw new Error(`Failed to parse EESR page ${basename(fileName)}: ${error}`, { cause: error })
    }
    return transformEesrPage(page, basename(fileName), recordId)
  })
}

async function fetchLatestEesrRecordId(): Promise<string> {
  const url = `https://zenodo.org/api/records/${EESR_ZENODO_ID}/versions?size=1&sort=version`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch latest EESR Zenodo version: HTTP ${response.status}`)

  const data = await response.json()
  const latestRecord = data.hits?.hits?.[0]
  if (!latestRecord?.id || latestRecord.metadata?.relations?.version?.[0]?.is_last !== true) {
    throw new Error("Zenodo did not return a valid latest EESR record")
  }
  return String(latestRecord.id)
}

export async function ingestEESR(
  index: string,
  options: {
    archivePath?: string
    cacheIndex?: string
    onProgress?: (message: string) => void
  } = {},
): Promise<{ indexedFiles: number; indexedChunks: number; cachedEmbeddings: number; newEmbeddings: number }> {
  const archivePath = options.archivePath ?? DEFAULT_EESR_ARCHIVE_PATH
  options.onProgress?.(`Loading EESR pages from ${archivePath}`)

  let archive: Uint8Array
  try {
    archive = await readFile(archivePath)
  } catch (error) {
    throw new Error(`Failed to read EESR archive at ${archivePath}: ${error}`, { cause: error })
  }

  const recordId = await fetchLatestEesrRecordId()

  const chunks = transformEesrArchive(archive, recordId)
  if (chunks.length === 0) throw new Error("EESR archive produced no chunks")

  options.onProgress?.(`Transformed ${chunks.length} EESR chunks from the latest Zenodo record ${recordId}`)
  const { cachedEmbeddings, newEmbeddings } = await indexDocumentChunks(chunks, index, options.cacheIndex)

  return {
    cachedEmbeddings,
    newEmbeddings,
    indexedFiles: new Set(chunks.map((chunk) => chunk.metadata.file_key)).size,
    indexedChunks: chunks.length,
  }
}
