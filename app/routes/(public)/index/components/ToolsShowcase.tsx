import { Link } from 'react-router';
import ResourceCard from '@/components/ResourceCard';
import { catalog } from '@/data/catalog';
import type { Resource } from '@/data/types';

const BENTO_IDS = ['A01', 'A02', 'A05', 'A06', 'A04', 'D02'];

export default function ToolsShowcase() {
  const tools = BENTO_IDS
    .map((id) => catalog.resources.find((r) => r.id === id))
    .filter((r): r is Resource => r !== undefined);

  if (tools.length === 0) return null;

  return (
    <section className="fr-container fr-py-12w">
      <h2 className="fr-h4 fr-mb-1v">Nos outils & tableaux de bord</h2>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
        Applications, visualisations et tableaux de bord interactifs
      </p>
      <div className="bento-grid">
        {tools.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            featured={index === 0}
            className={index === 0 ? 'bento-grid__item--featured' : undefined}
          />
        ))}
      </div>
      <div className="fx-flex fx-justify-center fr-mt-3w">
        <Link to="/outils" className="fr-btn fr-btn--secondary fr-btn--icon-right fr-icon-arrow-right-line">
          Voir tous les outils
        </Link>
      </div>
    </section>
  );
}
