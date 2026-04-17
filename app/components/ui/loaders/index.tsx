import './styles.css';

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Chargement en cours...' }: FullPageLoaderProps) {
  return (
    <div className="full-page-loader">
      <div className="full-page-loader__overlay" />
      <div className="full-page-loader__content">
        <div className="full-page-loader__spinner">
          <span className="fr-icon-refresh-line fr-icon--lg" aria-hidden="true" />
        </div>
        {message && <p className="full-page-loader__message fr-text--lg">{message}</p>}
      </div>
    </div>
  );
}

interface PageContentLoaderProps {
  message?: string;
}

export function PageContentLoader({ message = 'Chargement en cours...' }: PageContentLoaderProps) {
  return (
    <div className="page-content-loader">
      <div className="page-content-loader__content">
        <div className="page-content-loader__spinner">
          <span className="fr-icon-refresh-line fr-icon--lg" aria-hidden="true" />
        </div>
        {message && <p className="page-content-loader__message fr-text--lg">{message}</p>}
      </div>
    </div>
  );
}

export type { FullPageLoaderProps, PageContentLoaderProps };
