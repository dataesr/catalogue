import cn from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface SelectContentProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function Content({ children, className, maxHeight }: SelectContentProps) {
  const style: CSSProperties | undefined = maxHeight ? { maxHeight } : undefined;

  return (
    <div className={cn('select__content', className)} style={style}>
      {children}
    </div>
  );
}
