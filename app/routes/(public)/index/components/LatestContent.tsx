import cn from 'classnames';
import { Link } from 'react-router';
import { IconBox } from '@/components/ui/IconBox';
import { useCatalogSearch } from '@/api/catalog';
import { formatDate, formatNumber } from '@/components/catalog/utils';
import type { CatalogItem } from '~/schemas/catalog';

const ITEMS_COUNT = 6;

function RecentListSkeleton({ rows = ITEMS_COUNT }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn('fx-flex fx-items-center fx-gap-2w fr-px-3w fr-py-2w', {
            'fx-shadow-border-top': i > 0,
          })}
        >
          <div className="fx-flex-grow">
            <div
              className="fr-mb-1v"
              style={{
                height: '0.875rem',
                width: '65%',
                borderRadius: '0.25rem',
                background: 'var(--background-contrast-grey)',
              }}
            />
            <div
              style={{
                height: '0.75rem',
                width: '35%',
                borderRadius: '0.25rem',
                background: 'var(--background-alt-grey)',
              }}
            />
          </div>
          <div
            style={{
              height: '0.75rem',
              width: '4rem',
              borderRadius: '0.25rem',
              background: 'var(--background-alt-grey)',
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </>
  );
}

function PublicationRow({ item, index }: { item: CatalogItem; index: number }) {
  const date = item.published ? formatDate(item.published) : null;
  const type = item.journal || item.publicationType || null;

  return (
    <div
      className={cn(
        'recent-row fx-flex fx-items-start fr-px-3w fr-py-2w fr-enlarge-link',
        { 'fx-shadow-border-top': index > 0 },
      )}
    >
      <div className="fx-flex-grow" style={{ minWidth: 0 }}>
        <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w">
          <p className="fr-text--sm fr-text--bold fr-mb-0 fx-clamp-1">
            <Link to={`/publications/${item.id}`}>
              {item.title}
            </Link>
          </p>
          {date && (
            <span className="fr-text--xs fr-text-mention--grey fx-flex-shrink-0 fr-mb-0">
              {date}
            </span>
          )}
        </div>
        {type && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v fx-clamp-1">
            {type}
          </p>
        )}
      </div>
    </div>
  );
}

function DatasetRow({ item, index }: { item: CatalogItem; index: number }) {
  const downloads = item.downloads > 0 ? formatNumber(item.downloads) : null;
  const records = item.recordsCount > 0 ? `${formatNumber(item.recordsCount)} enregistrements` : null;
  const modified = item.modified ? `Mis à jour le ${formatDate(item.modified)}` : null;
  const subtitle = [records, modified].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'recent-row fx-flex fx-items-start fr-px-3w fr-py-2w fr-enlarge-link',
        { 'fx-shadow-border-top': index > 0 },
      )}
    >
      <div className="fx-flex-grow" style={{ minWidth: 0 }}>
        <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w">
          <p className="fr-text--sm fr-text--bold fr-mb-0 fx-clamp-1">
            <Link to={`/donnees-ouvertes/${item.id}`}>
              {item.title}
            </Link>
          </p>
          {downloads && (
            <span className="fx-flex fx-items-center fx-gap-1w fr-text--xs fr-text-mention--grey fx-flex-shrink-0 fr-mb-0">
              <span className="fr-icon-download-line fr-icon--sm" aria-hidden="true" />
              {downloads}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v fx-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function RecentPublications() {
  const { data, isLoading } = useCatalogSearch({
    type: 'publication',
    sort: 'newest',
    limit: ITEMS_COUNT,
  });
  const publications = data?.results ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <div className="fx-card fx-card--rounded fr-p-0 recent-card recent-card--publications">
      <div className="fr-px-3w fr-pt-2w fr-pb-2w fx-shadow-border-bottom fx-flex fx-items-center fx-gap-2w">
        <IconBox icon="fr-icon-article-fill" color="purple-glycine" size="sm" />
        <h3 className="fr-h6 fr-mb-0 fx-flex-grow">Dernières publications</h3>
      </div>

      {isLoading ? (
        <RecentListSkeleton />
      ) : publications.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey fr-m-3w">
          Aucune publication disponible.
        </p>
      ) : (
        publications.map((item, index) => (
          <PublicationRow key={item.id} item={item} index={index} />
        ))
      )}

      <div className="fx-shadow-border-top fr-px-3w fr-py-1w fx-flex fx-justify-between fx-items-center">
        <span className="fr-text--xs fr-text-mention--grey fr-mb-0">
          {total > 0 ? `${formatNumber(total)} publications au total` : ''}
        </span>
        <Link
          to="/publications"
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-arrow-right-line"
        >
          Voir tout
        </Link>
      </div>
    </div>
  );
}

function RecentDatasets() {
  const { data, isLoading } = useCatalogSearch({
    type: 'dataset',
    sort: 'downloads',
    limit: ITEMS_COUNT,
  });
  const datasets = data?.results ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <div className="fx-card fx-card--rounded fr-p-0 recent-card recent-card--datasets">
      <div className="fr-px-3w fr-pt-2w fr-pb-2w fx-shadow-border-bottom fx-flex fx-items-center fx-gap-2w">
        <IconBox icon="fr-icon-database-fill" color="blue-ecume" size="sm" />
        <h3 className="fr-h6 fr-mb-0 fx-flex-grow">Données populaires</h3>
      </div>

      {isLoading ? (
        <RecentListSkeleton />
      ) : datasets.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey fr-m-3w">
          Aucun jeu de données disponible.
        </p>
      ) : (
        datasets.map((item, index) => (
          <DatasetRow key={item.id} item={item} index={index} />
        ))
      )}

      <div className="fx-shadow-border-top fr-px-3w fr-py-1w fx-flex fx-justify-between fx-items-center">
        <span className="fr-text--xs fr-text-mention--grey fr-mb-0">
          {total > 0 ? `${formatNumber(total)} jeux de données au total` : ''}
        </span>
        <Link
          to="/donnees-ouvertes"
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-arrow-right-line"
        >
          Voir tout
        </Link>
      </div>
    </div>
  );
}

export default function LatestContent() {
  return (
    <div>

      <section className="fr-container fr-py-8w">
        <div className="fr-mb-4w">
          <h2 className="fr-h4 fr-mb-1v">Contenu récent</h2>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Les dernières publications et les jeux de données les plus consultés
          </p>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <RecentPublications />
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <RecentDatasets />
          </div>
        </div>
      </section>
    </div>
  );
}
