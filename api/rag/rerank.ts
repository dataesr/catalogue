import { config } from "~/config"
import type { RetrievedChunk } from "./types"

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
    source.rerank_score = 0.85 * (1 - source.distance) + 0.05 * titleScore + 0.1 * temporalScore
  }

  return [...sources].sort((left, right) => (right.rerank_score ?? 0) - (left.rerank_score ?? 0))
}

export async function runCrossEncoder(query: string, sources: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  if (!config.mlHub.url || !config.mlHub.apiKey || sources.length === 0) {
    console.warn("[RAG] ML Hub not configured; using lightweight reranking")
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

    return sources
      .map((source, index) => ({ ...source, rerank_score: numericScores[index] }))
      .sort((left, right) => (right.rerank_score ?? 0) - (left.rerank_score ?? 0))
  } catch (error) {
    console.warn(
      `[RAG] ML Hub cross-encoder failed; using lightweight reranking: ${error instanceof Error ? error.message : String(error)}`,
    )
    return runLightReranker(query, sources)
  }
}
