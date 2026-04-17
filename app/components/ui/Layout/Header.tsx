import cn from 'classnames';
import type { ReactNode } from 'react';
import './styles.css';

export interface HeaderProps {
  /** Optional content to render in the search slot */
  searchContent?: ReactNode;
  /**
   * Content rendered inside fr-header__menu after the empty fr-header__menu-links div.
   * When absent, no nav is rendered (but the modal container still exists for burger/sidemenu mobile wiring).
   */
  navContent?: ReactNode;
  serviceTitle?: ReactNode;
  /** App-specific tagline below the service title */
  serviceTagline?: string;
  /** Home URL for the service title link */
  homeUrl?: string;
}



export function Header({
  searchContent,
  navContent,
  serviceTitle,
  serviceTagline,
  homeUrl = '/',
}: HeaderProps) {

  return (
    <header className="fr-header">
      <div className="fr-header__body">
        <div className='fr-container'>
          <div className="fr-header__body-row">
            {/* Brand */}
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <p className="fr-logo">
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
                </div>
                <div className="fr-header__navbar">
                  {(navContent) && (
                    <button
                      data-fr-opened="false"
                      aria-controls="desr-modal-nav"
                      title="Menu"
                      type="button"
                      id="desr-button-menu"
                      className={cn('fr-btn--menu fr-btn')}
                    >
                      Menu
                    </button>
                  )}
                </div>
              </div>
              <div className="fr-header__service">
                <a href={homeUrl} title="Accueil - data.esr.gouv.fr">
                  <p className="fr-header__service-title">
                    <span className="fr-text--bold">#data</span>
                    <span className="fr-text--light">ESR</span>
                    {serviceTitle && (
                      <>
                        {' — '}
                        {serviceTitle}
                      </>
                    )}
                  </p>
                </a>
                {serviceTagline && (
                  <p className="fr-header__service-tagline fr-hidden fr-unhidden-md">
                    {serviceTagline}
                  </p>
                )}
              </div>
            </div>

            {/* Tools (right side) */}
            <div className="fr-header__tools">
              {searchContent && (
                <div className="fr-header__search fr-modal" id="desr-modal-search">
                  {searchContent}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation modal — always rendered so DSFR's HeaderLinks JS can find it.
          The empty fr-header__menu-links div must be present for DSFR to wire
          the mobile close button. navContent is an optional slot; sidemenuContent
          is injected by Layout for the mobile sidemenu. */}
      <div className="fr-header__menu fr-modal" id="desr-modal-nav">
        <div className="fr-container">
          <button
            aria-controls="desr-modal-nav"
            title="Fermer"
            type="button"
            className="fr-btn--close fr-btn"
          >
            Fermer
          </button>
          <div className="fr-header__menu-links" />
          {navContent}
        </div>
      </div>
    </header>
  );
}
