import { t } from "elysia"
import { catalogItemSchema } from "./catalog"

// ─── RAG source ────────────────────────────────────────────

const ragSourceSchema = t.Object({
  id: t.String(),
  document: t.String(),
  metadata: t.Record(t.String(), t.Any()),
  distance: t.Number(),
  rerank_score: t.Optional(t.Number()),
  bm25_score: t.Optional(t.Nullable(t.Number())),
  rrf_score: t.Optional(t.Nullable(t.Number())),
})
export type RagSource = typeof ragSourceSchema.static

// ─── RAG search params ──────────────────────────────────────

export const ragSearchParamsSchema = t.Object({
  q: t.String(),
  topK: t.Optional(t.Number()),
  topic: t.Optional(t.Array(t.String())),
  publicationType: t.Optional(t.String()),
  accessRight: t.Optional(t.String()),
})
export type RagSearchParams = typeof ragSearchParamsSchema.static

// ─── RAG completion response ────────────────────────────────

export const ragResponseSchema = t.Object({
  sources: t.Array(ragSourceSchema),
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
  sources: t.Array(ragSourceSchema),
})
export type RagCompletionParams = typeof ragCompletionParamsSchema.static

