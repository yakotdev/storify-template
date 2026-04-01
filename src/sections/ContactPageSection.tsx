import React, { useState } from 'react';
import { useThemeConfig } from '../ThemeContext';

/** مطابق لـ themes/tempcode/pages/store/Contact.tsx */
const ContactPageSection: React.FC<{ section: unknown }> = () => {
  const { store, settings } = useThemeConfig();
  const primary = String(settings?.primaryColor || '#0f172a').trim() || '#0f172a';
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const embedded = typeof window !== 'undefined' && window.parent !== window;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    if (embedded) {
      window.parent?.postMessage?.(
        {
          type: 'STORIFY_CONTACT_FORM',
          payload: { ...formData, storeId: (store as { id?: string })?.id },
        },
        '*',
      );
    }
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-2 block">اتصل بنا</span>
          <h1 className="text-5xl font-black text-slate-900 mb-6">تواصل معنا</h1>
          <p className="text-xl text-slate-500 mb-10 leading-relaxed">
            هل لديك سؤال أو ترغب في التواصل؟ يسعدنا مساعدتك. املأ النموذج أو تواصل عبر البريد أو الهاتف.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">البريد الإلكتروني</h3>
                {store?.email ? (
                  <a href={`mailto:${store.email}`} className="text-slate-500 hover:text-slate-900 transition">
                    {store.email}
                  </a>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>
            </div>
            {store?.address && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">العنوان</h3>
                  <p className="text-slate-500">{store.address}</p>
                </div>
              </div>
            )}
            {store?.phone && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">الهاتف</h3>
                  <a href={`tel:${store.phone}`} className="text-slate-500 hover:text-slate-900 transition">
                    {store.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="اسمك"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">البريد</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الرسالة</label>
              <textarea
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                placeholder="كيف يمكننا مساعدتك؟"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-full font-bold text-white shadow-lg hover:opacity-95 transition"
              style={{ backgroundColor: primary }}
            >
              إرسال الرسالة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPageSection;
