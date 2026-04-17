import cn from 'classnames';
import type { ReactNode } from 'react';

export interface SelectEmptyProps {
  children?: ReactNode;
  className?: string;
}

export function Empty({ children = 'Aucun résultat', className }: SelectEmptyProps) {
  return <div className={cn('select__empty', className)}>{children}</div>;
}
