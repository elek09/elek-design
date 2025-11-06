export function getOrigin(base: string): string {
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

export function resolveToAbsolute(apiOrigin: string, raw?: string): string {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return apiOrigin ? `${apiOrigin}${path}` : path;
}

export function joinUrl(base: string, path: string): string {
  const b = base?.endsWith('/') ? base.slice(0, -1) : base;
  const p = path?.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}
