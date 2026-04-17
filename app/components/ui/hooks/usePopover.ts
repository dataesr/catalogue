import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';
import { useFocusOnOpen } from './useFocusOnOpen';
import { usePopoverKeyboard } from './usePopoverKeyboard';
import {
  type PopoverAlign,
  type PopoverPlacement,
  type PopoverPosition,
  usePopoverPosition,
} from './usePopoverPosition';
import { useRouteClose } from './useRouteClose';
import { useScrollLock } from './useScrollLock';

export type { PopoverAlign, PopoverPlacement, PopoverPosition };

export interface UsePopoverOptions {
  align?: PopoverAlign;
  placement?: PopoverPlacement | 'auto';
  closeOnRouteChange?: boolean;
  focusDelay?: number;
  autoFocusFirst?: boolean;
  portal?: boolean;
}

export interface UsePopoverReturn {
  isOpen: boolean;
  computedAlign: 'start' | 'end';
  computedPlacement: PopoverPlacement;
  maxHeight: number | null;
  position: PopoverPosition | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  handleTriggerClick: () => void;
  handleTriggerKeyDown: (event: React.KeyboardEvent) => void;
  handleContainerKeyDown: (event: React.KeyboardEvent) => void;
  triggerId: string;
  menuId: string;
}

export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
  const {
    align = 'auto',
    placement = 'auto',
    closeOnRouteChange = true,
    focusDelay = 160,
    autoFocusFirst = false,
    portal = false,
  } = options;

  const id = useId();
  const triggerId = `${id}-trigger`;
  const menuId = `${id}-menu`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleTriggerClick = useCallback(() => {
    toggle();
  }, [toggle]);

  const { computedAlign, computedPlacement, maxHeight, position } = usePopoverPosition({
    enabled: isOpen,
    align,
    placement,
    portal,
    triggerRef,
    menuRef,
  });

  const { handleTriggerKeyDown, handleContainerKeyDown } = usePopoverKeyboard({
    isOpen,
    menuRef,
    triggerRef,
    onOpen: open,
    onClose: close,
  });

  const clickOutsideRefs = useMemo(() => [containerRef, menuRef], []);

  useClickOutside({
    enabled: isOpen,
    refs: clickOutsideRefs,
    onClickOutside: close,
  });

  useScrollLock({
    enabled: isOpen,
    containerRefs: clickOutsideRefs,
  });

  useRouteClose({
    enabled: closeOnRouteChange && isOpen,
    onRouteChange: close,
  });

  useFocusOnOpen({
    enabled: isOpen,
    containerRef: menuRef,
    delay: focusDelay,
    autoFocusFirst,
  });

  return {
    isOpen,
    computedAlign,
    computedPlacement,
    maxHeight,
    position,
    open,
    close,
    toggle,
    containerRef,
    triggerRef,
    menuRef,
    handleTriggerClick,
    handleTriggerKeyDown,
    handleContainerKeyDown,
    triggerId,
    menuId,
  };
}
