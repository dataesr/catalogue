import type { CatalogItem } from "~/schemas/catalog"
import type { RagSource } from "~/schemas/rag"

type RagPublication = { item: CatalogItem; chunks: RagSource[] }

const ragSort = (sort: string) => (a: RagPublication, b: RagPublication) => {
  if (sort === "newest" || sort === "oldest") {
    const aDate = a.item.published ? new Date(a.item.published).getTime() : null
    const bDate = b.item.published ? new Date(b.item.published).getTime() : null

    if (aDate === null || Number.isNaN(aDate)) return bDate === null || Number.isNaN(bDate) ? 0 : 1
    if (bDate === null || Number.isNaN(bDate)) return -1

    return sort === "newest" ? bDate - aDate : aDate - bDate
  }

  if (sort === "popularity") return b.item.popularityScore - a.item.popularityScore
  if (sort === "downloads") return b.item.downloads - a.item.downloads

  // default to relevance
  return Math.min(...a.chunks.map((chunk) => chunk.distance)) - Math.min(...b.chunks.map((chunk) => chunk.distance))
}

export function ragResultsByPublications(sources: RagSource[], items: Record<string, CatalogItem>, sort: string) {
  const byPublication = sources.reduce(
    (acc, source) => {
      const recordId = source.metadata.record_id
      if (!recordId) {
        console.warn(`recordId not found: ${source.metadata.file_name}`)
        return acc
      }
      const item = items[String(recordId)]
      if (!item) {
        console.warn(`catalog item not found for record: ${recordId}`)
        return acc
      }
      if (!acc[recordId]) {
        acc[recordId] = { item, chunks: [] }
      }
      acc[recordId].chunks.push(source)
      acc[recordId].chunks.sort((a, b) => (a.metadata.page_index || 0) - (b.metadata.page_index || 0))
      return acc
    },
    {} as Record<string, RagPublication>,
  )
  const publications = Object.values(byPublication)
  publications.sort(ragSort(sort))

  return publications
}
