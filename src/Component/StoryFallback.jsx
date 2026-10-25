import React from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import HeroFallback from './HeroFallback';
import { storyState } from '../lib/storyTimeline';

// البديل يستخدم صورة المنارة الأصلية؛ حركة ثنائية الأبعاد دون محاكاة هندسة ثلاثية الأبعاد.
export default function StoryFallback({ ready, isAr, progress }) {
  const reduced = useReducedMotion();
  const heroOpacity = useTransform(progress, [0, 0.8], [1, 0]);
  const opacity = useTransform(progress, [0.2, 0.85], [0, 1]);
  const scale = useTransform(progress, v => { const s = storyState(v); return reduced ? 1 : (0.8 + s.zoom * 0.2) * (1 - s.pull * 0.22); });
  const light = useTransform(progress, v => storyState(v).light);
  return <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
    <motion.div className="absolute inset-0" style={{ opacity: heroOpacity }}><HeroFallback ready={ready} isAr={isAr} /></motion.div>
    <motion.div className="absolute inset-0" style={{ opacity, background: 'var(--story-background)' }} />
    <motion.div className="manara-fallback-detail" style={{ opacity, scale }}>
      <img src="/Hero-lighthouse.png" alt="" draggable="false" />
      <motion.span className="manara-fallback-glow" style={{ opacity: light }} />
    </motion.div>
  </div>;
}
