// خط زمني واحد للكاميرا والإضاءة؛ القيم مشتقة من التمرير وقابلة للعكس.
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { const v = clamp(x); return v * v * (3 - 2 * v); };
export function storyState(progress) {
  const p = Math.max(0, Math.min(4, progress));
  const zoom = smooth(p / 0.95);
  const light = 1 - smooth(p / 0.65) + smooth((p - 1.6) / 0.4)
    - smooth((p - 2.6) / 0.4) + smooth((p - 3.6) / 0.4);
  return { zoom, light: clamp(light), halo: clamp(light) * smooth((p - 1.2) / 0.5), rotation: p * Math.PI * 0.8 };
}

export function progressAt(offset, stops) {
  for (let i = 1; i < stops.length; i += 1) {
    if (offset <= stops[i]) return i - 1 + clamp((offset - stops[i - 1]) / Math.max(1, stops[i] - stops[i - 1]));
  }
  return stops.length - 1;
}
