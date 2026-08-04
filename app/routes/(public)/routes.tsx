import { lazy } from 'react';
import { Navigate, Route, useParams } from 'react-router';
import Home from './index/index';
import Layout from './layout';

const DonneesOuvertes = lazy(() => import('./donnees-ouvertes/index'));
const DatasetDetail = lazy(() => import('./donnees-ouvertes/[id]/index'));
const Publications = lazy(() => import('./publications/index/index'));
const PublicationsRag = lazy(() => import('./publications-rag/index/index'))
const PublicationDetail = lazy(() => import('./publications/[id]/index'));
const Outils = lazy(() => import('./outils/index'));
const OutilDetail = lazy(() => import('./outils/[id]/index'));
const MentionsLegales = lazy(() => import('./mentions-legales/index'));
const Accessibilite = lazy(() => import('./accessibilite/index'));
const Contact = lazy(() => import('./contact/index'));
const Recherche = lazy(() => import('./recherche/index'));
const DataProductDetail = lazy(() => import('./data-product/[id]/index'));

function RedirectTheme() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/donnees-ouvertes?topic=${slug}`} replace />;
}

export const publicRoutes = (
  <Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="outils" element={<Outils />} />
    <Route path="outils/:id" element={<OutilDetail />} />
    <Route path="donnees-ouvertes" element={<DonneesOuvertes />} />
    <Route path="donnees-ouvertes/:id" element={<DatasetDetail />} />
    <Route path="publications" element={<Publications />} />
    <Route path="publications/:id" element={<PublicationDetail />} />
    <Route path="publications-rag" element={<PublicationsRag />} />
    <Route path="mentions-legales" element={<MentionsLegales />} />
    <Route path="accessibilite" element={<Accessibilite />} />
    <Route path="contact" element={<Contact />} />
    <Route path="recherche" element={<Recherche />} />
    <Route path="data-product/:id" element={<DataProductDetail />} />
    {/* Redirects for old URLs */}
    <Route path="themes" element={<Navigate to="/" replace />} />
    <Route path="themes/:slug" element={<RedirectTheme />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
)
