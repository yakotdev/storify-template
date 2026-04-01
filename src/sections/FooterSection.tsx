import React, { useState } from 'react';
import { useThemeConfig, LayoutSection } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';
import { useMenu } from '../lib/storefront-api';

/** مطابق لروح الفوتر في themes/tempcode/components/store/StoreLayout.tsx */
const FooterSection = ({ section }: { section: LayoutSection }) => {
  const { store, storeId, settings } = useThemeConfig();
  const content = section.content || {};
  const asBool = (value: any, fallback = true) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  };
  const bgColor = content.bg_color || '#0f172a';
  const textColor = content.text_color || '#ffffff';
  const showSocial = asBool(content.show_social, true);
  const showNewsletter = asBool(content.show_newsletter, true);
  const [footerEmail, setFooterEmail] = useState('');
  const [footerSubStatus, setFooterSubStatus] = useState<'idle' | 'sent'>('idle');
  const embedded = typeof window !== 'undefined' && window.parent !== window;

  const defaultQuickLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المتجر', href: '/shop' },
    { name: 'المفضلة', href: '/wishlist' },
  ];
  const defaultSupportLinks = [
    { name: 'الأسئلة الشائعة', href: '/contact' },
    { name: 'الشحن', href: '/contact' },
    { name: 'المرتجعات', href: '/contact' },
  ];

  const footerMenuItems = useMenu(settings?.footer_col_1, storeId);
  const primaryMenuItems = useMenu(settings?.nav_primary, storeId);
  const quickLinks =
    footerMenuItems.length > 0
      ? footerMenuItems
      : primaryMenuItems.length > 0
        ? primaryMenuItems
        : defaultQuickLinks;

  const year = new Date().getFullYear();
  const storeName = store?.name || 'المتجر';
  const copyright =
    content.copyright_text ||
    `© ${year} ${storeName}. جميع الحقوق محفوظة.`;

  return (
    <footer className="py-16 px-6 mt-auto" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mb-12">
        <div className="sm:col-span-2 md:col-span-1">
          {store?.logo && String(store.logo).trim() !== '' ? (
            <img
              src={String(store.logo).trim()}
              alt={storeName}
              className="h-12 w-auto object-contain mb-4"
              referrerPolicy="no-referrer"
            />
          ) : (
            <h3 className="text-2xl font-black mb-4 tracking-tight">{storeName}</h3>
          )}
          {store?.address && (
            <p className="opacity-70 mb-2 max-w-sm text-sm leading-relaxed">{store.address}</p>
          )}
          {store?.email && (
            <p className="opacity-70 mb-2 text-sm">
              <a href={`mailto:${store.email}`} className="hover:opacity-100 transition">
                {store.email}
              </a>
            </p>
          )}
          {store?.phone && (
            <p className="opacity-70 text-sm">
              <a href={`tel:${store.phone}`} className="hover:opacity-100 transition">
                {store.phone}
              </a>
            </p>
          )}
        </div>

        <div>
          <h4 className="font-bold uppercase text-xs tracking-widest opacity-50 mb-4">{content.footer_menu_title || 'روابط'}</h4>
          <ul className="space-y-2 opacity-80 text-sm">
            {quickLinks.map((item: any, idx: number) => (
              <li key={`${item?.name || 'link'}-${idx}`}>
                <a
                  href={toStorefrontUrl(item?.href || item?.url || '/')}
                  target="_top"
                  rel="noreferrer"
                  className="hover:opacity-100 transition"
                >
                  {item?.name || item?.label || item?.title || 'رابط'}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold uppercase text-xs tracking-widest opacity-50 mb-4">{content.support_menu_title || 'الدعم'}</h4>
          <ul className="space-y-2 opacity-80 text-sm">
            {defaultSupportLinks.map((item) => (
              <li key={item.href + item.name}>
                <a href={toStorefrontUrl(item.href)} target="_top" rel="noreferrer" className="hover:opacity-100 transition">
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showNewsletter && (
        <div className="max-w-7xl mx-auto px-0 pb-12 border-b border-white/10">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{content.newsletter_title || 'النشرة'}</p>
              <p className="text-sm opacity-80">{content.newsletter_desc || 'اشترك للتحديثات.'}</p>
            </div>
            <form
              className="flex gap-2 w-full md:max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = footerEmail.trim();
                if (!trimmed) return;
                if (embedded) {
                  window.parent?.postMessage?.({ type: 'STORIFY_NEWSLETTER_SUBSCRIBE', email: trimmed }, '*');
                  setFooterSubStatus('sent');
                  setFooterEmail('');
                }
              }}
            >
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => {
                  setFooterEmail(e.target.value);
                  setFooterSubStatus('idle');
                }}
                placeholder="بريدك"
                className="flex-1 rounded-lg px-4 py-2 bg-white/10 border border-white/20 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/30"
                style={{ color: textColor }}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition"
              >
                اشتراك
              </button>
            </form>
            {footerSubStatus === 'sent' ? (
              <p className="text-xs text-emerald-400 md:sr-only">تم الإرسال</p>
            ) : null}
          </div>
        </div>
      )}

      {showSocial ? (
        <div className="max-w-7xl mx-auto pb-8 text-sm opacity-50">
          {/* مكان لروابط اجتماعية لاحقاً */}
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
        <p>{copyright}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center md:justify-end">
          <a
            href={toStorefrontUrl('/policies/privacy')}
            target="_top"
            rel="noreferrer"
            className="hover:opacity-100 transition"
          >
            {content.privacy_text || 'سياسة الخصوصية'}
          </a>
          <a
            href={toStorefrontUrl('/policies/terms')}
            target="_top"
            rel="noreferrer"
            className="hover:opacity-100 transition"
          >
            {content.terms_text || 'الشروط والأحكام'}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
