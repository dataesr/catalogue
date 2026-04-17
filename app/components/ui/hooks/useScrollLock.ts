import { type RefObject, useEffect } from 'react';

export interface UseScrollLockOptions {
  enabled?: boolean;
  containerRefs: RefObject<HTMLElement | null>[];
  scrollableSelector?: string;
}

export function useScrollLock({
  enabled = true,
  containerRefs,
  scrollableSelector = '.dropdown__content, .select__content, .dropdown__popover-inner, .select__popover-inner',
}: UseScrollLockOptions): void {
  useEffect(() => {
    if (!enabled) return;

    let touchStartY = 0;

    const getScrollableContent = (): HTMLElement | null => {
      const isScrollContainer = (el: HTMLElement): boolean => {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        return (
          (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight
        );
      };

      for (const ref of containerRefs) {
        if (!ref.current) continue;

        const candidates = ref.current.querySelectorAll<HTMLElement>(scrollableSelector);
        for (const candidate of candidates) {
          if (isScrollContainer(candidate)) return candidate;
        }

        if (isScrollContainer(ref.current)) {
          return ref.current;
        }
      }
      return null;
    };

    const shouldPreventScroll = (deltaY: number): boolean => {
      const scrollableEl = getScrollableContent();
      if (!scrollableEl) return false;

      const { scrollTop, scrollHeight, clientHeight } = scrollableEl;
      const isAtTop = scrollTop === 0 && deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight && deltaY > 0;

      return isAtTop || isAtBottom;
    };

    const isInsideContainer = (target: Node): boolean => {
      return containerRefs.some((ref) => ref.current?.contains(target) ?? false);
    };

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as Node;
      if (!isInsideContainer(target)) {
        event.preventDefault();
        return;
      }

      if (shouldPreventScroll(event.deltaY)) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const target = event.target as Node;
      if (!isInsideContainer(target)) {
        event.preventDefault();
        return;
      }

      const touchY = event.touches[0]?.clientY ?? 0;
      const deltaY = touchStartY - touchY;

      if (shouldPreventScroll(deltaY)) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled, containerRefs, scrollableSelector]);
}
