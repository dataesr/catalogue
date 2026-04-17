import { Link } from 'react-router';
import type { CatalogItem } from '~/schemas/catalog';
import { formatDate, formatNumber } from './utils';
import './styles.css';

export default function DatasetCard({ item }: { item: CatalogItem }) {
  return (
    <Link to={`/donnees-ouvertes/${item.id}`} className="catalog-card">
      <div className="catalog-card__body">
        <h2 className="catalog-card__title">{item.title}</h2>
        {item.description && (
          <p className="catalog-card__desc">{item.description}</p>
        )}

        <div className="catalog-card__meta">
          {item.recordsCount > 0 && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-database-line fr-icon--sm" aria-hidden="true" />
              {formatNumber(item.recordsCount)} enregistrements
            </span>
          )}
          {item.modified && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-calendar-line fr-icon--sm" aria-hidden="true" />
              {formatDate(item.modified)}
            </span>
          )}
          {item.publisher && (
            <span className="catalog-card__meta-item catalog-card__meta-item--clamp">
              <span className="fr-icon-building-line fr-icon--sm" aria-hidden="true" />
              {item.publisher}
            </span>
          )}
        </div>

        {item.topics.length > 0 && (
          <div className="catalog-card__tags">
            {item.topics.slice(0, 3).map((topic) => (
              <span key={topic} className="fr-tag fr-tag--sm">
                {topic}
              </span>
            ))}
            {item.topics.length > 3 && (
              <span className="fr-text--xs fr-mb-0 fr-text-mention--grey">
                +{item.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="catalog-card__arrow fr-icon-arrow-right-line" aria-hidden="true" />
    </Link>
  );
}
