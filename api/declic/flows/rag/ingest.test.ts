import { describe, expect, test } from "bun:test"
import { ingestZenodoPublications, type IngestionServices } from "./ingest"

const record = {
  id: "123",
  metadata: { title: "Étude", publication_date: "2025" },
  files: [
    { key: "unchanged.pdf", url: "https://zenodo.org/unchanged.pdf", size: 1234, checksum: "md5:old" },
    { key: "changed.pdf", url: "https://zenodo.org/changed.pdf", size: 1234, checksum: "md5:new" },
    { key: "data.xlsx", url: "https://zenodo.org/data.xlsx", size: 1234 },
  ],
}

function createServices(overrides: Partial<IngestionServices> = {}) {
  const calls = {
    catalogIndexes: [] as string[],
    processedFiles: [] as string[],
    indexedFiles: [] as string[],
    cleanedFileVersions: [] as string[],
    cleanedRecords: [] as Array<{ recordId: string; fileIds: string[] }>,
  }
  const services: IngestionServices = {
    ensureIndex: async () => {},
    fetchRecords: async (catalogIndex) => {
      calls.catalogIndexes.push(catalogIndex)
      return [record]
    },
    getIndexedChecksums: async () => new Map([["unchanged", new Set(["md5:old"])]]),
    refreshIndex: async () => {},
    processFile: async (_record, file) => {
      calls.processedFiles.push(file.key)
      return []
    },
    indexFile: async (file) => {
      calls.indexedFiles.push(file.key)
    },
    removeStaleFileVersions: async (file) => {
      calls.cleanedFileVersions.push(file.key)
    },
    removeStaleFiles: async (recordId, fileIds) => {
      calls.cleanedRecords.push({ recordId, fileIds })
    },
    ...overrides,
  }
  return { calls, services }
}

describe("ingestZenodoPublications", () => {
  test("reads synced files, skips unchanged checksums, and processes changed PDFs", async () => {
    const { calls, services } = createServices()

    const result = await ingestZenodoPublications({ catalogIndex: "catalog-test", services })

    expect(result).toEqual({
      records: 1,
      pdfFiles: 2,
      indexedFiles: 1,
      skippedFiles: 1,
      indexedChunks: 0,
    })
    expect(calls.catalogIndexes).toEqual(["catalog-test"])
    expect(calls.processedFiles).toEqual(["changed"])
    expect(calls.indexedFiles).toEqual(["changed"])
    expect(calls.cleanedFileVersions).toEqual(["unchanged"])
    expect(calls.cleanedRecords).toEqual([{ recordId: "123", fileIds: ["unchanged", "changed"] }])
  })

  test("force reprocesses files without reading their indexed checksums", async () => {
    let checksumReads = 0
    const { calls, services } = createServices({
      getIndexedChecksums: async () => {
        checksumReads += 1
        return new Map([["unchanged", new Set(["md5:old"])]])
      },
    })

    const result = await ingestZenodoPublications({ forceReindex: true, services })

    expect(result.indexedFiles).toBe(2)
    expect(result.skippedFiles).toBe(0)
    expect(checksumReads).toBe(0)
    expect(calls.processedFiles).toEqual(["unchanged", "changed"])
  })
})
