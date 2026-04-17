import { type RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not(:disabled):not([tabindex="-1"]), a[href]:not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [role="option"]:not([aria-disabled="true"]), [role="menuitem"]:not([aria-disabled="true"])';

export interface UseFocusOnOpenOptions {
  enabled?: boolean;
  containerRef: RefObject<HTMLElement | null>;
  delay?: number;
  autoFocusFirst?: boolean;
  autoFocusSelector?: string;
}

export function useFocusOnOpen({
  enabled = true,
  containerRef,
  delay = 160,
  autoFocusFirst = false,
  autoFocusSelector = '[data-autofocus]',
}: UseFocusOnOpenOptions): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      const autoFocusEl = containerRef.current.querySelector<HTMLElement>(autoFocusSelector);
      if (autoFocusEl) {
        autoFocusEl.focus();
        return;
      }

      if (autoFocusFirst) {
        const firstFocusable = containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        firstFocusable?.focus();
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [enabled, containerRef, delay, autoFocusFirst, autoFocusSelector]);
}
