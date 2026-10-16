import { describe, expect, test } from "bun:test"
import { RAG_EMBEDDING_DIMENSIONS } from "~/database/mappings/rag"
import { orderAndValidateMistralEmbeddings, runMistralBatchEmbeddings } from "./mistral"

const embedding = Array.from({ length: RAG_EMBEDDING_DIMENSIONS }, (_, index) => index)

describe("orderAndValidateMistralEmbeddings", () => {
  test("restores input order from Mistral response indexes", () => {
    const result = orderAndValidateMistralEmbeddings(
      [
        { index: 1, embedding: [2, 2] },
        { index: 0, embedding: [1, 1] },
      ].map((item) => ({ ...item, embedding: item.embedding.concat(embedding.slice(2)) })),
      2,
    )

    expect(result[0]?.[0]).toBe(1)
    expect(result[1]?.[0]).toBe(2)
  })

  test("rejects duplicate response indexes", () => {
    expect(() =>
      orderAndValidateMistralEmbeddings(
        [
          { index: 0, embedding },
          { index: 0, embedding },
        ],
        2,
      ),
    ).toThrow("invalid embedding")
  })

  test("rejects missing, wrong-sized, and non-finite embeddings", () => {
    expect(() => orderAndValidateMistralEmbeddings([{ embedding }], 1)).toThrow("invalid embedding")
    expect(() => orderAndValidateMistralEmbeddings([{ index: 0, embedding: [1] }], 1)).toThrow(
      "invalid embedding",
    )
    expect(() =>
      orderAndValidateMistralEmbeddings([{ index: 0, embedding: [Number.NaN, ...embedding.slice(1)] }], 1),
    ).toThrow("invalid embedding")
  })

  test("rejects a response with a different number of embeddings", () => {
    expect(() => orderAndValidateMistralEmbeddings([], 1)).toThrow("0 embeddings for 1 chunks")
  })

  test("rejects an empty embedding batch without calling Mistral", async () => {
    await expect(runMistralBatchEmbeddings([])).rejects.toThrow("Cannot generate embeddings for an empty batch")
  })
})
