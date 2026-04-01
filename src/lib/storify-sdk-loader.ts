declare global {
  interface Window {
    StorifySDK?: {
      setStoreConfig: (config: {
        id?: string;
        currency?: string;
        language?: string;
        apiBaseUrl?: string;
      } | null) => void;
      getProducts?: (query?: { limit?: number }) => Promise<unknown[]>;
      getProduct?: (id: string) => Promise<unknown>;
      getCategories?: () => Promise<unknown[]>;
      getMenu?: (handle: string) => Promise<unknown[]>;
      getPolicy?: (slug: string) => Promise<{ slug?: string; body?: string } | null>;
      getReviews?: (productId: string) => Promise<unknown[]>;
      getOrderById?: (id: string) => Promise<unknown>;
      formatPrice?: (amount: number) => string;
      [key: string]: unknown;
    };
  }
}

let loadPromise: Promise<void> | null = null;
let lastLoadedUrl: string | null = null;

/**
 * Injects the platform storefront SDK script once. Caller must then call StorifySDK.setStoreConfig.
 */
export function loadStorifySdk(scriptUrl: string): Promise<void> {
  const url = typeof scriptUrl === 'string' ? scriptUrl.trim() : '';
  if (!url) return Promise.resolve();

  if (typeof window !== 'undefined' && window.StorifySDK?.setStoreConfig && lastLoadedUrl === url) {
    return Promise.resolve();
  }

  if (loadPromise && lastLoadedUrl === url) return loadPromise;

  lastLoadedUrl = url;
  loadPromise = new Promise((resolve, reject) => {
    const safeKey = encodeURIComponent(url);
    const existing = document.querySelector(`script[data-storify-sdk="${safeKey}"]`) as HTMLScriptElement | null;
    if (existing && window.StorifySDK?.setStoreConfig) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.setAttribute('data-storify-sdk', safeKey);
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      lastLoadedUrl = null;
      reject(new Error(`Failed to load Storify SDK: ${url}`));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function applyStorifyStoreConfig(payload: {
  storeId?: string;
  store?: { currency?: string; language?: string };
  apiBaseUrl?: string;
}): void {
  if (!window.StorifySDK?.setStoreConfig) return;
  window.StorifySDK.setStoreConfig({
    id: payload.storeId,
    currency: payload.store?.currency,
    language: payload.store?.language,
    apiBaseUrl: payload.apiBaseUrl,
  });
}
