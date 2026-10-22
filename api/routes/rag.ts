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

      const catalogItemIds = new Map<string, string>()
      for (const chunk of results.sources) {
        const recordId = chunk.metadata.record_id
        if (!recordId) {
          console.error(`record_id not found for RAG chunk ${chunk.id}`)
          continue
        }
        catalogItemIds.set(chunk.catalog_item_id ?? `zenodo-${recordId}`, String(recordId))
      }

      const catalogItems = catalogItemIds.size
        ? await elastic.mget<CatalogItem>({ index: ES_ALIAS, ids: [...catalogItemIds.keys()] })
        : undefined
      const items = Object.fromEntries(
        (catalogItems?.docs ?? []).flatMap((document) => {
          const recordId = catalogItemIds.get(document._id)
          if (!recordId) return []
          if ("error" in document) {
            throw new Error(`failed to fetch catalog document ${document._id}: ${JSON.stringify(document.error)}`)
          }
          if (!document.found || !document._source) {
            console.error(`document not found: ${document._id}`)
            return []
          }
          return [[recordId, document._source]]
        }),
      )

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
