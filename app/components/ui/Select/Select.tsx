import cn from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { type PopoverAlign, type PopoverPlacement, usePopover } from '../hooks/usePopover';
import { Portal } from '../Portal';
import { SelectContext, type SelectSize } from './context';

export interface SelectProps {
  label?: ReactNode;
  icon?: string;
  size?: SelectSize;
  outline?: boolean;
  hideArrow?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
  disabled?: boolean;
  align?: PopoverAlign;
  placement?: PopoverPlacement | 'auto';
  closeOnSelect?: boolean;
  fullWidth?: boolean;
  multiple?: boolean;
  portal?: boolean;
  popoverMinWidth?: string;
}

export function Select({
  label,
  icon,
  size = 'md',
  outline = true,
  hideArrow,
  children,
  className,
  title,
  'aria-label': ariaLabel,
  disabled = false,
  align = 'auto',
  placement = 'auto',
  closeOnSelect,
  fullWidth = false,
  multiple = false,
  portal = true,
  popoverMinWidth,
}: SelectProps) {
  const {
    isOpen,
    computedAlign,
    computedPlacement,
    maxHeight,
    position,
    close,
    containerRef,
    triggerRef,
    menuRef,
    handleTriggerClick,
    handleTriggerKeyDown,
    handleContainerKeyDown,
    triggerId,
    menuId,
  } = usePopover({ align, placement, portal });

  const isIconOnly = !label && !!icon;
  const accessibleLabel = ariaLabel ?? (isIconOnly ? title : undefined);
  const showArrow = hideArrow !== undefined ? !hideArrow : !isIconOnly;

  const shouldCloseOnSelect = closeOnSelect ?? !multiple;

  const sizeClass = size === 'sm' ? 'fr-btn--sm' : size === 'lg' ? 'fr-btn--lg' : null;
  const variantClass = outline ? 'fr-btn--tertiary' : 'fr-btn--tertiary-no-outline';
  const iconClass = icon ? `fr-icon-${icon}` : null;
  const iconPositionClass = icon && label ? 'fr-btn--icon-left' : null;

  const triggerClasses = cn(
    'fr-btn',
    'select__trigger',
    sizeClass,
    variantClass,
    iconClass,
    iconPositionClass,
    showArrow && 'select__trigger--has-arrow',
    fullWidth && 'select__trigger--full-width',
  );

  const containerClasses = cn(
    'select',
    size !== 'md' && `select--${size}`,
    fullWidth && 'select--full-width',
    className,
  );

  const popoverClasses = cn(
    'select__popover',
    isOpen && 'select__popover--expanded',
    computedAlign === 'end' && 'select__popover--align-end',
    computedPlacement === 'top' && 'select__popover--placement-top',
    portal && 'select__popover--portal',
  );

  const popoverStyle: CSSProperties = {
    ...(maxHeight != null && {
      '--popover-max-height': `${maxHeight}px`,
    }),
    ...(portal &&
      position && {
        position: 'absolute',
        top: position.top,
        left: position.left,
        minWidth: popoverMinWidth ?? position.minWidth,
      }),
    ...(!portal &&
      popoverMinWidth && {
        minWidth: popoverMinWidth,
      }),
  } as CSSProperties;

  const contextValue = {
    close,
    size,
    closeOnSelect: shouldCloseOnSelect,
  };

  const popoverContent = (
    <div
      ref={menuRef}
      id={menuId}
      role="listbox"
      aria-labelledby={triggerId}
      aria-hidden={!isOpen}
      aria-multiselectable={multiple || undefined}
      className={popoverClasses}
      style={popoverStyle}
    >
      <div className="select__popover-inner">{children}</div>
    </div>
  );

  return (
    <SelectContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: container handles keyboard navigation */}
      <div ref={containerRef} className={containerClasses} onKeyDown={handleContainerKeyDown}>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-controls={menuId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={accessibleLabel}
          title={title ?? (typeof label === 'string' ? label : undefined)}
          className={triggerClasses}
          disabled={disabled}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
        >
          {label}
        </button>
        {portal ? <Portal>{popoverContent}</Portal> : popoverContent}
      </div>
    </SelectContext.Provider>
  );
}
