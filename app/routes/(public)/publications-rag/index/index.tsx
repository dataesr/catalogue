import { useDebounce } from "@/components/ui/hooks"
import { Select } from "@/components/ui/Select"
import { Skeleton } from "@/components/ui/Skeleton"
import cn from "classnames"
import { parseAsString, useQueryStates } from "nuqs"
import { useCallback } from "react"
import { useFlashRag } from "@/api/flash-rag"
import CatalogEmpty from "@/components/catalog/CatalogEmpty"
import CatalogHero from "@/components/catalog/CatalogHero"
import CatalogPagination from "@/components/catalog/CatalogPagination"
import PublicationRagCard from "@/components/catalog/PublicationRagCard"
import { formatNumber } from "@/components/catalog/utils"
import "@/components/catalog/styles.css"
import type { RagSource } from "~/schemas/rag"

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Plus récents" },
]

function ResultsSkeleton() {
  return (
    <div className="catalog-results">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="catalog-card" style={{ pointerEvents: "none" }}>
          <div className="catalog-card__body">
            <Skeleton width="lg" height="1.125rem" />
            <Skeleton width="full" height="0.8125rem" />
            <Skeleton width="md" height="0.8125rem" />
            <div className="fx-flex fx-gap-2w fr-mt-1v">
              <Skeleton width="sm" height="0.75rem" />
              <Skeleton width="sm" height="0.75rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsByPublication(sources: RagSource[], sortByDistance: boolean = false) {
  if (!sources.length) return null

  const byPublication = sources.reduce(
    (acc, source) => {
      const recordId = source.metadata.record_id
      if (!acc[recordId]) {
        acc[recordId] = { id: recordId, date: source.metadata.publication_date, sources: [] }
      }
      acc[recordId].sources.push(source)
      acc[recordId].sources.sort((a, b) => a.metadata?.page_index || 0 - b.metadata?.page_index || 0)
      return acc
    },
    {} as Record<string, { id: number; date: string; sources: RagSource[] }>,
  )

  const byPublicationArray = Object.values(byPublication)
  byPublicationArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortByDistance) {
    // byPublicationArray.sort(
    //   (a, b) => Math.min(...a.sources.map((s) => s.distance)) - Math.min(...b.sources.map((s) => s.distance)),
    // )
    byPublicationArray.sort(
      (a, b) => Math.max(...b.sources.map((s) => s.rerank_score)) - Math.min(...a.sources.map((s) => s.rerank_score)),
    )
  }

  return byPublicationArray
}

export default function PublicationsRag() {
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      sort: parseAsString.withDefault("relevance"),
    },
    { history: "push", shallow: true },
  )
  const debouncedQ = useDebounce(params.q, { delay: 1000 })
  const { data: data, isLoading, isFetching, isPlaceholderData } = useFlashRag(debouncedQ, "ssmesr", 10)
  console.log("rag:", data)
  const byPublication = ResultsByPublication(data?.sources || [], params.sort === "relevance")
  console.log("byPublication", byPublication)

  const isStale = isFetching && isPlaceholderData

  const clearAllFilters = useCallback(() => {
    setParams({
      q: "",
      sort: "relevance",
    })
  }, [setParams])

  return (
    <div>
      <CatalogHero
        title="Publications statistiques - Retrieval Augmented Generation"
        totalCount={byPublication ? byPublication.length : undefined}
        query={params.q}
        onQueryChange={(q) => setParams({ q })}
        breadcrumbItems={[
          { label: "Accueil", href: "/" },
          { label: "Publications", current: true },
        ]}
        isLoading={isLoading}
      />

      <div className="fr-container fr-py-3w">
        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Results */}
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-9">
            <div className="catalog-row-header">
              {byPublication ? (
                <p className="fr-text--sm fr-mb-0">
                  <strong>{formatNumber(byPublication.length)}</strong> résultat
                  {byPublication.length > 1 ? "s" : ""}
                </p>
              ) : (
                <Skeleton width="sm" height="1rem" />
              )}

              <div className="fx-flex fx-items-center fx-gap-2w">
                {isStale && (
                  <span className="catalog-loading-indicator" aria-live="polite" role="status">
                    <span className="fr-icon-refresh-line fr-icon--sm fr-icon--spin" aria-hidden="true" />
                    <span className="fr-text--xs">Chargement…</span>
                  </span>
                )}

                <Select
                  label={SORT_OPTIONS.find((o) => o.value === params.sort)?.label ?? "Trier"}
                  size="sm"
                  outline={false}
                >
                  {SORT_OPTIONS.map((option) => (
                    <Select.Radio
                      key={option.value}
                      value={option.value}
                      name="sort"
                      checked={params.sort === option.value}
                      onChange={() => setParams({ sort: option.value })}
                    >
                      {option.label}
                    </Select.Radio>
                  ))}
                </Select>
              </div>
            </div>

            {isLoading ? (
              <ResultsSkeleton />
            ) : byPublication && byPublication.length > 0 ? (
              <div className={cn("catalog-results", { "catalog-results--stale": isStale })} aria-busy={isStale}>
                {byPublication.map((publication) => (
                  <PublicationRagCard key={publication.id} data={publication} query={params.q} />
                ))}
              </div>
            ) : data ? (
              <CatalogEmpty onReset={clearAllFilters} />
            ) : null}

            <CatalogPagination page={1} totalPages={0} onPageChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}
