import cn from 'classnames';
import type { ReactNode } from 'react';

export interface SelectFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'between';
}

export function Footer({ children, className, align = 'between' }: SelectFooterProps) {
  return (
    <div
      className={cn('select__footer', align !== 'between' && `select__footer--${align}`, className)}
    >
      {children}
    </div>
  );
}
