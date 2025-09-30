export function generateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${ts}${rand}`;
}

export function generateSku(name?: string, category?: string): string {
  const prefix = `${(category || '').slice(0, 2)}-${(name || '')}`
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 10)
    .toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix ? prefix + '-' : ''}${suffix}`;
}

export function isAbsoluteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function toCurrencyMinorUnits(value: number): number {
  return Math.max(0, Math.floor(value));
} 