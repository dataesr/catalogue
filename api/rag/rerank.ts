import { config } from "~/config"
import type { RetrievedChunk } from "./types"

export function normalizeRerankScores(scores: number[]): number[] {
  if (scores.length === 0) return []
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = maxScore - minScore
  if (range === 0) return scores.map(() => 0.5)
  return scores.map((score) => (score - minScore) / range)
}

export function runLightReranker(query: string, sources: RetrievedChunk[]): RetrievedChunk[] {
  const queryLower = query.toLowerCase().trim()
  const queryWords = new Set(queryLower.split(/\s+/).filter(Boolean))
  const queryYears = [...queryLower.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]))
  const earliestYear = queryYears.length ? Math.min(...queryYears) : undefined
  const yearEpoch = earliestYear === undefined ? undefined : Date.UTC(earliestYear, 0, 1) / 1000

  for (const source of sources) {
    const titleWords = new Set((source.metadata.title ?? "").toLowerCase().split(/\s+/).filter(Boolean))
    const titleScore = [...titleWords].filter((word) => queryWords.has(word)).length / Math.max(1, titleWords.size)

    const publicationEpoch = source.metadata.publication_epoch
    const temporalScore =
      yearEpoch !== undefined && typeof publicationEpoch === "number" && publicationEpoch >= yearEpoch ? 1 : 0

    const semanticRelevance = 1 - Math.max(0, Math.min(1, source.distance ?? 1))
    source.rerankScore = 0.85 * semanticRelevance + 0.05 * titleScore + 0.1 * temporalScore
    source.distance = 1 - source.rerankScore
  }

  return [...sources].sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0))
}

export async function runCrossEncoder(query: string, sources: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  if (!config.mlHub.url || !config.mlHub.apiKey || sources.length === 0) {
    console.warn("ML Hub not configured; using lightweight reranking")
    return runLightReranker(query, sources)
  }

  try {
    const response = await fetch(`${config.mlHub.url.replace(/\/$/, "")}/tools/cross-encoder`, {
      method: "POST",
      headers: {
        Authorization: config.mlHub.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pairs: sources.map((source) => [query, source.document]) }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) throw new Error(`ML Hub cross-encoder returned HTTP ${response.status}`)
    const scores: unknown = await response.json()
    if (!Array.isArray(scores) || scores.length !== sources.length) {
      throw new Error("ML Hub cross-encoder returned an invalid score list")
    }
    const numericScores: number[] = []
    for (const score of scores) {
      if (typeof score !== "number" || !Number.isFinite(score)) {
        throw new Error("ML Hub cross-encoder returned an invalid score list")
      }
      numericScores.push(score)
    }
    const normalizedScores = normalizeRerankScores(numericScores)
    return sources
      .map((source, index) => ({
        ...source,
        rerankScore: numericScores[index],
        distance: 1 - (normalizedScores[index] ?? 0.5),
      }))
      .sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0))

  } catch (error) {
    console.warn(
      `ML Hub cross-encoder failed; using lightweight reranking: ${error instanceof Error ? error.message : String(error)}`,
    )
    return runLightReranker(query, sources)
  }
}
