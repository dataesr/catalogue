type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';
type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  id?: string;
}

interface Toast extends Required<Pick<ToastOptions, 'type' | 'position'>> {
  id: string;
  title?: string;
  description?: string;
  duration: number;
  createdAt: number;
}

type Listener = () => void;

let toasts: Toast[] = [];
const listeners: Set<Listener> = new Set();
let idCounter = 0;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function generateId(): string {
  return `toast-${++idCounter}-${Date.now()}`;
}

function addToast(options: ToastOptions): string {
  const id = options.id ?? generateId();
  const newToast: Toast = {
    id,
    title: options.title,
    description: options.description,
    type: options.type ?? 'default',
    duration: options.duration ?? 5000,
    position: options.position ?? 'bottom-center',
    createdAt: Date.now(),
  };

  toasts = [...toasts, newToast];
  emit();
  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function updateToast(id: string, options: Partial<ToastOptions>) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...options, createdAt: Date.now() } : t));
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}

export function dismiss(id: string) {
  removeToast(id);
}

export function dismissAll() {
  toasts = [];
  emit();
}

export const toast = Object.assign((options: ToastOptions) => addToast(options), {
  success: (options: Omit<ToastOptions, 'type'>) => addToast({ ...options, type: 'success' }),
  error: (options: Omit<ToastOptions, 'type'>) => addToast({ ...options, type: 'error' }),
  warning: (options: Omit<ToastOptions, 'type'>) => addToast({ ...options, type: 'warning' }),
  info: (options: Omit<ToastOptions, 'type'>) => addToast({ ...options, type: 'info' }),
  loading: (options: Omit<ToastOptions, 'type'>) =>
    addToast({ ...options, type: 'loading', duration: 0 }),
  dismiss,
  dismissAll,
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: Omit<ToastOptions, 'type'>;
      success: Omit<ToastOptions, 'type'> | ((data: T) => Omit<ToastOptions, 'type'>);
      error: Omit<ToastOptions, 'type'> | ((err: Error) => Omit<ToastOptions, 'type'>);
    },
  ): Promise<T> => {
    const id = addToast({ ...options.loading, type: 'loading', duration: 0 });

    promise
      .then((data) => {
        const successOpts =
          typeof options.success === 'function' ? options.success(data) : options.success;
        updateToast(id, {
          ...successOpts,
          type: 'success',
          duration: successOpts.duration ?? 5000,
        });
      })
      .catch((err) => {
        const errorOpts = typeof options.error === 'function' ? options.error(err) : options.error;
        updateToast(id, {
          ...errorOpts,
          type: 'error',
          duration: errorOpts.duration ?? 5000,
        });
      });

    return promise;
  },
});

export type { Toast, ToastOptions, ToastType, ToastPosition };
