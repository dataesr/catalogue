import { flow } from "@dataesr/declic-sdk"
import { t } from "elysia"
import { elastic, RAG_ALIAS } from "~/database/elastic"
import { createNextRagIndex, promoteRagIndex, refreshRagIndex } from "../../rag/elastic"
import { ingestCatalogItems } from "../../rag/ingest"
import { ingestEESR } from "../../rag/ingest-eesr"

export const syncRag = flow({
  id: "sync-rag",
  description: "Create and populate Catalogue RAG index",
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 2 * 60 * 60 * 1000 },
  input: t.Object({
    catalog_index: t.Optional(t.String()),
    force_ocr: t.Optional(t.Boolean({ default: false })),
  }),
  run: async ({ input, step }) => {
    const index = await step.run("create-index", async ({ logger }) => {
      const index = await createNextRagIndex()
      logger.info(`Created new RAG index ${index}`)
      return index
    })

    const catalog = await step.run("ingest-publications", async ({ logger }) => {
      logger.info("Starting CATALOG ingestion")
      const ingestion = await ingestCatalogItems(index, {
        catalogIndex: input.catalog_index,
        forceOcr: input.force_ocr,
        onProgress: (message) => logger.info(message),
      })
      logger.info(`CATALOG ingestion finished: ${JSON.stringify(ingestion)}`)
      return ingestion
    })

    const eesr = await step.run("ingest-eesr", async ({ logger }) => {
      logger.info("Starting EESR ingestion")
      const ingestion = await ingestEESR(index, {
        onProgress: (message) => logger.info(message),
      })
      logger.info(`EESR ingestion finished: ${JSON.stringify(ingestion)}`)
      return ingestion
    })

    await step.run("verify-index", async ({ logger }) => {
      await refreshRagIndex(index)
      const indexedCount = (await elastic.count({ index })).count
      const expectedCount = catalog.indexedChunks + eesr.indexedChunks
      if (indexedCount !== expectedCount) {
        throw new Error(`RAG index ${index} contains ${indexedCount} chunks, expected ${expectedCount}`)
      }
      logger.info(`Verified ${indexedCount} chunks in RAG index ${index}`)
    })

    await step.run("promote-alias", async ({ logger }) => {
      await promoteRagIndex(index, RAG_ALIAS)
      logger.info(`Promoted RAG index ${index} to ${RAG_ALIAS}`)
    })

    return {
      status: "completed" as const,
      index: index,
      catalogIngestion: catalog,
      eesrIngestion: eesr,
    }
  },
})
