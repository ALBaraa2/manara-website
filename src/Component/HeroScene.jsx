import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// فحص سريع لدعم WebGL قبل تحميل مكتبة three (حتى لا نحمّلها بلا فائدة)
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

const SHINE_BASE = [243, 115, 33]; // برتقالي الشعار
const SHINE_PEAK = [255, 230, 209]; // لون الضوء على النص

// يرسم شريط الضوء على العنوان البرتقالي متزامناً مع الحزمة على الشاشة:
// مقدّمة الحزمة (حيث يبدأ ضوؤها بالتلاشي) تمتد من جهة المنارة عبر النص حين تدور نحوه،
// فيعبر الشريط النص كله (كل الأسطر) معها، بنفس اتجاه الحزمة وشدّتها، ما دامت الحزمة بمحاذاة النص عمودياً
const FRONT_FADE = 0.3; // نسبة شدّة الحزمة عند "مقدّمتها" المرئية

function paintShine(el, container, samples) {
  const box = container.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  if (!rect.width) return;
  if (!('synced' in el.dataset)) el.dataset.synced = '';

  const strength = samples[0].fade;
  const off = () => {
    if (el.style.getPropertyValue('--shine-pos') !== '-9999px') el.style.setProperty('--shine-pos', '-9999px');
  };
  if (strength < 0.01) {
    off();
    return;
  }

  // موضع مقدّمة الحزمة على الشاشة (بين عيّنتين)
  let front = null;
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    if (b.fade <= 0) break;
    const target = strength * FRONT_FADE;
    if (a.fade >= target && b.fade <= target) {
      const t = (a.fade - target) / (a.fade - b.fade || 1);
      front = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, half: a.half + (b.half - a.half) * t, dx: b.x - a.x, dy: b.y - a.y };
      break;
    }
  }
  if (!front) {
    off();
    return;
  }

  const w = rect.width;
  const h = rect.height;
  const left = rect.left - box.left;
  const top = rect.top - box.top;

  // لا ضوء على النص إلا إن مرّت الحزمة بمحاذاته عمودياً (لا حين ترتفع في السماء فوقه)
  const gap = Math.max(0, top - front.y, front.y - (top + h));
  const margin = front.half * 1.5 + h * 0.5;
  const nearness = Math.max(0, 1 - gap / margin);
  if (nearness <= 0) {
    off();
    return;
  }

  const band = Math.max(w * 0.22, 60);

  // يبدأ العبور من حافة النص القريبة من المنارة وينتهي بالبعيدة
  const lampOnRight = samples[0].x > left + w / 2;
  const startEdge = lampOnRight ? left + w + band : left - band;
  const endEdge = lampOnRight ? left - band : left + w + band;
  const progress = (front.x - startEdge) / (endEdge - startEdge);
  if (progress < 0 || progress > 1) {
    off();
    return;
  }

  // التدرج يتجه مع الحزمة، فيكون الشريط عمودياً عليها كمقدّمة الضوء
  const len = Math.hypot(front.dx, front.dy) || 1;
  const ux = front.dx / len;
  const uy = front.dy / len;
  const angle = Math.atan2(ux, -uy);
  const gradientLength = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
  // المقدّمة مُسقَطة على خط التدرج عند منتصف ارتفاع النص، فيغطي الشريط كل الأسطر
  const pos = gradientLength / 2 + (front.x - left - w / 2) * ux;
  const color = SHINE_BASE.map((c, i) => Math.round(c + (SHINE_PEAK[i] - c) * Math.min(strength, 1) * nearness)).join(' ');

  el.style.setProperty('--shine-angle', `${((angle * 180) / Math.PI).toFixed(1)}deg`);
  el.style.setProperty('--shine-pos', `${pos.toFixed(1)}px`);
  el.style.setProperty('--shine-w', `${band.toFixed(1)}px`);
  el.style.setProperty('--shine-color', `rgb(${color})`);
}

// غلاف React للمشهد ثلاثي الأبعاد: يحمّله عند الحاجة، ويمرّر له التمرير، وينظّف موارده عند الإزالة
function HeroScene({ shineRef, ready, mirrored, getComposition, layoutKey, scrollProgress, onFail }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const latest = useRef({ ready, mirrored, getComposition, onFail });
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    latest.current = { ready, mirrored, getComposition, onFail };
  });

  // إنشاء المشهد (ويُعاد إنشاؤه إن تغيّر تفضيل تقليل الحركة)
  useEffect(() => {
    let cancelled = false;
    let painted = null; // آخر عنصر رُسم عليه الضوء (يتغيّر العنصر عند تبديل اللغة)
    const fail = () => latest.current.onFail();

    if (!hasWebGL()) {
      fail();
      return undefined;
    }

    import('../lib/heroScene')
      .then(({ createHeroScene }) => {
        if (cancelled || !containerRef.current) return;
        const scene = createHeroScene(containerRef.current, {
          mirrored: latest.current.mirrored,
          reducedMotion: Boolean(reduceMotion),
          getComposition: (w, h) => latest.current.getComposition(w, h),
          onContextLost: fail,
          onBeam: (samples) => {
            painted = shineRef.current;
            if (painted && containerRef.current) paintShine(painted, containerRef.current, samples);
          },
        });
        sceneRef.current = scene;
        scene.setScroll(scrollProgress.get());
        if (latest.current.ready) scene.start();
        setVisible(true);
      })
      .catch(fail);

    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
      // يعود اللمعان إلى حركته المستقلة (CSS) إن أُزيل المشهد
      if (painted) delete painted.dataset.synced;
      setVisible(false);
    };
  }, [reduceMotion, shineRef, scrollProgress]);

  useEffect(() => {
    if (ready) sceneRef.current?.start();
  }, [ready]);

  useEffect(() => {
    sceneRef.current?.setMirrored(mirrored);
  }, [mirrored]);

  // تغيّر طول النص (عند تبديل اللغة) يغيّر موضع المنارة على الشاشات الضيقة
  useEffect(() => {
    sceneRef.current?.relayout();
  }, [layoutKey]);

  // التمرير يرفع الكاميرا فوق المدينة (يعمل على اللمس أيضاً)
  useEffect(() => {
    sceneRef.current?.setScroll(scrollProgress.get());
    return scrollProgress.on('change', (v) => sceneRef.current?.setScroll(v));
  }, [scrollProgress, reduceMotion]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    />
  );
}

export default HeroScene;
