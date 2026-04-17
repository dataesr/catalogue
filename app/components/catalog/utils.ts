const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return DATE_FORMATTER.format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatNumber(n: number): string {
  return NUMBER_FORMATTER.format(n);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
