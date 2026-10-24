import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EASE, reveal } from '../lib/brand';

// عناصر هوية مشتركة بين أقسام الصفحة (الورش، الخدمات، المنشورات، التواصل):
// كل قسم له تخطيطه الخاص، لكن الإيقاع واحد — «شعاع» صغير قبل عنوان القسم، عناوين تحريرية،
// وغلاف بديل بهوية منارة بدلاً من صور جاهزة لا علاقة لها بالمحتوى.


// شعاع المنارة مصغّراً: نقطة مضيئة وخط يمتد منها حين يظهر العنوان
export function Kicker({ children, tone = 'dark' }) {
  return (
    <p className={`brand-kicker brand-kicker--${tone}`}>
      <span className="brand-kicker-beam" aria-hidden="true">
        <span className="brand-kicker-dot" />
        <motion.span
          className="brand-kicker-line"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        />
      </span>
      {children}
    </p>
  );
}

// رأس قسم تحريري (محاذاة البداية): شعار صغير، عنوان، وصف، ومساحة اختيارية بجانبه
export function SectionHeading({ kicker, title, desc, tone = 'dark', aside, id }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 lg:mb-14">
      <motion.div {...reveal()} className="max-w-2xl">
        <Kicker tone={tone}>{kicker}</Kicker>
        <h2 id={id} className={`mt-4 text-3xl md:text-[2.6rem] font-bold leading-tight ${tone === 'dark' ? 'text-white' : 'text-brand-purple'}`}>{title}</h2>
        {desc && <p className={`mt-4 text-base md:text-lg leading-relaxed ${tone === 'dark' ? 'text-brand-gray' : 'text-gray-600'}`}>{desc}</p>}
      </motion.div>
      {aside && <motion.div {...reveal(0.15)} className="shrink-0">{aside}</motion.div>}
    </div>
  );
}

// غلاف بديل حين لا توجد صورة: سماء منارة وشعاع وعلامة الشعار — لا صور مخزنة لا تمثل المحتوى
export function BrandCover({ tone = 'dark', className = '' }) {
  return (
    <div className={`brand-cover brand-cover--${tone} ${className}`} aria-hidden="true">
      <span className="brand-cover-beam" />
      <img src="/logo-mark.svg" alt="" className="brand-cover-mark" loading="lazy" decoding="async" />
    </div>
  );
}

// صورة تتراجع إلى الغلاف البديل إن لم توجد أو فشل تحميلها
export function CoverImage({ src, tone = 'dark', className = '', imgClassName = '', alt = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <BrandCover tone={tone} className={className} />;
  return (
    // الصورة تملأ إطارها (absolute) فلا يمدّ ارتفاعها الطبيعي البطاقة
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`} />
    </div>
  );
}
