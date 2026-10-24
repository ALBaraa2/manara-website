// تشتّت حتمي لكل كلمة: نفس النص يتشتت دائماً بالطريقة نفسها، فيكون التمرير للأعلى والأسفل متطابقاً.
const noise = (n, salt) => {
  const v = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const signed = (n, salt) => noise(n, salt) * 2 - 1;

// الكلمة هي أصغر وحدة: تقسيم الحروف يقطع اتصال الحروف العربية.
export function splitWords(text) {
  return String(text).split(/(\s+)/).filter(Boolean).map(part => ({ part, isWord: /\S/.test(part) }));
}
// **عبارة** تعني إبرازاً؛ العلامات لا تُعرض ولا تُحسب كلمات.
export function parseEmphasis(text) {
  return String(text).split('**').map((chunk, i) => ({ text: chunk, em: i % 2 === 1 })).filter(seg => seg.text);
}
export const plainText = (text) => String(text).split('**').join('');
export const countWords = (text) => splitWords(plainText(text)).filter(p => p.isWord).length;

// dx/dy بوحدة em، r بالدرجات، blur بالبكسل، s العمق (-1..1).
export function wordScatter(index) {
  const dx = signed(index, 1);
  return {
    dx: +(dx * 0.9).toFixed(3),
    dy: +(signed(index, 2) * 0.55).toFixed(3),
    r: +(signed(index, 3) * 5).toFixed(2),
    blur: +(3 + noise(index, 4) * 4).toFixed(2),
    // عمق: موجب = أقرب للمشاهد (أكبر)، سالب = أبعد (أصغر)؛ الكلمات البعيدة تبدو أكثر ضبابية
    s: +signed(index, 6).toFixed(3),
  };
}

// تقدّم الكلمة (0 ضبابي → 1 واضح). الكلمات الأولى تتضح أولاً كأن شعاعاً يمسح السطر.
export const wordProgress = (blockProgress, t, spread = 0.7) =>
  Math.max(0, Math.min(1, blockProgress * (1 + spread) - t * spread));
