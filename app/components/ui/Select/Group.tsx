import cn from 'classnames';
import type { ReactNode } from 'react';

export interface SelectGroupProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

export function Group({ label, children, className }: SelectGroupProps) {
  return (
    /* biome-ignore lint/a11y/useSemanticElements: role="group" is intentional */
    <div role="group" aria-label={label} className={cn('select__group', className)}>
      {label && <div className="select__group-label">{label}</div>}
      <div className="select__group-content">{children}</div>
    </div>
  );
}
