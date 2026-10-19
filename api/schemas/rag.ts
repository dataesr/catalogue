import { t } from "elysia"
import { catalogItemSchema } from "./catalog"

// ─── RAG chunks ────────────────────────────────────────────

const ragChunkSchema = t.Object({
  id: t.String(),
  catalog_item_id: t.Optional(t.String()),
  document: t.String(),
  metadata: t.Record(t.String(), t.Any()),
  distance: t.Optional(t.Nullable(t.Number())),
  denseScore: t.Optional(t.Nullable(t.Number())),
  rerankScore: t.Optional(t.Nullable(t.Number())),
  sparseScore: t.Optional(t.Nullable(t.Number())),
  rrfScore: t.Optional(t.Nullable(t.Number())),
})
export type RagChunk = typeof ragChunkSchema.static

// ─── RAG search params ──────────────────────────────────────

export const ragSearchParamsSchema = t.Object({
  q: t.String(),
  topK: t.Optional(t.Number()),
  topic: t.Optional(t.Array(t.String())),
  publicationType: t.Optional(t.String()),
  accessRight: t.Optional(t.String()),
  useRerank: t.Optional(t.Boolean({ default: true })),
  useHybrid: t.Optional(t.Boolean({ default: true })),
})
export type RagSearchParams = typeof ragSearchParamsSchema.static

// ─── RAG completion response ────────────────────────────────

export const ragResponseSchema = t.Object({
  sources: t.Array(ragChunkSchema),
  // answer: t.String(),
  // citations: t.Array(),
})
export const ragSearchResponseSchema = t.Composite([
  ragResponseSchema,
  t.Object({
    items: t.Record(t.String(), catalogItemSchema),
  }),
])
export type RagResponse = typeof ragResponseSchema.static
export type RagSearchResponse = typeof ragSearchResponseSchema.static

// ─── RAG completion params ──────────────────────────────────

export const ragCompletionParamsSchema = t.Object({
  q: t.String(),
  chunks: t.Array(ragChunkSchema),
})
export type RagCompletionParams = typeof ragCompletionParamsSchema.static
