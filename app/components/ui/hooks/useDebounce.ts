import { useEffect, useState } from 'react';

export interface UseDebounceOptions {
  delay?: number;
}

export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {
  const { delay = 300 } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
