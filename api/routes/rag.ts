import { Elysia, t } from "elysia"
import { config } from "~/config"
import { ragResponseSchema } from "~/schemas/rag"
import { Mistral } from "@mistralai/mistralai"

const mistral = new Mistral({ apiKey: config.mistral.apiKey })

async function fetchFlashRag(query: string, source?: string, top_k?: number) {
  try {
    const response = await fetch(config.flashRag.url, {
      method: "POST",
      headers: {
        Authorization: config.flashRag.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, source, top_k, use_reranker: true }),
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


async function completeFlashRag(query: string, sources: string) {
  console.log("completeFlashRag", { query, sources })
  try {
    const response = await mistral.chat.complete({
      model: "open-mistral-nemo-2407",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant spécialisé dans l'analyse de documents internes. " +
            "Tu réponds UNIQUEMENT en te basant sur les extraits de documents fournis. " +
            "Règles strictes : " +
            "1. Si l'information demandée est clairement présente dans les extraits, réponds de manière concise et factuelle." +
            "2. Si l'information n'est pas présente ou pas claire, fais le savoir à l'utilisateur en expliquant pourquoi. " +
            "3. Ne fais JAMAIS d'hypothèses, de suppositions ou de généralisations. " +
            "4. Limite ta réponse à 5 phrases maximum, sauf si la question exige une liste, un tableau ou une analyse plus approfondie.",
        },
        {
          role: "user",
          content: `Extraits de documents:\n\n${sources}\n\nQuestion: ${query}`,
        },
      ],
      temperature: 0.2,
    })
    console.log("Mistral response", response)

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices returned")
    }
    if (!response.choices[0]?.message || !response.choices[0].message.content) {
      throw new Error("No message content returned")
    }
    return String(response.choices[0].message.content)
  } catch (error) {
    console.error(error)
    throw new Error(`[Mistral] ${error instanceof Error ? error.message : "Erreur inconnue"}`)
  }
}

export const ragRoutes = new Elysia({ prefix: "/rag" })
  .get(
    "/",
    async ({ query }) => {
      const { q, source, top_k } = query
      const results = await fetchFlashRag(q, source, top_k)
      return results
    },
    {
      query: t.Object({
        q: t.String(),
        source: t.Optional(t.String()),
        top_k: t.Optional(t.Number()),
      }),
      response: { 200: ragResponseSchema },
      detail: {
        description: "Retrieval Augmented Generation (RAG) pour les publications statistiques",
        tags: ["RAG"],
      },
    },
  )
  .post(
    "/mistral",
    async ({ body }) => {
      const { q, sources } = body
      const sourcesStr = typeof sources === "string" ? sources : JSON.stringify(sources)
      const result = await completeFlashRag(q, sourcesStr)
      return result
    },
    {
      body: t.Object({
        q: t.String(),
        sources: t.Union([t.Record(t.String(), t.Any()), t.String()]),
      }),
      response: { 200: t.String() },
      detail: {
        description: "Utilise Mistral pour compléter une réponse basée sur les sources fournies",
        tags: ["RAG", "Mistral"],
      },
    },
  )
