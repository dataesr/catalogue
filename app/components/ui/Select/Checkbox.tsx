import cn from 'classnames';
import type { ReactNode } from 'react';
import { useSelectContext } from './context';

export interface SelectCheckboxProps {
  value: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
  count?: number;
}

export function Checkbox({
  value,
  checked = false,
  disabled = false,
  onChange,
  children,
  className,
  count,
}: SelectCheckboxProps) {
  const { close, closeOnSelect } = useSelectContext();

  const handleClick = () => {
    if (disabled) return;
    onChange?.(!checked);
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

  return (
    <div
      role="option"
      aria-selected={checked}
      aria-disabled={disabled}
      data-value={value}
      tabIndex={disabled ? -1 : 0}
      className={cn('select__checkbox', className, {
        'select__checkbox--checked': checked,
        'select__checkbox--disabled': disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.(!checked)}
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="select__checkbox-label">{children}</span>
      {count !== undefined && (
        <span className="fr-badge fr-badge--sm fr-badge--no-icon">
          {count.toLocaleString('fr-FR')}
        </span>
      )}
    </div>
  );
}
