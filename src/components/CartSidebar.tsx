import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../constants';
import { toStorefrontUrl } from '../lib/navigation';
import { useThemeConfig } from '../ThemeContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Product[];
  onRemove: (item: Product) => void;
}

/** مطابق لـ themes/tempcode/components/store/CartDrawer.tsx */
const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, cart, onRemove }) => {
  const { settings } = useThemeConfig();
  const primary = String(settings?.primaryColor || '#0f172a').trim() || '#0f172a';

  const total = cart.reduce((sum, item) => {
    const qty = Number((item as Product & { quantity?: number }).quantity) || 1;
    return sum + item.price * qty;
  }, 0);

  const navigateTop = (path: string) => {
    const url = toStorefrontUrl(path);
    if (typeof window !== 'undefined') {
      if (window.top && window.top !== window) {
        window.top.location.href = url;
        return;
      }
      window.location.href = url;
    }
  };
  const handleCheckout = () => {
    onClose();
    navigateTop('/checkout');
  };
  const handleViewCart = () => {
    onClose();
    navigateTop('/cart');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">سلة التسوق</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 text-xl" aria-label="إغلاق">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
                  <p className="text-slate-600">السلة فارغة</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${String(item.id)}-${idx}`} className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm font-bold" aria-hidden>
                          {item.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-sm text-slate-500">{item.category}</p>
                      <p className="font-bold text-slate-800 mt-1">{item.price}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      className="text-red-400 hover:text-red-600 p-2 shrink-0"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
                <div className="flex justify-between items-center text-slate-900">
                  <span className="text-lg font-bold">{total.toFixed(2)}</span>
                  <span className="text-sm text-slate-500">المجموع الفرعي</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center">الشحن والضرائب عند الدفع</p>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-full font-bold text-white shadow-lg hover:opacity-95 transition"
                  style={{ backgroundColor: primary }}
                >
                  إتمام الشراء <ArrowRight size={16} className="inline rotate-180 ms-1" />
                </button>
                <button
                  type="button"
                  onClick={handleViewCart}
                  className="w-full py-3 rounded-full font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition text-sm"
                >
                  عرض السلة
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
