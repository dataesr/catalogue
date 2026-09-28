import { t } from "elysia"
import { flow } from "@dataesr/declic-sdk"
import { config } from "~/config"

export const updateFlashRag = flow({
  id: "update-flash-rag",
  description: "Run the flash-rag api update pipeline",
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 15 * 60 * 1000 },
  input: t.Object({
    override: t.Optional(t.Boolean()),
  }),
  run: async ({ input, step, logger }) => {
    const { status } = await step.run("update", async ({ logger }) => {
      const response = await fetch(config.flashRag.url, {
        method: "POST",
        headers: {
          Authorization: config.flashRag.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "all",
          reference: "all",
          use_cache: true,
          use_fetch: true,
          force_download: false,
          force_orc: false,
          db_override: input.override || false,
          db_reset: false,
        }),
      })
      if (!response.ok) throw new Error(`Flash-rag api update failed: ${response.status}`)
      const task = await response.json()
      return { status: task?.status || "failed" }
    })

    return { status: status }
  },
})
