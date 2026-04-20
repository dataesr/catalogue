import SearchModal, { useSearchModal } from '@/components/ui/SearchModal';
import cn from 'classnames';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import { useCatalogSearch } from '@/api/catalog';
import type { CatalogItem } from '~/schemas/catalog';

const SearchContext = createContext<{ open: () => void }>({ open: () => {} });

export function useSearch() {
  return useContext(SearchContext);
}

function getIconForType(item: CatalogItem): string {
  switch (item.type) {
    case 'dataset':
      return 'fr-icon-download-line';
    case 'publication':
      return 'fr-icon-article-line';
    case 'resource':
      return 'fr-icon-tools-line';
  }
}

function TypeBadge({ type }: { type: CatalogItem['type'] }) {
  const config = {
    dataset: { label: 'Données', className: 'fr-badge--info' },
    publication: { label: 'Publication', className: 'fr-badge--new' },
    resource: { label: 'Outil', className: 'fr-badge--purple-glycine' },
  };
  const c = config[type];
  return (
    <span className={cn('fr-badge fr-badge--xs fr-badge--no-icon', c.className)}>{c.label}</span>
  );
}

function getDetailPath(item: CatalogItem): string | null {
  switch (item.type) {
    case 'dataset':
      return `/donnees-ouvertes/${item.id}`;
    case 'publication':
      return `/publications/${item.id}`;
    case 'resource':
      return `/outils/${item.sourceId}`;
  }
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const { data } = useCatalogSearch({
    q: deferredQuery.trim() || undefined,
    limit: 8,
  });

  const results = data?.results ?? [];
  const hasQuery = !!deferredQuery.trim();
  const totalItems = results.length + (hasQuery ? 1 : 0);

  const closeSearchRef = useRef<() => void>(() => {});

  const handleSelect = useCallback(
    (index: number) => {
      if (index === results.length && hasQuery) {
        navigate(`/recherche?q=${encodeURIComponent(deferredQuery)}`);
        closeSearchRef.current();
        return;
      }
      const item = results[index];
      console.log(item)
      if (!item) return;
      const path = getDetailPath(item);
      if (path) navigate(path);
    },
    [results, navigate, deferredQuery, hasQuery],
  );

  const search = useSearchModal({
    itemCount: totalItems,
    onSelect: handleSelect,
    onClose: () => setQuery(''),
    onSubmit: () => {
      if (query.trim()) {
        navigate(`/recherche?q=${encodeURIComponent(query.trim())}`);
        closeSearchRef.current();
      }
    },
  });
  closeSearchRef.current = search.close;

  useEffect(() => {
    search.resetFocus();
  }, [deferredQuery, search.resetFocus]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        search.open();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [search.open]);

  const ctx = useMemo(() => ({ open: search.open }), [search.open]);

  return (
    <SearchContext.Provider value={ctx}>
      {children}

      <SearchModal
        modalProps={search.modalProps}
        query={query}
        onQueryChange={setQuery}
        inputRef={search.inputRef}
        onInputKeyDown={search.handleInputKeyDown}
        placeholder="Ex : science ouverte, parcoursup, effectifs étudiants…"
        listboxId="platform-search-listbox"
        activedescendant={
          search.focusedIndex >= 0 ? `search-result-${search.focusedIndex}` : undefined
        }
        footer={
          <>
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
              <SearchModal.Kbd>↑↓</SearchModal.Kbd> naviguer
              {' · '}
              <SearchModal.Kbd>↩</SearchModal.Kbd> ouvrir
              {' · '}
              <SearchModal.Kbd>esc</SearchModal.Kbd> fermer
            </p>
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
              <SearchModal.Kbd>Ctrl</SearchModal.Kbd>
              {' + '}
              <SearchModal.Kbd>K</SearchModal.Kbd>
            </p>
          </>
        }
      >
        {hasQuery && results.length === 0 && (
          <SearchModal.Empty>Aucun résultat pour « {deferredQuery} »</SearchModal.Empty>
        )}

        {results.map((item, index) => (
          <SearchModal.Item
            key={item.id}
            id={`search-result-${index}`}
            focused={search.focusedIndex === index}
            ref={(el) => search.setItemRef(index, el)}
            onClick={() => search.select(index)}
          >
            <div className="fx-flex fx-items-start fx-gap-2w fx-width-100">
              <span className={cn('fr-icon--sm', getIconForType(item))} aria-hidden="true" />
              <div className="fx-flex fx-flex-col fx-items-start fx-gap-1v fx-flex-grow">
                <div className="fx-flex fx-items-center fx-gap-1w">
                  <p className="fx-clamp-1 fr-text--sm fr-mb-0">{item.title}</p>
                  <TypeBadge type={item.type} />
                </div>
                {item.description && (
                  <p className="fx-clamp-1 fr-text--xs fr-text-mention--grey fr-mb-0">
                    {item.description}
                  </p>
                )}
              </div>
              {item.requiresAuth && (
                <span
                  className="fr-icon-lock-line fr-icon--sm fr-text-mention--grey"
                  aria-hidden="true"
                />
              )}
            </div>
          </SearchModal.Item>
        ))}

        {hasQuery && results.length > 0 && (
          <SearchModal.Item
            id="search-view-all"
            focused={search.focusedIndex === results.length}
            ref={(el) => search.setItemRef(results.length, el)}
            onClick={() => search.select(results.length)}
          >
            <div className="fx-flex fx-items-center fx-gap-2w fx-width-100 fx-justify-center">
              <span className="fr-icon-search-line fr-icon--sm" aria-hidden="true" />
              <p className="fr-text--sm fr-mb-0" style={{ color: 'var(--text-action-high-blue-france)' }}>
                Voir tous les résultats pour « {deferredQuery} »
              </p>
            </div>
          </SearchModal.Item>
        )}
      </SearchModal>
    </SearchContext.Provider>
  );
}
