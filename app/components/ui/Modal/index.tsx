import type { ComponentProps } from 'react';
import { createPortal } from 'react-dom';

import './styles.css';

export { useModal } from './useModal';

type ModalProps = ComponentProps<'dialog'>;

export function Modal({ children, className, ...props }: ModalProps) {
  return createPortal(
    <dialog className={['fr-modal', className].filter(Boolean).join(' ')} {...props}>
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}

export function NativeModal({ children, className, ...props }: ModalProps) {
  return createPortal(
    <dialog className={['fr-modal', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </dialog>,
    document.body,
  );
}

export type { ModalProps };
