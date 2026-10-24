// أدوات مشتركة لأقسام الصفحة (حركة، تواريخ، مدة القراءة، مقتطفات). المكوّنات في Component/brand.jsx.

export const EASE = [0.22, 1, 0.36, 1];

// ظهور عند الدخول إلى الشاشة. framer-motion يحترم تقليل الحركة عبر MotionConfig في App.
export const reveal = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px -10% 0px' },
  transition: { duration: 0.7, delay, ease: EASE },
});

// مدة القراءة المقدّرة (معلومة مشتقة من النص الفعلي، لا إحصائية مختلقة)
export function readingTime(text, isAr) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  if (!isAr) return `${minutes} min read`;
  if (minutes === 1) return 'دقيقة قراءة';
  if (minutes === 2) return 'دقيقتا قراءة';
  return minutes <= 10 ? `${minutes} دقائق قراءة` : `${minutes} دقيقة قراءة`;
}

export function formatDate(value, isAr) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// مقتطف نظيف من نص المقال
export function excerpt(text, max = 220) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
