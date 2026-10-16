import type { estypes } from "@elastic/elasticsearch"
import { config } from "~/config"
import { elastic, RAG_ALIAS } from "~/database/elastic"
import type { RagResponse, RagSearchParams } from "~/schemas/rag"
import { runMistralEmbeddings } from "./mistral"
import { runCrossEncoder } from "./rerank"
import type { IndexedChunk, RetrievedChunk } from "./types"

const MAX_RESULTS = 50
const RETRIEVAL_MULTIPLIER = 5
const RRF_K = 60
const DENSE_WEIGHT = 0.7
const LEXICAL_WEIGHT = 0.3
const MIN_CHUNK_LENGTH = 50

function clampTopK(topK: number | undefined): number {
  if (topK === undefined || !Number.isFinite(topK)) return 5
  return Math.max(1, Math.min(Math.trunc(topK), MAX_RESULTS))
}

export function buildRagFilters(params: RagSearchParams, now = new Date()): estypes.QueryDslQueryContainer[] {
  const filters: estypes.QueryDslQueryContainer[] = [
    { range: { "metadata.publication_epoch": { gte: Date.UTC(now.getUTCFullYear() - 4, 0, 1) / 1000 } } }, // 4 last years
    { range: { "metadata.chunk_len": { gte: MIN_CHUNK_LENGTH } } },
  ]

  if (params.accessRight) filters.push({ term: { "metadata.file_access": params.accessRight } })
  if (params.publicationType) filters.push({ term: { "metadata.publication_type": params.publicationType } })
  if (params.topic?.length) {
    filters.push({ terms: { "metadata.keywords": params.topic.map((topic) => topic.toLowerCase()) } })
  }
  return filters
}

export function cosineDistanceFromElasticScore(score: number): number {
  return Math.max(0, Math.min(2, 2 - 2 * score))
}

export function reciprocalRankFusion(
  denseResults: RetrievedChunk[],
  lexicalResults: Array<{ id: string; score: number }>,
): RetrievedChunk[] {
  if (!lexicalResults.length) return denseResults

  const fused = new Map<string, RetrievedChunk>()
  denseResults.forEach((result, index) => {
    const rank = index + 1
    fused.set(result.id, {
      ...result,
      bm25_score: null,
      rrf_score: DENSE_WEIGHT / (RRF_K + rank),
    })
  })

  lexicalResults.forEach((result, index) => {
    const existing = fused.get(result.id)
    if (!existing) return
    existing.bm25_score = result.score
    existing.rrf_score = (existing.rrf_score ?? 0) + LEXICAL_WEIGHT / (RRF_K + index + 1)
  })

  return [...fused.values()].sort((left, right) => (right.rrf_score ?? 0) - (left.rrf_score ?? 0))
}

export async function searchRag(params: RagSearchParams): Promise<RagResponse> {
  const query = params.q.trim()
  if (!query) throw new Error("RAG query must not be empty")

  const topK = clampTopK(params.topK)
  const retrievalK = Math.min(topK * RETRIEVAL_MULTIPLIER, MAX_RESULTS)
  const numCandidates = Math.min(MAX_RESULTS * RETRIEVAL_MULTIPLIER, Math.max(retrievalK * 10, 100))

  const [queryVector] = await runMistralEmbeddings([query])
  const filters = buildRagFilters(params)

  const [denseResponse, lexicalResponse] = await Promise.all([
    elastic.search<IndexedChunk>({
      index: RAG_ALIAS,
      size: retrievalK,
      knn: {
        field: "embedding",
        query_vector: queryVector,
        k: retrievalK,
        num_candidates: numCandidates,
        filter: filters,
      },
      _source: ["id", "document", "metadata"],
    }),
    elastic.search<IndexedChunk>({
      index: RAG_ALIAS,
      size: retrievalK,
      query: {
        bool: {
          filter: filters,
          must: [
            {
              bool: {
                should: [
                  {
                    multi_match: {
                      query,
                      fields: ["document", "metadata.title^2", "metadata.section_title^1.5"],
                      type: "best_fields",
                    },
                  },
                  ...(query.split(/\s+/).filter(Boolean).length
                    ? [{ terms: { "metadata.keywords": query.toLowerCase().split(/\s+/).filter(Boolean) } }]
                    : []),
                ],
                minimum_should_match: 1,
              },
            },
          ],
        },
      },
      _source: ["id", "document", "metadata"],
    }),
  ])

  const denseResults = denseResponse.hits.hits.flatMap((hit) => {
    if (!hit._source || typeof hit._score !== "number") return []
    return [
      {
        id: hit._source.id,
        document: hit._source.document,
        metadata: hit._source.metadata,
        distance: cosineDistanceFromElasticScore(hit._score),
      },
    ]
  })
  const lexicalResults = lexicalResponse.hits.hits.flatMap((hit) => {
    if (!hit._source || typeof hit._score !== "number") return []
    return [{ id: hit._source.id, score: hit._score }]
  })

  const fused = reciprocalRankFusion(denseResults, lexicalResults)
  const reranked = await runCrossEncoder(query, fused)

  return { sources: reranked.slice(0, topK) }
}
