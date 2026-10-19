import type { CatalogItem } from "~/schemas/catalog"

export type RagCatalogItem = Pick<
  CatalogItem,
  | "id"
  | "source"
  | "sourceId"
  | "title"
  | "published"
  | "accessRight"
  | "publicationType"
  | "keywords"
  | "files"
>

export interface MistralOcrTable {
  id: string
  content?: string | null
}

export interface MistralOcrPage {
  index?: number
  markdown?: string | null
  tables?: MistralOcrTable[]
}

export interface MistralOcrDocument {
  pages?: MistralOcrPage[]
}

export interface DocumentFileMetadata {
  title: string
  source: string
  record_id: string
  publication_type: string
  publication_date: string
  publication_epoch: number
  file_key: string
  file_type: string
  file_url: string
  file_access: string
  file_checksum?: string
  keywords?: string[]
}

export interface DocumentChunkMetadata extends DocumentFileMetadata {
  page_index: number
  section_index: number
  section_title: string
  section_level: number
  chunk_len: number
  chunk_type: "paragraph" | "table"
}

export interface DocumentChunk {
  id: string
  catalog_item_id: CatalogItem["id"]
  document: string
  metadata: DocumentChunkMetadata
}

export interface IndexedChunk extends DocumentChunk {
  embedding?: number[]
}

export interface RetrievedChunk extends DocumentChunk {
  distance?: number | null
  denseScore?: number | null
  sparseScore?: number | null
  rrfScore?: number | null
  rerankScore?: number | null
}
