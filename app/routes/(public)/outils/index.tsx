import { AutoGrid } from '@/components/ui/AutoGrid';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IconBox } from '@/components/ui/IconBox';
import { useMemo, useState } from 'react';
import ResourceCard from '@/components/ResourceCard';
import { catalog, getFormatMeta } from '@/data/catalog';
import type { ResourceFormat } from '@/data/types';

const FORMAT_ORDER: ResourceFormat[] = ['application', 'tableau-de-bord', 'api'];

export default function Outils() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  function toggleTopic(id: string) {
    setActiveTopic((prev) => (prev === id ? null : id));
  }

  const groups = useMemo(() => {
    const filtered = catalog.resources.filter(
      (r) => !activeTopic || r.topics.includes(activeTopic),
    );
    return FORMAT_ORDER.map((formatId) => ({
      format: getFormatMeta(formatId)!,
      items: filtered.filter((r) => r.format === formatId),
    })).filter((g) => g.items.length > 0);
  }, [activeTopic]);

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Outils & applications', current: true },
        ]}
        appName="#dataESR"
      />

      <div className="fx-flex fx-items-center fx-gap-2w fr-mb-1w">
        <h1 className="fr-h3 fr-mb-0">Nos outils & applications</h1>
        <span className="fr-badge fr-badge--sm fr-badge--no-icon">
          {totalCount} ressource{totalCount > 1 ? 's' : ''}
        </span>
      </div>
      <p className="fr-text-mention--grey fr-mb-3w">
        Tous les outils, applications, tableaux de bord et API de la plateforme #dataESR
      </p>

      <ul className="fx-flex fx-flex-wrap fx-gap-1w fr-mb-4w fx-reset-list">
        <li>
          <button
            className="fr-tag"
            aria-pressed={activeTopic === null}
            onClick={() => setActiveTopic(null)}
            type="button"
          >
            Tout
          </button>
        </li>
        {catalog.topics.map((topic) => (
          <li key={topic.id}>
            <button
              className="fr-tag"
              aria-pressed={activeTopic === topic.id}
              onClick={() => toggleTopic(topic.id)}
              type="button"
            >
              {topic.shortLabel}
            </button>
          </li>
        ))}
      </ul>

      {groups.length > 0 ? (
        <div className="fx-flex fx-flex-col fx-gap-4w">
          {groups.map((group) => (
            <section key={group.format.id}>
              <div className="fx-flex fx-items-center fx-gap-2w fr-mb-2w">
                <IconBox icon={group.format.icon} color={group.format.color} size="sm" />
                <h2 className="fr-h5 fr-mb-0">
                  {group.format.label}{group.format.id !== 'api' ? 's' : ''}
                </h2>
                <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--grey">
                  {group.items.length}
                </span>
              </div>
              <AutoGrid type="fill" min={320} gap="md">
                {group.items.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} showTopics />
                ))}
              </AutoGrid>
            </section>
          ))}
        </div>
      ) : (
        <div className="fr-py-8w fx-flex fx-flex-col fx-items-center fx-gap-2w">
          <span className="fr-icon-search-line fr-icon--lg" aria-hidden="true" />
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Aucune ressource ne correspond à cette thématique.
          </p>
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={() => setActiveTopic(null)}
            type="button"
          >
            Réinitialiser le filtre
          </button>
        </div>
      )}
    </div>
  );
}
