import { AutoGrid } from '@/components/ui/AutoGrid';
import { StatCard } from '@/components/ui/StatCard';
import { Link } from 'react-router';
import { useCatalogSearch } from '@/api/catalog';
import { catalog } from '@/data/catalog';

const resourceCount = catalog.resources.length;

const STATS = [
  { key: 'resource', label: 'Outils & applications', description: 'Tableaux de bord interactifs', icon: 'fr-icon-tools-fill', color: 'green-emeraude', to: '/outils' },
  { key: 'dataset', label: 'Jeux de données', description: 'Téléchargeables en open data', icon: 'fr-icon-database-fill', color: 'blue-ecume', to: '/donnees-ouvertes' },
  { key: 'publication', label: 'Publications', description: 'Notes et études statistiques', icon: 'fr-icon-article-fill', color: 'purple-glycine', to: '/publications' },
] as const;

export default function Hero() {
  const { data, isLoading } = useCatalogSearch({ limit: 0 });

  function getCount(key: string): number | string {
    if (key === 'resource') return resourceCount;
    if (isLoading) return '…';
    return data?.facets.type.find((b) => b.key === key)?.count ?? 0;
  }

  return (
    <section className="home-hero">
      <div className="fr-container">
        <div className="fx-max-prose--sm">
          <h1 className="fr-h1 fr-mb-2w">
            Les données de l'enseignement supérieur et de la recherche
          </h1>
          <p className="fr-text--xl fr-text-mention--grey fr-mb-0">
            Applications, tableaux de bord interactifs, données ouvertes et publications statistiques — en accès libre.
          </p>
        </div>
      </div>

      <div className="fr-container fr-mt-8w">
        <AutoGrid type="fit" min={220} gap="sm">
          {STATS.map(({ key, label, description, icon, color, to }) => (
            <Link key={key} to={to} className="home-hero__stat-link">
              <div className="fx-card fx-card--shadow fx-card--sm fx-card--animate">
                <StatCard
                  value={getCount(key)}
                  label={label}
                  description={description}
                  icon={icon}
                  color={color}
                />
              </div>
            </Link>
          ))}
        </AutoGrid>
      </div>
    </section>
  );
}
