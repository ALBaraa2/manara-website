import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../LanguageContext';
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import HeroScene from './HeroScene';
import StoryFallback from './StoryFallback';
import ManaraStory from './ManaraStory';
import { manaraStory } from '../content/manaraStory';
import { storyState, progressAt, outroAt, OUTRO_AT } from '../lib/storyTimeline';

const EASE = [0.22, 1, 0.36, 1];
const LG = 1024;

function HeroSection({ ready = true }) {
  const { lang, t } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const shineRef = useRef(null);
  const [mode, setMode] = useState('3d');

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const journey = useMotionValue(0);
  const copy = manaraStory[lang];
  useEffect(() => {
    const root = sectionRef.current;
    let stops = [0];
    let travel = 1;
    let release = 1;
    // الفصول (0..4) ثم الختام (4..5): يبدأ حين تتحرر بطاقة الفصل الأخير وينتهي حين يفكّ المشهد تثبيته
    const update = () => {
      const offset = scrollYProgress.get() * travel;
      journey.set(Math.min(progressAt(offset, stops), OUTRO_AT) + outroAt(offset, release, travel));
    };
    const measure = () => {
      const top = root.getBoundingClientRect().top;
      travel = Math.max(1, root.offsetHeight - window.innerHeight);
      // محطة كل فصل: لحظة بلوغ الكاميرا والضوء حالته. الافتراضي قبيل تثبيت بطاقته بـ10% من الشاشة؛
      // الفصل الأول يحدد محطته (data-story-stop) لأنه يبدأ متداخلاً مع الواجهة ويظهر تدريجياً
      stops = [0, ...Array.from(root.querySelectorAll('[data-story-chapter]'), el =>
        el.getBoundingClientRect().top - top + window.innerHeight * Number(el.dataset.storyStop ?? -0.1))];
      const chapters = root.querySelectorAll('[data-story-chapter]');
      release = chapters.length ? chapters[chapters.length - 1].getBoundingClientRect().bottom - top - window.innerHeight : travel;
      update();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener('resize', measure);
    measure();
    const unsubscribe = scrollYProgress.on('change', update);
    return () => { observer.disconnect(); unsubscribe(); window.removeEventListener('resize', measure); };
  }, [journey, scrollYProgress, lang]);
  const background = useTransform(journey, v => `color-mix(in srgb-linear, var(--color-brand-story-dark), var(--color-story-lit) ${storyState(v).light * 100}%)`);
  // الانتقال من الواجهة إلى الحكاية على خط زمني واحد (journey) مع الكاميرا والضوء:
  // نص الواجهة مثبّت في مكانه ويذوب (يتلاشى ويرتفع قليلاً ويتشوّش كأن الكاميرا تعبره) بين 0 و0.45 من الطريق إلى الفصل الأول،
  // بينما تظهر بطاقة الفصل الأول في موضعها نفسه. مع تقليل الحركة يبقى التلاشي فقط.
  const HERO_OUT = 0.45;
  const textOpacity = useTransform(journey, [0, HERO_OUT], [1, 0]);
  const textY = useTransform(journey, [0, HERO_OUT], [0, reduceMotion ? 0 : -40]);
  const textScale = useTransform(journey, [0, HERO_OUT], [1, reduceMotion ? 1 : 1.05]);
  const textBlur = useTransform(journey, [0.1, HERO_OUT], ['blur(0px)', reduceMotion ? 'blur(0px)' : 'blur(8px)']);
  const cueOpacity = useTransform(journey, [0, 0.12], [1, 0]);

  // أين تقف المنارة على الشاشة: بجانب النص على الشاشات العريضة، وتحته على الضيقة
  // (القيم نسب من عرض/ارتفاع القسم؛ height = المسافة بين قاعدة المنارة ومصباحها)
  const getComposition = useCallback((w, h) => {
    // نفس نقطة التحول في Tailwind (lg) — تُقاس على عرض النافذة لا القسم (الذي ينقص بعرض شريط التمرير)
    if (window.matchMedia(`(min-width: ${LG}px)`).matches) return { x: isAr ? 0.25 : 0.75, y: 0.28, height: 0.5 };
    const el = textRef.current;
    const textBottom = el ? (el.offsetTop + el.offsetHeight) / h : 0.6;
    // القبة والمؤشر فوق المصباح بنحو 17% من ارتفاع المنارة، فنضع المصباح بحيث تبقى قمتها تحت النص
    const y = Math.min(Math.max((textBottom + 0.183) / 1.17, textBottom + 0.06, 0.5), 0.8);
    return { x: 0.5, y, height: Math.max(0.9 - y, 0.14) };
  }, [isAr]);

  const handleFail = useCallback(() => setMode('fallback'), []);

  const words = (t.heroTitle2 || '').split(' ');
  const state = ready ? 'show' : 'hidden';
  const initial = reduceMotion ? false : 'hidden';

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: mode === '3d' ? 1.4 : 0.35 } },
  };
  const rise = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
  };
  const word = {
    hidden: { opacity: 0, y: '0.45em', filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
  };

  return (
    <motion.div
      style={{ '--story-background': background }}
      ref={sectionRef}
      className="manara-journey relative isolate bg-brand-night"
    >
      <div className="manara-stage">
      {/* السماء قبل تحميل المشهد (وتبقى خلفية للبديل ثنائي الأبعاد) */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 70% 60% at ${isAr ? '28%' : '72%'} 38%, var(--color-brand-purple) 0%, var(--color-brand-purple-dark) 42%, var(--color-brand-night) 100%)`,
        }}
        aria-hidden="true"
      />

      {mode === '3d' ? (
        <HeroScene
          shineRef={shineRef}
          ready={ready}
          mirrored={!isAr}
          getComposition={getComposition}
          layoutKey={lang}
          scrollProgress={journey}
          onFail={handleFail}
        />
      ) : (
        <StoryFallback ready={ready} isAr={isAr} progress={journey} />
      )}

      </div>
      <section id="home" className="manara-hero-content">
      {/* مثبّت طوال ذوبان النص، فلا يجرّه التمرير خارج الشاشة */}
      <div className="manara-hero-pin">
      <div className="relative z-10 container mx-auto px-6 md:px-10 min-h-[100svh] grid grid-cols-1 lg:grid-cols-12 lg:gap-8 pointer-events-none">
        <motion.div
          ref={textRef}
          style={{ y: textY, scale: textScale, opacity: textOpacity, filter: textBlur }}
          className="pointer-events-auto relative lg:col-span-7 self-start lg:self-center pt-28 pb-4 lg:pt-28 lg:pb-36 text-center lg:text-start"
        >
          <motion.div variants={container} initial={initial} animate={state} key={lang}>
            <h1 className="font-extrabold text-white leading-[1.25] text-[clamp(1.9rem,5.4vw,4.4rem)] lg:text-[clamp(2.6rem,4.3vw,4.4rem)] [text-shadow:0_2px_24px_rgb(12_8_32/0.6)]">
              <span className="block">
                {words.map((w, i) => (
                  <React.Fragment key={i}>
                    <motion.span variants={word} className="inline-block">{w}</motion.span>
                    {i < words.length - 1 && ' '}
                  </React.Fragment>
                ))}
              </span>
              <motion.span variants={word} className="block mt-1 pb-2">
                <span ref={shineRef} className={`hero-shine${mode === 'fallback' ? (isAr ? ' hero-shine--sweep-right' : ' hero-shine--sweep-left') : ''}`}>{t.heroTitle}</span>
              </motion.span>
            </h1>

            <motion.p
              variants={rise}
              className="mt-4 lg:mt-6 text-brand-gray text-[15px] md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 [text-shadow:0_1px_12px_rgb(12_8_32/0.8)]"
            >
              {t.heroDesc}
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

      <motion.p style={{ opacity: cueOpacity }} className="manara-scroll-cue">{copy.scroll} <span aria-hidden="true">↓</span></motion.p>
      </div>
      </section>
      <ManaraStory copy={copy} />
      {/* ختام الحكاية: المشهد يبقى مثبّتاً بعد رحيل آخر بطاقة، فتبتعد الكاميرا ويتسلّمه قسم الورش (انظر index.css) */}
      <div className="manara-outro" aria-hidden="true" />

      {/* حبيبات خفيفة تمنح الصورة ملمساً سينمائياً */}
      <div className="hero-grain absolute inset-0 pointer-events-none" aria-hidden="true" />
    </motion.div>
  );
}

export default HeroSection;
