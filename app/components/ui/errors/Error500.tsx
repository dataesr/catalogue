import { Link } from 'react-router';
import { DsfrArtwork } from '@/components/ui/DsfrArtwork';

export function Error500() {
  const handleRefresh = () => {
    window.location.reload();
  };
  return (
    <div className="fr-container">
      <div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
        <div className="fr-py-0 fr-col-12 fr-col-md-6">
          <h1>Erreur inattendue</h1>
          <p className="fr-text--sm fr-mb-3w">Erreur 500</p>
          <p className="fr-text--sm fr-mb-5w">
            Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus
            rapidement possible.
          </p>
          <p className="fr-text--lead fr-mb-3w">
            Essayez de rafraîchir la page ou bien réessayez plus tard.
          </p>
          <ul className="fr-btns-group fr-btns-group--inline-md">
            <li>
              <button type="button" className="fr-btn" onClick={handleRefresh}>
                Rafraîchir la page
              </button>
            </li>
            <li>
              <Link to="/" className="fr-btn fr-btn--secondary">
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

export default Error500;
