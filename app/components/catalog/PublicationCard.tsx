import cn from 'classnames';
import { Link } from 'react-router';
import type { CatalogItem } from '~/schemas/catalog';
import { formatDate, formatFileSize, formatNumber } from './utils';
import './styles.css';

export default function PublicationCard({ item }: { item: CatalogItem }) {
  const pdfFile = item.files.find((f) => f.key.endsWith('.pdf'));

  return (
    <Link to={`/publications/${item.id}`} className="catalog-card">
      {item.thumbnailUrl && (
        <img
          className="catalog-card__thumbnail"
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
        />
      )}
      <div className="catalog-card__body">
        <p className="catalog-card__title">{item.title}</p>

        <div className="fx-flex fx-flex-wrap fx-items-center fx-gap-1w fr-mb-1v">
          {item.journal && (
            <span
              className={cn('fr-badge fr-badge--sm fr-badge--no-icon', {
                'fr-badge--info': item.journal.includes("Note d'information"),
                'fr-badge--new': item.journal.includes('Note flash'),
              })}
            >
              {item.journal}
              {item.issue ? ` n°${item.issue}` : ''}
            </span>
          )}
          {item.publicationType && !item.journal && (
            <span className="fr-badge fr-badge--sm fr-badge--no-icon">
              {item.publicationType}
            </span>
          )}
          {item.published && (
            <span className="fr-text--xs fr-text-mention--grey">
              {formatDate(item.published)}
            </span>
          )}
        </div>

        {item.authors.length > 0 && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fx-clamp-1">
            {item.authors.map((a) => a.name).join(', ')}
          </p>
        )}

        {item.description && (
          <p className="catalog-card__desc">{item.description}</p>
        )}

        <div className="catalog-card__meta">
          {item.downloads > 0 && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-download-line fr-icon--sm" aria-hidden="true" />
              {formatNumber(item.downloads)}
            </span>
          )}
          {item.views > 0 && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-eye-line fr-icon--sm" aria-hidden="true" />
              {formatNumber(item.views)}
            </span>
          )}
          {pdfFile && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-file-pdf-line fr-icon--sm" aria-hidden="true" />
              PDF ({formatFileSize(pdfFile.size)})
            </span>
          )}
        </div>
      </div>
      <span className="catalog-card__arrow fr-icon-arrow-right-line" aria-hidden="true" />
    </Link>
  );
}
