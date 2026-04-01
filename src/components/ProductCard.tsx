import React from 'react';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../constants';
import { useThemeConfig } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';

interface ProductCardProps {
  product: Product;
  /** اختياري — تصميم tempcode لا يعرض زر عرض سريع */
  onQuickView?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

/** مطابق لشبكة المنتجات في themes/tempcode/pages/store/Shop.tsx */
function toRadiusCss(value: unknown): string {
  if (value == null || value === '') return '12px';
  if (typeof value === 'number') return `${value}px`;
  const s = String(value).trim();
  if (s === 'none' || s === '0px') return '0px';
  if (s === 'sm' || s === '4px') return '4px';
  if (s === 'md' || s === '8px') return '8px';
  if (s === 'lg' || s === '16px') return '16px';
  if (s === 'full' || s === '24px') return '24px';
  return s || '12px';
}

function formatPriceValue(amount: number, currency?: string): string {
  const cur = (currency || 'SAR').toUpperCase();
  const code = cur === 'USD' || cur === 'EUR' ? cur : 'SAR';
  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${cur}`;
  }
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}) => {
  const { settings, store } = useThemeConfig();
  const primary = String(settings?.primaryColor || '#0f172a').trim() || '#0f172a';
  const radius = toRadiusCss(settings?.borderRadius);
  const currency = store?.currency || 'SAR';
  const priceNum = Number(product.price);
  const compareNum =
    product.compareAtPrice != null ? Number(product.compareAtPrice) : undefined;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const goProduct = () => {
    const url = toStorefrontUrl(`/product/${product.id}`);
    try {
      if (window.top && window.top !== window) window.top.location.href = url;
      else window.location.href = url;
    } catch {
      window.location.href = url;
    }
  };

  return (
    <div
      className="group bg-white overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 relative"
      style={{ borderRadius: radius }}
    >
      <div
        className="h-80 overflow-hidden bg-slate-100 relative cursor-pointer"
        role="presentation"
        onClick={goProduct}
      >
        {product.image && String(product.image).trim() !== '' ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition duration-700 transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-2xl" aria-hidden>
            {product.name?.charAt(0) || '?'}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onToggleWishlist(product);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-md z-10 transition hover:scale-110 ${
            isWishlisted ? 'bg-white text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500'
          }`}
          aria-label="مفضلة"
        >
          <Heart className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onAddToCart(product);
          }}
          className="absolute bottom-4 right-4 bg-white text-slate-900 p-3 rounded-full shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 hover:bg-slate-900 hover:text-white z-10"
          aria-label="أضف للسلة"
        >
          <ShoppingBag className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="p-6 text-right">
        <p className="text-xs font-bold uppercase opacity-40 mb-2 tracking-widest text-slate-600">{product.category}</p>
        <a
          href={toStorefrontUrl(`/product/${product.id}`)}
          target="_top"
          rel="noreferrer"
          className="block font-bold text-xl text-slate-900 mb-2 truncate hover:text-indigo-600 transition"
        >
          {product.name}
        </a>
        <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
          <span className="font-bold text-lg" style={{ color: primary }}>
            {formatPriceValue(priceNum, currency)}
          </span>
          {compareNum != null && compareNum > priceNum && (
            <span className="text-sm text-slate-400 line-through">
              {formatPriceValue(compareNum, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
