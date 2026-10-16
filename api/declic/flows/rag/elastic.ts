import type { estypes } from "@elastic/elasticsearch"
import { elastic, RAG_ALIAS, createRagIndexName } from "~/database/elastic"
import type { ZenodoRecord, DocumentChunk, ZenodoFile } from "./types"
import type { CatalogItem } from "~/schemas/catalog"
import { RAG_MAPPING } from "~/database/mappings/rag"

const PUBLICATION_SCAN_SIZE = 500

// interface IndexedPublication {
//   sourceId: string
//   doiUrl?: string | null
//   title: string
//   published?: string | null
//   accessRight?: string | null
//   publicationType?: string | null
//   keywords?: string[]
//   files?: ZenodoPublicationFile[]
// }

export async function fetchZenodoRecords(catalogIndex: string): Promise<ZenodoRecord[]> {
  const records: ZenodoRecord[] = []
  let scrollId: string | undefined

  try {
    let response = await elastic.search<CatalogItem>({
      index: catalogIndex,
      scroll: "2m",
      size: PUBLICATION_SCAN_SIZE,
      query: { term: { source: "zenodo" } },
      _source: ["sourceId", "doiUrl", "title", "published", "accessRight", "publicationType", "keywords", "files"],
    })

    while (response.hits.hits.length > 0) {
      scrollId = response._scroll_id ?? scrollId
      for (const hit of response.hits.hits) {
        const source = hit._source
        if (!source) throw new Error(`Zenodo publication ${hit._id ?? "unknown"} is missing its Elasticsearch source`)
        const recordId = source.sourceId || hit._id?.replace(/^zenodo-/, "")
        if (!recordId) throw new Error(`Zenodo publication ${hit._id ?? "unknown"} is missing its record ID`)

        const files = source.files ?? []
        for (const file of files) {
          if (typeof file.key !== "string" || !file.key) {
            throw new Error(`Zenodo publication ${recordId} contains a file without an ID or key`)
          }
        }

        records.push({
          id: recordId,
          doi_url: source.doiUrl ?? "",
          metadata: {
            title: source.title,
            publication_date: source.published ?? "",
            access_right: source.accessRight ?? "",
            keywords: source.keywords ?? [],
            resource_type: { subtype: source.publicationType ?? "" },
          },
          files: files.map((file) => ({ ...file, checksum: file.checksum!, type: file.type! })),
        })
      }

      if (!response._scroll_id) break
      response = await elastic.scroll<CatalogItem>({ scroll_id: response._scroll_id, scroll: "2m" })
    }
  } finally {
    if (scrollId) await elastic.clearScroll({ scroll_id: scrollId })
  }

  return records
}

export async function ensureRagIndex(): Promise<void> {
  if (await elastic.indices.exists({ index: RAG_ALIAS })) return

  const index = await createRagIndex(createRagIndexName())
  await elastic.indices.updateAliases({
    actions: [{ add: { index, alias: RAG_ALIAS, is_write_index: true } }],
  })
}

export async function createRagIndex(index = createRagIndexName()): Promise<string> {
  await elastic.indices.create({
    index,
    settings: RAG_MAPPING.settings,
    mappings: RAG_MAPPING.mappings,
  })

  return index
}

export async function refreshRagIndex(): Promise<void> {
  await elastic.indices.refresh({ index: RAG_ALIAS })
}

export async function indexRagChunks(chunks: Array<DocumentChunk & { embedding: number[] }>): Promise<void> {
  if (!chunks.length) return

  const operations = chunks.flatMap((chunk) => [{ index: { _index: RAG_ALIAS, _id: chunk.id } }, chunk])
  const result = await elastic.bulk({ operations })
  if (result.errors) {
    const failedItem = result.items.find((item) => item.index?.error)
    throw new Error(`Failed to index chunk: ${JSON.stringify(failedItem?.index?.error)}`)
  }
}

export async function removeStaleFileVersions(file: ZenodoFile): Promise<void> {
  const result = await elastic.deleteByQuery({
    index: RAG_ALIAS,
    query: {
      bool: {
        filter: [{ term: { "metadata.file_key": file.key } }],
        ...(file.checksum ? { must_not: [{ term: { "metadata.file_checksum": file.checksum } }] } : {}),
      },
    },
    conflicts: "proceed",
  })
  const failures = result.failures ?? []
  if (failures.length > 0) {
    throw new Error(`Failed to remove stale chunks for file ${file.key}: ${JSON.stringify(failures[0])}`)
  }
}

export async function removeStaleFiles(recordId: string, currentFileKeys: string[]): Promise<void> {
  const result = await elastic.deleteByQuery({
    index: RAG_ALIAS,
    query: {
      bool: {
        filter: [{ term: { "metadata.record_id": recordId } }],
        ...(currentFileKeys.length > 0 ? { must_not: [{ terms: { "metadata.file_key": currentFileKeys } }] } : {}),
      },
    },
    conflicts: "proceed",
  })
  const failures = result.failures ?? []
  if (failures.length > 0) {
    throw new Error(`Failed to remove stale chunks for record ${recordId}: ${JSON.stringify(failures[0])}`)
  }
}

export async function getIndexedChecksums(): Promise<Map<string, Set<string>>> {
  const indexedChecksums = new Map<string, Set<string>>()
  if (!(await elastic.indices.exists({ index: RAG_ALIAS }))) return indexedChecksums

  let after: estypes.AggregationsCompositeAggregateKey | undefined
  do {
    const response = await elastic.search({
      index: RAG_ALIAS,
      size: 0,
      aggregations: {
        indexed_files: {
          composite: {
            size: 1_000,
            sources: [{ file_id: { terms: { field: "metadata.file_id" } } }],
            ...(after ? { after } : {}),
          },
          aggregations: {
            checksums: { terms: { field: "metadata.file_checksum", size: 10 } },
          },
        },
      },
    })

    const aggregation = response.aggregations?.indexed_files as estypes.AggregationsCompositeAggregate | undefined
    if (!aggregation) throw new Error("Elasticsearch did not return indexed-file aggregation results")

    const fileBuckets = Array.isArray(aggregation.buckets) ? aggregation.buckets : Object.values(aggregation.buckets)
    for (const bucket of fileBuckets) {
      const fileId = bucket.key.file_id
      if (typeof fileId !== "string") continue

      const checksums = bucket.checksums as estypes.AggregationsStringTermsAggregate | undefined
      const checksumBuckets = checksums
        ? Array.isArray(checksums.buckets)
          ? checksums.buckets
          : Object.values(checksums.buckets)
        : []
      const values = checksumBuckets
        .map((checksum) => checksum.key)
        .filter((checksum): checksum is string => typeof checksum === "string")
      if (values.length > 0) indexedChecksums.set(fileId, new Set(values))
    }

    after = aggregation.after_key
  } while (after)

  return indexedChecksums
}
