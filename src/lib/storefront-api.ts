import { useEffect, useMemo, useState } from 'react';
import type { Category, Product } from '../constants';
import { useThemeConfig } from '../ThemeContext';
import { getHostOrigin } from './host-origin';

export interface MenuItem {
  id?: string;
  label?: string;
  name?: string;
  title?: string;
  url?: string;
  href?: string;
}

/** Iframe themes get ?storeId= on the URL even when React config loses storeId briefly. */
function getStoreIdFromLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const q = new URLSearchParams(window.location.search);
    const id = q.get('storeId') ?? q.get('store_id');
    return id && id.trim() ? id.trim() : undefined;
  } catch {
    return undefined;
  }
}

const withStoreHeader = (storeId?: string): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (storeId) headers['X-Store-Id'] = storeId;
  return headers;
};

async function fetchPublicApi<T>(path: string, storeId?: string): Promise<T> {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getHostOrigin()}/api${safePath}`;
  const res = await fetch(url, {
    headers: withStoreHeader(storeId),
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

function normalizeListResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

function getSdk() {
  return typeof window !== 'undefined' ? window.StorifySDK : undefined;
}

/** Same idea as HeaderSection.pickMenuHandle — menu fields may be string handle or editor object. */
function resolveMenuHandle(raw: unknown): string {
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return '';
    if (t.startsWith('{')) {
      try {
        return resolveMenuHandle(JSON.parse(t) as unknown);
      } catch {
        return '';
      }
    }
    return t.startsWith('/') ? '' : t;
  }
  if (!raw || typeof raw !== 'object') return '';
  const o = raw as Record<string, unknown>;
  const candidates: unknown[] = [o.handle, o.menuHandle, o.value, o.slug, o.id, o.ar, o.en];
  const value = candidates.find((v) => typeof v === 'string' && String(v).trim()) as string | undefined;
  if (!value) return '';
  const handle = value.trim();
  return handle && !handle.startsWith('/') ? handle : '';
}

export function useProducts(storeId?: string, limit = 12) {
  const { sdkReady } = useThemeConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const effectiveStoreId = (storeId && String(storeId).trim()) || getStoreIdFromLocation();

  useEffect(() => {
    let mounted = true;
    const cap = Math.min(limit, 100);

    const run = async () => {
      if (!effectiveStoreId?.trim()) {
        if (mounted) setProducts([]);
        return;
      }
      const sdk = getSdk();
      try {
        if (sdkReady && sdk?.getProducts) {
          const list = await sdk.getProducts({ limit: cap });
          if (!mounted) return;
          setProducts(Array.isArray(list) ? list.slice(0, cap) : []);
          return;
        }
        const url = cap > 0 ? `/products?limit=${cap}` : '/products';
        const data = await fetchPublicApi<unknown>(url, effectiveStoreId);
        if (!mounted) return;
        const list = normalizeListResponse<Product>(data);
        setProducts(cap > 0 ? list.slice(0, cap) : list);
      } catch {
        if (mounted) setProducts([]);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [effectiveStoreId, limit, sdkReady]);

  return products;
}

export function useCategories(storeId?: string, limit = 12) {
  const { sdkReady } = useThemeConfig();
  const [categories, setCategories] = useState<Category[]>([]);
  const effectiveStoreId = (storeId && String(storeId).trim()) || getStoreIdFromLocation();

  useEffect(() => {
    let mounted = true;
    const cap = Math.min(limit, 100);

    const run = async () => {
      if (!effectiveStoreId?.trim()) {
        if (mounted) setCategories([]);
        return;
      }
      const sdk = getSdk();
      try {
        if (sdkReady && sdk?.getCategories) {
          const list = await sdk.getCategories();
          if (!mounted) return;
          const arr = Array.isArray(list) ? list : [];
          setCategories(cap > 0 ? arr.slice(0, cap) : arr);
          return;
        }
        const url = cap > 0 ? `/categories?limit=${cap}` : '/categories';
        const data = await fetchPublicApi<unknown>(url, effectiveStoreId);
        if (!mounted) return;
        const list = normalizeListResponse<Category>(data);
        setCategories(cap > 0 ? list.slice(0, cap) : list);
      } catch {
        if (mounted) setCategories([]);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [effectiveStoreId, limit, sdkReady]);

  return categories;
}

export function useProduct(productId: string | undefined, storeId?: string) {
  const { sdkReady } = useThemeConfig();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const effectiveStoreId = (storeId && String(storeId).trim()) || getStoreIdFromLocation();

  useEffect(() => {
    let mounted = true;
    if (!productId || !effectiveStoreId?.trim()) {
      setProduct(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const run = async () => {
      setLoading(true);
      const sdk = getSdk();
      try {
        if (sdkReady && sdk?.getProduct) {
          const p = await sdk.getProduct(productId);
          if (!mounted) return;
          setProduct(p && typeof p === 'object' ? (p as Product) : null);
          return;
        }
        const data = await fetchPublicApi<Product>(`/products/${encodeURIComponent(productId)}`, effectiveStoreId);
        if (!mounted) return;
        setProduct(data && typeof data === 'object' ? data : null);
      } catch {
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [productId, effectiveStoreId, sdkReady]);

  return { product, loading };
}

export function useMenu(menuHandle: unknown, storeId?: string) {
  const handle = resolveMenuHandle(menuHandle);
  const { sdkReady } = useThemeConfig();
  const [items, setItems] = useState<MenuItem[]>([]);
  const effectiveStoreId = (storeId && String(storeId).trim()) || getStoreIdFromLocation();

  useEffect(() => {
    let mounted = true;
    if (!handle) {
      setItems([]);
      return () => {
        mounted = false;
      };
    }

    const run = async () => {
      const sdk = getSdk();
      try {
        if (sdkReady && sdk?.getMenu) {
          const list = await sdk.getMenu(handle);
          if (!mounted) return;
          setItems(Array.isArray(list) ? (list as MenuItem[]) : []);
          return;
        }
        if (!effectiveStoreId?.trim()) {
          if (mounted) setItems([]);
          return;
        }
        const data = await fetchPublicApi<{ items?: MenuItem[] }>(
          `/menus/by-handle?handle=${encodeURIComponent(handle)}`,
          effectiveStoreId,
        );
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (mounted) setItems([]);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [handle, effectiveStoreId, sdkReady]);

  return useMemo(() => items, [items]);
}
