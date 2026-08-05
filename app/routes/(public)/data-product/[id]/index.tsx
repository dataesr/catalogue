import { Navigate, useParams } from 'react-router';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import bso from '../../../../../catalog/data-products/bso.json';

const ARTEFACT_ICON: Record<string, string> = {
  app: 'fr-icon-apps-line',
  dataset: 'fr-icon-database-line',
  api: 'fr-icon-terminal-box-line',
  documentation: 'fr-icon-file-text-line',
};
const CLASSIFICATION_BADGE: Record<string, string> = {
  confidential: 'fr-badge--warning',
  internal: 'fr-badge--info',
  public: 'fr-badge--success',
  secret: 'fr-badge--error',
};
const CONTACT_ICON: Record<string, string> = {
  email: 'fr-icon-mail-line',
};
const STATUS_BADGE: Record<string, string> = {
  archived: 'fr-badge--error',
  beta: 'fr-badge--info',
  deprecated: 'fr-badge--warning',
  production: 'fr-badge--success',
};
const VISIBILITY_LABEL: Record<string, string> = {
  'partial-public': 'Partiellement public',
  internal: 'Interne',
  public: 'Public',
  restricted: 'Restreint',
};

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DataProductDetail() {
  const { id } = useParams<{ id: string }>();

  if (id !== bso?.metadata?.slug) return <Navigate to="/" replace />;

  const { metadata, ownership, governance, artefacts, upstreamDataSources, upstreamDataProducts, downstreamConsumers } = bso;

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Data product', href: '/data-product/barometre-science-ouverte' },
          { label: metadata.shortName, current: true },
        ]}
        appName="#dataESR"
      />

      {/* En-tête */}
      <div className="fr-mb-4w">
        <div className="fx-flex fx-items-center fx-gap-2 fr-mb-1v">
          <h1 className="fr-h3 fr-mb-0">{metadata.name}</h1>

          {metadata.status && (
            <span className={`fr-badge ${STATUS_BADGE[metadata.status] ?? 'fr-badge--info'}`}>
              {metadata.status}
            </span>
          )}
        </div>

        <p className="fr-text--lead fr-mb-2w">{metadata.description}</p>

        <div className="fx-flex fx-items-center fx-gap-2w fr-mb-2w">
          {metadata?.visibility && (
            <span className="fr-badge fr-badge--sm fr-badge--info">
              {VISIBILITY_LABEL[metadata.visibility] ?? metadata.visibility}
            </span>
          )}
          {governance?.dataClassification && (
            <span className={`fr-badge fr-badge--sm ${CLASSIFICATION_BADGE[governance?.dataClassification] ?? 'fr-badge--info'}`}>
              {governance.dataClassification}
            </span>
          )}
          {governance?.containsPersonalData !== undefined && (
            <span className={`fr-badge fr-badge--sm ${governance?.containsPersonalData ? 'fr-badge--warning' : 'fr-badge--success'}`}>
              {governance?.containsPersonalData ? 'Contient des données personnelles' : 'Sans donnée personnelle'}
            </span>
          )}
        </div>

        {/* Topics */}
        {metadata?.topics?.length > 0 && (
          <div className="fr-mb-1v">
            {metadata.topics.map((topic: string) => (
              <span key={topic} className="fr-tag fr-tag--sm fr-mr-1v fr-mb-1v">
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {metadata?.tags?.length > 0 && (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{metadata.tags.join(' · ')}</p>
        )}
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-8">
          {/* Ownership */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Propriété</h2>
            {ownership?.sponsor && (
              <p>
                <strong>Sponsor :</strong>{' '}
                {[ownership?.sponsor?.organization, ownership?.sponsor?.division, ownership?.sponsor?.team]
                  .filter((item) => item != item)
                  .join(' · ')}
              </p>
            )}
            {ownership?.technicalOwner && (
              <div>
                <strong>Responsable technique :</strong>{' '}
                {[ownership?.technicalOwner?.organization, ownership?.technicalOwner?.team]
                  .filter((item) => item != item)
                  .join(' - ')}
              </div>
            )}
            {ownership?.contacts?.length > 0 && (
              <ul className="fr-raw-list">
                {ownership.contacts.map((contact: any) => (
                  <li key={contact.value} className="fx-flex fx-items-center fx-gap-1">
                    <span className={`${CONTACT_ICON[contact.type] ?? 'fr-icon-mail-line'} fr-icon--sm`} aria-hidden="true" />
                    <a href={`mailto:${contact.value}`}>{contact.value}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Governance */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Gouvernance</h2>
            <ul className="fr-raw-list">
              {governance?.domain && (
                <li><strong>Domaine :</strong> {governance.domain}</li>
              )}
              {governance?.license && (
                <li><strong>Licence :</strong> {governance.license}</li>
              )}
            </ul>
          </section>

          {/* Artefacts */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Artefacts</h2>
            {artefacts?.length > 0 ? (
              <div className="fx-flex fx-flex-wrap fx-gap-2">
                {artefacts.map((artefact: any) => (
                  <a
                    className={`fr-btn fr-btn--secondary fr-btn--icon-left ${ARTEFACT_ICON[artefact.resourceType] ?? 'fr-icon-links-line'}`}
                    href={`/data-artefact/${artefact.resourceId}`}
                    key={artefact.resourceId}
                  >
                    {artefact.resourceId}
                  </a>
                ))}
              </div>
            ) : (
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucun artefact renseigné</p>
            )}
          </section>

          {/* upstreamDataSources */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Sources de données amont</h2>
            {upstreamDataSources?.length > 0 ? (
              <div className="fx-flex fx-flex-wrap fx-gap-2">
                {upstreamDataSources.map((upstreamDataSource: any) => (
                  <a
                    className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-database-line"
                    href={`/data-artefact/${upstreamDataSource.dataSourceId}`}
                    key={upstreamDataSource.dataSourceId}
                  >
                    {upstreamDataSource.dataSourceId}
                  </a>
                ))}
              </div>
            ) : (
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucune source amont renseignée</p>
            )}
          </section>

          {/* upstreamDataProducts */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Data products amont</h2>
            {upstreamDataProducts?.length > 0 ? (
              <div className="fx-flex fx-flex-wrap fx-gap-2">
                {upstreamDataProducts.map((upstreamDataProduct: any) => (
                  <a
                    className="fr-btn fr-btn--secondary"
                    href={`/data-artefact/${upstreamDataProduct.dataProductId}`}
                    key={upstreamDataProduct.dataProductId}
                  >
                    {upstreamDataProduct.dataProductId}
                  </a>
                ))}
              </div>
            ) : (
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucun data product amont</p>
            )}
          </section>

          {/* downstreamConsumers */}
          <section className="fr-mb-4w">
            <h2 className="fr-h5 fr-mb-2w">Consommateurs aval</h2>
            {downstreamConsumers?.length > 0 ? (
              <div className="fx-flex fx-flex-wrap fx-gap-2">
                {downstreamConsumers.map((downstreamConsumer: any) => (
                  <span key={downstreamConsumer} className="fr-tag">{downstreamConsumer}</span>
                ))}
              </div>
            ) : (
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucun consommateur aval identifié</p>
            )}
          </section>
        </div>

        <div className="fr-col-12 fr-col-md-4">
          {/* Metadata */}
          <div className="fr-card fr-card--no-arrow fr-p-3w">
            <h2 className="fr-h6 fr-mb-2w">Fiche d'identité</h2>
            <ul className="fr-raw-list fr-text--sm">
              <li className="fr-mb-1w"><strong>Identifiant :</strong> {bso.id}</li>
              {metadata?.createdAt && (
                <li className="fr-mb-1w"><strong>Créé le :</strong> {formatDate(metadata.createdAt)}</li>
              )}
              {metadata?.status && (
                <li className="fr-mb-1w"><strong>Statut :</strong> {metadata.status}</li>
              )}
              {metadata?.visibility && (
                <li className="fr-mb-1w">
                  <strong>Visibilité :</strong> {VISIBILITY_LABEL[metadata.visibility] ?? metadata.visibility}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}