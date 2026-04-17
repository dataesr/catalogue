import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from '../Modal';

interface UseSearchModalOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onClose?: () => void;
  onSubmit?: () => void;
}

export function useSearchModal({ itemCount, onSelect, onClose, onSubmit }: UseSearchModalOptions) {
  const { modalProps, open: modalOpen, close: modalClose } = useModal();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const open = useCallback(() => {
    modalOpen();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [modalOpen]);

  const close = useCallback(() => {
    modalClose();
    setFocusedIndex(-1);
    onClose?.();
  }, [modalClose, onClose]);

  const select = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        close();
        onSelect(index);
      }
    },
    [itemCount, onSelect, close],
  );

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusedIndex >= 0) {
            select(focusedIndex);
          } else {
            onSubmit?.();
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          close();
          break;
        }
      }
    },
    [itemCount, focusedIndex, select, close, onSubmit],
  );

  const setItemRef = useCallback((index: number, el: HTMLButtonElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  return {
    modalProps,
    open,
    close,
    select,
    focusedIndex,
    resetFocus,
    inputRef,
    handleInputKeyDown,
    setItemRef,
  };
}
