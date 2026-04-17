import { useId } from 'react';
import './styles.css';

export const DSFR_COLOR_FAMILIES = [
  'green-tilleul-verveine',
  'green-bourgeon',
  'green-emeraude',
  'green-menthe',
  'green-archipel',
  'blue-ecume',
  'blue-cumulus',
  'purple-glycine',
  'pink-macaron',
  'pink-tuile',
  'yellow-tournesol',
  'yellow-moutarde',
  'orange-terre-battue',
  'brown-cafe-creme',
  'brown-caramel',
  'brown-opera',
  'beige-gris-galet',
] as const;

export type ColorFamily = (typeof DSFR_COLOR_FAMILIES)[number];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  hint?: string;
}

export function ColorPicker({ value, onChange, label, hint }: ColorPickerProps) {
  const id = useId();

  return (
    <div className="color-picker">
      {label && (
        <label className="fr-label fr-mb-1w" htmlFor={id}>
          {label}
          {hint && <span className="fr-hint-text">{hint}</span>}
        </label>
      )}
      <div className="color-picker__grid" id={id}>
        {DSFR_COLOR_FAMILIES.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-picker__swatch color-picker__swatch--${color} ${
              value === color ? 'color-picker__swatch--selected' : ''
            }`}
            onClick={() => onChange(color)}
            title={color}
            aria-label={`Couleur ${color}`}
            aria-pressed={value === color}
          >
            {value === color && (
              <span className="fr-icon-check-line color-picker__check" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { ColorPickerProps };
export default ColorPicker;
