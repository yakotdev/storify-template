import React from 'react';
import { User } from 'lucide-react';
import { useThemeConfig } from '../ThemeContext';
import { toStorefrontUrl } from '../lib/navigation';

const ProfilePageSection: React.FC<{ section: { content?: Record<string, unknown> } }> = ({ section }) => {
  const { t } = useThemeConfig();
  const content = section?.content || {};
  const title = (content.title as string) || t('profile') || 'حسابي';
  const desc =
    (content.subtitle as string) ||
    t('profile_theme_hint') ||
    'إدارة بياناتك وطلباتك تتم من واجهة المتجر الرئيسية.';

  return (
    <section className="py-20 md:py-28 bg-white min-h-[50vh]">
      <div className="max-w-xl mx-auto px-6 text-center text-brand-primary space-y-8">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-brand-accent">
          <User size={40} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-3">{title}</h1>
          <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
        </div>
        <a
          href={toStorefrontUrl('/profile')}
          target="_top"
          rel="noreferrer"
          className="inline-block bg-brand-primary text-white px-10 py-4 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-colors"
        >
          {t('open_profile') || 'فتح صفحة الحساب'}
        </a>
      </div>
    </section>
  );
};

export default ProfilePageSection;
