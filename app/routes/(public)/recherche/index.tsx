import cn from 'classnames';
import { parseAsString, useQueryStates } from 'nuqs';
import { Link } from 'react-router';
import { useGroupedCatalogSearch } from '@/api/catalog';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IconBox } from '@/components/ui/IconBox';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/components/catalog/utils';
import type { ColorFamily } from '@/components/ui/ColorPicker';
import type { CatalogItem } from '~/schemas/catalog';

const LIMIT = 5;

function getHref(item: CatalogItem): string {
  if (item.type === 'dataset') return `/donnees-ouvertes/${item.id}`;
  if (item.type === 'publication') return `/publications/${item.id}`;
  if (item.type === 'resource') return `/outils/${item.id}`;
  return '/outils';
}

function getMeta(item: CatalogItem): string {
  if (item.type === 'resource') return item.format ?? item.publisher ?? '';
  if (item.type === 'dataset') {
    if (item.publisher) return item.publisher;
    if (item.recordsCount > 0) return `${formatNumber(item.recordsCount)} enregistrements`;
    return '';
  }
  const author = item.authors[0]?.name ?? '';
  const suffix = item.authors.length > 1 ? ' et al.' : '';
  const year = item.published ? item.published.slice(0, 4) : '';
  return [author ? author + suffix : '', year].filter(Boolean).join(' · ');
}

function ResultRow({ item, index }: { item: CatalogItem; index: number }) {
  const meta = getMeta(item);
  const href = getHref(item);
  const isExternal = false;

  return (
    <div
      className={cn('fx-flex fx-items-center fr-px-3w fr-py-2w fr-enlarge-link', {
        'fx-shadow-border-top': index > 0,
      })}
    >
      <div className="fx-flex-grow" style={{ minWidth: 0 }}>
        <p className="fr-text--sm fr-text--bold fr-mb-0 fx-clamp-1">
          {isExternal ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          ) : (
            <Link to={href}>{item.title}</Link>
          )}
        </p>
        {meta && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v fx-clamp-1">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('fr-px-3w fr-py-2w', { 'fx-shadow-border-top': i > 0 })}>
          <Skeleton width="lg" height="0.875rem" className="fr-mb-1v" />
          <Skeleton width="sm" height="0.75rem" />
        </div>
      ))}
    </>
  );
}

interface SectionProps {
  icon: string;
  color: ColorFamily;
  title: string;
  results: CatalogItem[];
  totalCount: number;
  isLoading: boolean;
  moreHref: string;
}

function Section({ icon, color, title, results, totalCount, isLoading, moreHref }: SectionProps) {
  if (!isLoading && totalCount === 0) return null;

  return (
    <div className="fr-py-3w">
      <div className="fr-px-3w fr-pt-2w fr-pb-2w fx-shadow-border-bottom fx-flex fx-items-center fx-gap-2w">
        <IconBox icon={icon} color={color} size="sm" />
        <h2 className="fr-h6 fr-mb-0 fx-flex-grow">{formatNumber(totalCount)} {title}</h2>
        {!isLoading && (
          <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--grey">
            {formatNumber(totalCount)}
          </span>
        )}
      </div>

      {isLoading ? (
        <SkeletonRows count={LIMIT} />
      ) : (
        results.map((item, index) => (
          <ResultRow key={item.id} item={item} index={index} />
        ))
      )}

      {!isLoading && totalCount > LIMIT && (
        <div className="fx-shadow-border-top fr-px-3w fr-py-1w fx-flex fx-justify-end">
          <Link
            to={moreHref}
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-arrow-right-line"
          >
            Voir les {formatNumber(totalCount)}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Recherche() {
  const [{ q }] = useQueryStates({ q: parseAsString.withDefault('') });

  const { data, isLoading } = useGroupedCatalogSearch({
    q: q.trim() || undefined,
    limit: LIMIT,
  });

  const resources    = data?.resources    ?? { results: [], totalCount: 0 };
  const datasets     = data?.datasets     ?? { results: [], totalCount: 0 };
  const publications = data?.publications ?? { results: [], totalCount: 0 };

  const datasetsHref     = q ? `/donnees-ouvertes?q=${encodeURIComponent(q)}` : '/donnees-ouvertes';
  const publicationsHref = q ? `/publications?q=${encodeURIComponent(q)}`     : '/publications';

  const totalResults = resources.totalCount + datasets.totalCount + publications.totalCount;

  const summaryParts = [
    resources.totalCount > 0 && `${formatNumber(resources.totalCount)} outil${resources.totalCount !== 1 ? 's' : ''}`,
    datasets.totalCount > 0 && `${formatNumber(datasets.totalCount)} jeu${datasets.totalCount !== 1 ? 'x' : ''} de données`,
    publications.totalCount > 0 && `${formatNumber(publications.totalCount)} publication${publications.totalCount !== 1 ? 's' : ''}`,
  ].filter(Boolean) as string[];

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Recherche', current: true },
        ]}
        appName="#dataESR"
      />

      <div className="fr-mb-4w">
        {q ? (
          <>
            <h1 className="fr-h3 fr-mb-1v">
              Résultats pour <strong>« {q} »</strong>
            </h1>
            {!isLoading && summaryParts.length > 0 && (
              <p className="fr-text-mention--grey fr-mb-0">{summaryParts.join(' · ')}</p>
            )}
          </>
        ) : (
          <>
            <h1 className="fr-h3 fr-mb-1v">Explorer le catalogue</h1>
            <p className="fr-text-mention--grey fr-mb-0">
              Outils &amp; applications, jeux de données et publications statistiques
            </p>
          </>
        )}
      </div>

      {!isLoading && q && totalResults === 0 ? (
        <div className="fr-py-8w fx-flex fx-flex-col fx-items-center fx-gap-2w">
          <span className="fr-icon-search-line fr-icon--lg" aria-hidden="true" />
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Aucun résultat ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="fx-flex fx-flex-col fx-gap-4w">
          <Section
            icon="fr-icon-tools-fill"
            color="green-emeraude"
            title="Outils & applications"
            results={resources.results}
            totalCount={resources.totalCount}
            isLoading={isLoading}
            moreHref="/outils"
          />
          <Section
            icon="fr-icon-database-fill"
            color="blue-ecume"
            title="Jeux de données"
            results={datasets.results}
            totalCount={datasets.totalCount}
            isLoading={isLoading}
            moreHref={datasetsHref}
          />
          <Section
            icon="fr-icon-article-fill"
            color="purple-glycine"
            title="Publications"
            results={publications.results}
            totalCount={publications.totalCount}
            isLoading={isLoading}
            moreHref={publicationsHref}
          />
        </div>
      )}
    </div>
  );
}
