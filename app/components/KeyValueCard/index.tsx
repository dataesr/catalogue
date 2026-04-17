import cn from 'classnames';
import { useState } from 'react';
import './styles.css';

interface KeyValueCardProps {
  label: string;
  value?: string | null;
  monospace?: boolean;
  copy?: boolean;
}

export function KeyValueCard({ label, value, monospace = false, copy = false }: KeyValueCardProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      className={cn('fx-kvc fx-card fx-card--sm fx-card--rounded', {
        'fx-card--animate': copy && value,
      })}
    >
      <span className="fx-kvc__label">{label}</span>
      {!!(copy && value) && (
        <button
          type="button"
          className={cn('fx-kvc__copy fr-btn fr-btn--sm fr-btn--tertiary-no-outline fr-btn--icon', {
            'fr-icon-clipboard-line': !copied && !error,
            'fr-icon-check-line': copied,
            'fr-icon-error-line': error,
            'fr-btn--success': copied,
            'fr-btn--error': error,
          })}
          onClick={handleCopy}
          title={copied ? 'Copié !' : 'Copier'}
          aria-label={`Copier ${label}`}
        />
      )}
      <span className={cn('fx-kvc__value', { 'fx-kvc__value--mono': monospace })}>
        {value || 'N/A'}
      </span>
    </div>
  );
}
