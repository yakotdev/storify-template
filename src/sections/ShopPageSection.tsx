import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowRight,
  Plus,
} from 'lucide-react';
import type { Product } from '../constants';
import { PRODUCTS, CATEGORIES as MOCK_CATEGORIES } from '../constants';
import ProductCard from '../components/ProductCard';
import { useThemeConfig } from '../ThemeContext';
import { useCategories, useProducts } from '../lib/storefront-api';
import { toStorefrontUrl } from '../lib/navigation';

type SortKey = 'featured' | 'newest' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'المميز',
  newest: 'الأحدث',
  price_asc: 'السعر: من الأقل للأعلى',
  price_desc: 'السعر: من الأعلى للأقل',
};

function productMatchesCategory(
  p: Product,
  categoryId: string | null,
  categories: { id: string; name: string }[],
): boolean {
  if (categoryId == null || categoryId === '') return true;
  const cat = categories.find((c) => String(c.id) === String(categoryId));
  if (!cat) return true;
  if (p.categoryId != null && String(p.categoryId) === String(cat.id)) return true;
  if (p.category && cat.name && String(p.category) === String(cat.name)) return true;
  const subs = p.categories;
  if (Array.isArray(subs)) {
    for (const x of subs) {
      if (typeof x === 'string') {
        if (x === cat.id || x === cat.name) return true;
      } else if (x?.id && String(x.id) === String(cat.id)) return true;
    }
  }
  return false;
}

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }));
    case 'price_asc':
      return copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case 'price_desc':
      return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'featured':
    default:
      return copy;
  }
}

const ShopPageSection: React.FC<{ section: { content?: Record<string, unknown> } }> = ({ section }) => {
  const {
    storeId,
    store,
    products: configProducts,
    categories: configCategories,
    onAddToCart,
    onQuickView,
    onToggleWishlist,
    wishlist,
    settings,
  } = useThemeConfig();
  const content = section?.content || {};

  const kicker = (content.kicker as string) || 'المجموعة';
  const title = (content.title as string) || 'تسوق الكل';
  const subtitle =
    (content.subtitle as string) ||
    'استكشف مجموعتنا المختارة من الأثاث المعماري والديكور البسيط المصمم للمعيشة الحديثة.';
  const itemsPerRow = Number(content.items_per_row) || 4;
  /** مطابق tempcode Shop: بدون شريط فلاتر/ترتيب إلا إذا تُفعّل صراحةً */
  const showAdvancedToolbar =
    content.show_advanced_toolbar === true || String(content.show_advanced_toolbar).toLowerCase() === 'true';
  const showNewsletter =
    content.show_newsletter === true || String(content.show_newsletter).toLowerCase() === 'true';
  const newsletterTitle = (content.newsletter_title as string) || 'احصل على إلهام التصميم في بريدك';
  const newsletterSubtitle =
    (content.newsletter_subtitle as string) ||
    'انضم إلى مجتمعنا واحصل على وصول حصري للمجموعات الجديدة، ونصائح التصميم الداخلي، والعروض الخاصة.';

  const currencyLabel =
    store?.currency === 'USD' || store?.currency === 'EUR' ? String(store.currency) : 'ر.س';

  const apiProducts = useProducts(storeId, 200);
  const apiCategories = useCategories(storeId, 100);

  const baseProducts: Product[] = useMemo(() => {
    if (Array.isArray(configProducts) && configProducts.length > 0) return configProducts;
    if (storeId) return apiProducts;
    if (apiProducts.length > 0) return apiProducts;
    return PRODUCTS;
  }, [configProducts, storeId, apiProducts]);

  const categories = useMemo((): { id: string; name: string }[] => {
    if (Array.isArray(configCategories) && configCategories.length > 0) {
      return configCategories.map((c: { id?: string; name?: string }) => ({
        id: String(c.id ?? ''),
        name: String(c.name ?? ''),
      })).filter((c) => c.id && c.name);
    }
    if (apiCategories.length > 0) {
      return apiCategories.map((c) => ({ id: String(c.id), name: String(c.name ?? '') })).filter((c) => c.name);
    }
    return MOCK_CATEGORIES.map((c) => ({ id: String(c.id), name: c.name }));
  }, [configCategories, apiCategories]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('featured');
  const [priceMaxCap, setPriceMaxCap] = useState(5000);
  const [priceRange, setPriceRange] = useState(5000);
  const [visibleCount, setVisibleCount] = useState(8);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const maxP = Math.max(500, ...baseProducts.map((p) => Number(p.price) || 0));
    const cap = Math.ceil(maxP / 50) * 50;
    setPriceMaxCap(cap);
    setPriceRange((r) => (r > cap ? cap : r));
  }, [baseProducts]);

  useEffect(() => {
    setVisibleCount(8);
  }, [activeCategoryId, sortKey, priceRange]);

  const syncCategoryFromUrl = useCallback(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('category');
      if (!q) {
        setActiveCategoryId(null);
        return;
      }
      const byId = categories.find((c) => String(c.id) === q);
      if (byId) {
        setActiveCategoryId(String(byId.id));
        return;
      }
      const byName = categories.find((c) => c.name === q);
      if (byName) setActiveCategoryId(String(byName.id));
    } catch {
      /* noop */
    }
  }, [categories]);

  useEffect(() => {
    syncCategoryFromUrl();
    window.addEventListener('popstate', syncCategoryFromUrl);
    return () => window.removeEventListener('popstate', syncCategoryFromUrl);
  }, [syncCategoryFromUrl]);

  const setCategoryAndUrl = (id: string | null) => {
    setActiveCategoryId(id);
    try {
      const u = new URL(window.location.href);
      if (id) u.searchParams.set('category', id);
      else u.searchParams.delete('category');
      window.history.replaceState({}, '', u.pathname + u.search + u.hash);
    } catch {
      /* noop */
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = baseProducts.filter((p) => {
      if (q && !(String(p.name || '').toLowerCase().includes(q))) return false;
      return productMatchesCategory(p, activeCategoryId, categories) && (Number(p.price) || 0) <= priceRange;
    });
    list = sortProducts(list, sortKey);
    return list;
  }, [baseProducts, activeCategoryId, categories, priceRange, sortKey, searchQuery]);

  const displayedProducts = showAdvancedToolbar
    ? filteredProducts.slice(0, visibleCount)
    : filteredProducts;

  /** هاتف: عمودان | تابلت: 3 | سطح مكتب: حسب items_per_row */
  const gridColsLg =
    {
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
    }[itemsPerRow] || 'lg:grid-cols-4';

  const embedded = typeof window !== 'undefined' && window.parent !== window;

  const onNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed) return;
    if (embedded) {
      window.parent?.postMessage?.({ type: 'STORIFY_NEWSLETTER_SUBSCRIBE', email: trimmed }, '*');
      setNewsletterStatus('sent');
      setNewsletterEmail('');
      return;
    }
    setNewsletterStatus('error');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryAndUrl(null);
    setSortKey('featured');
    setPriceRange(priceMaxCap);
  };

  const primaryRgb = settings?.primaryColor || '#0f172a';
  const accentRgb = settings?.accentColor || '#f27d26';

  return (
    <div className="pt-8 pb-24 bg-white text-slate-900">
      {/* مطابق لـ themes/tempcode Shop: عنوان، وصف، بحث، فلاتر أقسام كبills */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 mb-4">{title}</h1>
          <p className="text-slate-500 max-w-2xl mx-auto mb-8">{subtitle}</p>
          <div className="max-w-md mx-auto relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المنتجات..."
              className="w-full py-3 px-6 pe-12 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            />
            <div className="absolute end-4 top-3.5 text-slate-400 pointer-events-none">
              <Search size={20} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            type="button"
            onClick={() => setCategoryAndUrl(null)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${
              activeCategoryId == null
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryAndUrl(c.id)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition ${
                activeCategoryId === c.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {showAdvancedToolbar ? (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 text-sm text-slate-500">
            <p>عرض {filteredProducts.length} منتج</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide hover:bg-slate-50"
              >
                <Filter size={16} /> فلاتر متقدمة
              </button>
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer py-1 text-slate-600">
                  <span className="text-xs font-bold">ترتيب: {SORT_LABELS[sortKey]}</span>
                  <ChevronDown size={14} className="shrink-0" />
                </div>
                <div className="absolute top-full end-0 mt-2 w-56 bg-white shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-100">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSortKey(k)}
                      className={`w-full text-right py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                        sortKey === k ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {SORT_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 min-h-[400px]">
        {displayedProducts.length > 0 ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsLg} gap-10`}>
            {showAdvancedToolbar ? (
              <AnimatePresence mode="popLayout">
                {displayedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ProductCard
                      product={product}
                      onQuickView={onQuickView || (() => {})}
                      onAddToCart={onAddToCart || (() => {})}
                      onToggleWishlist={onToggleWishlist || (() => {})}
                      isWishlisted={wishlist?.some((p) => p.id === product.id) || false}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={onQuickView || (() => {})}
                  onAddToCart={onAddToCart || (() => {})}
                  onToggleWishlist={onToggleWishlist || (() => {})}
                  isWishlisted={wishlist?.some((p) => p.id === product.id) || false}
                />
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <p>{showAdvancedToolbar ? 'لم نجد منتجات تطابق البحث أو الفلاتر.' : 'لا توجد منتجات مطابقة للبحث.'}</p>
            {showAdvancedToolbar ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm font-bold text-slate-700 underline underline-offset-4"
              >
                إعادة تعيين الفلاتر
              </button>
            ) : null}
          </div>
        )}

        {showAdvancedToolbar && visibleCount < filteredProducts.length && (
          <div className="mt-24 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + 8)}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full border border-neutral-200 flex items-center justify-center text-brand-primary transition-all duration-500 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-white">
                <Plus size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">عرض المزيد</span>
            </button>
          </div>
        )}
      </section>

      {/* Newsletter */}
      {showNewsletter && (
        <section className="max-w-7xl mx-auto px-6 mt-32">
          <div
            className="rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-white"
            style={{ backgroundColor: primaryRgb }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none opacity-40"
              style={{ backgroundColor: accentRgb }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6 max-w-xl text-center md:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-90" style={{ color: accentRgb }}>
                  النشرة البريدية
                </p>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase leading-none">
                  {newsletterTitle}
                </h2>
                <p className="text-white/70 text-lg">{newsletterSubtitle}</p>
              </div>
              <div className="w-full max-w-md">
                <form className="relative group" onSubmit={onNewsletterSubmit}>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="عنوان بريدك الإلكتروني"
                    className="w-full bg-white/10 border border-white/20 rounded-full py-5 px-8 md:py-6 md:px-10 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute left-2 top-2 bottom-2 bg-white text-brand-primary px-6 md:px-8 rounded-full font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 hover:opacity-95"
                    style={{ color: primaryRgb }}
                  >
                    اشترك <ArrowRight size={14} />
                  </button>
                </form>
                {newsletterStatus === 'sent' ? (
                  <p className="text-[11px] text-white/90 mt-4 text-center md:text-right">تم تسجيل بريدك.</p>
                ) : null}
                <p className="text-[10px] text-white/40 mt-6 text-center md:text-right font-bold uppercase tracking-widest">
                  بالاشتراك، أنت توافق على سياسة الخصوصية الخاصة بنا.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter drawer (RTL: من يمين الشاشة) */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end" dir="rtl">
            <motion.button
              type="button"
              aria-label="إغلاق"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm border-0 cursor-pointer p-0"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full max-w-md bg-white h-full p-8 md:p-10 shadow-2xl overflow-y-auto text-brand-primary"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-extrabold tracking-tighter uppercase">الفلاتر</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest">الفئات</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryAndUrl(null)}
                      className={`px-5 py-2 border rounded-full text-xs font-bold transition-all ${
                        activeCategoryId == null
                          ? 'bg-brand-primary text-white border-transparent'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                      style={activeCategoryId == null ? { backgroundColor: primaryRgb } : undefined}
                    >
                      الكل
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryAndUrl(c.id)}
                        className={`px-5 py-2 border rounded-full text-xs font-bold transition-all ${
                          activeCategoryId === c.id
                            ? 'text-white border-transparent'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                        style={
                          activeCategoryId === c.id
                            ? { backgroundColor: primaryRgb, borderColor: primaryRgb }
                            : undefined
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest">
                    نطاق السعر (حتى {Math.min(priceRange, priceMaxCap)} {currencyLabel})
                  </h4>
                  <input
                    type="range"
                    min={0}
                    max={priceMaxCap}
                    step={priceMaxCap > 2000 ? 100 : 50}
                    value={Math.min(priceRange, priceMaxCap)}
                    onChange={(e) => setPriceRange(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-primary h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: accentRgb }}
                  />
                  <div className="flex justify-between text-[11px] font-bold text-neutral-500">
                    <span>0</span>
                    <span>{priceMaxCap}+ {currencyLabel}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest">ترتيب حسب</h4>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <label
                      key={k}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSortKey(k)}
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded-full shrink-0 transition-colors ${
                          sortKey === k ? 'border-brand-accent bg-brand-accent' : 'border-neutral-200 group-hover:border-brand-accent'
                        }`}
                        style={
                          sortKey === k
                            ? { borderColor: accentRgb, backgroundColor: accentRgb }
                            : undefined
                        }
                      />
                      <span
                        className={`text-sm transition-colors ${
                          sortKey === k ? 'text-brand-primary font-bold' : 'text-neutral-600 group-hover:text-brand-primary'
                        }`}
                      >
                        {SORT_LABELS[k]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full text-white py-4 rounded-full font-bold uppercase text-xs tracking-widest transition-all hover:opacity-95"
                  style={{ backgroundColor: primaryRgb }}
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPageSection;
