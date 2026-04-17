import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { formatNumber } from './utils';
import './styles.css';

interface CatalogHeroProps {
  title: string;
  totalCount?: number;
  query: string;
  onQueryChange: (q: string) => void;
  breadcrumbItems: Array<{ label: string; href?: string; current?: boolean }>;
  isLoading?: boolean;
}

export default function CatalogHero({
  title,
  totalCount,
  query,
  onQueryChange,
  breadcrumbItems,
  isLoading = false,
}: CatalogHeroProps) {
  const searchId = `catalog-hero-search-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="catalog-hero">
      <div className="fr-container">
        <Breadcrumb items={breadcrumbItems} appName="#dataESR" />
        <div className="catalog-hero__inner">
          <div className="catalog-hero__text">
            <h1 className="fr-h3 fr-mb-1v">{title}</h1>
            <p className="fr-text-mention--grey fr-mb-0">
              {isLoading
                ? 'Chargement…'
                : totalCount !== undefined
                  ? `${formatNumber(totalCount)} résultat${totalCount > 1 ? 's' : ''}`
                  : null}
            </p>
          </div>
          <search className="catalog-hero__search">
            <div className="fr-search-bar">
              <label className="fr-label" htmlFor={searchId}>
                Rechercher
              </label>
              <input
                className="fr-input"
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Rechercher…"
              />
              <button className="fr-btn" type="button" title="Rechercher">
                Rechercher
              </button>
            </div>
          </search>
        </div>
      </div>
    </div>
  );
}
