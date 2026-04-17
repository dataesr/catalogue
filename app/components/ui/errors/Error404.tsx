import { Link } from 'react-router';
import { DsfrArtwork } from '@/components/ui/DsfrArtwork';

export function Error404() {
  return (
    <div className="fr-container">
      <div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
        <div className="fr-py-0 fr-col-12 fr-col-md-6">
          <h1>Page non trouvée</h1>
          <p className="fr-text--sm fr-mb-3w">Erreur 404</p>
          <p className="fr-text--lead fr-mb-3w">
            La page que vous cherchez est introuvable. Excusez-nous pour la gêne occasionnée.
          </p>
          <p className="fr-text--sm fr-mb-5w">
            Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La
            page n'est peut-être plus disponible.
            <br />
            Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d'accueil.
          </p>
          <ul className="fr-btns-group fr-btns-group--inline-md">
            <li>
              <Link className="fr-btn" to="/">
                Page d'accueil
              </Link>
            </li>
          </ul>
        </div>
        <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
          <DsfrArtwork pictogram="system/technical-error" />
        </div>
      </div>
    </div>
  );
}

export default Error404;
