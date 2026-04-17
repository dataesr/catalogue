import { useCallback, useId, useRef } from 'react';

export function useModal() {
  const id = useId().replace(/:/g, '-');
  const modalId = `modal${id}`;
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const open = useCallback(() => {
    if (window.dsfr && modalRef.current) {
      window.dsfr(modalRef.current)?.modal?.disclose();
    }
  }, []);

  const close = useCallback(() => {
    if (window.dsfr && modalRef.current) {
      window.dsfr(modalRef.current)?.modal?.conceal();
    }
  }, []);

  const modalProps = {
    id: modalId,
    ref: modalRef,
  };

  const triggerProps = {
    'aria-controls': modalId,
    'data-fr-opened': false,
    onClick: open,
  };

  return {
    modalProps,
    triggerProps,
    modalId,
    open,
    close,
  };
}

export default useModal;
