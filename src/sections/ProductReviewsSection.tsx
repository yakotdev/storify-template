import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useThemeConfig } from '../ThemeContext';

type ReviewRow = {
  id?: string;
  customerName?: string;
  rating?: number;
  comment?: string;
  date?: string;
};

const ProductReviewsSection: React.FC<{ section: { content?: Record<string, unknown> } }> = ({ section }) => {
  const { productId, sdkReady, t } = useThemeConfig();
  const content = section?.content || {};
  const title = (content.title as string) || t('reviews') || 'التقييمات';
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!productId?.trim()) {
        if (mounted) {
          setReviews([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const sdk = typeof window !== 'undefined' ? window.StorifySDK : undefined;
        if (sdkReady && sdk?.getReviews) {
          const list = await sdk.getReviews(productId);
          if (!mounted) return;
          setReviews(Array.isArray(list) ? (list as ReviewRow[]) : []);
        } else if (mounted) {
          setReviews([]);
        }
      } catch {
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [productId, sdkReady]);

  if (!productId) {
    return null;
  }

  return (
    <section className="py-16 bg-neutral-50 border-t border-neutral-100">
      <div className="max-w-3xl mx-auto px-6 text-brand-primary">
        <h2 className="text-2xl font-black mb-8">{title}</h2>
        {loading ? (
          <p className="text-neutral-400 text-sm">{t('loading') || 'جاري التحميل...'}</p>
        ) : reviews.length === 0 ? (
          <p className="text-neutral-500 text-sm">{t('no_reviews') || 'لا توجد تقييمات بعد.'}</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={r.id || `${r.customerName}-${r.date}`} className="bg-white rounded-2xl p-6 border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < (r.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}
                    />
                  ))}
                </div>
                <p className="font-bold text-sm">{r.customerName || '—'}</p>
                {r.date ? <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2">{r.date}</p> : null}
                {r.comment ? <p className="text-neutral-600 text-sm leading-relaxed">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ProductReviewsSection;
