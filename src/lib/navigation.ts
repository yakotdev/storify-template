import { getHostOrigin } from './host-origin';

const getStoreIdFromSearch = (search: string): string | undefined => {
  try {
    const params = new URLSearchParams(search);
    const fromQuery = params.get('storeId') || params.get('store_id');
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    /* ignore */
  }
  return undefined;
};

const getActiveStoreId = (): string | undefined => {
  const fromCurrent = getStoreIdFromSearch(window.location.search);
  if (fromCurrent) return fromCurrent;
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      return getStoreIdFromSearch(ref.search);
    }
  } catch {
    /* ignore */
  }
  return undefined;
};

/** Absolute URL on the storefront host so navigation breaks out of the theme iframe (`target="_top"`). */
/** Normalize manifest `link` field (string or { url }) to a path or absolute URL. */
export function normalizeLinkPath(link: unknown, fallback = '/'): string {
  if (typeof link === 'string' && link.trim()) {
    const u = link.trim();
    if (u.startsWith('http')) return u;
    return u.startsWith('/') ? u : `/${u}`;
  }
  if (link && typeof link === 'object' && 'url' in link && typeof (link as { url?: string }).url === 'string') {
    const u = (link as { url: string }).url.trim();
    if (u.startsWith('http')) return u;
    return u.startsWith('/') ? u : `/${u}`;
  }
  return fallback;
}

export const toStorefrontUrl = (path: string): string => {
  const raw = path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  const url = new URL(raw, getHostOrigin());
  const storeId = getActiveStoreId();
  if (storeId && !url.searchParams.get('storeId') && !url.searchParams.get('store_id')) {
    url.searchParams.set('storeId', storeId);
  }
  return url.toString();
};
