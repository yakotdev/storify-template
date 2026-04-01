import React, { useState, useEffect } from 'react';
import { ThemeProvider, ThemeConfig, LayoutSection } from './ThemeContext';
import { SectionRenderer } from './SectionRenderer';
import QuickViewModal from './components/QuickViewModal';
import CartSidebar from './components/CartSidebar';
import SearchOverlay from './components/SearchOverlay';
import NewsletterPopup from './components/NewsletterPopup';
import StorifySimulator from './components/StorifySimulator';
import ThemeEditor from './components/ThemeEditor';
import { Product } from './constants';
import { Settings as SettingsIcon } from 'lucide-react';
import manifest from '../theme-manifest.json';
import { setHostOriginFromApiBase, setHostOriginFromString } from './lib/host-origin';
import { loadStorifySdk, applyStorifyStoreConfig } from './lib/storify-sdk-loader';
import { buildStorifyAddToCartMessage } from './lib/cart-messaging';
import { parseCategoryScope } from './lib/category-scope';

const isThemeEmbedded = () => typeof window !== 'undefined' && window.parent !== window;

const postOpenParentCart = () => {
  if (isThemeEmbedded()) window.parent?.postMessage?.({ type: 'STORIFY_OPEN_CART' }, '*');
};

const toCanonicalId = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');

const getSectionDefinition = (sectionIdOrType: unknown) => {
  const source = String(sectionIdOrType || '');
  const canonical = toCanonicalId(source);
  const upper = source.toUpperCase().replace(/-/g, '_');

  return (manifest.sections || []).find(
    (s: any) =>
      toCanonicalId(s.id) === canonical ||
      toCanonicalId(s.component) === canonical ||
      String(s.component || '').toUpperCase() === upper,
  );
};

const defaultFieldValue = (field: Record<string, any> = {}) => {
  if (field.default !== undefined) return field.default;
  if (field.type === 'repeater') return [];
  if (field.type === 'menu') return '';
  if (field.type === 'category_scope') return { mode: 'all', categoryIds: [] as string[] };
  if (field.type === 'select') {
    const firstOption = Array.isArray(field.options) ? field.options[0] : undefined;
    if (typeof firstOption === 'object' && firstOption !== null) return firstOption.value ?? '';
    return firstOption ?? '';
  }
  return '';
};

const normalizeSectionContent = (
  schema: Record<string, any> = {},
  content: Record<string, any> = {},
): Record<string, any> => {
  const input = content && typeof content === 'object' && !Array.isArray(content) ? content : {};
  /** بدون مخطط لا نُصفّر المحتوى الوارد (مثلاً إن فشل حل نوع القسم). */
  if (!schema || Object.keys(schema).length === 0) {
    return { ...input };
  }
  const normalized: Record<string, any> = {};

  Object.entries(schema).forEach(([key, field]) => {
    const currentValue = input[key] ?? defaultFieldValue(field);

    if (field?.type === 'repeater') {
      const items = Array.isArray(currentValue) ? currentValue : [];
      const itemSchema = field?.fields || {};
      normalized[key] = items.map((item: any) => normalizeSectionContent(itemSchema, item || {}));
      return;
    }

    if (field?.type === 'menu') {
      if (Array.isArray(currentValue)) {
        normalized[key] = currentValue;
      } else if (typeof currentValue === 'string') {
        normalized[key] = currentValue;
      } else if (currentValue && typeof currentValue === 'object') {
        // Keep object-shaped menu values (e.g. {handle}, localized maps) so HeaderSection can resolve them.
        normalized[key] = currentValue;
      } else {
        normalized[key] = '';
      }
      return;
    }

    if (field?.type === 'select') {
      normalized[key] = String(currentValue ?? '');
      return;
    }

    if (field?.type === 'link') {
      normalized[key] =
        typeof currentValue === 'string' || typeof currentValue === 'object'
          ? currentValue
          : String(currentValue ?? '');
      return;
    }

    if (field?.type === 'category_scope') {
      normalized[key] = parseCategoryScope(currentValue);
      return;
    }

    normalized[key] = currentValue === null || currentValue === undefined ? '' : currentValue;
  });

  // Keep unknown keys from persisted content to avoid losing backward-compatible fields
  // (e.g. older key naming styles still consumed by section components).
  const passthrough: Record<string, any> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (!(key in schema)) passthrough[key] = value;
  });

  return { ...passthrough, ...normalized };
};

const buildDefaultContent = (schema: Record<string, any> = {}) => normalizeSectionContent(schema, {});

const resolveSectionDefinition = (section: LayoutSection & { manifestId?: string }) =>
  getSectionDefinition(section.manifestId) ||
  getSectionDefinition(section.type) ||
  getSectionDefinition(section.id);

const normalizeLayout = (layout: LayoutSection[] = []): LayoutSection[] =>
  layout.map((section, index) => {
    const sectionDef = resolveSectionDefinition(section as LayoutSection & { manifestId?: string });
    const resolvedType = sectionDef?.component || String(section.type || section.id || '').toUpperCase();
    const schema = sectionDef?.contentSchema || {};
    const incoming = section.content && typeof section.content === 'object' && !Array.isArray(section.content) ? section.content : {};

    // Payload content takes priority. Only fill in missing keys from manifest defaults.
    const mergedContent: Record<string, any> = { ...incoming };
    for (const [key, field] of Object.entries(schema)) {
      if (!(key in mergedContent)) {
        mergedContent[key] = defaultFieldValue(field);
      }
    }

    return {
      ...section,
      id: String(section.id || `${toCanonicalId(sectionDef?.id || resolvedType)}-${index + 1}`),
      type: resolvedType,
      order: section.order ?? index,
      group: section.group || sectionDef?.group || 'template_group',
      content: mergedContent,
    };
  });

const buildDefaultLayout = (): LayoutSection[] => {
  const homePage = (manifest.pages || []).find((p: any) => p.id === 'home');
  if (!homePage) return normalizeLayout(mockConfig.layout);

  const pageDefaults = (manifest as any).pageDefaults?.home || {};
  const mapped = (homePage.layout || []).map((entry: any, index: number) => {
    const sectionDef = getSectionDefinition(entry.sectionId);
    const defaultsFromPage = pageDefaults?.[entry.handle] || {};
    const baseContent = buildDefaultContent(sectionDef?.contentSchema || {});

    return {
      id: String(entry.sectionId || entry.handle || `section-${index + 1}`),
      type: sectionDef?.component || entry.sectionId,
      enabled: entry.defaultEnabled !== false,
      order: index,
      group: sectionDef?.group || 'template_group',
      content: normalizeSectionContent(sectionDef?.contentSchema || {}, {
        ...baseContent,
        ...defaultsFromPage,
      }),
    };
  });

  return normalizeLayout(mapped);
};

const mockConfig: ThemeConfig = {
  layout: [
    {
      id: 'header-1',
      type: 'HEADER',
      enabled: true,
      group: 'header_group',
      content: {
        sticky: true,
        height: 'normal',
        show_logo: true,
        nav_align: 'left',
        show_wishlist: true,
        show_cart: true,
        menu: [],
      },
    },
    {
      id: 'hero-1',
      type: 'HERO_SLIDER',
      enabled: true,
      group: 'template_group',
      content: {
        image:
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1920',
        title: 'أناقة بلا حدود',
        subtitle: 'اكتشف أحدث صيحات الموضة والمنتجات الحصرية لدينا.',
        buttonText: 'تسوق الآن',
        link: '/shop',
        alignment: 'left',
        overlayOpacity: '0.1',
      },
    },
    {
      id: 'categories-1',
      type: 'CATEGORIES',
      enabled: true,
      group: 'template_group',
      content: {
        title: 'تسوق حسب الفئة',
        subtitle: 'اختر المزاج المناسب لمساحتك',
        layout_style: 'bento',
        padding_top: '80px',
        padding_bottom: '80px',
      },
    },
    {
      id: 'featured-1',
      type: 'FEATURED_PRODUCTS',
      enabled: true,
      group: 'template_group',
      content: {
        title: 'قطع معمارية مميزة',
        subtitle: 'اختيارات منسّقة بعناية',
        layout_style: 'grid',
        items_per_row: '4',
        bg_color: '#ffffff',
        padding_top: '96px',
        padding_bottom: '96px',
      },
    },
    {
      id: 'newsletter-1',
      type: 'NEWSLETTER',
      enabled: true,
      group: 'template_group',
      content: {
        title: 'النشرة البريدية',
        subtitle: 'اشترك للحصول على تحديثات حصرية ومجموعات جديدة.',
        bg_color: '#111827',
        text_color: '#ffffff',
        padding_top: '96px',
        padding_bottom: '96px',
      },
    },
    {
      id: 'footer-1',
      type: 'FOOTER',
      enabled: true,
      group: 'footer_group',
      content: {
        footer_menu_title: 'المتجر',
        show_social: true,
        bg_color: '#0b1120',
        text_color: '#f9fafb',
      },
    },
  ],
  settings: {
    primaryColor: '#0f172a',
    accentColor: '#6366f1',
    borderRadius: '16px',
    fontFamily: 'Almarai',
    nav_primary: [
      { name: 'الرئيسية', href: '/' },
      { name: 'المتجر', href: '/shop' },
      { name: 'من نحن', href: '/about' },
      { name: 'اتصل بنا', href: '/contact' }
    ]
  },
  store: {
    name: 'متجر ستوريفاي',
    logo: '',
    favicon: '',
    email: 'hello@storify.example',
    phone: '+966 00 000 0000',
    address: 'الرياض، المملكة العربية السعودية',
    metaDescription:
      'متجر إلكتروني بقالب Storify Template: واجهة نظيفة، أقسام ومنتجات مميزة، وتجربة تسوق مألوفة.',
  },
  t: (key: string) => key,
};

export const ThemeApp: React.FC = () => {
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [layout, setLayout] = useState<LayoutSection[]>(buildDefaultLayout);
  const [cart, setCart] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const devMode = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    let receivedParentConfig = false;
    const getStoreIdFromQuery = (): string | undefined => {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('storeId') || params.get('store_id');
      return fromQuery && fromQuery.trim() ? fromQuery.trim() : undefined;
    };

    const shouldUseLocalFallback = (() => {
      const hasStoreQuery = !!getStoreIdFromQuery();
      const embedded = window.parent !== window || !!document.referrer;
      // Use mock fallback only for standalone local preview (not real storefront/editor iframe).
      return !embedded && !hasStoreQuery;
    })();

    const themeSettingsDefaults: Record<string, string> = {
      primaryColor: '#0f172a',
      accentColor: '#6366f1',
      borderRadius: '16px',
      fontFamily: 'Almarai',
    };
    const normalizeSettings = (value: unknown): Record<string, any> => {
      const raw = value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, any>)
        : {};
      const merged: Record<string, any> = { ...raw };
      const empty = (x: unknown) => x == null || (typeof x === 'string' && x.trim() === '');
      if (empty(merged.primaryColor)) {
        const pc = merged.primary_color ?? merged.primaryColour;
        if (!empty(pc)) merged.primaryColor = pc;
      }
      if (empty(merged.accentColor)) {
        const ac = merged.accent_color ?? merged.secondaryColor ?? merged.secondary_color;
        if (!empty(ac)) merged.accentColor = ac;
      }
      return { ...themeSettingsDefaults, ...merged };
    };

    const resolvePreviewLayout = (themeData: any, previewPage?: string): LayoutSection[] => {
      const pageKey = previewPage && previewPage !== 'index' ? previewPage : 'home';
      const pages = themeData?.pages && typeof themeData.pages === 'object' ? themeData.pages : {};
      const fromPage = Array.isArray(pages?.[pageKey]?.layout) ? pages[pageKey].layout : null;
      const fromHome = Array.isArray(pages?.home?.layout) ? pages.home.layout : null;
      const fromUploaded = Array.isArray(themeData?.uploadedThemeLayout) ? themeData.uploadedThemeLayout : null;
      const fromThemeLayout = Array.isArray(themeData?.layout) ? themeData.layout : null;
      const raw = fromPage || fromHome || fromUploaded || fromThemeLayout || [];
      return normalizeLayout(raw);
    };

    const fallbackTimer = shouldUseLocalFallback
      ? setTimeout(() => {
          setSdkReady(true);
          setConfig((prev) => {
            if (prev) return prev;
            setLayout(normalizeLayout(mockConfig.layout));
            return mockConfig;
          });
        }, 1500)
      : null;

    // Safety net: if no parent config ever arrives, stop endless loading.
    // Use manifest-based default layout (not mock-heavy content) to keep app usable.
    const emergencyTimer = setTimeout(() => {
      setSdkReady(true);
      setConfig((prev) => {
        if (prev) return prev;
        const fallbackLayout = buildDefaultLayout();
        setLayout(fallbackLayout);
        return {
          layout: fallbackLayout,
          settings: { primaryColor: '#0f172a', accentColor: '#6366f1', borderRadius: '16px', fontFamily: 'Almarai' },
          storeId: getStoreIdFromQuery(),
          store: mockConfig.store,
          t: (key: string) => key,
        };
      });
    }, 7000);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STORIFY_THEME_CONFIG' && event.data.payload) {
        receivedParentConfig = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        clearTimeout(emergencyTimer);
        const p = event.data.payload;
        setHostOriginFromApiBase(typeof p.apiBaseUrl === 'string' ? p.apiBaseUrl : undefined);
        const incomingLayout = normalizeLayout(Array.isArray(p.layout) ? p.layout : []);
        setLayout(incomingLayout);

        const payloadProducts = Array.isArray(p.products) ? p.products : [];
        const payloadCart = Array.isArray(p.cart) ? p.cart : [];
        const payloadCategories = Array.isArray(p.categories) ? p.categories : [];
        const productIdFromPayload = typeof p.productId === 'string' ? p.productId : undefined;
        const productIdFromUrl = (() => {
          try {
            const q = new URLSearchParams(window.location.search);
            return q.get('productId') || q.get('product_id') || undefined;
          } catch {
            return undefined;
          }
        })();
        const currentProductPayload = p.currentProduct && typeof p.currentProduct === 'object' ? p.currentProduct : undefined;
        setSdkReady(false);
        setCart(payloadCart as Product[]);
        setConfig({
          layout: incomingLayout,
          settings: normalizeSettings(p.settings),
          storeId: p.storeId ?? getStoreIdFromQuery(),
          store: p.store ?? undefined,
          products: payloadProducts,
          categories: payloadCategories,
          path: typeof p.path === 'string' ? p.path : undefined,
          productId: productIdFromPayload ?? productIdFromUrl,
          currentProduct: currentProductPayload ?? undefined,
          t: (key: string) => key,
        });
        void (async () => {
          try {
            if (p.sdkScriptUrl && typeof p.sdkScriptUrl === 'string') {
              await loadStorifySdk(p.sdkScriptUrl);
              applyStorifyStoreConfig({
                storeId: p.storeId ?? getStoreIdFromQuery(),
                store: p.store,
                apiBaseUrl: typeof p.apiBaseUrl === 'string' ? p.apiBaseUrl : undefined,
              });
            }
          } catch (err) {
            console.warn('[storify-template] SDK load failed', err);
          } finally {
            setSdkReady(true);
          }
        })();
        return;
      }

      // Theme editor iframe preview payload from admin-central.
      if (event.data?.type === 'STORIFY_THEME_PREVIEW' && event.data.theme) {
        receivedParentConfig = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        clearTimeout(emergencyTimer);
        const previewPage = typeof event.data.previewPage === 'string' ? event.data.previewPage : 'home';
        const themeData = event.data.theme;
        const origin = typeof event.origin === 'string' && event.origin ? event.origin : '';
        if (origin) setHostOriginFromString(origin);
        const incomingLayout = resolvePreviewLayout(themeData, previewPage);
        const settings = normalizeSettings(themeData?.uploadedThemeSettings ?? themeData?.settings);

        setLayout(incomingLayout.length > 0 ? incomingLayout : normalizeLayout(mockConfig.layout));
        setSdkReady(false);
        setConfig((prev) => ({
          ...(prev || mockConfig),
          layout: incomingLayout.length > 0 ? incomingLayout : normalizeLayout(mockConfig.layout),
          settings,
          storeId: themeData?.storeId ?? prev?.storeId ?? getStoreIdFromQuery(),
          store: themeData?.store || prev?.store || mockConfig.store,
          products: Array.isArray(themeData?.products) ? themeData.products : prev?.products,
          categories: Array.isArray(themeData?.categories) ? themeData.categories : prev?.categories,
          t: (key: string) => key,
        }));
        void (async () => {
          try {
            const sdkUrl = origin ? `${origin}/sdk/storefront-sdk.js` : '';
            if (sdkUrl) {
              await loadStorifySdk(sdkUrl);
              applyStorifyStoreConfig({
                storeId: themeData?.storeId ?? getStoreIdFromQuery(),
                store: themeData?.store,
                apiBaseUrl: origin ? `${origin}/api` : undefined,
              });
            }
          } catch (err) {
            console.warn('[storify-template] Preview SDK load failed', err);
          } finally {
            setSdkReady(true);
          }
        })();
      }
    };

    window.addEventListener('message', handleMessage);
    // Tell parent storefront/editor we are ready to receive config.
    // Retry a few times to avoid race condition if parent listener isn't ready on first ping.
    const postThemeReady = () => window.parent?.postMessage?.({ type: 'STORIFY_THEME_READY' }, '*');
    postThemeReady();
    const readyRetryInterval = window.setInterval(() => {
      if (receivedParentConfig) {
        window.clearInterval(readyRetryInterval);
        return;
      }
      postThemeReady();
    }, 700);
    const readyRetryStopper = window.setTimeout(() => {
      window.clearInterval(readyRetryInterval);
    }, 10000);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      clearTimeout(emergencyTimer);
      window.clearInterval(readyRetryInterval);
      window.clearTimeout(readyRetryStopper);
    };
  }, []);

  useEffect(() => {
    if (config?.settings) {
      const root = document.documentElement;
      const s = config.settings;
      if (s.primaryColor) root.style.setProperty('--brand-primary', s.primaryColor);
      if (s.accentColor) root.style.setProperty('--brand-accent', s.accentColor);
      if (s.borderRadius) root.style.setProperty('--brand-radius', s.borderRadius);
      if (s.fontFamily) root.style.setProperty('--brand-font', s.fontFamily);
    }
  }, [config?.settings]);

  const currentLayout = layout.length > 0 ? layout : config?.layout || normalizeLayout(mockConfig.layout);

  const updateSectionContent = (sectionId: string, contentPatch: Record<string, any>) => {
    setLayout(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...(section.content || {}), ...contentPatch } }
          : section)
    );
  };

  const updateSectionEnabled = (sectionId: string, enabled: boolean) => {
    setLayout(prev => prev.map(section => (section.id === sectionId ? { ...section, enabled } : section)));
  };

  const handleAddToCart = (product: Product) => {
    const qty =
      typeof (product as Product & { quantity?: number }).quantity === 'number' &&
      !Number.isNaN((product as Product & { quantity?: number }).quantity!)
        ? Math.max(1, (product as Product & { quantity?: number }).quantity!)
        : 1;
    const id = product?.id != null ? String(product.id).trim() : '';
    if (!id || id === 'undefined' || id === 'null') return;

    const payload = { ...product, quantity: qty } as Product & { quantity: number };
    setCart((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === id);
      if (idx >= 0) {
        return prev.map((p, i) =>
          i === idx ? { ...p, quantity: (Number((p as Product & { quantity?: number }).quantity) || 1) + qty } : p,
        );
      }
      return [...prev, payload];
    });

    const msg = buildStorifyAddToCartMessage(payload);
    if (msg) window.parent?.postMessage?.(msg, '*');
    // افتح سلة الثيم دائماً للحفاظ على تجربة Storify Template داخل iframe.
    setIsCartOpen(true);
  };

  const toggleWishlist = (product: Product) => {
    window.parent?.postMessage?.({ type: 'STORIFY_TOGGLE_WISHLIST', product }, '*');
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-accent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium tracking-widest uppercase">جاري تحميل الثيم...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider value={{
      ...config,
      sdkReady,
      layout: currentLayout,
      onQuickView: setQuickViewProduct,
      onAddToCart: handleAddToCart,
      onToggleWishlist: toggleWishlist,
      onOpenCart: () => {
        setIsCartOpen(true);
      },
      onOpenSearch: () => setIsSearchOpen(true),
      cart,
      wishlist,
      updateSectionContent,
      updateSectionEnabled,
    }}>
      <div className="selection:bg-brand-accent selection:text-white" dir="rtl">
        <SectionRenderer />
        {devMode ? <ThemeEditor /> : null}
        
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
          onAddToCart={handleAddToCart} 
          onToggleWishlist={toggleWishlist}
          wishlist={wishlist}
        />

        <CartSidebar 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart} 
          onRemove={(item) =>
            setCart((prev) => {
              const selected = item as Product & { selectedVariant?: { id?: string } };
              const productId = selected?.id != null ? String(selected.id).trim() : '';
              const variantId =
                selected?.selectedVariant?.id != null ? String(selected.selectedVariant.id).trim() : undefined;
              if (productId) {
                window.parent?.postMessage?.(
                  { type: 'STORIFY_REMOVE_FROM_CART', productId, variantId },
                  '*',
                );
              }
              return prev.filter((p) => {
                const pid = p?.id != null ? String(p.id).trim() : '';
                const pvid =
                  (p as Product & { selectedVariant?: { id?: string } }).selectedVariant?.id != null
                    ? String((p as Product & { selectedVariant?: { id?: string } }).selectedVariant!.id).trim()
                    : undefined;
                return !(pid === productId && (pvid || '') === (variantId || ''));
              });
            })
          } 
        />

        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />

        <NewsletterPopup 
          isOpen={showNewsletter} 
          onClose={() => setShowNewsletter(false)} 
        />

        {devMode ? (
          <>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="fixed bottom-24 left-6 z-[90] bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-3 group"
            >
              <SettingsIcon size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xs font-bold uppercase tracking-widest hidden md:block">محاكي الإعدادات</span>
            </button>

            <StorifySimulator
              isOpen={isSimulatorOpen}
              onClose={() => setIsSimulatorOpen(false)}
            />
          </>
        ) : null}
      </div>
    </ThemeProvider>
  );
};
