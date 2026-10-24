import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { LanguageContext } from '../LanguageContext';
import axiosClient from '../Api/axiosClient';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';
import SectionLink from './SectionLink';
import { CoverImage, Kicker } from './brand';
import { reveal } from '../lib/brand';
import { announceIntent } from '../lib/contactIntent';

// لوحة الفرص: أحدث ورشة بارزة، وبقية الورش صفوف قابلة للنقر بالكامل تنتهي بالتسجيل.
// البيانات من GET /forms (النماذج المنشورة فقط، الأحدث أولاً). لا يعيد الـ API تواريخ أو تصنيفات أو مدربين،
// لذا لا نعرض شيئاً من ذلك؛ «الأحدث» حقيقي لأن الترتيب من الخادم.
const SEARCH_FROM = 7; // البحث يظهر فقط حين يكثر عدد الورش

function useWorkshops() {
  const [forms, setForms] = useState([]);
  const [status, setStatus] = useState('loading');
  const load = useCallback(() => {
    let cancelled = false;
    setStatus('loading');
    axiosClient.get('/forms')
      .then((response) => {
        if (cancelled) return;
        setForms(Array.isArray(response.data.data) ? response.data.data.filter((form) => form?.slug) : []);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => load(), [load]);
  return { forms, status, retry: load };
}

const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

function Featured({ form, lang, isAr }) {
  const title = localize(form.title, lang, isAr ? 'ورشة عمل' : 'Workshop');
  const description = localize(form.description, lang);
  return (
    <motion.article {...reveal(0.05)} className="workshop-featured group">
      <Link to={`/forms/${form.slug}`} onClick={toTop} className="workshop-featured-link" aria-label={`${isAr ? 'سجّل في' : 'Register for'}: ${title}`}>
        <div className="workshop-featured-body">
          <span className="workshop-badge">{isAr ? 'الأحدث' : 'Newest'}</span>
          <h3 className="mt-4 text-2xl md:text-[2rem] font-bold text-white leading-snug line-clamp-3" dir="auto">{title}</h3>
          {description && <p className="mt-4 text-brand-gray leading-8 line-clamp-5" dir="auto">{description}</p>}
          <span className="workshop-cta mt-8">
            <span>{isAr ? 'سجّل الآن' : 'Register now'}</span>
            <FiArrowUpRight aria-hidden="true" className={isAr ? '-scale-x-100' : ''} />
          </span>
        </div>
        {/* النص أولاً (يمين العربية / يسار الإنجليزية) والصورة بجانبه */}
        <CoverImage src={resolveMediaUrl(form.image)} tone="dark" className="workshop-featured-media" imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
      </Link>
    </motion.article>
  );
}

function Row({ form, index, lang, isAr }) {
  const title = localize(form.title, lang, isAr ? 'ورشة عمل' : 'Workshop');
  const description = localize(form.description, lang);
  return (
    <motion.li {...reveal(Math.min(index, 6) * 0.06, 16)}>
      <Link to={`/forms/${form.slug}`} onClick={toTop} className="workshop-row group" aria-label={`${isAr ? 'سجّل في' : 'Register for'}: ${title}`}>
        <span className="workshop-row-index" aria-hidden="true">{String(index + 2).padStart(2, '0')}</span>
        <CoverImage src={resolveMediaUrl(form.image)} tone="dark" className="workshop-row-thumb" imgClassName="transition-transform duration-500 group-hover:scale-110" />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-orange-light transition-colors" dir="auto">{title}</span>
          {description && <span className="block mt-1.5 text-sm text-brand-gray leading-7 line-clamp-2" dir="auto">{description}</span>}
        </span>
        <span className="workshop-row-go" aria-hidden="true"><FiArrowUpRight className={isAr ? '-scale-x-100' : ''} /></span>
      </Link>
    </motion.li>
  );
}

// كيف تنضم: خطوات فعلية في الموقع، بلا وعود لا نعرف صحتها
function JoinSteps({ isAr }) {
  const steps = isAr
    ? ['اختر ورشة من القائمة', 'افتح صفحتها واقرأ تفاصيلها', 'أرسل نموذج التسجيل']
    : ['Pick a workshop from the list', 'Open its page and read the details', 'Send the registration form'];
  return (
    <motion.ol {...reveal(0.1)} className="workshop-steps">
      {steps.map((step, i) => (
        <li key={i} style={{ '--i': i }}>
          <span className="workshop-steps-num">{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </motion.ol>
  );
}

function Skeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="workshop-featured skeleton-block h-80" />
      <div className="grid gap-3">{[0, 1].map(i => <div key={i} className="skeleton-block h-24 rounded-2xl" />)}</div>
    </div>
  );
}

const UserWorkshops = () => {
  const { lang } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const { forms, status, retry } = useWorkshops();
  const [query, setQuery] = useState('');

  const [featured, ...rest] = forms;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rest;
    return rest.filter(f => `${localize(f.title, lang)} ${localize(f.description, lang)}`.toLowerCase().includes(q));
  }, [rest, query, lang]);

  const count = forms.length;
  const countLabel = isAr
    ? (count === 1 ? 'ورشة واحدة مفتوحة للتسجيل' : count === 2 ? 'ورشتان مفتوحتان للتسجيل'
      : count <= 10 ? `${count} ورش مفتوحة للتسجيل` : `${count} ورشة مفتوحة للتسجيل`)
    : `${count} ${count === 1 ? 'workshop' : 'workshops'} open for registration`;

  return (
    <section id="workshops" className="workshops-section" aria-labelledby="workshops-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <motion.div {...reveal()} className="max-w-2xl">
            <Kicker tone="dark">{isAr ? 'فرص التعلّم' : 'Learning opportunities'}</Kicker>
            <h2 id="workshops-title" className="mt-4 text-3xl md:text-[2.6rem] font-bold text-white leading-tight">
              {isAr ? 'ورش ودورات منارة المتاحة' : 'Available Manara Workshops'}
            </h2>
            <p className="mt-4 text-base md:text-lg text-brand-gray leading-relaxed">
              {isAr ? 'تصفح الورش الحالية وسجل فيها بسهولة لتبدأ رحلتك التقنية.' : 'Browse current workshops and register easily to start your tech journey.'}
            </p>
          </motion.div>
          {status === 'ready' && count > 0 && (
            <motion.p {...reveal(0.15)} className="workshop-count" aria-live="polite">
              <span className="workshop-count-dot" aria-hidden="true" />{countLabel}
            </motion.p>
          )}
        </div>

        {status === 'loading' && <><span className="sr-only" role="status">{isAr ? 'جاري تحميل الورش…' : 'Loading workshops…'}</span><Skeleton /></>}

        {status === 'error' && (
          <div className="workshop-state" role="alert">
            <p className="text-white font-bold">{isAr ? 'تعذّر جلب الورش المتاحة حالياً.' : 'We could not load the available workshops.'}</p>
            <p className="text-brand-gray text-sm mt-1">{isAr ? 'تحقق من اتصالك ثم حاول مرة أخرى.' : 'Check your connection and try again.'}</p>
            <button type="button" onClick={retry} className="workshop-cta mt-6"><FiRefreshCw aria-hidden="true" />{isAr ? 'إعادة المحاولة' : 'Try again'}</button>
          </div>
        )}

        {status === 'ready' && count === 0 && (
          <motion.div {...reveal()} className="workshop-state">
            <p className="text-white text-xl font-bold">{isAr ? 'لا توجد ورش مفتوحة للتسجيل الآن' : 'No workshops are open for registration right now'}</p>
            <p className="text-brand-gray mt-2 leading-7">{isAr ? 'تُنشر الورش الجديدة هنا فور فتح التسجيل. يمكنك سؤال الفريق عن الورش القادمة.' : 'New workshops appear here as soon as registration opens. You can ask the team about upcoming ones.'}</p>
            <SectionLink id="contact" onClick={() => announceIntent('workshop')} className="workshop-cta mt-6">{isAr ? 'اسأل عن الورش القادمة' : 'Ask about upcoming workshops'}</SectionLink>
          </motion.div>
        )}

        {status === 'ready' && count > 0 && (
          <>
            <Featured form={featured} lang={lang} isAr={isAr} />
            {rest.length > 0 && (
              <div className="mt-10">
                {rest.length + 1 >= SEARCH_FROM && (
                  <label className="workshop-search">
                    <FiSearch aria-hidden="true" />
                    <span className="sr-only">{isAr ? 'ابحث في الورش' : 'Search workshops'}</span>
                    <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={isAr ? 'ابحث باسم الورشة أو موضوعها' : 'Search by workshop name or topic'} />
                  </label>
                )}
                <ul className="workshop-rows">
                  {filtered.map((form) => <Row key={form.id ?? form.slug} form={form} index={rest.indexOf(form)} lang={lang} isAr={isAr} />)}
                </ul>
                {filtered.length === 0 && <p className="text-brand-gray text-sm py-6" role="status">{isAr ? 'لا توجد ورش تطابق بحثك.' : 'No workshops match your search.'}</p>}
              </div>
            )}
            <JoinSteps isAr={isAr} />
          </>
        )}
      </div>
    </section>
  );
};

export default UserWorkshops;
