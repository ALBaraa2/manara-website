import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkylineBack } from './HeroSkyline';

// البديل ثنائي الأبعاد للواجهة الأولى: يُعرض حين لا يتوفر WebGL أو يفشل تحميل المشهد ثلاثي الأبعاد

// نجوم بمواقع ثابتة (عشوائية محسوبة مرة واحدة) في النصف العلوي من السماء
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    top: `${(r(2) * 62).toFixed(2)}%`,
    size: r(3) > 0.85 ? 3 : r(3) > 0.45 ? 2 : 1,
    duration: `${(3 + r(4) * 5).toFixed(1)}s`,
    delay: `${(-r(5) * 8).toFixed(1)}s`,
  };
});

// موضع المصباح داخل صورة المنارة (Hero-lighthouse.png بأبعاد 740×1036)
const LAMP = { x: '45.6%', y: '36.5%' };

const EASE = [0.22, 1, 0.36, 1];

function HeroFallback({ ready, isAr }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className={`hero-aurora absolute -top-1/4 ${isAr ? '-right-1/4' : '-left-1/4'} w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full`} />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className="hero-star absolute rounded-full bg-white"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDuration: s.duration, animationDelay: s.delay }}
          />
        ))}
      </motion.div>

      {/* المدينة على الشاطئ البعيد */}
      <div className="absolute -inset-x-6 bottom-[16%] h-[60px] sm:h-[80px] lg:h-[100px] opacity-80">
        <SkylineBack ready={ready} />
      </div>

      {/* المنارة في البحر، في جهة مقابلة للنص، وحزمتها تتجه نحوه */}
      <div className={`absolute bottom-[6%] left-1/2 -translate-x-1/2 lg:translate-x-0 ${isAr ? 'lg:left-[7%]' : 'lg:left-auto lg:right-[7%]'}`}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 80 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
          className={`relative aspect-[740/1036] h-[min(34svh,280px)] sm:h-[min(40svh,340px)] md:h-[min(42svh,440px)] lg:h-[min(68svh,46vw,620px)] ${isAr ? '' : '-scale-x-100'}`}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={ready ? { opacity: 1 } : undefined}
            transition={{ duration: 1.6, delay: 1.2 }}
            className="absolute inset-0"
          >
            <span className="hero-beam" style={{ left: LAMP.x, top: LAMP.y }} />
            <span className="hero-beam hero-beam--b" style={{ left: LAMP.x, top: LAMP.y }} />
          </motion.div>

          <img src="/Hero-lighthouse.png" alt="" className="absolute inset-0 w-full h-full select-none" draggable="false" />

          <motion.span
            initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
            animate={ready ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.9, delay: 1, ease: 'easeOut' }}
            className="absolute w-[30%] aspect-square -translate-x-1/2 -translate-y-1/2"
            style={{ left: LAMP.x, top: LAMP.y }}
          >
            <span className="hero-lamp" />
          </motion.span>
        </motion.div>
      </div>

      {/* سطح البحر يغطي قاعدة المنارة، مع انعكاس برتقالي متموّج تحتها */}
      <div className="absolute inset-x-0 bottom-0 h-[17%] bg-gradient-to-b from-brand-purple-dark to-brand-night">
        <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
        {/* يقع تحت المصباح: 7% + عرض الصورة × موضع المصباح فيها (45.6% من جهتها) */}
        <div
          className={`absolute top-0 bottom-0 w-24 lg:w-40 left-1/2 -translate-x-1/2 ${isAr ? 'lg:left-[calc(7%+min(68svh,46vw,620px)*0.3256)]' : 'lg:left-auto lg:right-[calc(7%+min(68svh,46vw,620px)*0.3256)] lg:translate-x-1/2'} bg-[repeating-linear-gradient(180deg,rgb(243_115_33/0.45)_0_3px,transparent_3px_9px)] [mask-image:linear-gradient(180deg,black,transparent)] opacity-80`}
        />
      </div>
    </div>
  );
}

export default HeroFallback;
