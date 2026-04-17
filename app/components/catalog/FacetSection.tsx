import cn from 'classnames';
import { useId, useMemo, useState } from 'react';
import { formatNumber } from './utils';

interface FacetSectionProps {
  title: string;
  items: Array<{ key: string; count: number }>;
  activeValues: string[];
  onChange: (value: string) => void;
  initialCount?: number;
  searchable?: boolean;
  labelMap?: Record<string, string>;
  defaultOpen?: boolean;
}

export default function FacetSection({
  title,
  items,
  activeValues,
  onChange,
  initialCount,
  searchable = false,
  labelMap,
  defaultOpen = true,
}: FacetSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');
  const panelId = useId();

  const filteredItems = useMemo(() => {
    if (!searchable || !filterText.trim()) return items;
    const q = filterText.toLowerCase();
    return items.filter((item) => {
      const label = labelMap?.[item.key] ?? item.key;
      return label.toLowerCase().includes(q);
    });
  }, [items, filterText, searchable, labelMap]);

  const limit = initialCount ?? filteredItems.length;
  const hasMore = filteredItems.length > limit;
  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <div className="facet-group">
      <button
        type="button"
        className="facet-group__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="facet-group__title">{title}</span>
        <span
          className={cn(
            'facet-group__chevron',
            open ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="facet-group__panel">
          {searchable && items.length > 8 && (
            <div className="facet-filter">
              <span
                className="fr-icon-search-line fr-icon--sm facet-filter__icon"
                aria-hidden="true"
              />
              <input
                type="search"
                className="facet-filter__input"
                placeholder="Filtrer…"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setExpanded(false);
                }}
              />
              {filterText && (
                <button
                  type="button"
                  className="facet-filter__clear fr-icon-close-line fr-icon--sm"
                  aria-label="Effacer"
                  onClick={() => setFilterText('')}
                />
              )}
            </div>
          )}

          <ul className="facet-list">
            {visibleItems.map((item) => {
              const isActive = activeValues.includes(item.key);
              const label = labelMap?.[item.key] ?? item.key;
              const checkboxId = `${panelId}-${item.key}`;
              return (
                <li key={item.key} className="fr-checkbox-group fr-checkbox-group--sm">
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={isActive}
                    onChange={() => onChange(item.key)}
                  />
                  <label className="fr-label" htmlFor={checkboxId}>
                    <span className="facet-option__label">{label}</span>
                    <span className="facet-option__count">{formatNumber(item.count)}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {visibleItems.length === 0 && filterText && (
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v fr-px-1w">
              Aucun résultat
            </p>
          )}

          {hasMore && (
            <button
              type="button"
              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-mt-1v"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? 'Voir moins'
                : `+ ${filteredItems.length - limit} autre${filteredItems.length - limit > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
