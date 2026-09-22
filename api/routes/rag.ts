import { Elysia, t } from "elysia"
import { config } from "~/config"
import {
  ragSearchParamsSchema,
  ragSearchResponseSchema,
  ragCompletionParamsSchema,
  type RagSearchParams,
  type RagCompletionParams,
  type RagResponse,
} from "~/schemas/rag"
import { Mistral } from "@mistralai/mistralai"
import { elastic, ES_ALIAS } from "~/database/elastic"
import type { CatalogItem } from "~/schemas/catalog"

const mistral = new Mistral({ apiKey: config.mistral.apiKey })

async function flashRagSearch(params: RagSearchParams): Promise<RagResponse> {
  const body = {
    query: params.q,
    top_k: params.topK,
    use_reranker: true,
    use_cross_encoder: true,
    use_hybrid_search: true,
  }

  const filters = {} as Record<string, string | Array<string>>
  if (params.accessRight) filters["file_access"] = params.accessRight
  if (params.publicationType) filters["publication_type"] = params.publicationType
  if (params.topic) filters["keywords"] = params.topic.map((t) => t.toLowerCase())

  try {
    const response = await fetch(config.flashRag.url, {
      method: "POST",
      headers: {
        Authorization: config.flashRag.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, filters }),
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


async function mistralRagCompletion(query: RagCompletionParams) {
  const chunksAsString = query.chunks.reduce(
    (acc, chunk) => acc.concat("\n\n", `- ${chunk.metadata.section_title}:\n${chunk.document}`),
    `[${query.chunks[0]?.metadata.title} (${query.chunks[0]?.metadata.publication_date})]`,
  )
  console.debug("chunksAsString", chunksAsString)
  try {
    const response = await mistral.chat.complete({
      model: "ministral-8b-2512",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant d'analyse de données. " +
            "Tu réponds aux questions en te basant UNIQUEMENT sur les paragraphes fournis. " +
            "Règles strictes : " +
            "1. Réponds directement à la question posée " +
            "2. Si les documents ne contiennent pas la réponse, dis-le explicitement " +
            "3. Pour les chiffres : sois précis, inclus les années et les unités " +
            "4. Si plusieurs documents contiennent des informations contradictoires, note-le " +
            "5. Ne cite pas le document source - Tu peux citer l'ID ou la PAGE du paragraph si besoin." +
            "Format : réponse courte et factuelle. ",
        },
        {
          role: "user",
          content: `Extraits de documents:\n\n${chunksAsString}\n\nQuestion: ${query.q}`,
        },
      ],
      maxTokens: 512,
      temperature: 0.0,
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
    throw new Error(`[Mistral] ${error instanceof Error ? error.message : "Erreur inconnue"}`)
  }
}

export const ragRoutes = new Elysia({ prefix: "/rag" })
  .get(
    "/",
    async ({ query }) => {
      const results = await flashRagSearch(query)

      const recordIds = results.sources.reduce((acc, chunk) => {
        const recordId = chunk.metadata?.record_id
        if (!recordId) {
          console.error(`record_id not found: ${chunk.metadata.file_name}`)
          return acc
        }
        const normalizedId = String(recordId)
        if (!acc.includes(normalizedId)) {
          acc.push(normalizedId)
        }
        return acc
      }, [] as string[])

      const items = Object.fromEntries(
        (
          await Promise.all(
            recordIds.map(async (recordId) => {
              const documentId = recordId.startsWith("zenodo-")
                ? recordId
                : recordId.toLowerCase().includes("eesr19")
                  ? `zenodo-22691829` // trouver un moyen de lier le dernier id de l'etat du sup..
                  : `zenodo-${recordId}`
              try {
                const response = await elastic.get<CatalogItem>({ index: ES_ALIAS, id: documentId })
                if (!response._source) {
                  console.error(`document not found: ${documentId}`)
                  return undefined
                }
                return [recordId, response._source] as const
              } catch (error) {
                console.error(`failed to fetch catalog document ${documentId}`, error)
                return undefined
              }
            }),
          )
        ).filter((entry): entry is readonly [string, CatalogItem] => entry !== undefined),
      ) as Record<string, CatalogItem>

      return { ...results, items }
    },
    {
      query: ragSearchParamsSchema,
      response: { 200: ragSearchResponseSchema },
      detail: {
        description: "Retrieval Augmented Generation (RAG) pour les publications statistiques",
        tags: ["RAG"],
      },
    },
  )
  .post(
    "/mistral",
    async ({ body }) => {
      const result = await mistralRagCompletion(body)
      return result
    },
    {
      body: ragCompletionParamsSchema,
      response: { 200: t.String() },
      detail: {
        description: "Utilise Mistral pour compléter une réponse basée sur les sources fournies",
        tags: ["RAG", "Mistral"],
      },
    },
  )
