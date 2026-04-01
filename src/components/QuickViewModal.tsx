import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Heart, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { Product } from '../constants';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: Product[];
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ 
  product, 
  onClose, 
  onAddToCart, 
  onToggleWishlist,
  wishlist 
}) => {
  if (!product) return null;

  const isWishlisted = wishlist.some(p => p.id === product.id);

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-30 w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-accent hover:text-white transition-all shadow-lg"
            >
              <X size={20} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 aspect-square relative bg-neutral-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-brand-primary' : 'bg-white/50'}`} />
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-right">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-brand-accent">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold mr-2 text-neutral-400">(24 مراجعة)</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">{product.category}</p>
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tighter uppercase text-brand-primary">{product.name}</h2>
                  <div className="flex items-center justify-end gap-4">
                    {product.compareAtPrice && (
                      <span className="text-xl text-neutral-300 line-through">{product.compareAtPrice} $</span>
                    )}
                    <span className="text-3xl font-black text-brand-primary">{product.price} $</span>
                  </div>
                </div>

                <p className="text-neutral-500 text-sm leading-relaxed">
                  هذا المنتج المصمم بعناية يجمع بين الوظيفة والجمال المعماري. مصنوع من مواد مستدامة عالية الجودة لضمان المتانة والأناقة الدائمة في مساحتك الخاصة.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest">اللون:</span>
                    <div className="flex gap-2">
                      {['#141414', '#E5E7EB', '#D1D5DB'].map(c => (
                        <div key={c} className="w-6 h-6 rounded-full border border-neutral-200 p-0.5 cursor-pointer">
                          <div className="w-full h-full rounded-full" style={{ backgroundColor: c }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="flex-1 bg-brand-primary text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-all flex items-center justify-center gap-3"
                  >
                    <ShoppingBag size={18} /> إضافة إلى السلة
                  </button>
                  <button 
                    onClick={() => onToggleWishlist(product)}
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all ${isWishlisted ? 'bg-brand-accent border-brand-accent text-white' : 'border-neutral-200 text-brand-primary hover:border-brand-primary'}`}
                  >
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="pt-8 border-t border-neutral-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  <div className="flex items-center gap-4">
                    <span>SKU: UMINO-001</span>
                    <span>التصنيف: {product.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
