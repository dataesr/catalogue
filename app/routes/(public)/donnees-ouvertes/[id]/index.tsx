import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageContentLoader } from '@/components/ui/loaders';
import { Navigate, useParams } from 'react-router';
import { useCatalogItem } from '@/api/catalog';
import { formatDate, formatNumber } from '@/components/catalog/utils';
import { KeyValueCard } from '@/components/KeyValueCard';
import type { CatalogItem } from '~/schemas/catalog';

const FORMAT_LABELS: Record<string, string> = {
  csv: 'CSV',
  json: 'JSON',
  xlsx: 'Excel',
  parquet: 'Parquet',
  geojson: 'GeoJSON',
  shp: 'Shapefile',
  xml: 'XML',
  pdf: 'PDF',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
  semiannual: 'Semestrielle',
  annual: 'Annuelle',
  irregular: 'Irrégulière',
  unknown: 'Inconnue',
};

function DatasetDetail({ item }: { item: CatalogItem }) {
  const sourceUrl = item.sourceId
    ? `https://data.enseignementsup-recherche.gouv.fr/explore/assets/${item.sourceId}/view/`
    : null;

  const metadataCards: { label: string; value: string }[] = [];

  if (item.license) {
    metadataCards.push({ label: 'Licence', value: item.license });
  }
  metadataCards.push({ label: 'Enregistrements', value: formatNumber(item.recordsCount) });
  if (item.recordsSize > 0) {
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let size = item.recordsSize;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    metadataCards.push({
      label: 'Taille des données',
      value: `${i === 0 ? size : size.toFixed(1)} ${units[i]}`,
    });
  }
  if (item.modified) {
    metadataCards.push({ label: 'Dernière modification', value: formatDate(item.modified) });
  }
  if (item.accrualPeriodicity) {
    metadataCards.push({
      label: 'Fréquence de mise à jour',
      value: FREQUENCY_LABELS[item.accrualPeriodicity] ?? item.accrualPeriodicity,
    });
  }
  if (item.territory.length > 0) {
    const value = item.territory.join(', ');
    if (value?.toLowerCase() !== "world") {
      metadataCards.push({ label: 'Territoire', value });
    } else {
      metadataCards.push({ label: 'Territoire', value: 'Monde' });
    }

  }

  return (
    <>
      {/* Header: title, publisher, source link */}
      <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w fr-mb-3w">
        <div>
          <h1 className="fr-h3 fr-mb-1v">{item.title}</h1>
          {item.publisher && (
            <p className="fr-text--lg fr-text-mention--grey fr-mb-0">{item.publisher}</p>
          )}
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            className="fr-btn fr-btn--icon-right fr-icon-external-link-line"
            target="_blank"
            rel="noopener noreferrer"
          >
            Accéder aux données
          </a>
        )}
      </div>

      {/* Description */}
      {item.description && <p className="fr-text--md fr-mb-3w fx-max-prose">{item.description}</p>}

      {/* Tags / themes */}
      {(item.topics.length > 0 || item.odsThemes.length > 0) && (
        <div className="fx-flex fx-flex-wrap fx-gap-1w fr-mb-4w">
          {item.odsThemes.map((t) => (
            <p key={t} className="fr-tag fr-tag--sm">
              {t}
            </p>
          ))}
          {item.topics
            .filter((t) => !item.odsThemes.includes(t))
            .map((t) => (
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
    </>
  );
}

export default function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useCatalogItem(id!);

  if (isLoading) return <PageContentLoader />;
  if (!item) return <Navigate to="/donnees-ouvertes" replace />;

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Données ouvertes', href: '/donnees-ouvertes' },
          { label: item.title, current: true },
        ]}
        appName="#dataESR"
      />
      <DatasetDetail item={item} />
    </div>
  );
}
