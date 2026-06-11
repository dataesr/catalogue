import Markdown from 'react-markdown'
import { Navigate, useParams } from 'react-router'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { IconBox } from '@/components/ui/IconBox'
import { catalog, getFormatMeta, getTopicsForResource } from '@/data/catalog'

function LinkRenderer(props: any) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  );
}

export default function OutilDetail() {
  const { id } = useParams<{ id: string }>();
  const resource = catalog.resources.find((r) => r.id === id);

  if (!resource) return <Navigate to="/outils" replace />;

  const format = getFormatMeta(resource.format);
  const topics = getTopicsForResource(resource);
  const externalUrl = resource.url ?? resource.internalPath ?? null;

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Outils & applications', href: '/outils' },
          { label: resource.title, current: true },
        ]}
        appName="#dataESR"
      />

      {/* Header */}
      <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w fr-mb-3w">
        <div className="fx-flex fx-items-start fx-gap-2w">
          {format && <IconBox icon={format.icon} color={format.color} size="md" />}
          <div>
            <h1 className="fr-h3 fr-mb-1v">{resource.title}</h1>
            <div className="fx-flex fx-items-center fx-gap-1w">
              {format && (
                <span className={`fr-badge fr-badge--sm fr-badge--no-icon fr-badge--${format.color}`}>
                  {format.label}
                </span>
              )}
              {resource.requiresAuth && (
                <span className="fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning">
                  Authentification requise
                </span>
              )}
            </div>
          </div>
        </div>
        {externalUrl && (
          <a
            href={externalUrl}
            className="fr-btn fr-btn--icon-right fr-icon-external-link-line"
            target="_blank"
            rel="noopener noreferrer"
          >
            Accéder
          </a>
        )}
      </div>

      {/* Description */}
      {/* Fix by annelhote */}
      {resource.description && (
        <p className="fr-text--lg fr-mb-4w fx-max-prose">
          <Markdown components={{ a: LinkRenderer }}>
            {resource.description}
          </Markdown>
        </p>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div className="fx-flex fx-flex-wrap fx-gap-1w fr-mb-4w">
          {topics.map((topic) => (
            <span key={topic.id} className="fr-tag fr-tag--sm">
              {topic.label}
            </span>
          ))}
        </div>
      )}

      {/* Keywords */}
      {resource.keywords.length > 0 && (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
          {resource.keywords.join(' · ')}
        </p>
      )}
    </div>
  );
}
