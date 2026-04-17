import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageContentLoader } from '@/components/ui/loaders';
import cn from 'classnames';
import { Navigate, useParams } from 'react-router';
import { useCatalogItem } from '@/api/catalog';
import { formatDate, formatFileSize, formatNumber } from '@/components/catalog/utils';
import { KeyValueCard } from '@/components/KeyValueCard';
import type { CatalogItem } from '~/schemas/catalog';

function PublicationContent({ item }: { item: CatalogItem }) {
  const metadataCards: { label: string; value: string }[] = [];

  if (item.published) {
    metadataCards.push({ label: 'Date de publication', value: formatDate(item.published) });
  }
  if (item.publisher) {
    metadataCards.push({ label: 'Éditeur', value: item.publisher });
  }
  if (item.license) {
    metadataCards.push({ label: 'Licence', value: item.license });
  }
  if (item.views > 0) {
    metadataCards.push({ label: 'Consultations', value: formatNumber(item.views) });
  }
  if (item.downloads > 0) {
    metadataCards.push({ label: 'Téléchargements', value: formatNumber(item.downloads) });
  }

  const totalSize = item.files.reduce((sum, f) => sum + f.size, 0);

  return (
    <>
      {/* Header: title, source link */}
      <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w fr-mb-2w">
        <h1 className="fr-h3 fr-mb-0">{item.title}</h1>
        {item.url && (
          <a
            href={item.url}
            className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-right fr-icon-external-link-line"
            target="_blank"
            rel="noopener"
          >
            Voir sur Zenodo
          </a>
        )}
      </div>

      {/* Authors */}
      {item.authors.length > 0 && (
        <div className="fx-flex fx-flex-wrap fx-gap-2w fr-mb-2w">
          {item.authors.map((author) => (
            <span key={author.name} className="fx-flex fx-items-center fx-gap-1w">
              <span className="fr-icon-user-line fr-icon--sm" aria-hidden="true" />
              <span className="fr-text--sm fr-mb-0">
                {author.name}
                {author.affiliation && (
                  <span className="fr-text-mention--grey"> — {author.affiliation}</span>
                )}
              </span>
              {author.orcid && (
                <a
                  href={`https://orcid.org/${author.orcid}`}
                  className="fr-text--xs fr-text-mention--grey fr-mb-0"
                  target="_blank"
                  rel="noopener"
                  title="Profil ORCID"
                >
                  ORCID
                </a>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Badges: type, journal, DOI, access right */}
      <div className="fx-flex fx-flex-wrap fx-items-center fx-gap-1w fr-mb-3w">
        {item.publicationType && (
          <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--purple-glycine">
            {item.publicationType}
          </span>
        )}
        {item.journal && (
          <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--blue-ecume">
            {item.journal}
            {item.issue ? ` — ${item.issue}` : ''}
          </span>
        )}
        {item.doi && (
          <a
            href={item.doiUrl ?? `https://doi.org/${item.doi}`}
            className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--green-emeraude"
            target="_blank"
            rel="noopener"
          >
            DOI: {item.doi}
          </a>
        )}
        {item.accessRight && (
          <span
            className={cn('fr-badge fr-badge--sm fr-badge--no-icon', {
              'fr-badge--success': item.accessRight === 'open',
              'fr-badge--warning': item.accessRight === 'restricted',
              'fr-badge--error': item.accessRight === 'closed',
            })}
          >
            {item.accessRight === 'open'
              ? 'Accès ouvert'
              : item.accessRight === 'restricted'
                ? 'Accès restreint'
                : item.accessRight}
          </span>
        )}
      </div>

      {/* Description + thumbnail */}
      <div className="fx-flex fx-gap-3w fr-mb-3w">
        {item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="fr-responsive-img"
            style={{ width: '8rem', height: 'auto', objectFit: 'cover', borderRadius: '0.25rem' }}
          />
        )}
        {item.description && <p className="fr-text--md fx-max-prose fr-mb-0">{item.description}</p>}
      </div>

      {/* Tags */}
      {item.topics.length > 0 && (
        <div className="fx-flex fx-flex-wrap fx-gap-1w fr-mb-4w">
          {item.topics.map((t) => (
            <p key={t} className="fr-tag fr-tag--sm">
              {t}
            </p>
          ))}
        </div>
      )}

      {/* Metadata cards */}
      {metadataCards.length > 0 && (
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
          {metadataCards.map((card) => (
            <div key={card.label} className="fr-col-6 fr-col-md-4 fr-col-lg-3">
              <KeyValueCard label={card.label} value={card.value} />
            </div>
          ))}
        </div>
      )}

      {/* Files — DSFR download links */}
      {item.files.length > 0 && (
        <>
          <h2 className="fr-h5 fr-mb-2w">
            Fichiers ({item.files.length})
            {totalSize > 0 && (
              <span className="fr-text--sm fr-text-mention--grey fr-ml-1w">
                — {formatFileSize(totalSize)}
              </span>
            )}
          </h2>
          <ul className="fr-links-group fr-mb-4w">
            {item.files.map((f) => {
              const ext = f.key.split('.').pop()?.toUpperCase() ?? '';
              const detail = [ext, f.size > 0 ? formatFileSize(f.size) : '']
                .filter(Boolean)
                .join(' – ');

              return (
                <li key={f.key}>
                  <a download="true" href={f.url} className="fr-link fr-link--download">
                    Télécharger {f.key}
                    {detail && <span className="fr-link__detail">{detail}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

export default function PublicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useCatalogItem(id!);

  if (isLoading) return <PageContentLoader />;
  if (!item) return <Navigate to="/publications" replace />;

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Publications', href: '/publications' },
          { label: item.title, current: true },
        ]}
        appName="#dataESR"
      />
      <PublicationContent item={item} />
    </div>
  );
}
