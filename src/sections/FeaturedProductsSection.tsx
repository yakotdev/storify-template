import React, { useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../constants';
import { PRODUCTS } from '../constants';
import { useThemeConfig } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';
import { useCategories, useProducts } from '../lib/storefront-api';
import { filterProductsByCategoryScope, parseCategoryScope } from '../lib/category-scope';

const FeaturedProductsSection: React.FC<{ section: any }> = ({ section }) => {
  const {
    storeId,
    products: configProducts,
    categories: configCategories,
    onAddToCart,
    settings,
  } = useThemeConfig();
  const primaryColor = settings?.primaryColor || '#4f46e5';
  const content = section?.content || {};
  const itemsPerRow = Number(content.items_per_row) || 4;
  const bgColor = content.bg_color || '#ffffff';
  const paddingTop = content.padding_top || '100px';
  const paddingBottom = content.padding_bottom || '100px';

  const apiProducts = useProducts(storeId, Math.max(itemsPerRow * 4, 24));
  const apiCategories = useCategories(storeId, 100);
  const categoriesMaster =
    Array.isArray(configCategories) && configCategories.length > 0 ? configCategories : apiCategories;

  const baseProducts = useMemo((): Product[] => {
    if (Array.isArray(configProducts) && configProducts.length > 0) return configProducts;
    if (storeId) return apiProducts;
    if (apiProducts.length > 0) return apiProducts;
    return PRODUCTS;
  }, [configProducts, storeId, apiProducts]);

  const scopeFiltered = useMemo(
    () =>
      filterProductsByCategoryScope(
        baseProducts,
        parseCategoryScope(content.category_scope),
        categoriesMaster,
      ),
    [baseProducts, content.category_scope, categoriesMaster],
  );

  const products = useMemo(() => scopeFiltered, [scopeFiltered]);

  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4'
  }[itemsPerRow] || 'lg:grid-cols-4';

  const productsToRender = products.slice(0, Math.max(itemsPerRow * 2, 4));
  const isEmpty = productsToRender.length === 0;

  return (
    <section style={{ backgroundColor: bgColor, paddingTop, paddingBottom }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              {content.subtitle || 'وصل حديثاً'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 relative inline-block">
              {content.title || 'منتجات مميزة'}
              <span className="block h-1 w-20 mt-3 rounded-full" style={{ backgroundColor: primaryColor }} />
            </h2>
          </div>
          <a
            href={toStorefrontUrl('/shop')}
            target="_top"
            rel="noreferrer"
            className="hidden md:inline-block font-bold text-sm border-b-2 border-slate-200 hover:border-slate-900 pb-1 transition text-slate-700"
          >
            المتجر ←
          </a>
        </div>
        {isEmpty ? (
          <div className="py-16 text-center text-brand-primary/60">
            <p className="text-sm font-medium uppercase tracking-widest">لا توجد منتجات لعرضها حالياً</p>
            <p className="text-xs mt-2">أضف منتجات من لوحة التحكم لتظهر هنا</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-10`}>
            {productsToRender.map((product) => {
              const image = (Array.isArray(product.images) && product.images[0]) || product.image;
              const hasImage = typeof image === 'string' && image.trim() !== '';
              return (
                <article
                  key={product.id}
                  className="group bg-white overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 rounded-2xl"
                >
                  <a
                    href={toStorefrontUrl(`/product/${encodeURIComponent(String(product.id))}`)}
                    target="_top"
                    rel="noreferrer"
                    className="block h-80 overflow-hidden bg-slate-100 relative"
                  >
                    {hasImage ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200" aria-hidden />
                    )}
                  </a>
                  <div className="p-6">
                    <p className="text-xs font-bold uppercase opacity-40 mb-2 tracking-widest">
                      {product.category || 'منتج'}
                    </p>
                    <a
                      href={toStorefrontUrl(`/product/${encodeURIComponent(String(product.id))}`)}
                      target="_top"
                      rel="noreferrer"
                      className="block font-bold text-xl text-slate-900 mb-2 truncate hover:text-indigo-600 transition"
                    >
                      {product.name}
                    </a>
                    <div className="flex items-center justify-between mt-4 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          {product.price} ر.س
                        </span>
                        {product.compareAtPrice != null && Number(product.compareAtPrice) > Number(product.price) ? (
                          <span className="text-sm text-slate-400 line-through">{product.compareAtPrice} ر.س</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart?.(product as Product)}
                        className="p-3 rounded-full bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white transition"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
