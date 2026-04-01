import React from 'react';
import { motion } from 'motion/react';
import { CATEGORIES } from '../constants';
import { useThemeConfig } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';
import { useCategories } from '../lib/storefront-api';
import { applyCategoryScope, parseCategoryScope } from '../lib/category-scope';

const CategoriesSection: React.FC<{ section: any }> = ({ section }) => {
  const { storeId, settings, categories: configCategories } = useThemeConfig();
  const content = section?.content || {};
  const rawRadius = settings?.borderRadius;
  const borderRadius = typeof rawRadius === 'string' ? rawRadius : `${Number(rawRadius) || 24}px`;
  const grayscale = settings?.grayscale || false;
  const displayStyle = content.layout_style || content.style || 'grid';
  const paddingTop = content.padding_top || '80px';
  const paddingBottom = content.padding_bottom || '80px';
  const flipLayout = content.flip_layout === 'true' || content.flip_layout === true;
  const apiCategories = useCategories(storeId, 100);
  const scope = parseCategoryScope(content.category_scope);
  const baseCategories =
    Array.isArray(configCategories) && configCategories.length > 0
      ? configCategories
      : storeId
        ? apiCategories
        : apiCategories.length > 0
          ? apiCategories
          : CATEGORIES;
  const categories = applyCategoryScope(baseCategories, scope);

  const renderContent = () => {
    switch (displayStyle) {
      case 'bento':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-[800px]">
            {categories.slice(0, 4).map((cat, i) => (
              <a
                href={toStorefrontUrl(`/shop?category=${encodeURIComponent(cat.id || cat.name || '')}`)}
                target="_top"
                rel="noreferrer"
                key={cat.id}
                className={`group relative overflow-hidden cursor-pointer block ${
                  i === 0 ? 'md:col-span-2 md:row-span-2' : 
                  i === 1 ? 'md:col-span-2 md:row-span-1' : 
                  'md:col-span-1 md:row-span-1'
                }`}
                style={{ borderRadius }}
              >
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${grayscale ? 'grayscale' : ''}`}
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 ${flipLayout ? 'text-left' : 'text-right'}`}>
                  <h3 className="text-2xl font-extrabold text-white tracking-tighter uppercase">{cat.name}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">{cat.count} قطعة</p>
                </div>
              </a>
            ))}
          </div>
        );
      case 'circles':
        return (
          <div className="flex flex-wrap justify-center gap-12">
            {categories.map((cat, i) => (
              <a
                href={toStorefrontUrl(`/shop?category=${encodeURIComponent(cat.id || cat.name || '')}`)}
                target="_top"
                rel="noreferrer"
                key={cat.id}
                className="group flex flex-col items-center gap-6"
              >
                <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-accent transition-all duration-500 p-2">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className={`w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110 ${grayscale ? 'grayscale' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={`text-center ${flipLayout ? 'order-first' : ''}`}>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-brand-primary">{cat.name}</h3>
                  <p className="text-brand-accent text-[10px] font-bold uppercase tracking-widest mt-1">{cat.count} قطعة</p>
                </div>
              </a>
            ))}
          </div>
        );
      case 'grid':
      default:
        /* themes/tempcode StoreFront CATEGORIES: شبكة 2×4، بطاقات h-48، طبقة داكنة ووسط */
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.a
                href={toStorefrontUrl(`/shop?category=${encodeURIComponent(cat.id || cat.name || '')}`)}
                target="_top"
                rel="noreferrer"
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group relative h-48 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                style={{ borderRadius }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className={`w-full h-full object-cover transition duration-500 group-hover:scale-110 ${grayscale ? 'grayscale' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200" aria-hidden />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition flex items-center justify-center px-2">
                  <span className="text-white font-bold text-xl uppercase tracking-widest text-center">
                    {cat.name}
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        );
    }
  };

  const isEmpty = categories.length === 0;
  const isGridLayout = displayStyle !== 'bento' && displayStyle !== 'circles';

  return (
    <section 
      className="max-w-7xl mx-auto px-6"
      style={{ paddingTop, paddingBottom }}
    >
      {isGridLayout ? (
        <h2 className="text-3xl font-bold mb-10 text-center text-slate-900">
          {content.title || 'تسوق حسب القسم'}
        </h2>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
            <h2 className="text-3xl font-bold text-center sm:text-right text-slate-900 w-full sm:w-auto">
              {content.title || 'الأقسام'}
            </h2>
            <a
              href={toStorefrontUrl('/shop')}
              target="_top"
              rel="noreferrer"
              className="hidden md:inline-block font-bold text-sm border-b-2 border-slate-200 hover:border-slate-900 pb-1 transition text-slate-700"
            >
              المتجر ←
            </a>
          </div>
          {content.subtitle ? (
            <p className="text-center text-slate-500 mb-10 text-sm">{content.subtitle}</p>
          ) : null}
        </>
      )}

      {isEmpty ? (
        <div className="col-span-full text-center text-slate-400 py-10">
          <p className="text-sm">لا توجد تصنيفات</p>
        </div>
      ) : (
        renderContent()
      )}
    </section>
  );
};

export default CategoriesSection;
