import { t } from "elysia"

const ragSourceMetadataSchema = t.Object({
  record_id: t.Number(),
  title: t.String(),
  doc_type: t.String(),
  file_format: t.String(),
  file_id: t.String(),
  file_name: t.String(),
  keywords: t.String(),
  created: t.String(),
  modified: t.String(),
  chunk_type: t.String(),
  page_index: t.Number(),
  publication_date: t.String(),
  publication_epoch: t.Number(),
  section_level: t.Number(),
  section_title: t.String(),
})

const ragSourceSchema = t.Object({
  distance: t.Number(),
  document: t.String(),
  metadata: ragSourceMetadataSchema,
})

export const ragResponseSchema = t.Object({
  answer: t.String(),
  sources: t.Array(ragSourceSchema),
})

export type RagSource = typeof ragSourceSchema.static
export type RagResponse = typeof ragResponseSchema.static
