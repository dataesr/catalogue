import { Breadcrumb } from '@/components/ui/Breadcrumb';

export function Component() {
  return (
    <div className="fr-container fr-py-4w">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Mentions légales', current: true },
        ]}
        appName="#dataESR"
      />
      <h1 className="fr-h3 fr-mb-4w">Mentions légales</h1>
      <div className="fx-max-prose">
        <h2 className="fr-h5">Éditeur</h2>
        <p>
          Sous-direction des systèmes d'information et des études statistiques (SIES) du ministère
          de l'Enseignement supérieur, de la Recherche et de l'Espace.
        </p>
        <p>
          1, rue Descartes
          <br />
          75231 Paris cedex 05
        </p>

        <h2 className="fr-h5 fr-mt-4w">Hébergement</h2>
        <p>
          OVH SAS
          <br />
          2, rue Kellermann
          <br />
          59100 Roubaix
        </p>

        <h2 className="fr-h5 fr-mt-4w">Propriété intellectuelle</h2>
        <p>
          Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de
          ce site sont proposés sous licence{' '}
          <a
            href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
            target="_blank"
            rel="noopener"
          >
            Licence Ouverte 2.0 / Open Licence 2.0
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default Component;
