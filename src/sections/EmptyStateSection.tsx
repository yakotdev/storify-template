import React from 'react';
import { motion } from 'motion/react';
import { PackageOpen } from 'lucide-react';
import { toStorefrontUrl } from '../lib/navigation';

const EmptyStateSection: React.FC<{ section: any }> = ({ section }) => {
  const content = section?.content || {};
  
  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center space-y-8 bg-neutral-50 rounded-[3rem] py-24 px-12"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-neutral-200 shadow-xl">
            <PackageOpen size={48} />
          </div>
          <div className="space-y-4 text-brand-primary">
            <h2 className="text-4xl font-extrabold tracking-tighter uppercase">
              {content.title || 'لا توجد نتائج'}
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-lg">
              {content.desc || 'عذراً، لم نتمكن من العثور على ما تبحث عنه. جرب تغيير كلمات البحث أو استكشاف مجموعتنا الكاملة.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            <a 
              href={toStorefrontUrl('/shop')}
              target="_top"
              rel="noreferrer"
              className="bg-brand-primary text-white px-12 py-5 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-all shadow-xl shadow-black/5"
            >
              استكشف المجموعة
            </a>
            <a 
              href={toStorefrontUrl('/')}
              target="_top"
              rel="noreferrer"
              className="border-b-2 border-brand-primary pb-2 font-bold uppercase text-xs tracking-widest hover:text-brand-accent hover:border-brand-accent transition-all"
            >
              العودة للرئيسية
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EmptyStateSection;
