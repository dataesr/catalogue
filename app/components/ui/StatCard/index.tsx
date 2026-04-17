import type { ReactNode } from 'react';
import type { ColorFamily } from '../ColorPicker';
import { IconBox } from '../IconBox';
import './styles.css';

export interface StatCardProps {
  value: string | number | ReactNode;
  label: string;
  icon?: string;
  color?: ColorFamily;
  description?: string;
}

export function StatCard({ value, label, icon, color, description }: StatCardProps) {
  return (
    <div className="fx-stat-card">
      {icon && <IconBox icon={icon} color={color} />}
      <div className="fx-stat-card__body">
        <p className="fr-text--bold fr-mb-0 fx-stat-card__value">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{label}</p>
        {description && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">{description}</p>
        )}
      </div>
    </div>
  );
}
