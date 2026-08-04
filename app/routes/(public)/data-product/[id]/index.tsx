import { Navigate, useParams } from 'react-router';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IconBox } from '@/components/ui/IconBox'
import bso from '../../../../../catalog/data-products/bso.json';

export default function DataProductDetail() {
  const { id } = useParams<{ id: string }>();

  if (id !== bso.metadata.slug) return <Navigate to="/" replace />;

  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Data product', href: '/data-product/barometre-science-ouverte' },
          { label: bso.metadata.shortName, current: true },
        ]}
        appName="#dataESR"
      />
      <div className="fx-flex fx-justify-between fx-items-start fx-gap-3w fr-mb-3w">
        <div>
          <h1 className="fr-h3 fr-mb-1v">{bso.metadata.name}</h1>
          <div className="fr-mb-2w">{bso.metadata.description}</div>
          {/* Topics */}
          {bso?.metadata?.topics?.length > 0 && (
            <div>
              {bso.metadata.topics.map((topic) => (
                <span key={topic} className="fr-tag fr-tag--sm">
                  {topic}
                </span>
              ))}
            </div>
          )}
          {/* Tags */}
          {bso?.metadata?.tags?.length > 0 && (
            <div>
              {bso.metadata.tags.join(' · ')}
            </div>
          )}
        </div>
      </div>

      <div className="fr-grid-row">
        <div className="fr-col-md-9">
          {/* Ownership */}
          <div>
            <h2 className="fr-h3 fr-mb-1v">Ownership</h2>
            {bso?.ownership?.sponsor && (
              <div>
                Sponsor: {[bso?.ownership?.sponsor?.organization, bso?.ownership?.sponsor?.division, bso?.ownership?.sponsor?.team].join(' - ')}
              </div>
            )}
            {bso?.ownership?.technicalOwner && (
              <div>
                Responsable: {[bso?.ownership?.technicalOwner?.organization, bso?.ownership?.technicalOwner?.team].join(' - ')}
              </div>
            )}
            {bso?.ownership?.contacts?.length > 0 && (
              <div>
                Contacts:
                <ul>
                  {bso.ownership.contacts.map((contact) => (
                    <li>{contact.type}: {contact.value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Governance */}
          <div>
            <h2 className="fr-h3 fr-mb-1v">Gouvernance</h2>
            {/* domain */}
            {bso?.governance?.domain && (
              <div>
                domain: {bso.governance.domain}
              </div>
            )}
            {/* dataClassification */}
            {bso?.governance?.dataClassification && (
              <div>
                dataClassification: {bso.governance.dataClassification}
              </div>
            )}
            {/* containsPersonalData */}
            {bso?.governance?.containsPersonalData && (
              <div>
                containsPersonalData: {bso.governance.containsPersonalData}
              </div>
            )}
            {/* license */}
            {bso?.governance?.license && (
              <div>
                license: {bso.governance.license}
              </div>
            )}
          </div>

          {/* Artefacts */}
          <div>
            <h2 className="fr-h3 fr-mb-1v">Artefacts</h2>
            {bso?.artefacts?.length > 0 && (
              <div>
                {bso.artefacts.map((artefact) => (
                  <a
                    className="fr-btn fr-btn--icon-right fr-icon-external-link-line"
                    href={`/data-artefact/${artefact.resourceId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {artefact.resourceId}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* upstreamDataSources */}
          <div>
            <h2 className="fr-h3 fr-mb-1v">upstreamDataSources</h2>
            {bso?.upstreamDataSources?.length > 0 && (
              <div>
                {bso.upstreamDataSources.map((upstreamDataSource) => (
                  <a
                    className="fr-btn fr-btn--icon-right fr-icon-external-link-line"
                    href={`/data-artefact/${upstreamDataSource.dataSourceId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {upstreamDataSource.dataSourceId}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="fr-col-md-3">
          {/* Metadata */}
          <div>
            <h2 className="fr-h3 fr-mb-1v">Metadata</h2>
            {/* Status */}
            {bso?.metadata?.status && (
              <div>
                Status: {bso.metadata.status}
              </div>
            )}
            {/* Visibility */}
            {bso?.metadata?.visibility && (
              <div>
                Visibilité: {bso.metadata.visibility}
              </div>
            )}
            {/* CreatedAt */}
            {bso?.metadata?.createdAt && (
              <div>
                Création: {bso.metadata.createdAt}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}