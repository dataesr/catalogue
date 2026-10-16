import { Elysia, t } from "elysia"
import {
  ragSearchParamsSchema,
  ragSearchResponseSchema,
  ragCompletionParamsSchema,
  type RagCompletionParams,
} from "~/schemas/rag"
import { elastic, ES_ALIAS } from "~/database/elastic"
import type { CatalogItem } from "~/schemas/catalog"
import { searchRag } from "~/rag/retrieval"
import { runMistralCompletion } from "~/rag/mistral"

async function mistralRagCompletion(query: RagCompletionParams) {
  const chunksAsString = query.chunks.reduce(
    (acc, chunk) => acc.concat("\n\n", `- ${chunk.metadata.section_title}:\n${chunk.document}`),
    `[${query.chunks[0]?.metadata.title} (${query.chunks[0]?.metadata.publication_date})]`,
  )
  console.debug("chunksAsString", chunksAsString)
  return await runMistralCompletion({
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
    maxTokens: 1024,
    temperature: 0.0,
  })
}

export const ragRoutes = new Elysia({ prefix: "/rag" })
  .get(
    "/",
    async ({ query }) => {
      const results = await searchRag(query)

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
              const documentId = recordId.startsWith("zenodo-") ? recordId : `zenodo-${recordId}`
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
