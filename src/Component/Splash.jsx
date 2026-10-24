import React, { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

// شاشة الافتتاح: الشعار يتجمّع من التشتت إلى الوضوح (نفس لغة نصوص القصة)، ثم يشتعل قرص المنارة
// ويمرّ شعاع ضوء على الشعار. عند جاهزية الصفحة يتوهّج القرص ويتّسع الضوء ويدفعنا عبره إلى مشهد
// المنارة، وتبدأ كاميرا المشهد بالهبوط في اللحظة نفسها فلا يبدو الانتقال قطعاً.
const EXIT_MS = 1000;

export default function Splash({ exiting, onDone }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!exiting) return undefined;
    const timer = setTimeout(onDone, reduced ? 250 : EXIT_MS);
    return () => clearTimeout(timer);
  }, [exiting, onDone, reduced]);

  return (
    <div className={`splash${exiting ? ' is-exiting' : ''}`} aria-hidden="true">
      <div className="splash-stage">
        <div className="splash-halo" />
        <img className="splash-ghost splash-ghost--a" src="/logo-mark.svg" alt="" />
        <img className="splash-ghost splash-ghost--b" src="/logo-mark.svg" alt="" />
        <img className="splash-logo" src="/logo-mark.svg" alt="" />
        <div className="splash-sweep"><span /></div>
        <div className="splash-bloom" />
      </div>
    </div>
  );
}
