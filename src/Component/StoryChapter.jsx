import React, { useLayoutEffect, useRef } from 'react';
import { useReducedMotion, useScroll } from 'framer-motion';
import { countWords, parseEmphasis, splitWords, wordScatter } from '../lib/clarity';

// الكلمة هي أصغر وحدة تشتيت: تقسيم الحروف يقطع اتصال الحروف العربية.
// العبارات المُبرَزة تُلفّ بـ <mark>، ويُرسم تحتها خط يمتد بعد أن تتضح كلماتها (--t لأول كلمة فيها).
function Words({ text, start, total }) {
  const at = (index) => (total > 1 ? index / (total - 1) : 0);
  let k = 0;
  const word = (part, i) => {
    const index = start + k;
    k += 1;
    const s = wordScatter(index);
    return <span key={i} className="clarity-word" style={{
      '--t': at(index), '--dx': s.dx, '--dy': s.dy, '--r': s.r, '--b': s.blur, '--s': s.s,
    }}>{part}</span>;
  };
  const words = (chunk) => splitWords(chunk).map(({ part, isWord }, i) => (isWord ? word(part, i) : part));
  return parseEmphasis(text).map((seg, i) => {
    if (!seg.em) return <React.Fragment key={i}>{words(seg.text)}</React.Fragment>;
    const first = start + k;
    return <mark key={i} className="manara-em" style={{ '--t': at(first) }}>{words(seg.text)}</mark>;
  });
}

// مجموعة نص تتضح كوحدة واحدة (العنوان، أو مشهد). strings بترتيب ظهورها، و w(text) يلفّ كل نص بكلمات متحرّكة.
// النص حقيقي ومقروء دائماً: الحركة تُضاف فقط حين يضع StoryChapter الصنف is-live.
export function ClarityGroup({ as: Tag = 'div', strings, beat, className = '', children }) {
  const total = strings.reduce((n, s) => n + countWords(s), 0);
  let at = 0;
  const w = (text) => {
    const start = at;
    at += countWords(text);
    return <Words text={text} start={start} total={total} />;
  };
  return <Tag data-clarity="" data-beat={beat} className={`clarity ${className}`}>{children(w)}</Tag>;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// الخط الزمني للفصل بوحدات «ارتفاع شاشة» من لحظة تثبيت البطاقة (s = 0).
const BEAT = 0.8; // مسافة التمرير لكل مشهد
const beatStart = (i) => 0.1 + i * BEAT;
const HOLD = 0.55; // بقاء المشهد الأخير مقروءاً قبل تحرّر البطاقة
const dwellFor = (beats) => beatStart(beats - 1) + 0.3 + HOLD;

// فصل مثبّت: المسار (section) أطول من الشاشة، والبطاقة داخله sticky فتبقى ثابتة في مكان القراءة.
// staged: العنوان ثابت، والمشاهد تتبدّل داخل البطاقة بالتمرير (تتراكب في خلية واحدة بارتفاع أطولها فلا يتغير حجم البطاقة).
// flow: حين لا تتسع البطاقة للشاشة (هواتف صغيرة) أو مع تقليل الحركة، تُعرض المشاهد متتالية بشكل عادي.
// كل الحالات مشتقة من موضع التمرير، فالرجوع للأعلى يعكسها تماماً.
export default function StoryChapter({ id, tone, beats, layoutKey, children }) {
  const track = useRef(null);
  const pin = useRef(null);
  const copy = useRef(null);
  const dwell = useRef(null);
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  useLayoutEffect(() => {
    const section = track.current;
    const card = copy.current;
    const groups = [...card.querySelectorAll('[data-clarity]')].map(el => ({
      el, beat: el.dataset.beat === undefined ? -1 : Number(el.dataset.beat),
      // الحالة تُقرأ من DOM (قد تبقى من تشغيل سابق للتأثير) حتى لا تُتجاهل كتابة لازمة
      shown: el.style.getPropertyValue('--p') || '0.0000', clear: el.classList.contains('is-clear'),
      live: el.classList.contains('is-live'), opacity: el.style.opacity, active: el.classList.contains('is-active'),
    }));
    const steps = [...card.querySelectorAll('[data-step]')];
    let staged = false;
    let current = -1;

    // لا نكتب إلا عند تغيّر القيمة: كل كتابة تعيد حساب أنماط عشرات الكلمات.
    const setGroup = (g, p, near, opacity) => {
      const value = p.toFixed(4);
      if (value !== g.shown) { g.shown = value; g.el.style.setProperty('--p', value); }
      const done = p >= 0.999;
      if (done !== g.clear) { g.clear = done; g.el.classList.toggle('is-clear', done); }
      const live = near && !done;
      if (live !== g.live) { g.live = live; g.el.classList.toggle('is-live', live); }
      if (opacity !== g.opacity) { g.opacity = opacity; g.el.style.opacity = opacity; }
      const active = opacity === '' || Number(opacity) > 0.5;
      if (active !== g.active) { g.active = active; g.el.classList.toggle('is-active', active); }
    };

    // هل تتسع البطاقة بمشاهدها المتراكبة للشاشة؟ تُقاس عند التحميل وتغيّر الحجم واللغة فقط.
    const measure = () => {
      if (reduced) staged = false;
      else {
        const fits = () => pin.current.offsetHeight <= window.innerHeight + 1;
        card.classList.add('is-staged');
        pin.current.classList.remove('is-tight');
        staged = fits();
        // الأجهزة اللوحية: إن لم تتسع البطاقة تحت المنارة، تُرفع إلى ما تحت شريط التنقل مباشرة
        if (!staged && window.innerWidth >= 600) {
          pin.current.classList.add('is-tight');
          staged = fits();
          if (!staged) pin.current.classList.remove('is-tight');
        }
        if (!staged) card.classList.remove('is-staged');
      }
      const vh = window.innerHeight;
      dwell.current.style.height = `${Math.round((staged ? dwellFor(beats) : reduced ? 0.3 : 0.35) * vh)}px`;
      if (!staged) groups.forEach(g => { if (g.opacity !== '') { g.opacity = ''; g.el.style.opacity = ''; } });
    };
    // بطاقة أطول من الشاشة (وضع flow): يتحرّك المثبّت للأعلى بمقدار الزيادة فتُقرأ كاملة دون تمرير داخلي.
    let pinTop = pin.current.style.top;
    const fit = () => {
      const next = `${Math.min(0, window.innerHeight - pin.current.offsetHeight)}px`;
      if (next !== pinTop) { pinTop = next; pin.current.style.top = next; }
    };

    const paint = () => {
      if (reduced) return;
      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();
      const near = rect.top < vh * 1.6 && rect.bottom > -vh * 0.2;
      const s = -rect.top / vh;
      const last = beats - 1;
      let best = 0;
      let bestOpacity = -1;
      groups.forEach(g => {
        if (g.beat < 0) { setGroup(g, clamp01((s + 0.35) / 0.5), near, ''); return; }
        const i = g.beat;
        if (!staged) {
          const top = g.el.getBoundingClientRect().top;
          setGroup(g, clamp01((vh * 0.92 - top) / (vh * 0.45)), near, '');
          return;
        }
        const a = beatStart(i);
        const enter = i === 0 ? 1 : clamp01((s - (a - 0.15)) / 0.15);
        const leave = i === last ? 0 : clamp01((s - (beatStart(i + 1) - 0.3)) / 0.15);
        const o = enter * (1 - leave);
        const p = i === 0 ? clamp01((s + 0.1) / 0.5) : clamp01((s - (a - 0.15)) / 0.45);
        // المشاهد الخفية لا تحتاج حسابات الحركة الثقيلة
        setGroup(g, p, near && o > 0, o.toFixed(3));
        if (o > bestOpacity) { bestOpacity = o; best = i; }
      });
      const step = staged ? best : -1;
      if (step !== current) {
        current = step;
        steps.forEach((el, i) => el.classList.toggle('is-current', i === step));
      }
    };

    // لوحة المفاتيح: التركيز على رابط داخل مشهد خفي يمرّر الصفحة إليه فيصبح ظاهراً
    const onFocus = (event) => {
      if (!staged) return;
      const beat = event.target.closest('[data-beat]');
      if (!beat) return;
      const s = -section.getBoundingClientRect().top / window.innerHeight;
      const target = beatStart(Number(beat.dataset.beat)) + 0.2;
      if (Math.abs(s - target) > BEAT / 2) {
        // instant: التمرير الناعم العام في الصفحة كان يترك المشهدين متراكبين أثناء الانتقال
        window.scrollTo({ top: window.scrollY + (target - s) * window.innerHeight, behavior: 'instant' });
      }
    };

    if (reduced) groups.forEach(g => { g.clear = true; g.el.classList.add('is-clear'); });
    const layout = () => { measure(); fit(); paint(); };
    const observer = new ResizeObserver(() => { fit(); paint(); });
    observer.observe(pin.current);
    window.addEventListener('resize', layout);
    card.addEventListener('focusin', onFocus);
    layout();
    // الخط النهائي يغيّر ارتفاع النص؛ نعيد القياس بعد تحميله
    document.fonts?.ready.then(() => { if (copy.current) layout(); });
    const unsubscribe = scrollY.on('change', paint);
    return () => {
      unsubscribe(); observer.disconnect();
      window.removeEventListener('resize', layout); card.removeEventListener('focusin', onFocus);
      groups.forEach(g => { g.el.classList.add('is-clear'); g.el.style.opacity = ''; });
      card.classList.remove('is-staged');
    };
  }, [reduced, scrollY, beats, layoutKey]);

  return <section ref={track} id={id} data-story-chapter className={`manara-chapter manara-chapter--${tone}`} aria-labelledby={`${id}-title`}>
    <div ref={pin} className="manara-chapter-pin">
      <div ref={copy} className="manara-chapter-copy">{children}</div>
    </div>
    <div ref={dwell} className="manara-chapter-dwell" aria-hidden="true" />
  </section>;
}
