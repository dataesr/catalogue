import cn from 'classnames';
import type { ReactNode } from 'react';
import { useSelectContext } from './context';

export interface SelectRadioProps {
  value: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: () => void;
  children: ReactNode;
  className?: string;
  name?: string;
}

export function Radio({
  value,
  checked = false,
  disabled = false,
  onChange,
  children,
  className,
  name,
}: SelectRadioProps) {
  const { close, closeOnSelect } = useSelectContext();

  const handleClick = () => {
    if (disabled || checked) return;
    onChange?.();
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
      className={cn('select__radio', className, {
        'select__radio--checked': checked,
        'select__radio--disabled': disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="select__radio-label">{children}</span>
    </div>
  );
}
