import React, { useEffect, useState } from 'react';
import { ShoppingBag, Heart } from 'lucide-react';
import { useThemeConfig } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';
import { useMenu } from '../lib/storefront-api';

type RawMenuInput = unknown;
type NavItem = { name: string; href: string };

const normalizeMenuItems = (input: RawMenuInput): NavItem[] => {
  if (!input) return [];
  const source = Array.isArray(input)
    ? input
    : typeof input === 'object' && Array.isArray((input as { items?: unknown[] }).items)
      ? (input as { items: unknown[] }).items
      : [input];
  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const name = String(o.name ?? o.label ?? o.title ?? '').trim();
      const hrefRaw = String(o.href ?? o.url ?? '/').trim();
      if (!name) return null;
      const href = hrefRaw.startsWith('http') || hrefRaw.startsWith('/') ? hrefRaw : `/${hrefRaw}`;
      return { name, href };
    })
    .filter((x): x is NavItem => Boolean(x));
};

const pickMenuHandle = (input: RawMenuInput): string => {
  if (typeof input === 'string') {
    const t = input.trim();
    if (t.startsWith('{')) {
      try {
        return pickMenuHandle(JSON.parse(t) as RawMenuInput);
      } catch {
        return '';
      }
    }
    return t && !t.startsWith('/') ? t : '';
  }
  if (!input || typeof input !== 'object') return '';
  const o = input as Record<string, unknown>;
  const candidates: unknown[] = [o.handle, o.menuHandle, o.value, o.slug, o.id, o.ar, o.en];
  const value = candidates.find((v) => typeof v === 'string' && String(v).trim()) as string | undefined;
  if (!value) return '';
  const handle = value.trim();
  return handle && !handle.startsWith('/') ? handle : '';
};

const asBool = (value: unknown, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/** مطابق themes/tempcode/components/store/StoreHeader.tsx — بنية وكلاسات */
const HeaderSection: React.FC<{ section: any }> = ({ section }) => {
  const { store, storeId, settings, onOpenCart, wishlist, cart } = useThemeConfig();
  const content = section?.content || {};

  const [pathname, setPathname] = useState('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setPathname(window.location.pathname || '/');
      } catch {
        setPathname('/');
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const headerSettings = {
    sticky: asBool(content.sticky, true),
    backgroundColor: String(content.background_color ?? content.backgroundColor ?? '').trim(),
    showWishlist: asBool(content.show_wishlist, true),
    showCart: asBool(content.show_cart, true),
    height: (String(content.height || 'normal') as 'compact' | 'normal' | 'large') || 'normal',
    showLogo: asBool(content.show_logo, true),
    navAlign: (String(content.nav_align || 'left') as 'left' | 'center' | 'right') || 'left',
  };

  const isSticky = headerSettings.sticky !== false;
  const bgColor = headerSettings.backgroundColor || undefined;
  const showWishlist = headerSettings.showWishlist !== false;
  const showCart = headerSettings.showCart !== false;
  const heightClass =
    headerSettings.height === 'compact' ? 'h-16' : headerSettings.height === 'large' ? 'h-24' : 'h-20';
  const showLogo = headerSettings.showLogo !== false;
  const navLinksJustify =
    headerSettings.navAlign === 'center'
      ? 'justify-center'
      : headerSettings.navAlign === 'right'
        ? 'justify-end'
        : 'justify-start';

  const primaryColor = String(settings?.primaryColor || '#0f172a').trim() || '#0f172a';
  const textPrimaryStyle = { color: primaryColor };

  const defaultLinks: NavItem[] = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المتجر', href: '/shop' },
    { name: 'اتصل بنا', href: '/contact' },
  ];

  const sectionMenuInline = normalizeMenuItems(content.menu);
  const primaryMenuInline = normalizeMenuItems(settings?.nav_primary);
  const sectionMenuHandle = pickMenuHandle(content.menu);
  const primaryMenuHandle =
    pickMenuHandle((settings as Record<string, unknown> | undefined)?.headerMenuHandle) ||
    pickMenuHandle(settings?.nav_primary);
  const sectionMenuItems = useMenu(sectionMenuHandle, storeId);
  const primaryMenuItems = useMenu(primaryMenuHandle, storeId);
  const sectionMenuFromSystem = sectionMenuItems
    .map((link) => ({
      name: String(link.name || link.label || link.title || '').trim(),
      href: String(link.href || link.url || '/'),
    }))
    .filter((x) => x.name);
  const primaryMenuFromSystem = primaryMenuItems
    .map((link) => ({
      name: String(link.name || link.label || link.title || '').trim(),
      href: String(link.href || link.url || '/'),
    }))
    .filter((x) => x.name);

  const hasSectionMenuSelection = sectionMenuInline.length > 0 || Boolean(sectionMenuHandle);
  const selectedSectionLinks =
    sectionMenuInline.length > 0 ? sectionMenuInline : sectionMenuFromSystem;
  const fallbackLinks =
    primaryMenuInline.length > 0
      ? primaryMenuInline
      : primaryMenuFromSystem.length > 0
        ? primaryMenuFromSystem
        : defaultLinks;
  const navLinks = hasSectionMenuSelection
    ? (selectedSectionLinks.length > 0 ? selectedSectionLinks : fallbackLinks)
    : fallbackLinks;

  const displayName =
    String(
      (store as Record<string, unknown> | undefined)?.name ??
        (store as Record<string, unknown> | undefined)?.storeName ??
        settings?.store_name ??
        settings?.storeName ??
        'STORE.',
    ).trim() || 'STORE.';
  const displayLogo = String(
    (store as Record<string, unknown> | undefined)?.logo ??
      (store as Record<string, unknown> | undefined)?.storeLogo ??
      settings?.store_logo ??
      settings?.logo ??
      '',
  ).trim();

  const cartCount =
    cart?.reduce((n, p) => n + (Number((p as { quantity?: number }).quantity) || 1), 0) ?? 0;

  const navLinkClass = (href: string) => {
    const normalized = href.startsWith('/') ? href : `/${href}`;
    const active = pathname === normalized || (normalized !== '/' && pathname.startsWith(normalized));
    return `hover:text-black transition ${active ? 'text-black font-bold' : ''}`;
  };

  const isExternal = (url: string) => url.startsWith('http://') || url.startsWith('https://');

  return (
    <>
      <nav
        className={`${isSticky ? 'sticky top-0' : ''} z-40 border-b border-slate-100 shadow-sm ${!bgColor ? 'bg-white/90 backdrop-blur-md' : ''}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <div className={`max-w-7xl mx-auto px-6 ${heightClass} flex items-center justify-between`}>
          <button
            type="button"
            className="md:hidden text-slate-800"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="القائمة"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {showLogo && (
            <a
              href={toStorefrontUrl('/')}
              target="_top"
              rel="noreferrer"
              className="flex items-center cursor-pointer"
            >
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={displayName}
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl font-black tracking-tighter" style={textPrimaryStyle}>
                  {displayName}
                </span>
              )}
            </a>
          )}

          <div
            className={`hidden md:flex flex-1 ${navLinksJustify} space-x-10 rtl:space-x-reverse font-bold text-sm uppercase tracking-wide text-slate-500`}
          >
            {navLinks.map((item) => {
              const ext = isExternal(item.href);
              const className = navLinkClass(ext ? pathname : item.href);
              if (ext) {
                return (
                  <a
                    key={`${item.name}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {item.name}
                  </a>
                );
              }
              return (
                <a
                  key={`${item.name}-${item.href}`}
                  href={toStorefrontUrl(item.href)}
                  target="_top"
                  rel="noreferrer"
                  className={className}
                >
                  {item.name}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            {showWishlist && (
              <a href={toStorefrontUrl('/wishlist')} target="_top" rel="noreferrer" className="relative group cursor-pointer">
                <Heart className="w-7 h-7 text-slate-800 transition transform group-hover:scale-110" strokeWidth={2} />
                {(wishlist?.length ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">
                    {wishlist!.length > 99 ? '99+' : wishlist!.length}
                  </span>
                )}
              </a>
            )}
            {showCart && (
              <button
                type="button"
                className="relative group cursor-pointer border-0 bg-transparent p-0"
                onClick={() => onOpenCart?.()}
                aria-label="السلة"
              >
                <ShoppingBag className="w-7 h-7 text-slate-800 transition transform group-hover:scale-110" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm border-0 cursor-pointer p-0"
            aria-label="إغلاق"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={displayName}
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black" style={textPrimaryStyle}>
                  القائمة
                </span>
              )}
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 text-2xl">
                ✕
              </button>
            </div>
            <div className="flex flex-col space-y-4 font-bold text-lg text-slate-800">
              {navLinks.map((item) => (
                <a
                  key={`m-${item.name}-${item.href}`}
                  href={isExternal(item.href) ? item.href : toStorefrontUrl(item.href)}
                  target={isExternal(item.href) ? '_blank' : '_top'}
                  rel={isExternal(item.href) ? 'noopener noreferrer' : 'noreferrer'}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <a
                href={toStorefrontUrl('/wishlist')}
                target="_top"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                المفضلة
              </a>
              <a
                href={toStorefrontUrl('/track-order')}
                target="_top"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                تتبع الطلب
              </a>
              <a
                href={toStorefrontUrl('/profile')}
                target="_top"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                حسابي
              </a>
              <a
                href={toStorefrontUrl('/about')}
                target="_top"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                من نحن
              </a>
              <a
                href={toStorefrontUrl('/contact')}
                target="_top"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                اتصل بنا
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderSection;
