import { Mistral } from "@mistralai/mistralai"
import { config } from "~/config"
import { RAG_EMBEDDING_DIMENSIONS } from "~/database/mappings/rag"
import type { DocumentChunk, MistralOcrDocument } from "./types"
import type { ChatCompletionRequest } from "@mistralai/mistralai/models/components"

const EMBEDDING_MODEL = "mistral-embed-2312"
export const OCR_MODEL = "mistral-ocr-4-1"
export const EMBEDDING_BATCH_SIZE = 8

const mistral = new Mistral({
  apiKey: config.mistral.apiKey,
  retryConfig: {
    strategy: "backoff",
    backoff: { initialInterval: 1000, maxInterval: 30_000, exponent: 2, maxElapsedTime: 180_000 },
    retryConnectionErrors: true,
  },
})

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

export async function runMistralEmbeddings(batch: string[]): Promise<number[][]> {
  if (!batch.length) {
    throw new Error("Cannot generate embeddings for an empty batch")
  }

  const embeddings = await mistral.embeddings.create({
    model: EMBEDDING_MODEL,
    inputs: batch,
  })

  return validateEmbeddings(embeddings.data, batch.length)
}

export async function runMistralOcr(documentName: string, documentUrl: string): Promise<MistralOcrDocument> {
  if (!documentUrl) {
    throw new Error(`Document ${documentName} has no downloadable URL`)
  }

  return mistral.ocr.process({
    model: OCR_MODEL,
    document: {
      type: "document_url",
      documentUrl: documentUrl,
      documentName: documentName,
    },
    extractHeader: true,
    extractFooter: true,
    tableFormat: "markdown",
  })
}

export async function runMistralCompletion(request: ChatCompletionRequest): Promise<string> {
  const { model, messages, maxTokens, temperature, ..._request } = request
  if (!messages) {
    throw new Error("The request is missing a messages object")
  }
  try {
    const response = await mistral.chat.complete({
      model: model ?? "ministral-8b-2512",
      messages: messages,
      maxTokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.0,
      ..._request,
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices returned")
    }
    if (!response.choices[0]?.message || !response.choices[0].message.content) {
      throw new Error("No message content returned")
    }
    return String(response.choices[0].message.content)
  } catch (error) {
    console.error(error)
    throw new Error(`Error while running completion: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
  }
}