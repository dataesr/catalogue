import './styles.css';

interface ActiveFiltersBarProps {
  filters: Array<{ key: string; label: string; value: string; displayValue: string }>;
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
  query?: string;
  onClearQuery?: () => void;
}

export default function ActiveFiltersBar({
  filters,
  onRemove,
  onClearAll,
  query,
  onClearQuery,
}: ActiveFiltersBarProps) {
  const hasQuery = !!query?.trim();
  const hasFilters = filters.length > 0;

  if (!hasQuery && !hasFilters) return null;

  return (
    <div className="active-filters-bar">
      <div className="fr-container fx-flex fx-items-center fx-flex-wrap fx-gap-1w">
        <span className="fr-text--xs fr-mb-0 fr-text--bold fr-text-mention--grey">
          Filtres actifs :
        </span>

        {hasQuery && (
          <button
            className="fr-tag fr-tag--sm fr-tag--dismiss"
            type="button"
            aria-label="Retirer la recherche"
            onClick={onClearQuery}
          >
            « {query} »
          </button>
        )}

        {filters.map((filter) => (
          <button
            key={`${filter.key}-${filter.value}`}
            className="fr-tag fr-tag--sm fr-tag--dismiss"
            type="button"
            aria-label={`Retirer ${filter.label} : ${filter.displayValue}`}
            onClick={() => onRemove(filter.key, filter.value)}
          >
            {filter.displayValue}
          </button>
        ))}

        <button
          type="button"
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-close-line fr-btn--sm fr-ml-auto"
          onClick={onClearAll}
        >
          Tout effacer
        </button>
      </div>
    </div>
  );
}
