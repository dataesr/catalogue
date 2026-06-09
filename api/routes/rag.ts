import { Elysia, t } from "elysia"
import { config } from "~/config"
import { ragResponseSchema } from "~/schemas/rag"

async function fetchFlashRag(query: string, top_k?: number) {
  console.log("url", config.flashRag.url)
  try {
    const response = await fetch(config.flashRag.url, {
      method: "POST",
      headers: {
        Authorization: config.flashRag.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, top_k }),
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error(error)
    throw new Error(`[RAG] ${error instanceof Error ? error.message : "Erreur inconnue"}`)
  }
}

export const ragRoutes = new Elysia({ prefix: "/rag" }).get(
  "/",
  async ({ query }) => {
    const { q, top_k } = query
    const results = await fetchFlashRag(q, top_k)
    return results
  },
  {
    query: t.Object({
      q: t.String(),
      top_k: t.Optional(t.Number()),
    }),
    response: { 200: ragResponseSchema },
    detail: {
      description: "Retrieval Augmented Generation (RAG) pour les publications statistiques",
      tags: ["RAG"],
    },
  },
)
