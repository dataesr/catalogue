import './styles.css';

interface CatalogEmptyProps {
  message?: string;
  onReset?: () => void;
}

export default function CatalogEmpty({
  message = 'Aucun résultat ne correspond à vos critères de recherche.',
  onReset,
}: CatalogEmptyProps) {
  return (
    <div className="catalog-empty">
      <span className="fr-icon-search-line catalog-empty__icon" aria-hidden="true" />
      <p className="fr-text--lg fr-text--bold fr-mb-1v">Aucun résultat</p>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">{message}</p>
      {onReset && (
        <button
          type="button"
          className="fr-btn fr-btn--secondary fr-btn--sm"
          onClick={onReset}
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
