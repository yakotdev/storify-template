/**
 * Storefront host origin for links (target=_top) and API fallback when the theme runs in a cross-origin iframe.
 * Set from STORIFY_THEME_CONFIG (apiBaseUrl) or message event.origin (preview).
 */

let hostOriginOverride: string | null = null;

export function setHostOriginFromApiBase(apiBaseUrl?: string): void {
  hostOriginOverride = null;
  if (!apiBaseUrl || typeof apiBaseUrl !== 'string') return;
  const trimmed = apiBaseUrl.trim().replace(/\/?$/, '');
  const withoutApi = trimmed.replace(/\/api\/?$/, '');
  try {
    hostOriginOverride = new URL(withoutApi.endsWith('/') ? withoutApi : `${withoutApi}/`).origin;
  } catch {
    hostOriginOverride = null;
  }
}

export function setHostOriginFromString(origin: string | undefined): void {
  hostOriginOverride = null;
  if (!origin || typeof origin !== 'string') return;
  try {
    hostOriginOverride = new URL(origin).origin;
  } catch {
    hostOriginOverride = null;
  }
}

export function getHostOriginOverride(): string | null {
  return hostOriginOverride;
}

export function getHostOrigin(): string {
  if (hostOriginOverride) return hostOriginOverride;
  try {
    if (document.referrer) return new URL(document.referrer).origin;
  } catch {
    /* ignore */
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}
