import cn from 'classnames';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { Modal } from '../Modal';
import './styles.css';

interface SearchModalProps {
  modalProps: { id: string; ref: React.RefObject<HTMLDialogElement | null> };
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  listboxId?: string;
  activedescendant?: string;
  children: ReactNode;
  footer?: ReactNode;
}

function SearchModalRoot({
  modalProps,
  query,
  onQueryChange,
  inputRef,
  onInputKeyDown,
  placeholder = 'Rechercher…',
  listboxId = 'search-modal-listbox',
  activedescendant,
  children,
  footer,
}: SearchModalProps) {
  return (
    <Modal {...modalProps} className="search-modal">
      <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
        <div className="fr-modal__body search-modal__body">
          <div className="fr-modal__content fr-px-0 fr-pb-0">
            <div className="fr-input-group fr-mb-0">
              <div
                className={cn('fr-input-wrap', {
                  'fr-icon-search-line': !query,
                  'fr-icon-close-line': !!query,
                })}
              >
                <input
                  ref={inputRef}
                  className="fr-input search-modal__input"
                  type="search"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={placeholder}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-activedescendant={activedescendant}
                />
                {!!query && (
                  <button
                    type="button"
                    aria-label="Réinitialiser"
                    onClick={() => {
                      onQueryChange('');
                      inputRef.current?.focus();
                    }}
                    className="fr-btn--tertiary-no-outline search-modal__clear-btn"
                  />
                )}
              </div>

              <div className="search-modal__listbox" role="listbox" id={listboxId}>
                {children}
              </div>
            </div>
          </div>

          {footer && (
            <div className="fr-modal__footer fx-justify-between fx-shadow-border-top fr-px-2w">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface ItemProps {
  id?: string;
  focused: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Item = forwardRef<HTMLButtonElement, ItemProps>(({ id, focused, onClick, children }, ref) => (
  <button
    ref={ref}
    role="option"
    type="button"
    id={id}
    className="fr-px-2w fr-py-1w search-modal__item"
    aria-selected={focused}
    onClick={onClick}
  >
    {children}
  </button>
));

Item.displayName = 'SearchModal.Item';

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="fr-p-4w fx-flex fx-items-start fx-flex-col">
      <i className="fr-text-mention--grey">{children}</i>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="search-modal__kbd">{children}</kbd>;
}

type SearchModalCompound = typeof SearchModalRoot & {
  Item: typeof Item;
  Empty: typeof Empty;
  Kbd: typeof Kbd;
};

const SearchModal = SearchModalRoot as SearchModalCompound;

SearchModal.Item = Item;
SearchModal.Empty = Empty;
SearchModal.Kbd = Kbd;

export { SearchModal, Item as SearchModalItem, Empty as SearchModalEmpty, Kbd as SearchModalKbd };
export type { SearchModalProps };
export { useSearchModal } from './useSearchModal';
export default SearchModal;
