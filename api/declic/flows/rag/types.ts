// ZenodoFile after Catalog indexation
export interface ZenodoFile {
  key: string
  url: string
  checksum?: string
  size?: number
  type?: string
}

export interface ZenodoRecord {
  id: string | number
  doi_url?: string | null
  metadata: {
    title?: string | null
    publication_date?: string | null
    access_right?: string | null
    keywords?: string[] | null
    resource_type?: { subtype?: string | null } | null
  }
  files?: ZenodoFile[]
}

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
  reference: "zenodo"
  record_id: string
  publication_type: string
  publication_date: string
  publication_epoch: number
  file_key: string
  file_name: string
  file_format: string
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
  document: string
  metadata: DocumentChunkMetadata
}
