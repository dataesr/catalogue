import cn from 'classnames';
import type { ReactNode } from 'react';

export interface SelectHeaderProps {
  children: ReactNode;
  className?: string;
}

export function Header({ children, className }: SelectHeaderProps) {
  return <div className={cn('select__header', className)}>{children}</div>;
}
