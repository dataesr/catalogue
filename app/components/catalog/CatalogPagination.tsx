interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="fr-pagination fr-mt-3w" aria-label="Pagination">
      <ul className="fr-pagination__list">
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--first"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            type="button"
          >
            Première page
          </button>
        </li>
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--prev"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Page précédente
          </button>
        </li>
        <li>
          <span className="fr-pagination__link fr-text--sm">
            Page {page} sur {totalPages}
          </span>
        </li>
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--next"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Page suivante
          </button>
        </li>
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--last"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            type="button"
          >
            Dernière page
          </button>
        </li>
      </ul>
    </nav>
  );
}
