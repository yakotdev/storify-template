import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useThemeConfig } from '../ThemeContext';
import { useProduct } from '../lib/storefront-api';
import { toStorefrontUrl } from '../lib/navigation';

const ProductDetailsSettingsSection: React.FC<{ section: any }> = ({ section }) => {
  const { storeId, productId, currentProduct: configProduct, onAddToCart } = useThemeConfig();
  const { product: apiProduct, loading } = useProduct(productId, storeId);
  const product = configProduct ?? apiProduct;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  const content = section?.content || {};
  const layout = content.layout || 'image_left';
  const showThumbnails = content.show_thumbnails !== 'false' && content.show_thumbnails !== false;
  const showDescription = content.show_description !== 'false' && content.show_description !== false;
  const showQuantity = content.show_quantity !== 'false' && content.show_quantity !== false;
  const showAddToCart = content.show_add_to_cart !== 'false' && content.show_add_to_cart !== false;

  React.useEffect(() => {
    if (product?.image) setSelectedImage(product.image);
  }, [product?.image]);

  const isLoading = !configProduct && loading;
  if (isLoading) {
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="animate-pulse flex gap-8">
          <div className="w-1/2 aspect-square bg-neutral-100 rounded-3xl" />
          <div className="w-1/2 space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-3/4" />
            <div className="h-6 bg-neutral-100 rounded w-1/2" />
            <div className="h-12 bg-neutral-100 rounded w-1/4" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    const hasProductId = Boolean(productId || typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('productId'));
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto text-center text-brand-primary/70">
        <p className="text-lg font-medium">
          {hasProductId ? 'المنتج غير موجود أو غير متاح.' : 'لم يُحدد منتج. انتقل من صفحة المتجر لفتح صفحة المنتج.'}
        </p>
        <a href={toStorefrontUrl('/shop')} target="_top" rel="noreferrer" className="inline-block mt-4 text-brand-accent font-bold uppercase text-sm tracking-widest border-b border-brand-accent pb-1">
          العودة للمتجر
        </a>
      </section>
    );
  }

  const images = (Array.isArray(product.images) && product.images.length > 0 ? product.images : product.image ? [product.image] : []) as string[];
  const mainImage = selectedImage || images[0] || '';

  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart({ ...product, quantity } as typeof product & { quantity: number });
  };

  const imageBlock = (
    <div className="space-y-4">
      <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-100">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-4xl font-bold">{product.name?.charAt(0) || '?'}</div>
        )}
      </div>
      {showThumbnails && images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-brand-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const detailsBlock = (
    <div className="space-y-8 text-brand-primary">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase mb-2">{product.name}</h1>
        <p className="text-brand-accent text-sm font-bold uppercase tracking-widest">{product.category}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-3xl font-extrabold">{product.price}</span>
        {product.compareAtPrice != null && product.compareAtPrice > product.price && (
          <span className="text-neutral-400 line-through text-xl">{product.compareAtPrice}</span>
        )}
      </div>
      {showDescription && product.description && (
        <p className="text-neutral-600 leading-relaxed">{product.description}</p>
      )}
      {showQuantity && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest">الكمية</span>
          <div className="flex items-center border border-neutral-200 rounded-full px-4 py-2">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-1 hover:text-brand-accent transition-colors">
              <Minus size={16} />
            </button>
            <span className="w-10 text-center font-bold">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="p-1 hover:text-brand-accent transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
      {showAddToCart && (
        <button
          type="button"
          onClick={handleAddToCart}
          className="bg-brand-primary text-white px-10 py-4 rounded-full font-bold uppercase text-sm tracking-widest hover:bg-brand-accent transition-all flex items-center gap-3"
        >
          <ShoppingBag size={20} /> أضف إلى السلة
        </button>
      )}
    </div>
  );

  const isTop = layout === 'image_top';
  const isRight = layout === 'image_right';

  return (
    <section className="py-12 md:py-20 px-6 max-w-7xl mx-auto">
      <div className={`grid gap-10 md:gap-16 items-start ${isTop ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {isTop ? (
          <>
            {imageBlock}
            {detailsBlock}
          </>
        ) : (
          <>
            {isRight ? detailsBlock : imageBlock}
            {isRight ? imageBlock : detailsBlock}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductDetailsSettingsSection;
