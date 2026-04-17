import cn from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import './styles.css';

interface CustomCSSProperties extends CSSProperties {
  '--fx-grid-min': string;
}

export interface AutoGridProps {
  type?: 'fit' | 'fill';
  min?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}

export function AutoGrid({
  type = 'fit',
  min = 400,
  gap = 'md',
  children,
  className,
}: AutoGridProps) {
  return (
    <div
      className={cn(`fx-grid--auto-${type}`, `fx-grid--auto-${type}-${gap}`, className)}
      style={{ '--fx-grid-min': `${min}px` } as CustomCSSProperties}
    >
      {children}
    </div>
  );
}
