import { DsfrArtwork } from '@/components/ui/DsfrArtwork';

const GITHUB_ORGS = [
  {
    href: 'https://github.com/dataesr',
    label: 'github.com/dataesr',
  },
];

const HIGHLIGHTS = [
  { icon: 'fr-icon-code-s-slash-line', label: 'Code source disponible' },
  { icon: 'fr-icon-git-repository-line', label: 'Dépôts publics' },
  { icon: 'fr-icon-team-fill', label: 'Contributions bienvenues' },
];

export default function OpenSourceBanner() {
  return (
    <section className="home-opensource fr-py-8w">
      <div className="fr-container">
        <div className="home-opensource__inner fx-flex fx-items-center fx-gap-6w">
          {/* Pictogram */}
          <div className="home-opensource__pictogram--inner">
            <DsfrArtwork pictogram="digital/coding" withBackground={false} className="fr-artwork home-opensource__pictogram" />
          </div>

          {/* Content */}
          <div className="fx-flex-grow">
            <h2 className="fr-h4 fr-mb-1w">Notre code est ouvert</h2>
            <p className="fr-text--sm fr-text-mention--grey fr-mb-3w" style={{ maxWidth: '58ch' }}>
              Le code de nos applications, APIs et outils de traitement de données sont
              disponibles en libre accès. Explorez nos dépôts, réutilisez nos briques logicielles ou
              contribuez directement à nos projets.
            </p>

            <ul className="fx-reset-list fx-flex fx-flex-wrap fx-gap-x-4w fx-gap-y-1w fr-mb-3w">
              {HIGHLIGHTS.map(({ icon, label }) => (
                <li
                  key={label}
                  className="fx-flex fx-items-center fx-gap-1w fr-text--sm fr-text-mention--grey fr-mb-0"
                >
                  <span className={`${icon} fr-icon--sm`} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="fx-flex fx-gap-2w fx-flex-wrap">
              {GITHUB_ORGS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-btn fr-btn--icon-left fr-icon-code-s-slash-line"
                >
                  {label}
                </a>
              ))}
              <a
                href="https://github.com/dataesr/catalogue"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-external-link-line"
              >
                Ce site sur GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
