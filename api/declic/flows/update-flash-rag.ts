import { t } from "elysia"
import { flow } from "@dataesr/declic-sdk"
import { config } from "~/config"

export const updateFlashRag = flow({
  id: "update-flash-rag",
  description: "Run the flash-rag api update pipeline",
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 15 * 60 * 1000 },
  input: t.Object({
    task: t.Optional(
      t.Union([t.Literal("all"), t.Literal("load"), t.Literal("extract"), t.Literal("transform"), t.Literal("populate")], {
        default: "all",
      }),
    ),
    reference: t.Optional(t.Union([t.Literal("all"), t.Literal("ssmesr"), t.Literal("eesr")], { default: "all" })),
    use_cache: t.Optional(t.Boolean({ default: true })),
    use_fetch: t.Optional(t.Boolean({ default: true })),
    force_download: t.Optional(t.Boolean({ default: false })),
    force_ocr: t.Optional(t.Boolean({ default: false })),
    db_override: t.Optional(t.Boolean({ default: false })),
    db_reset: t.Optional(t.Boolean({ default: false })),
  }),
  run: async ({ input, step, logger }) => {
    const { status } = await step.run("update", async ({ logger }) => {
      logger.debug(`Start flash-rag api update with params ${JSON.stringify(input)}`)
      const response = await fetch(config.flashRag.url + "/update", {
        method: "POST",
        headers: {
          Authorization: config.flashRag.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: input.task,
          reference: input.reference,
          use_cache: input.use_cache,
          use_fetch: input.use_fetch,
          force_download: input.force_download,
          force_orc: input.force_ocr,
          db_override: input.db_override,
          db_reset: input.db_reset,
        }),
      })
      if (!response.ok) throw new Error(`Update failed: ${response.status}`)
      const task = await response.json()
      return { status: task?.status || "failed" }
    })

    return { status: status }
  },
})
