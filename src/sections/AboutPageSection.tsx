import React from 'react';
import { useThemeConfig } from '../ThemeContext';

/** مطابق لـ themes/tempcode/pages/store/About.tsx */
const AboutPageSection: React.FC<{ section: unknown }> = () => {
  const { settings } = useThemeConfig();
  const primary = String(settings?.primaryColor || '#0f172a').trim() || '#0f172a';

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-2 block">من نحن</span>
        <h1 className="text-5xl font-black text-slate-900 mb-6">قصتنا</h1>
        <p className="text-xl text-slate-500 leading-relaxed">
          نحن نؤمن بتجربة تسوق بسيطة وواضحة، مع منتجات مختارة بعناية ودعم يضعك أولاً.
        </p>
      </div>

      <div className="bg-slate-100 rounded-3xl overflow-hidden mb-16 h-96 relative">
        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
          صورة أو فيديو عن المتجر
        </div>
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      <div className="grid md:grid-cols-2 gap-12 text-slate-600 text-lg leading-relaxed">
        <p>
          تأسس متجرنا بهدف جعل التسوق الإلكتروني أسهل: عرض واضح للمنتجات، أسعار شفافة، وتوصيل موثوق.
        </p>
        <p>
          فريقنا يعمل على اختيار المنتجات والاستماع لملاحظاتكم باستمرار. شكراً لكونكم جزءاً من رحلتنا.
        </p>
      </div>

      <div className="mt-20 border-t border-slate-200 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-black text-slate-900 mb-2" style={{ color: primary }}>
              10k+
            </div>
            <div className="font-bold text-slate-600">عملاء سعداء</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-black mb-2" style={{ color: primary }}>
              500+
            </div>
            <div className="font-bold text-slate-600">منتجات مميزة</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-black mb-2" style={{ color: primary }}>
              24/7
            </div>
            <div className="font-bold text-slate-600">دعم</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPageSection;
