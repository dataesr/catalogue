import { type ReactNode, useEffect, useRef } from 'react';
import { Footer, type FooterProps } from './Footer';
import { Header, type HeaderProps } from './Header';

function DSFRInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.dsfr && typeof window.dsfr.start === 'function') {
      window.dsfr.start();
    }
  }, []);

  return <>{children}</>;
}

function ScrollToTop({ pathname }: { pathname?: string }) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!pathname) return;

    // Double-rAF: wait for React to commit the new DOM and the browser to paint
    // before scrolling, so smooth behavior isn't interrupted by layout work.
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [pathname]);

  return null;
}

function SkipLinks() {
  return (
    <div className="fr-skiplinks">
      <nav className="fr-container" aria-label="Accès rapide">
        <ul className="fr-skiplinks__list">
          <li>
            <a className="fr-link" href="#desr-content">
              Contenu
            </a>
          </li>
          <li>
            <a className="fr-link" href="#desr-modal-nav">
              Menu
            </a>
          </li>
          <li>
            <a className="fr-link" href="#desr-footer">
              Pied de page
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export interface LayoutProps {
  /** Content rendered between header and footer */
  children: ReactNode;
  /** Current pathname for scroll-to-top behavior. Pass from your router. */
  pathname?: string;
  /**
   * When present, renders a two-column layout: sticky sidemenu column + content column.
   * The header burger button appears automatically and the sidemenu is also wired
   * into the header's mobile modal slot.
   * When absent, renders a simple header → main → footer stack.
   */
  sidemenu?: ReactNode;
  /** Props forwarded to Header */
  headerProps?: HeaderProps;
  /** Props forwarded to Footer */
  footerProps?: FooterProps;
  /** Whether to render skip links (defaults to true) */
  showSkipLinks?: boolean;
  /** Extra className on the <main> element */
  className?: string;
  /** Whether to use a fluid container for the main content (defaults to false) */
}

export function Layout({
  children,
  pathname,
  sidemenu,
  headerProps = {},
  footerProps = {},
  showSkipLinks = true,
  className,
}: LayoutProps) {
  const hasSidemenu = sidemenu != null;

  return (
    <DSFRInitializer>
      <ScrollToTop pathname={pathname} />
      {showSkipLinks && <SkipLinks />}
      <Header {...headerProps} />
      <main id="desr-content" className={className}>
        {hasSidemenu ? (
          <div className="fx-flex">
            <div className="fx-col-sidemenu">{sidemenu}</div>
            <div className="fx-col-content">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer {...footerProps} />
    </DSFRInitializer>
  );
}
