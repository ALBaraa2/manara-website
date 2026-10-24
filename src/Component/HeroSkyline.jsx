import React from 'react';

// أفق مدينة ليلي يُولَّد مرة واحدة عند تحميل الملف (عشوائية ثابتة البذرة حتى يبقى الشكل نفسه في كل زيارة)
// أبنية بنوافذ تضيء تدريجياً + رافعة بناء (تُستخدم في البديل ثنائي الأبعاد كمدينة على الشاطئ البعيد).

const WIDTH = 1440;
const HEIGHT = 180;

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(1948);
const between = (min, max) => min + rand() * (max - min);

// الطبقة البعيدة
const buildings = [];
const windows = [];
for (let x = -10; x < WIDTH; ) {
  const w = Math.round(between(38, 86));
  const h = Math.round(between(48, 150));
  const top = HEIGHT - h;
  buildings.push({ x, w, top });

  for (let wy = top + 10; wy < HEIGHT - 14; wy += 13) {
    for (let wx = x + 7; wx < x + w - 9; wx += 11) {
      if (rand() < 0.17) {
        windows.push({
          x: wx,
          y: wy,
          delay: between(0.2, 4.5).toFixed(2),
          flicker: rand() < 0.08,
        });
      }
    }
  }
  x += w + Math.round(between(3, 12));
}

// رافعة البناء فوق أحد الأبنية الوسطى
const craneBase = buildings.reduce((best, b) => (Math.abs(b.x - 860) < Math.abs(best.x - 860) ? b : best), buildings[0]);
const crane = { x: craneBase.x + craneBase.w * 0.6, base: craneBase.top, top: Math.max(craneBase.top - 70, 6) };

const svgProps = {
  viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
  preserveAspectRatio: 'xMidYMax slice',
  'aria-hidden': true,
  focusable: false,
  className: 'block w-full h-full',
};

export function SkylineBack({ ready }) {
  return (
    <svg {...svgProps} className={`${svgProps.className} hero-skyline`} data-ready={ready || undefined}>
      <defs>
        {/* كل بناء مضاء من أعلاه ويذوب في ظلام الليل نحو الأسفل */}
        <linearGradient id="hero-building" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-brand-purple)" />
          <stop offset="1" stopColor="var(--color-brand-night)" />
        </linearGradient>
      </defs>
      <g fill="url(#hero-building)">
        {buildings.map((b) => (
          <rect key={b.x} x={b.x} y={b.top} width={b.w} height={HEIGHT - b.top} />
        ))}
      </g>

      {/* الرافعة */}
      <g className="stroke-brand-purple" strokeWidth="3" fill="none">
        <line x1={crane.x} y1={crane.base} x2={crane.x} y2={crane.top} />
        <line x1={crane.x - 26} y1={crane.top + 6} x2={crane.x + 120} y2={crane.top + 6} />
        <line x1={crane.x} y1={crane.top - 8} x2={crane.x + 120} y2={crane.top + 6} strokeWidth="1.5" />
        <line x1={crane.x} y1={crane.top - 8} x2={crane.x - 26} y2={crane.top + 6} strokeWidth="1.5" />
        <line x1={crane.x + 92} y1={crane.top + 6} x2={crane.x + 92} y2={crane.top + 40} strokeWidth="1" />
      </g>
      <circle cx={crane.x + 120} cy={crane.top + 6} r="2.6" className="fill-brand-orange hero-crane-light" />

      <g className="fill-brand-orange-light">
        {windows.map((w) => (
          <rect
            key={`${w.x}-${w.y}`}
            x={w.x}
            y={w.y}
            width="4"
            height="6"
            rx="0.5"
            className={`hero-window${w.flicker ? ' hero-window--flicker' : ''}`}
            style={{ '--d': `${w.delay}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
