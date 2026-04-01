import React from 'react';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { toStorefrontUrl } from '../lib/navigation';
import { useThemeConfig } from '../ThemeContext';

/** مطابق لـ themes/tempcode/pages/store/Wishlist.tsx */
const WishlistPageSection: React.FC<{ section: { content?: Record<string, unknown> } }> = () => {
  const { wishlist: ctxWishlist, onAddToCart, onToggleWishlist } = useThemeConfig();
  const wishlist = ctxWishlist ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[50vh]">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">المفضلة</h1>
        <p className="text-slate-500">عناصر محفوظة لوقت لاحق.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-slate-300" strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-4">قائمة المفضلة فارغة</p>
          <a
            href={toStorefrontUrl('/shop')}
            target="_top"
            rel="noreferrer"
            className="text-indigo-600 font-bold hover:underline"
          >
            متابعة التسوق
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {wishlist.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart || (() => {})}
              onToggleWishlist={onToggleWishlist || (() => {})}
              isWishlisted
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPageSection;
