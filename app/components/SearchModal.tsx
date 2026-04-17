import { useSearch } from '@/components/SearchProvider';

export default function SearchLauncher() {
  const { open } = useSearch();

  return (
    <search className="fr-search-bar">
      <label className="fr-label" htmlFor="platform-search">
        Rechercher
      </label>
      <input
        className="fr-input"
        id="platform-search"
        type="search"
        placeholder="Rechercher… (Ctrl+K)"
        readOnly
        onFocus={(e) => {
          e.target.blur();
          open();
        }}
        onClick={open}
      />
      <button className="fr-btn" type="button" onClick={open}>
        Rechercher
      </button>
    </search>
  );
}
