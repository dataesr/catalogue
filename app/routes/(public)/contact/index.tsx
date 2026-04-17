import { Breadcrumb } from '@/components/ui/Breadcrumb';

export function Component() {
  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Contact', current: true },
        ]}
        appName="#dataESR"
      />
      <h1 className="fr-h3 fr-mb-4w">Contact</h1>
      <div className="fx-max-prose">
        <p>
          Pour toute question relative aux données et outils de la plateforme #dataESR, vous pouvez
          nous contacter par courriel :
        </p>
        <p className="fr-mt-2w">
          <a
            href="mailto:dataesr@enseignementsup.gouv.fr"
            className="fr-btn fr-btn--icon-left fr-icon-mail-fill"
          >
            data.esr@recherche.gouv.fr
          </a>
        </p>

        <h2 className="fr-h5 fr-mt-6w">Signaler un problème</h2>
        <p>
          Si vous rencontrez un problème technique sur la plateforme ou si vous souhaitez signaler
          une erreur dans les données, n'hésitez pas à nous contacter à la même adresse.
        </p>

        <h2 className="fr-h5 fr-mt-6w">Adresse</h2>
        <p>
          Ministère de l'Enseignement supérieur, de la Recherche et de l'Espace
          <br />
          Sous-direction des systèmes d'information et des études statistiques (SIES)
          <br />
          1, rue Descartes
          <br />
          75231 Paris cedex 05
        </p>
      </div>
    </div>
  );
}

export default Component;
