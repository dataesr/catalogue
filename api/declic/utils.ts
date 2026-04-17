import he from 'he';

export function stripHtml(html: string): string {
  return he.decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

export function fileExtension(filename: string): string | null {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return null;
  return filename.slice(dot + 1).toLowerCase();
}
