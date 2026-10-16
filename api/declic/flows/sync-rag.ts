import { flow } from "@dataesr/declic-sdk"
import { t } from "elysia"
import { ingestZenodoPublications } from "./rag/ingest"

export const syncRag = flow({
  id: "sync-rag",
  description: "Ingest Zenodo publication PDFs into the Catalogue RAG index",
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 2 * 60 * 60 * 1000 },
  input: t.Object({
    targetIndex: t.Optional(t.String()),
    force_reindex: t.Optional(t.Boolean({ default: false })),
  }),
  run: async ({ input, step }) => {
    const result = await step.run("ingest-publications", async ({ logger }) => {
      logger.info("Starting Zenodo publication RAG ingestion")

      const ingestion = await ingestZenodoPublications({
        catalogIndex: input.targetIndex,
        forceReindex: input.force_reindex,
        onProgress: (message) => logger.info(message),
      })

      logger.info(`Zenodo publication RAG ingestion finished: ${JSON.stringify(ingestion)}`)
      return ingestion
    })

    return { status: "completed" as const, ...result }
  },
})
