import React from 'react';
import { useThemeConfig } from '../ThemeContext';
import HtmlContent from '../components/HtmlContent';
import { normalizeLinkPath, toStorefrontUrl } from '../lib/navigation';

/**
 * مطابق themes/tempcode/pages/store/StoreFront.tsx — case 'HERO' (بطل واحد، زر إلى /shop)
 */
const HeroSliderSection: React.FC<{ section: any }> = ({ section }) => {
  const { settings, t } = useThemeConfig();
  const content = section?.content || {};

  const primaryStyle = { backgroundColor: settings?.primaryColor || '#0f172a', color: '#ffffff' };

  const tf = (key: string, fallbackAr: string) => {
    const v = t(key);
    return v && v !== key ? v : fallbackAr;
  };

  const heroAlign = content?.alignment || 'left';
  const heroBoxPosition = heroAlign === 'center' ? 'mx-auto' : heroAlign === 'right' ? 'ml-auto' : 'mr-auto';
  const heroTextAlign = heroAlign === 'center' ? 'center' : heroAlign === 'right' ? 'right' : 'left';

  const rawOverlay = content.overlayOpacity ?? content.overlay_opacity;
  const overlayOpacity =
    typeof rawOverlay === 'number' && !Number.isNaN(rawOverlay)
      ? Math.min(1, Math.max(0, rawOverlay))
      : Math.min(1, Math.max(0, parseFloat(String(rawOverlay ?? '')) || 0.1));

  const buttonLabel =
    (typeof content.buttonText === 'string' && content.buttonText.trim() !== ''
      ? content.buttonText
      : typeof content.button_text === 'string' && content.button_text.trim() !== ''
        ? content.button_text
        : null) || tf('shop_now', 'تسوق الآن');

  const shopHref = toStorefrontUrl(normalizeLinkPath(content?.link, '/shop'));

  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden bg-slate-50 flex">
      <div className="absolute inset-0 z-0">
        {content?.image && String(content.image).trim() !== '' ? (
          <img src={content.image} className="absolute inset-0 w-full h-full object-cover" alt="Hero" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-200" aria-hidden />
        )}
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-full flex items-center">
        <div className={`max-w-2xl w-full ${heroBoxPosition}`} style={{ textAlign: heroTextAlign }}>
          <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase border border-white text-white rounded-full backdrop-blur-sm">
            {tf('home', 'الرئيسية')}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
            <HtmlContent html={content?.title} tag="span" fallback={tf('hero_title', 'أناقة بلا حدود')} />
          </h1>
          <p
            className="text-xl text-slate-100 mb-8 max-w-lg leading-relaxed drop-shadow-md"
            style={{ marginLeft: heroAlign === 'center' ? 'auto' : 0, marginRight: heroAlign === 'center' ? 'auto' : 0 }}
          >
            <HtmlContent html={content?.subtitle} tag="span" fallback={tf('hero_subtitle', 'اكتشف أحدث صيحات الموضة والمنتجات الحصرية لدينا.')} />
          </p>
          <a href={shopHref} target="_top" rel="noreferrer">
            <button
              type="button"
              className="px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1"
              style={{ ...primaryStyle, borderRadius: '9999px' }}
            >
              {buttonLabel}
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSliderSection;
