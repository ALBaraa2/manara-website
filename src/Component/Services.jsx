import React, { useContext, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUpRight, FiBriefcase, FiCode, FiMonitor, FiUsers } from 'react-icons/fi';
import { LanguageContext } from '../LanguageContext';
import SectionLink from './SectionLink';
import { Kicker } from './brand';
import { EASE, reveal } from '../lib/brand';
import { announceIntent } from '../lib/contactIntent';

// مستكشف الخدمات: قائمة الخدمات الأربع (من translations.servicesCards، بالترتيب نفسه) ولوحة تعرض المختارة
// برسم خطي خاص بها يُرسم عند اختيارها، ووصفها الفعلي، وخطوة تالية مناسبة:
// الورش ← قسم الورش المتاحة، والبقية ← نموذج التواصل مع تحديد الخدمة في موضوع الرسالة.
const SERVICES = [
  { icon: FiCode, art: 'code', next: 'contact' },
  { icon: FiUsers, art: 'people', next: 'contact' },
  { icon: FiMonitor, art: 'screen', next: 'workshops' },
  { icon: FiBriefcase, art: 'field', next: 'contact' },
];

// رسوم خطية بسيطة بألوان الهوية؛ الخطوط تُرسم تدريجياً (stroke-dashoffset) والنقاط البرتقالية تضيء أخيراً
function ServiceArt({ kind }) {
  const line = { className: 'service-art-line', pathLength: 1 };
  return (
    <svg viewBox="0 0 240 160" className="service-art" aria-hidden="true" focusable="false">
      {kind === 'code' && <>
        <path {...line} d="M74 52 L46 80 L74 108" />
        <path {...line} d="M166 52 L194 80 L166 108" />
        <path {...line} d="M132 40 L108 120" />
        <circle className="service-art-dot" cx="194" cy="80" r="5" />
      </>}
      {kind === 'people' && <>
        <circle {...line} cx="70" cy="64" r="16" />
        <circle {...line} cx="170" cy="64" r="16" />
        <circle {...line} cx="120" cy="104" r="16" />
        <path {...line} d="M84 72 L108 96 M156 72 L132 96 M86 64 L154 64" />
        <circle className="service-art-dot" cx="120" cy="104" r="5" />
      </>}
      {kind === 'screen' && <>
        <rect {...line} x="50" y="34" width="140" height="86" rx="8" />
        <path {...line} d="M100 136 L140 136 M120 120 L120 136" />
        <path {...line} d="M70 58 L130 58 M70 76 L150 76 M70 94 L112 94" />
        <circle className="service-art-dot" cx="164" cy="96" r="5" />
      </>}
      {kind === 'field' && <>
        <rect {...line} x="56" y="70" width="64" height="50" rx="6" />
        <path {...line} d="M74 70 L74 60 L102 60 L102 70" />
        <path {...line} d="M120 108 L148 108 L148 86 L172 86 L172 62 L196 62" />
        <circle className="service-art-dot" cx="196" cy="62" r="5" />
      </>}
    </svg>
  );
}

function Services() {
  const { t, lang } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const cards = t.servicesCards || [];
  const [active, setActive] = useState(0);
  const tabs = useRef([]);
  const uid = useId().replace(/:/g, '');

  // لوحة المفاتيح: الأسهم (الاتجاهان) و Home/End تتنقل بين الخدمات
  const onKeyDown = (event) => {
    const keys = { ArrowDown: 1, ArrowUp: -1, ArrowRight: isAr ? -1 : 1, ArrowLeft: isAr ? 1 : -1 };
    let next = null;
    if (event.key in keys) next = (active + keys[event.key] + cards.length) % cards.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cards.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  const service = SERVICES[active] || SERVICES[0];
  const item = cards[active] || {};

  return (
    <section id="services" className="services-section" aria-labelledby="services-title">
      <div className="container mx-auto px-6 md:px-10" dir={isAr ? 'rtl' : 'ltr'}>
        {/* grid-cols-1 = minmax(0,1fr): بدونها يتمدد العمود على الهاتف بعرض شريط الخدمات القابل للتمرير */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <motion.div {...reveal()}>
              <Kicker tone="light">{isAr ? 'ما نقدّمه' : 'What we offer'}</Kicker>
              <h2 id="services-title" className="mt-4 text-3xl md:text-[2.6rem] font-bold text-brand-purple leading-tight">{t.servicesTitle}</h2>
              <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed">{t.servicesDesc}</p>
            </motion.div>

            <motion.div {...reveal(0.1)} role="tablist" aria-orientation="vertical" aria-label={isAr ? 'الخدمات' : 'Services'} className="service-tabs" onKeyDown={onKeyDown}>
              {cards.map((card, i) => {
                const Icon = SERVICES[i]?.icon;
                const selected = i === active;
                return (
                  <button
                    key={i}
                    ref={el => { tabs.current[i] = el; }}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`${uid}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={`service-tab${selected ? ' is-active' : ''}`}
                  >
                    <span className="service-tab-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    {Icon && <Icon className="service-tab-icon" aria-hidden="true" />}
                    <span className="service-tab-label">{card.title}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>

          <motion.div {...reveal(0.15)} className="lg:col-span-7">
            <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} className="service-panel">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="service-panel-inner"
                >
                  <div className="service-panel-art"><ServiceArt kind={service.art} /></div>
                  <p className="service-panel-count" aria-hidden="true">{String(active + 1).padStart(2, '0')} <span>/ {String(cards.length).padStart(2, '0')}</span></p>
                  <h3 className="mt-2 text-2xl md:text-3xl font-bold text-brand-purple">{item.title}</h3>
                  <p className="mt-4 text-gray-600 text-base md:text-lg leading-8 max-w-xl">{item.desc}</p>
                  {service.next === 'workshops' ? (
                    <SectionLink id="workshops" className="service-cta">
                      {isAr ? 'تصفّح الورش المتاحة' : 'Browse available workshops'}
                      <FiArrowUpRight aria-hidden="true" className={isAr ? '-scale-x-100' : ''} />
                    </SectionLink>
                  ) : (
                    <SectionLink id="contact" onClick={() => announceIntent({ topic: 'service', label: item.title })} className="service-cta">
                      {isAr ? 'اسأل عن هذه الخدمة' : 'Ask about this service'}
                      <FiArrowUpRight aria-hidden="true" className={isAr ? '-scale-x-100' : ''} />
                    </SectionLink>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Services;
