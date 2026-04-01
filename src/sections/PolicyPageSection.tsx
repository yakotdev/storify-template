import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '../ThemeContext';

const SLUG_LABELS: Record<string, string> = {
  'return-exchange': 'سياسة الاستبدال والاسترجاع',
  privacy: 'سياسة الخصوصية',
  terms: 'الشروط والأحكام',
  shipping: 'الشحن والتوصيل',
};

function policySlugFromPath(path: string | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const normalized = path.replace(/\/+$/, '');
  const m = normalized.match(/\/policies\/([^/?#]+)/) || normalized.match(/\/policy\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const PolicyPageSection: React.FC<{ section: { content?: Record<string, unknown> } }> = ({ section }) => {
  const { path, sdkReady, t } = useThemeConfig();
  const content = section?.content || {};
  const slugOverride = typeof content.policy_slug === 'string' ? content.policy_slug.trim() : '';
  const slug = slugOverride || policySlugFromPath(path);
  const [body, setBody] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(t('policy') || 'سياسة');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!slug || !SLUG_LABELS[slug]) {
        if (mounted) {
          setBody(null);
          setTitle(t('policy') || 'سياسة');
          setLoading(false);
        }
        return;
      }
      setTitle(SLUG_LABELS[slug] || slug);
      setLoading(true);
      try {
        const sdk = typeof window !== 'undefined' ? window.StorifySDK : undefined;
        if (sdkReady && sdk?.getPolicy) {
          const pol = await sdk.getPolicy(slug);
          if (!mounted) return;
          setBody(pol?.body && String(pol.body).trim() ? String(pol.body) : null);
        } else {
          if (mounted) setBody(null);
        }
      } catch {
        if (mounted) setBody(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [slug, sdkReady, t]);

  if (!slug || !SLUG_LABELS[slug]) {
    return (
      <section className="py-20 px-6 text-center text-neutral-500">
        <p>{t('policy_not_available') || 'لم يتم تحديد صفحة سياسة صالحة.'}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-20 px-6 text-center text-neutral-400 text-sm">
        {t('loading') || 'جاري التحميل...'}
      </section>
    );
  }

  if (!body?.trim()) {
    return (
      <section className="py-20 px-6 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-black text-brand-primary mb-4">{title}</h1>
        <p className="text-neutral-500">{t('policy_not_available') || 'هذه السياسة غير متوفرة حالياً.'}</p>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-6 max-w-4xl mx-auto text-brand-primary">
      <h1 className="text-3xl md:text-4xl font-black mb-8">{title}</h1>
      <div
        className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed policy-rich-content"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <style>{`
        .policy-rich-content p { margin: 0.75em 0; line-height: 1.7; }
        .policy-rich-content ul { list-style: disc; padding-inline-start: 1.5em; margin: 0.75em 0; }
        .policy-rich-content ol { list-style: decimal; padding-inline-start: 1.5em; margin: 0.75em 0; }
        .policy-rich-content a { text-decoration: underline; }
      `}</style>
    </section>
  );
};

export default PolicyPageSection;
