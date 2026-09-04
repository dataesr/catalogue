import { t } from "elysia"

const ragSourceSchema = t.Object({
  id: t.String(),
  document: t.String(),
  metadata: t.Record(t.String(), t.Any()),
  distance: t.Number(),
  rerank_score: t.Number(),
  bm25_score: t.Optional(t.Nullable(t.Number())),
  rrf_score: t.Optional(t.Nullable(t.Number())),
})

export const ragResponseSchema = t.Object({
  sources: t.Array(ragSourceSchema),
  // answer: t.String(),
  // citations: t.Array(),
})

export type RagSource = typeof ragSourceSchema.static
export type RagResponse = typeof ragResponseSchema.static
