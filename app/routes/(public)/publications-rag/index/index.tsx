import { useDebounce } from "@/components/ui/hooks"
import { Select } from "@/components/ui/Select"
import { Skeleton } from "@/components/ui/Skeleton"
import cn from "classnames"
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { useCallback, useMemo } from "react"
import { useCatalogSearch } from "@/api/catalog"
import ActiveFiltersBar from "@/components/catalog/ActiveFiltersBar"
import CatalogEmpty from "@/components/catalog/CatalogEmpty"
import CatalogHero from "@/components/catalog/CatalogHero"
import CatalogPagination from "@/components/catalog/CatalogPagination"
import FacetSection from "@/components/catalog/FacetSection"
import ResultCard from "@/components/catalog/ResultCard"
import { formatNumber } from "@/components/catalog/utils"
import "@/components/catalog/styles.css"
import { useFlashRag } from "@/api/flash-rag"

const PAGE_SIZE = 20

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Plus récents" },
  // { value: "oldest", label: "Plus anciens" },
  // { value: "popularity", label: "Popularité" },
  // { value: "downloads", label: "Téléchargements" },
]

type FilterKey = "publicationType" | "topic" | "accessRight"

const FILTER_META: Record<FilterKey, { label: string }> = {
  publicationType: { label: "Type de publication" },
  topic: { label: "Thématique" },
  accessRight: { label: "Droit d'accès" },
}

const FILTER_KEYS: FilterKey[] = ["publicationType", "topic", "accessRight"]

const ACCESS_LABELS: Record<string, string> = {
  open: "Accès ouvert",
  restricted: "Accès restreint",
  closed: "Accès fermé",
}

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

export default function PublicationsRag() {
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      publicationType: parseAsArrayOf(parseAsString).withDefault([]),
      topic: parseAsArrayOf(parseAsString).withDefault([]),
      accessRight: parseAsArrayOf(parseAsString).withDefault([]),
      page: parseAsInteger.withDefault(1),
      sort: parseAsString.withDefault("relevance"),
    },
    { history: "push", shallow: true },
  )

  const debouncedQ = useDebounce(params.q, { delay: 300 })

  const { data, isLoading, isFetching, isPlaceholderData } = useCatalogSearch({
    q: debouncedQ || undefined,
    type: "publication",
    publicationType: params.publicationType.length > 0 ? params.publicationType : undefined,
    topic: params.topic.length > 0 ? params.topic : undefined,
    accessRight: params.accessRight.length > 0 ? params.accessRight : undefined,
    sort: params.sort !== "relevance" ? params.sort : undefined,
    page: params.page,
    limit: PAGE_SIZE,
  })

  const { data: dataRag } = useFlashRag(debouncedQ, 5)
  console.log("rag:", dataRag)

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0
  const isStale = isFetching && isPlaceholderData

  const handleFacetChange = useCallback(
    (key: FilterKey) => (value: string) => {
      const current = params[key]
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      setParams({ [key]: next, page: 1 })
    },
    [params, setParams],
  )

  const labelForValue = useCallback((key: FilterKey, value: string): string => {
    if (key === "accessRight") return ACCESS_LABELS[value] ?? value
    return value
  }, [])

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string; displayValue: string }> = []
    for (const key of FILTER_KEYS) {
      for (const val of params[key]) {
        filters.push({
          key,
          label: FILTER_META[key].label,
          value: val,
          displayValue: labelForValue(key, val),
        })
      }
    }
    return filters
  }, [params, labelForValue])

  const activeFilterCount = activeFilters.length

  const hasAnyFilter = activeFilterCount > 0 || !!params.q

  const clearAllFilters = useCallback(() => {
    setParams({
      q: "",
      publicationType: [],
      topic: [],
      accessRight: [],
      sort: "relevance",
      page: 1,
    })
  }, [setParams])

  const handleRemoveFilter = useCallback(
    (key: string, value: string) => {
      const filterKey = key as FilterKey
      const next = params[filterKey].filter((v) => v !== value)
      setParams({ [filterKey]: next, page: 1 })
    },
    [params, setParams],
  )

  const handleClearQuery = useCallback(() => {
    setParams({ q: "", page: 1 })
  }, [setParams])

  return (
    <div>
      <CatalogHero
        title="Publications statistiques - Retrieval Augmented Generation"
        totalCount={data?.totalCount}
        query={params.q}
        onQueryChange={(q) => setParams({ q, page: 1 })}
        breadcrumbItems={[
          { label: "Accueil", href: "/" },
          { label: "Publications", current: true },
        ]}
        isLoading={isLoading}
      />

      {hasAnyFilter && (
        <ActiveFiltersBar
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={clearAllFilters}
          query={params.q || undefined}
          onClearQuery={handleClearQuery}
        />
      )}

      <div className="fr-container fr-py-3w">
        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Sidebar */}
          {/* <div className="fr-col-12 fr-col-md-4 fr-col-lg-3">
            <aside className="catalog-sidebar" aria-label="Filtres">
              <div className="catalog-row-header">
                <span className="fx-flex fx-items-center fx-gap-1w">
                  <span className="fr-icon-filter-line fr-icon--sm" aria-hidden="true" />
                  <span className="fr-text--bold fr-text--sm fr-mb-0">Affiner la recherche</span>
                </span>
                {activeFilterCount > 0 && (
                  <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--blue-france">{activeFilterCount}</span>
                )}
              </div>

              <FacetSection
                title="Type de publication"
                items={data?.facets.publicationType ?? []}
                activeValues={params.publicationType}
                onChange={handleFacetChange("publicationType")}
              />
              <FacetSection
                title="Thématique"
                items={data?.facets.topics ?? []}
                activeValues={params.topic}
                onChange={handleFacetChange("topic")}
                searchable
                initialCount={8}
              />
              <FacetSection
                title="Droit d'accès"
                items={data?.facets.accessRight ?? []}
                activeValues={params.accessRight}
                onChange={handleFacetChange("accessRight")}
                labelMap={ACCESS_LABELS}
              />
            </aside>
          </div> */}

          {/* Results */}
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-9">
            <div className="catalog-row-header">
              {data ? (
                <p className="fr-text--sm fr-mb-0">
                  <strong>{formatNumber(data.totalCount)}</strong> résultat
                  {data.totalCount > 1 ? "s" : ""}
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
                      onChange={() => setParams({ sort: option.value, page: 1 })}
                    >
                      {option.label}
                    </Select.Radio>
                  ))}
                </Select>
              </div>
            </div>

            {isLoading ? (
              <ResultsSkeleton />
            ) : data && data.results.length > 0 ? (
              <div className={cn("catalog-results", { "catalog-results--stale": isStale })} aria-busy={isStale}>
                {data.results.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : data ? (
              <CatalogEmpty onReset={clearAllFilters} />
            ) : null}

            <CatalogPagination page={params.page} totalPages={totalPages} onPageChange={(p) => setParams({ page: p })} />
          </div>
        </div>
      </div>
    </div>
  )
}
