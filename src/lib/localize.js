// الـ API يعيد النصوص المترجمة بالشكل { ar, en } — هذه الدالة تختار النص المناسب للغة
// وتعيد fallback بدلاً من طباعة الكائن كـ JSON عندما تكون القيم فارغة.
export const localize = (value, lang = 'AR', fallback = '') => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === 'object') {
    const primary = lang === 'EN' ? value.en : value.ar;
    const secondary = lang === 'EN' ? value.ar : value.en;
    const text = primary || secondary;
    return text ? String(text) : fallback;
  }

  const text = String(value);
  return text.trim() === '' ? fallback : text;
};
