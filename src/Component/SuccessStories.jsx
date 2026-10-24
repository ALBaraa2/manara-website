// SuccessStories.jsx (محدث ليبقى ثابتاً من اليسار لليمين مع اتجاه نصوص صحيح)

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { LanguageContext } from '../LanguageContext';
import { motion } from 'framer-motion';
import axiosClient from '../Api/axiosClient';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';

const MAX_STORIES = 6;

function SuccessStories() {
  const { lang } = useContext(LanguageContext);
  const isAr = lang === 'AR';

  const [stories, setStories] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  // GET /field-voices — القصص المنشورة فقط (تحتوي ترجمة إنجليزية تلقائية)
  const load = useCallback(() => {
    let cancelled = false;
    setStatus('loading');

    axiosClient.get('/field-voices')
      .then((response) => {
        if (cancelled) return;
        const fetched = Array.isArray(response.data.data) ? response.data.data : [];
        // نعرض أحدث 6 قصص فقط (حسب تاريخ الإنشاء، ثم المعرّف كاحتياط)
        const latest = [...fetched]
          .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || (b.id ?? 0) - (a.id ?? 0))
          .slice(0, MAX_STORIES);
        setStories(latest);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => load(), [load]);

  // القسم يظهر دائماً (رابطه في شريط التنقل يجب أن يقود إليه): أثناء التحميل، وعند الفشل مع إعادة المحاولة، وعند عدم وجود قصص

  return (
    <section id="stories" className="py-20 bg-brand-purple text-white overflow-hidden" dir="ltr">
      <div className="container mx-auto px-6 md:px-10">
        
        <div className="text-center mb-16 space-y-3">
          <div className="w-12 h-1 bg-brand-orange mx-auto rounded-full"></div>
          <h2 className="text-3xl md:text-4xl font-bold">
            {isAr ? "أصوات من الميدان" : "Voices from the Field"}
          </h2>
          <p className="text-brand-gray max-w-md mx-auto">
            {isAr ? "قصص نجاح كتبت بالتعب والأمل" : "Success stories written with hardship and hope"}
          </p>
        </div>

        {status === 'loading' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-hidden="true">
            {[0, 1, 2].map(i => <div key={i} className="skeleton-block rounded-[2rem] h-56" />)}
            <span className="sr-only" role="status">{isAr ? 'جاري تحميل القصص…' : 'Loading stories…'}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="workshop-state" role="alert" dir={isAr ? 'rtl' : 'ltr'}>
            <p className="font-bold text-white">{isAr ? 'تعذّر تحميل القصص حالياً.' : 'Stories could not be loaded right now.'}</p>
            <button type="button" onClick={load} className="state-retry mt-4"><FiRefreshCw aria-hidden="true" />{isAr ? 'إعادة المحاولة' : 'Try again'}</button>
          </div>
        )}

        {status === 'ready' && stories.length === 0 && (
          <div className="workshop-state" dir={isAr ? 'rtl' : 'ltr'}>
            <p className="text-brand-gray">{isAr ? 'لا توجد قصص منشورة بعد — ستظهر هنا قصص المتدرّبين فور نشرها.' : 'No stories yet — trainees’ stories will appear here once published.'}</p>
          </div>
        )}

        {status === 'ready' && stories.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => {
            const storyNumber = String(index + 1).padStart(2, '0');

            const quoteText = localize(story.quote, lang);
            const nameText = localize(story.name, lang);
            const roleText = localize(story.role, lang);

            return (
              <motion.div
                key={story.id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col justify-between backdrop-blur-sm hover:border-brand-orange/60 transition-all group"
              >
                {/* رقم القصة يثبت في اليمين دائماً أو اليسار حسب الرغبة، هنا جعلناه يثبت في اليمين (أو يتكيف مع اللغة باستخدام اليمين دائماً لثبات الشكل) */}
                <span className="absolute top-6 right-6 text-4xl font-black text-white/10 select-none group-hover:text-brand-orange/30 transition-colors">
                  {storyNumber}
                </span>

                <p className={`text-white/90 leading-relaxed mb-8 relative z-10 ${isAr ? 'text-right' : 'text-left'}`} dir="auto">
                  "{quoteText}"
                </p>

                <div className={`flex items-center gap-4 pt-4 border-t border-white/10 ${isAr ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                  <div className="w-12 h-12 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange-light font-bold text-lg shrink-0 overflow-hidden">
                    {story.image ? (
                      <img src={resolveMediaUrl(story.image)} alt="" loading="lazy" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      nameText?.[0] || 'ع'
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">
                      {nameText}
                    </h4>
                    <span className="text-xs text-brand-orange-light">
                      {roleText}
                    </span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>}

      </div>
    </section>
  );
}

export default SuccessStories;