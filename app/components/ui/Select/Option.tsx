import cn from 'classnames';
import type { ReactNode } from 'react';
import { useSelectContext } from './context';

export interface SelectOptionProps {
  value: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export function Option({
  value,
  selected = false,
  disabled = false,
  onClick,
  children,
  className,
  icon,
  iconPosition = 'left',
}: SelectOptionProps) {
  const { close, closeOnSelect } = useSelectContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    if (closeOnSelect) {
      requestAnimationFrame(() => close());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const iconClass = icon ? `fr-icon-${icon}` : null;
  const iconPosClass = icon && iconPosition === 'right' ? 'select__option--icon-right' : null;

  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      data-value={value}
      tabIndex={disabled ? -1 : 0}
      className={cn('select__option', iconClass, iconPosClass, className, {
        'select__option--selected': selected,
        'select__option--disabled': disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
