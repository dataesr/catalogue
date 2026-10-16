import { Mistral } from "@mistralai/mistralai"
import { config } from "~/config"
import { RAG_EMBEDDING_DIMENSIONS } from "~/database/mappings/rag"
import type { DocumentChunk, MistralOcrDocument, ZenodoFile } from "./types"

const OCR_MODEL = "mistral-ocr-4-1"
const EMBEDDING_MODEL = "mistral-embed-2312"
export const EMBEDDING_BATCH_SIZE = 8

const mistral = new Mistral({ apiKey: config.mistral.apiKey })

export function validateEmbeddings(
  data: readonly { index?: number; embedding?: number[] }[],
  expectedCount: number,
): number[][] {
  if (data.length !== expectedCount) {
    throw new Error(`Mistral returned ${data.length} embeddings for ${expectedCount} chunks`)
  }

  const orderedEmbeddings = new Array<number[]>(expectedCount)
  for (const result of data) {
    const { index, embedding } = result
    if (
      index === undefined ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= expectedCount ||
      orderedEmbeddings[index] !== undefined ||
      !embedding ||
      embedding.length !== RAG_EMBEDDING_DIMENSIONS ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`Mistral returned an invalid embedding at index ${index ?? "unknown"}`)
    }
    orderedEmbeddings[index] = embedding
  }

  for (let index = 0; index < expectedCount; index += 1) {
    if (orderedEmbeddings[index] === undefined) {
      throw new Error(`Mistral did not return an embedding for chunk ${index}`)
    }
  }

  return orderedEmbeddings
}

export async function runMistralBatchEmbeddings(batch: DocumentChunk[]): Promise<number[][]> {
  if (!batch.length) {
    throw new Error("Cannot generate embeddings for an empty batch")
  }

  const embeddings = await mistral.embeddings.create({
    model: EMBEDDING_MODEL,
    inputs: batch.map((chunk) => chunk.document),
    outputDimension: RAG_EMBEDDING_DIMENSIONS,
  })

  return validateEmbeddings(embeddings.data, batch.length)
}

export async function runMistralOcr(file: ZenodoFile): Promise<MistralOcrDocument> {
  if (!file.url) {
    throw new Error(`Zenodo file ${file.key} has no downloadable URL`)
  }

  return mistral.ocr.process({
    model: OCR_MODEL,
    document: {
      type: "document_url",
      documentUrl: file.url,
      documentName: file.key,
    },
    extractHeader: true,
    extractFooter: true,
    tableFormat: "markdown",
  })
}
