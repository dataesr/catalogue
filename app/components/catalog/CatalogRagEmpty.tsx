import "./styles.css"

interface CatalogRagEmptyProps {
  hasQuery?: boolean
  message?: string
  onReset?: () => void
}

const NO_RESULTS = "Aucun résultat ne correspond à vos critères de recherche."
const NO_QUERY =
  "Entrez une question. La recherche intelligente utilise la similarité sémantique pour retrouver les publications les plus pertinentes."

export default function CatalogRagEmpty({ hasQuery = false, message, onReset }: CatalogRagEmptyProps) {
  return (
    <div className="catalog-empty">
      <span className="fr-icon-search-line catalog-empty__icon" aria-hidden="true" />
      <p className="fr-text--lg fr-text--bold fr-mb-1v">{hasQuery ? "Aucun résultat" : "Recherche sémantique"}</p>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">{message || (hasQuery ? NO_RESULTS : NO_QUERY)}</p>
      {onReset && (
        <button type="button" className="fr-btn fr-btn--secondary fr-btn--sm" onClick={onReset}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}
