import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { useThemeConfig } from '../ThemeContext';

type OrderResult = {
  id?: string;
  date?: string;
  status?: string;
  total?: number;
  trackingNumber?: string;
  trackingUrl?: string;
};

const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const TrackOrderPageSection: React.FC<{ section: { content?: Record<string, unknown> } }> = ({ section }) => {
  const { sdkReady, t } = useThemeConfig();
  const content = section?.content || {};
  const title = (content.title as string) || t('track_order') || 'تتبع الطلب';
  const desc = (content.subtitle as string) || t('track_order_desc') || 'أدخل رقم الطلب لمتابعة حالته.';

  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatMoney = (n: number | undefined) => {
    if (n == null || Number.isNaN(n)) return '—';
    const sdk = typeof window !== 'undefined' ? window.StorifySDK : undefined;
    if (sdk?.formatPrice) return sdk.formatPrice(n);
    return `${n}`;
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const id = orderId.trim().replace(/^#/, '');
    if (!id) return;

    setLoading(true);
    try {
      const sdk = typeof window !== 'undefined' ? window.StorifySDK : undefined;
      if (sdkReady && sdk?.getOrderById) {
        const order = await sdk.getOrderById(id);
        if (order && typeof order === 'object') {
          setResult(order as OrderResult);
        } else {
          setError(t('order_not_found') || 'لم يُعثر على الطلب.');
        }
      } else {
        setError(t('order_not_found') || 'حمّل منصة المتجر أولاً ثم أعد المحاولة.');
      }
    } catch {
      setError(t('order_not_found') || 'تعذر جلب الطلب.');
    } finally {
      setLoading(false);
    }
  };

  const isCancelled = result?.status === 'Cancelled';
  const currentStepIndex = result && !isCancelled ? steps.indexOf(String(result.status)) : -1;

  return (
    <section className="py-16 md:py-24 bg-white min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-6 text-brand-primary">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2">{title}</h1>
          <p className="text-neutral-500 text-sm">{desc}</p>
        </div>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t('enter_order_id') || 'رقم الطلب'}
            className="flex-1 px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold disabled:opacity-50"
          >
            {loading ? '...' : t('track') || 'تتبع'}
          </button>
        </form>

        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-center text-sm font-bold mb-8">{error}</div>
        ) : null}

        {result ? (
          <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 space-y-6">
            <div className="flex flex-wrap justify-between gap-4 border-b border-neutral-200 pb-6">
              <div>
                <h3 className="text-xl font-bold">طلب #{result.id}</h3>
                {result.date ? <p className="text-neutral-500 text-sm mt-1">{result.date}</p> : null}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold uppercase text-neutral-400">{t('total') || 'الإجمالي'}</p>
                <p className="text-xl font-black">{formatMoney(result.total)}</p>
              </div>
            </div>

            {isCancelled ? (
              <div className="p-4 rounded-2xl bg-red-50 text-red-800 font-bold text-sm">
                {t('order_cancelled') || 'تم إلغاء هذا الطلب.'}
              </div>
            ) : null}

            {(result.trackingNumber || result.trackingUrl) && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  {t('tracking') || 'الشحن'}
                </h4>
                {result.trackingNumber ? (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{t('tracking_number') || 'رقم التتبع'}:</span> {result.trackingNumber}
                  </p>
                ) : null}
                {result.trackingUrl ? (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm font-bold text-indigo-600 underline"
                  >
                    {t('track_shipment') || 'تتبع الشحنة'}
                  </a>
                ) : null}
              </div>
            )}

            {!isCancelled && currentStepIndex >= 0 && (
              <div className="flex justify-between gap-2 pt-4">
                {steps.map((step, i) => (
                  <div key={step} className="flex-1 text-center">
                    <div
                      className={`h-2 rounded-full mb-2 ${i <= currentStepIndex ? 'bg-brand-accent' : 'bg-neutral-200'}`}
                    />
                    <span className="text-[10px] font-bold uppercase text-neutral-500">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default TrackOrderPageSection;
