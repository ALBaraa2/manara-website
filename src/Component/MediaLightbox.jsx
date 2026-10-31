import React, { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiPlay, FiAlertCircle } from 'react-icons/fi';
import { imageSrcSet, mediaUrl } from '../content/activities';

// عارض الصور والفيديو لنشاط واحد: <dialog> أصلي (Esc والتركيز ومنع التفاعل مع الخلفية من المتصفح)،
// الأسهم/السحب للتنقل، ومصغّرات أسفل العارض. الفيديو لا يعمل تلقائياً إلا إن فتحه الزائر من زر التشغيل.
function Slide({ item, title, autoPlay, labels }) {
  const [state, setState] = useState('loading'); // loading | ready | error
  const video = useRef(null);
  const alt = item.alt;

  // التشغيل بـ play() صراحة بعد نقرة الزائر على زر التشغيل (خاصية autoplay يتجاهلها Chrome للفيديو بالصوت)؛
  // إن رفضه المتصفح يبقى الفيديو متوقفاً بأزرار التحكم
  useEffect(() => {
    if (autoPlay && item.type === 'video') video.current?.play().catch(() => {});
  }, [autoPlay, item.type]);

  if (state === 'error') {
    return (
      <div className="lightbox-missing" role="alert">
        <FiAlertCircle aria-hidden="true" />
        <span>{labels.missing}</span>
      </div>
    );
  }

  return (
    <div className={`lightbox-frame${state === 'ready' ? ' is-ready' : ''}`}>
      {state === 'loading' && <span className="lightbox-spinner" aria-hidden="true" />}
      {item.type === 'video' ? (
        <video
          key={item.src}
          ref={video}
          className="lightbox-media"
          src={mediaUrl(item.src, '.mp4')}
          poster={mediaUrl(item.src, '-poster.webp')}
          controls
          playsInline
          preload="metadata"
          aria-label={`${alt} — ${title}`}
          onLoadedMetadata={() => setState('ready')}
          onError={() => setState('error')}
        />
      ) : (
        <img
          key={item.src}
          className="lightbox-media"
          src={mediaUrl(item.src, '-1600.webp')}
          srcSet={imageSrcSet(item.src)}
          sizes="(min-width: 1024px) 80vw, 100vw"
          width={item.w}
          height={item.h}
          alt={alt}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      )}
    </div>
  );
}

export default function MediaLightbox({ activity, index, autoPlay, onIndex, onClose, lang }) {
  const dialog = useRef(null);
  const swipe = useRef(null);
  const isAr = lang === 'AR';
  const open = Boolean(activity) && index !== null;
  const items = activity?.media || [];
  const item = items[index];
  const title = activity?.title[lang] || '';
  const labels = isAr
    ? { close: 'إغلاق', prev: 'السابق', next: 'التالي', missing: 'تعذّر تحميل هذا الملف.', video: 'فيديو', of: 'من' }
    : { close: 'Close', prev: 'Previous', next: 'Next', missing: 'This file could not be loaded.', video: 'Video', of: 'of' };

  useEffect(() => {
    const el = dialog.current;
    if (!el) return undefined;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (!open) return undefined;
    // الصفحة خلف العارض لا تتمرر
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous; };
  }, [open]);

  const go = (step) => onIndex((index + step + items.length) % items.length);

  const onKeyDown = (event) => {
    if (event.target.tagName === 'VIDEO') return; // الأسهم داخل الفيديو للتقديم والإرجاع
    // في العربية: السهم الأيسر = التالي (اتجاه القراءة)
    if (event.key === 'ArrowRight') { event.preventDefault(); go(isAr ? -1 : 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(isAr ? 1 : -1); }
  };

  // السحب باللمس أو الفأرة: مسافة أفقية واضحة فقط، حتى لا يتعارض مع النقر
  const onPointerDown = (event) => { swipe.current = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || items.length < 2) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(event.clientY - start.y)) return;
    go((dx < 0) !== isAr ? 1 : -1);
  };

  const PrevIcon = isAr ? FiChevronRight : FiChevronLeft;
  const NextIcon = isAr ? FiChevronLeft : FiChevronRight;

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={onKeyDown}
    >
      {open && item && (
        <div className="lightbox-layout">
          <header className="lightbox-bar">
            <div className="min-w-0">
              <p className="lightbox-title" dir="auto">{title}</p>
              <p className="lightbox-count" aria-live="polite">{index + 1} {labels.of} {items.length}</p>
            </div>
            <button type="button" className="lightbox-button" onClick={onClose} aria-label={labels.close} autoFocus>
              <FiX aria-hidden="true" />
            </button>
          </header>

          <div
            className="lightbox-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
          >
            {items.length > 1 && (
              <button type="button" className="lightbox-button lightbox-nav lightbox-nav--prev" onClick={() => go(-1)} aria-label={labels.prev}>
                <PrevIcon aria-hidden="true" />
              </button>
            )}
            <Slide key={`${activity.id}-${index}`} item={{ ...item, alt: item.alt[lang] }} title={title} autoPlay={autoPlay} labels={labels} />
            {items.length > 1 && (
              <button type="button" className="lightbox-button lightbox-nav lightbox-nav--next" onClick={() => go(1)} aria-label={labels.next}>
                <NextIcon aria-hidden="true" />
              </button>
            )}
          </div>

          <footer className="lightbox-foot">
            <p className="lightbox-caption" dir="auto">{item.alt[lang]}</p>
            {items.length > 1 && (
              <ul className="lightbox-thumbs">
                {items.map((thumb, i) => (
                  <li key={thumb.src}>
                    <button
                      type="button"
                      className={`lightbox-thumb${i === index ? ' is-current' : ''}`}
                      aria-current={i === index ? 'true' : undefined}
                      aria-label={`${thumb.type === 'video' ? `${labels.video}: ` : ''}${thumb.alt[lang]}`}
                      onClick={() => onIndex(i)}
                    >
                      <img src={thumb.type === 'video' ? mediaUrl(thumb.src, '-poster.webp') : mediaUrl(thumb.src, '-800.webp')} alt="" loading="lazy" decoding="async" />
                      {thumb.type === 'video' && <span className="lightbox-thumb-play" aria-hidden="true"><FiPlay /></span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </footer>
        </div>
      )}
    </dialog>
  );
}
