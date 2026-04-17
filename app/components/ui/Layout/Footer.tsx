import cn from 'classnames';

export interface FooterProps {
  /** Smaller logo variant */
  sm?: boolean;
  /** Use full-width fluid container (default true) */
  fluid?: boolean;
  /** Override the home URL */
  homeUrl?: string;
  /** Override the description text */
  description?: string;
  /** Additional links to add in the bottom section */
  bottomLinks?: Array<{ label: string; href: string }>;
}

const siesLogo = '/public/sies_logo_signature.svg';

const EXTERNAL_LINKS = [
  { label: 'info.gouv.fr', href: 'https://info.gouv.fr' },
  { label: 'service-public.fr', href: 'https://service-public.fr' },
  { label: 'legifrance.gouv.fr', href: 'https://legifrance.gouv.fr' },
  { label: 'data.gouv.fr', href: 'https://data.gouv.fr' },
] as const;

const DEFAULT_BOTTOM_LINKS = [
  { label: 'Plan du site', href: '/plan-du-site' },
  { label: 'Accessibilité : partiellement conforme', href: '/accessibilite' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Données personnelles', href: '/donnees-personnelles' },
] as const;

export function Footer({
  sm = false,
  fluid = true,
  homeUrl = '/',
  description = "Cette application est gérée par la Sous-direction des systèmes d'information et des études statistiques (SIES)",
  bottomLinks,
}: FooterProps) {
  const allBottomLinks = bottomLinks ?? DEFAULT_BOTTOM_LINKS;

  return (
    <footer className="fr-footer" id="desr-footer">
      <div className={fluid ? 'fr-container--fluid' : 'fr-container'}>
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <a title="Retour à l'accueil du site" href={homeUrl} className="fr-footer__brand-link">
              <p className={cn('fr-logo', { 'fr-logo--sm': sm })}>
                Ministère
                <br />
                de l'enseignement
                <br />
                supérieur,
                <br />
                de la recherche
                <br />
                et de l'espace
              </p>
              <svg
                role="img"
                aria-label="Logo SIES"
                viewBox="0 0 1167.77 752.85"
                width={sm ? '200px' : '300px'}
              >
                <use className="fr-text-black-white--grey" href={`${siesLogo}#sies-logo-text`} />
                <use href={`${siesLogo}#sies-logo-artwork`} />
              </svg>
            </a>
          </div>
          <div className="fr-footer__content">
            <p className="fr-footer__content-desc">{description}</p>
            <ul className="fr-footer__content-list">
              {EXTERNAL_LINKS.map((link) => (
                <li key={link.href} className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${link.label} - nouvelle fenêtre`}
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            {allBottomLinks.map((link) => (
              <li key={link.href} className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="fr-footer__bottom-copy">
            <p>
              Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus
              de ce site sont proposés sous{' '}
              <a
                href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                target="_blank"
                rel="noopener noreferrer"
                title="Licence etalab - nouvelle fenêtre"
              >
                licence etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
