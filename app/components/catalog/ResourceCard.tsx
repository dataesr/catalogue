import cn from 'classnames';
import { Link } from 'react-router';
import type { CatalogItem } from '~/schemas/catalog';
import { formatDate } from './utils';
import './styles.css';

export default function ResourceCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      to={item.url || item.internalPath || '/outils'}
      className={cn('catalog-card', { 'catalog-card--locked': item.requiresAuth })}
    >
      <div className="catalog-card__body">
        <div className="fx-flex fx-items-center fx-flex-wrap fx-gap-1w">
          <h3 className="catalog-card__title">{item.title}</h3>
          {item.format && (
            <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--info">
              {item.format}
            </span>
          )}
          {item.requiresAuth && (
            <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning">
              <span className="fr-icon-lock-line fr-icon--sm fr-mr-1v" aria-hidden="true" />
              Connexion requise
            </span>
          )}
        </div>

        {item.description && (
          <p className="catalog-card__desc">{item.description}</p>
        )}

        <div className="catalog-card__meta">
          {item.publisher && (
            <span className="catalog-card__meta-item catalog-card__meta-item--clamp">
              <span className="fr-icon-building-line fr-icon--sm" aria-hidden="true" />
              {item.publisher}
            </span>
          )}
          {item.modified && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-calendar-line fr-icon--sm" aria-hidden="true" />
              {formatDate(item.modified)}
            </span>
          )}
          {item.accessRight && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-lock-line fr-icon--sm" aria-hidden="true" />
              {item.accessRight}
            </span>
          )}
        </div>

        {item.topics.length > 0 && (
          <div className="catalog-card__tags">
            {item.topics.slice(0, 4).map((topic) => (
              <span key={topic} className="fr-tag fr-tag--sm">
                {topic}
              </span>
            ))}
            {item.topics.length > 4 && (
              <span className="fr-text--xs fr-mb-0 fr-text-mention--grey">
                +{item.topics.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="catalog-card__arrow fr-icon-arrow-right-line" aria-hidden="true" />
    </Link>
  );
}
