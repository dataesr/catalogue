import cn from 'classnames';
import type { ColorFamily } from '../ColorPicker';
import './styles.css';

export interface IconBoxProps {
  icon: string;
  color?: ColorFamily;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}

export function IconBox({ icon, color, size = 'md', inline = false, className }: IconBoxProps) {
  return (
    <span
      className={cn(
        'icon-box',
        icon,
        {
          'icon-box--inline': inline,
          [`icon-box--${size}`]: size !== 'md',
          [`icon-box--${color}`]: !!color,
        },
        className,
      )}
      aria-hidden="true"
    />
  );
}
