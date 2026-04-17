import cn from 'classnames';

export interface SelectSeparatorProps {
  className?: string;
}

export function Separator({ className }: SelectSeparatorProps) {
  return <hr className={cn('select__separator', className)} />;
}
