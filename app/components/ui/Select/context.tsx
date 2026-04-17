import { createContext, useContext } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectContextValue {
  close: () => void;
  size: SelectSize;
  closeOnSelect: boolean;
}

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelectContext(): SelectContextValue {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select compound components must be used within a Select component');
  }
  return context;
}
