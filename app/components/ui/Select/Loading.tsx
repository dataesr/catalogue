import cn from 'classnames';
import type { ReactNode } from 'react';
import { useSelectContext } from './context';

export interface SelectLoadingProps {
  children?: ReactNode;
  className?: string;
}

export function Loading({ children = 'Chargement...', className }: SelectLoadingProps) {
  const { size } = useSelectContext();

  const iconSizeClass = size === 'sm' ? 'fr-icon--sm' : size === 'lg' ? 'fr-icon--lg' : undefined;

  return (
    <div className={cn('select__loading', className)}>
      <span className={cn('fr-icon-refresh-line', iconSizeClass)} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
