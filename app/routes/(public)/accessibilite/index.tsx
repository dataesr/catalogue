import { Breadcrumb } from '@/components/ui/Breadcrumb';

export function Component() {
  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Accessibilité', current: true },
        ]}
        appName="#dataESR"
      />
      <h1 className="fr-h3 fr-mb-4w">Déclaration d'accessibilité</h1>
      <div className="fx-max-prose">
        <p>
          Le ministère de l'Enseignement supérieur, de la Recherche et de l'Espace s'engage à rendre
          ses sites internet accessibles conformément à l'article 47 de la loi n°2005-102 du 11
          février 2005.
        </p>

        <h2 className="fr-h5 fr-mt-4w">État de conformité</h2>
        <p>
          Le site <strong>data.esr.gouv.fr</strong> est <strong>partiellement conforme</strong> avec
          le référentiel général d'amélioration de l'accessibilité (RGAA) version 4.1.
        </p>

        <h2 className="fr-h5 fr-mt-4w">Contact</h2>
        <p>
          Si vous rencontrez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une
          fonctionnalité du site, merci de nous contacter à l'adresse :{' '}
          <a href="mailto:data.esr@recherche.gouv.fr">dataesr@enseignementsup.gouv.fr</a>.
        </p>
      </div>
    </div>
  );
}

export default Component;
