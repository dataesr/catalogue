import type { estypes } from "@elastic/elasticsearch"
import { config } from "~/config"
import { elastic, RAG_ALIAS } from "~/database/elastic"
import type { RagResponse, RagSearchParams } from "~/schemas/rag"
import { runMistralEmbeddings } from "./mistral"
import { runCrossEncoder } from "./rerank"
import type { IndexedChunk, RetrievedChunk } from "./types"

const DEFAULT_RESULTS = 5
const MAX_RESULTS = 50
const RETRIEVAL_MULTIPLIER = 5
const RRF_K = 60
const DENSE_WEIGHT = 0.7
const SPARSE_WEIGHT = 0.3
const MIN_CHUNK_LENGTH = 50

function clampTopK(topK: number | undefined): number {
  if (topK === undefined || !Number.isFinite(topK)) return DEFAULT_RESULTS
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

export function reciprocalRankFusion(denseResults: RetrievedChunk[], sparseResults: RetrievedChunk[]): RetrievedChunk[] {
  if (!sparseResults.length) return denseResults

  const maximumScore =
    (denseResults.length ? DENSE_WEIGHT / (RRF_K + 1) : 0) + (sparseResults.length ? SPARSE_WEIGHT / (RRF_K + 1) : 0)
  const fused = new Map<string, RetrievedChunk>()
  denseResults.forEach((result, index) => {
    const rank = index + 1
    const contribution = DENSE_WEIGHT / (RRF_K + rank)
    fused.set(result.id, {
      ...result,
      sparseScore: null,
      rrfScore: contribution,
    })
  })

  sparseResults.forEach((result, index) => {
    const contribution = SPARSE_WEIGHT / (RRF_K + index + 1)
    const existing = fused.get(result.id)
    if (existing) {
      existing.sparseScore = result.sparseScore
      existing.rrfScore = (existing.rrfScore ?? 0) + contribution
    } else {
      fused.set(result.id, {
        ...result,
        sparseScore: result.sparseScore,
        rrfScore: contribution,
      })
    }
  })

  return [...fused.values()]
    .map((result) => ({
      ...result,
      distance: 1 - Math.min(1, (result.rrfScore ?? 0) / maximumScore),
    }))
    .sort((a, b) => (b.rrfScore ?? 0) - (a.rrfScore ?? 0))
}

export async function searchRag(params: RagSearchParams): Promise<RagResponse> {
  const query = params.q.trim()
  if (!query) throw new Error("RAG query must not be empty")

  const topK = clampTopK(params.topK)
  const retrievalK = Math.min(topK * RETRIEVAL_MULTIPLIER, MAX_RESULTS)
  const numCandidates = Math.min(MAX_RESULTS * RETRIEVAL_MULTIPLIER, Math.max(retrievalK * 10, 100))

  const [queryVector] = await runMistralEmbeddings([query])
  const filters = buildRagFilters(params)

  // Compute both dense and sparse search
  const [denseResponse, sparseResponse] = await Promise.all([
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
      _source: ["id", "catalog_item_id", "document", "metadata"],
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
      _source: ["id", "catalog_item_id", "document", "metadata"],
    }),
  ])

  const denseResults = denseResponse.hits.hits.flatMap((hit) => {
    if (!hit._source || typeof hit._score !== "number") return []
    return [
      {
        id: hit._source.id,
        catalog_item_id: hit._source.catalog_item_id ?? `zenodo-${hit._source.metadata.record_id}`,
        document: hit._source.document,
        metadata: hit._source.metadata,
        denseScore: hit._score,
        distance: 1 - Math.max(0, Math.min(1, hit._score)),
      },
    ]
  })
  const sparseResults = sparseResponse.hits.hits.flatMap((hit) => {
    if (!hit._source || typeof hit._score !== "number") return []
    return [
      {
        id: hit._source.id,
        catalog_item_id: hit._source.catalog_item_id ?? `zenodo-${hit._source.metadata.record_id}`,
        document: hit._source.document,
        metadata: hit._source.metadata,
        sparseScore: hit._score,
      },
    ]
  })

  // Merge dense and sparse results
  const fused = params.useHybrid ? reciprocalRankFusion(denseResults, sparseResults) : denseResults

  // Rerank results
  const reranked = params.useRerank ? await runCrossEncoder(query, fused) : fused

  return { sources: reranked.slice(0, topK) }
}
