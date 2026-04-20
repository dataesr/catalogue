import cn from 'classnames';
import { SiesLogo } from '../SiesLogo';

import sunSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/sun.svg' with { type: 'file' };
import moonSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/moon.svg' with { type: 'file' };
import systemSvg from '@gouvfr/dsfr/dist/artwork/pictograms/system/system.svg' with { type: 'file' };

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
              <SiesLogo width={sm ? 200 : 300} />
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
            <li className="fr-footer__bottom-item">
              <button aria-controls="footer-display" data-fr-opened="false" id="footer__bottom-link-13" className="fr-icon-theme-fill fr-btn--icon-left fr-footer__bottom-link">Paramètres d'affichage</button>
            </li>
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
      <dialog id="footer-display" className="fr-modal" aria-labelledby="footer-display-title">
        <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button aria-controls="footer-display" title="Fermer" type="button" id="button-14" className="fr-btn--close fr-btn">Fermer</button>
                </div>
                <div className="fr-modal__content">
                  <h2 id="footer-display-title" className="fr-modal__title"> Paramètres d’affichage </h2>
                  <div id="fr-display" className="fr-display">
                    <fieldset className="fr-fieldset" id="display-fieldset" aria-labelledby="display-fieldset-legend display-fieldset-messages">
                      <legend className="fr-fieldset__legend--regular fr-fieldset__legend" id="display-fieldset-legend"> Choisissez un thème pour personnaliser l’apparence du site. </legend>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input value="light" type="radio" id="fr-radios-theme-light" name="fr-radios-theme" />
                          <label className="fr-label" htmlFor="fr-radios-theme-light"> Thème clair </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg aria-hidden="true" className="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
                              <use className="fr-artwork-decorative" href={`${sunSvg}#artwork-decorative`}></use>
                              <use className="fr-artwork-minor" href={`${sunSvg}#artwork-minor`}></use>
                              <use className="fr-artwork-major" href={`${sunSvg}#artwork-major`}></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input value="dark" type="radio" id="fr-radios-theme-dark" name="fr-radios-theme" />
                          <label className="fr-label" htmlFor="fr-radios-theme-dark"> Thème sombre </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg aria-hidden="true" className="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
                              <use className="fr-artwork-decorative" href={`${moonSvg}#artwork-decorative`}></use>
                              <use className="fr-artwork-minor" href={`${moonSvg}#artwork-minor`}></use>
                              <use className="fr-artwork-major" href={`${moonSvg}#artwork-major`}></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input value="system" type="radio" id="fr-radios-theme-system" name="fr-radios-theme" />
                          <label className="fr-label" htmlFor="fr-radios-theme-system"> Système <span className="fr-hint-text">Utilise les paramètres système</span>
                          </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg aria-hidden="true" className="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
                              <use className="fr-artwork-decorative" href={`${systemSvg}#artwork-decorative`}></use>
                              <use className="fr-artwork-minor" href={`${systemSvg}#artwork-minor`}></use>
                              <use className="fr-artwork-major" href={`${systemSvg}#artwork-major`}></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </footer>
  );
}
