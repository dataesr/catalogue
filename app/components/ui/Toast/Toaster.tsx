import { useSyncExternalStore } from 'react';
import { Portal } from '../Portal';
import { getToasts, subscribe, type Toast, type ToastPosition } from './store';
import { ToastItem } from './ToastItem';

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-left': 'toaster--top-left',
  'top-center': 'toaster--top-center',
  'top-right': 'toaster--top-right',
  'bottom-left': 'toaster--bottom-left',
  'bottom-center': 'toaster--bottom-center',
  'bottom-right': 'toaster--bottom-right',
};

interface ToasterProps {
  position?: ToastPosition;
}

export function Toaster({ position: defaultPosition = 'bottom-right' }: ToasterProps) {
  const toasts = useSyncExternalStore(subscribe, getToasts, () => []);

  const groupedByPosition = toasts.reduce(
    (acc, t) => {
      const pos = t.position ?? defaultPosition;
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(t);
      return acc;
    },
    {} as Record<ToastPosition, Toast[]>,
  );

  return (
    <Portal>
      {Object.entries(groupedByPosition).map(([pos, positionToasts]) => (
        <div key={pos} className={`toaster ${POSITION_CLASSES[pos as ToastPosition]}`}>
          {positionToasts.map((t) => (
            <div key={t.id} className="toaster__item">
              <ToastItem toast={t} />
            </div>
          ))}
        </div>
      ))}
    </Portal>
  );
}
