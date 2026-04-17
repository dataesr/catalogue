import { type RefObject, useCallback } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not(:disabled):not([tabindex="-1"]), a[href]:not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [role="option"]:not([aria-disabled="true"]), [role="menuitem"]:not([aria-disabled="true"])';

export interface UsePopoverKeyboardOptions {
  isOpen: boolean;
  menuRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  onOpen: () => void;
  onClose: () => void;
}

export interface UsePopoverKeyboardReturn {
  handleTriggerKeyDown: (event: React.KeyboardEvent) => void;
  handleContainerKeyDown: (event: React.KeyboardEvent) => void;
}

export function usePopoverKeyboard({
  isOpen,
  menuRef,
  triggerRef,
  onOpen,
  onClose,
}: UsePopoverKeyboardOptions): UsePopoverKeyboardReturn {
  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        if (!isOpen) {
          event.preventDefault();
          onOpen();
        }
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onOpen, onClose],
  );

  const handleContainerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (!isOpen || !menuRef.current) return;

      const items = menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!items.length) return;

      const itemsArray = Array.from(items);
      const currentIndex = itemsArray.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex === -1) {
            itemsArray[0]?.focus();
          } else {
            itemsArray[(currentIndex + 1) % itemsArray.length]?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex === -1) {
            itemsArray[itemsArray.length - 1]?.focus();
          } else {
            itemsArray[(currentIndex - 1 + itemsArray.length) % itemsArray.length]?.focus();
          }
          break;
        case 'Home':
          event.preventDefault();
          itemsArray[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          itemsArray[itemsArray.length - 1]?.focus();
          break;
        case 'Tab':
          onClose();
          break;
      }
    },
    [isOpen, menuRef, triggerRef, onClose],
  );

  return {
    handleTriggerKeyDown,
    handleContainerKeyDown,
  };
}
