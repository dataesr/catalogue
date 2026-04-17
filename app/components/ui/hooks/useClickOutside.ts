import { type RefObject, useEffect } from 'react';

export interface UseClickOutsideOptions {
  enabled?: boolean;
  refs: RefObject<HTMLElement | null>[];
  onClickOutside: () => void;
}

export function useClickOutside({
  enabled = true,
  refs,
  onClickOutside,
}: UseClickOutsideOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isInsideAnyRef = refs.some((ref) => ref.current?.contains(target));

      if (!isInsideAnyRef) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [enabled, refs, onClickOutside]);
}
