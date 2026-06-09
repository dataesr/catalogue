import { ErrorBoundary } from '@/components/ui/errors';
import { Layout } from '@/components/ui/Layout';
import { PageContentLoader } from '@/components/ui/loaders';
import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import SearchLauncher from '@/components/SearchModal';
import { SearchProvider } from '@/components/SearchProvider';

const navItems = [
  { label: "Accueil", to: "/" },
  { label: "Outils & tableaux de bord", to: "/outils" },
  { label: "Données ouvertes", to: "/donnees-ouvertes" },
  { label: "Publications", to: "/publications" },
  { label: "Publications RAG", to: "/publications-rag" },
]

function PlatformNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fr-nav" aria-label="Menu principal">
      <ul className="fr-nav__list">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? pathname === '/'
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="fr-nav__item">
              <Link
                className="fr-nav__link"
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <SearchProvider>
      <Layout
        pathname={pathname}
        headerProps={{
          serviceTitle: 'Plateforme de données',
          serviceTagline: "Les données de l'enseignement supérieur, la recherche et l'innovation",
          searchContent: <SearchLauncher />,
          navContent: <PlatformNav />,
        }}
        footerProps={{
          fluid: false,
          description:
            "#dataESR — Les données de l'enseignement supérieur, la recherche et l'innovation",
          bottomLinks: [
            { label: 'Accessibilité : partiellement conforme', href: '/accessibilite' },
            { label: 'Mentions légales', href: '/mentions-legales' },
            { label: 'Contact', href: '/contact' },
          ],
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageContentLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </SearchProvider>
  );
}
