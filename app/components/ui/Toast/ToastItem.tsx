import cn from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dismiss, type Toast } from './store';

const ICONS: Record<string, string> = {
  success: 'fr-icon-checkbox-circle-line',
  error: 'fr-icon-close-circle-line',
  warning: 'fr-icon-warning-line',
  info: 'fr-icon-information-line',
  loading: 'fr-icon-refresh-line',
};

interface ToastItemProps {
  toast: Toast;
}

export function ToastItem({ toast: toastData }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => dismiss(toastData.id), 200);
  }, [toastData.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: createdAt is intentional to reset timer on toast update
  useEffect(() => {
    if (toastData.duration > 0) {
      timerRef.current = setTimeout(handleDismiss, toastData.duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toastData.duration, toastData.createdAt, handleDismiss]);

  const typeClass = {
    default: null,
    success: 'toast__icon--success',
    error: 'toast__icon--error',
    warning: 'toast__icon--warning',
    info: 'toast__icon--info',
    loading: 'toast__icon--loading',
  }[toastData.type];

  const icon = ICONS[toastData.type];

  return (
    <div
      className={cn('toast', {
        'toast--exiting': isExiting,
      })}
      role="alert"
      aria-live={toastData.type === 'error' ? 'assertive' : 'polite'}
    >
      {icon && (
        <span
          className={cn(icon, 'toast__icon', typeClass, {
            'toast__icon--spin': toastData.type === 'loading',
          })}
          aria-hidden="true"
        />
      )}
      <div className="toast__content">
        {toastData.title && <p className="toast__title">{toastData.title}</p>}
        {toastData.description && <p className="toast__description">{toastData.description}</p>}
      </div>
      {(toastData.duration === 0 || toastData.type === 'loading') && (
        <button
          type="button"
          className="toast__close fr-icon-close-line"
          aria-label="Fermer"
          onClick={handleDismiss}
        />
      )}
    </div>
  );
}
