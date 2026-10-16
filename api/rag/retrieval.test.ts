import { describe, expect, test } from "bun:test"
import {
  buildRagFilters,
  cosineDistanceFromElasticScore,
  lightweightRerank,
  reciprocalRankFusion,
  type RetrievedChunk,
} from "./retrieval"

function chunk(id: string, distance: number, title: string, publicationEpoch: number): RetrievedChunk {
  return {
    id,
    document: `Document ${id}`,
    metadata: { title, publication_epoch: publicationEpoch },
    distance,
  }
}

describe("RAG retrieval helpers", () => {
  test("builds date, chunk length, and user-selected Elasticsearch filters", () => {
    const filters = buildRagFilters(
      {
        q: "emploi",
        accessRight: "open",
        publicationType: "article",
        topic: ["Éducation", "Recherche"],
      },
      new Date("2026-10-14T00:00:00Z"),
    )

    expect(filters).toEqual([
      { range: { "metadata.publication_epoch": { gte: Date.UTC(2022, 0, 1) / 1000 } } },
      { range: { "metadata.chunk_len": { gte: 50 } } },
      { term: { "metadata.file_access": "open" } },
      { term: { "metadata.publication_type": "article" } },
      { terms: { "metadata.keywords": ["éducation", "recherche"] } },
    ])
  })

  test("converts Elasticsearch cosine similarity scores to Chroma-compatible distance", () => {
    expect(cosineDistanceFromElasticScore(0.95)).toBeCloseTo(0.1)
    expect(cosineDistanceFromElasticScore(1)).toBe(0)
    expect(cosineDistanceFromElasticScore(-1)).toBe(2)
  })

  test("fuses dense and lexical rankings using weighted reciprocal-rank fusion", () => {
    const dense = [chunk("first", 0.2, "Title", 0), chunk("second", 0.1, "Title", 0)]
    const fused = reciprocalRankFusion(dense, [
      { id: "second", score: 8 },
      { id: "first", score: 4 },
    ])

    expect(fused.map((result) => result.id)).toEqual(["first", "second"])
    expect(fused[0]?.bm25_score).toBe(4)
    expect(fused[1]?.bm25_score).toBe(8)
    expect(fused[0]?.rrf_score).toBeCloseTo(0.7 / 61 + 0.3 / 62)
  })

  test("preserves dense ordering when lexical search has no matches", () => {
    const dense = [chunk("first", 0.1, "Title", 0), chunk("second", 0.2, "Title", 0)]
    expect(reciprocalRankFusion(dense, [])).toEqual(dense)
  })

  test("lightweight reranking combines semantic, title, and requested-year signals", () => {
    const reranked = lightweightRerank("emploi 2024", [
      chunk("semantic", 0.1, "Autre sujet", Date.UTC(2020, 0, 1) / 1000),
      chunk("title-date", 0.2, "Emploi et travail", Date.UTC(2024, 0, 1) / 1000),
    ])

    expect(reranked[0]?.id).toBe("title-date")
    expect(reranked[0]?.rerank_score).toBeCloseTo(0.85 * 0.8 + 0.05 * (1 / 3) + 0.1)
  })
})
