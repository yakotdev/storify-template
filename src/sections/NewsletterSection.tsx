import React, { useState } from 'react';
import { useThemeConfig } from '../ThemeContext';

const NewsletterSection: React.FC<{ section: any }> = ({ section }) => {
  const { settings } = useThemeConfig();
  const primaryColor = settings?.primaryColor || '#4f46e5';
  const content = section.content || {};
  const bgColor = content.bg_color || content.backgroundColor || '#f8fafc';
  const textColor = content.text_color || '#0f172a';
  const paddingTop = content.padding_top || '96px';
  const paddingBottom = content.padding_bottom || '96px';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const embedded = typeof window !== 'undefined' && window.parent !== window;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    if (embedded) {
      window.parent?.postMessage?.({ type: 'STORIFY_NEWSLETTER_SUBSCRIBE', email: trimmed }, '*');
      setStatus('sent');
      setEmail('');
      return;
    }
    setStatus('error');
  };

  const primaryStyle = { backgroundColor: primaryColor, color: '#ffffff' };

  return (
    <section className="py-24 px-6" style={{ backgroundColor: bgColor, color: textColor, paddingTop, paddingBottom }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: textColor }}>
          {content.title || 'انضم إلى نشرتنا'}
        </h2>
        <p
          className="opacity-70 mb-10 max-w-xl mx-auto text-lg"
          style={{ color: textColor }}
        >
          {content.subtitle || 'عروض حصرية وآخر الأخبار تصل إلى بريدك.'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-lg mx-auto gap-4">
          <input
            type="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              setStatus('idle');
            }}
            placeholder="بريدك الإلكتروني"
            disabled={status === 'loading'}
            className="flex-1 px-6 py-4 rounded-full text-slate-900 focus:outline-none shadow-inner bg-white/80 focus:bg-white border border-slate-200 focus:border-slate-300 transition disabled:opacity-70"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-8 py-4 font-bold rounded-full whitespace-nowrap shadow-lg hover:shadow-xl transition disabled:opacity-70"
            style={primaryStyle}
          >
            {status === 'loading' ? 'جاري الإرسال...' : 'اشتراك'}
          </button>
        </form>
        {status === 'sent' && (
          <p className="mt-4 text-emerald-700 font-medium text-sm">تم — شكراً لك</p>
        )}
        {status === 'error' && !embedded && (
          <p className="mt-4 text-red-600 text-sm">المعاينة المحلية فقط — استخدم المتجر المضمّن للاشتراك الفعلي.</p>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
