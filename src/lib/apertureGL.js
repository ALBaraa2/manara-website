// نافذة «لحظات حقيقية» بـ WebGL2: العنوان يُرسم مرة واحدة عند القياس إلى قناع صغير، ويُحسب منه حقل مسافات
// (لكل بكسل: بُعده الموقَّع عن حافة أقرب حرف). بعدها كل إطار مجرد مُظلِّل واحد:
//   انتفاخ الحروف = عتبة على المسافة، وخطوط الكنتور = خطوط عند مسافات ثابتة من الشكل،
//   والإطار المستدير = اتحاد ناعم مع مسافة مستطيل مستدير، فتذوب الحروف فيه بدل أن تُغطّى.
// بدلاً من إعادة رسم 13 نسخة من نص بخط عريض وقناع SVG بحجم الشاشة في كل إطار (كان يستغرق مئات الملّي ثانية).

// دقة حقل المسافات: بكسل CSS كامل (بحد أقصى ~1.6 مليون بكسل)؛ الحواف دقيقة لما دون البكسل بفضل تنعيم الخط نفسه
const SDF_MAX_PIXELS = 1.6e6;
const MAX_DPR = 2;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSdf;
uniform sampler2D uPhoto;
uniform vec2 uRes;        // أبعاد الشاشة بوحدة CSS
uniform float uDpr;
uniform float uSwell;     // نصف عرض الانتفاخ (px)
uniform vec4 uRect;       // x, y, w, h
uniform float uRectR;     // نصف قطر الزوايا
uniform float uRectOn;    // 0..1
uniform float uMelt;      // نعومة الاتحاد بين الحروف والإطار
uniform float uGap;       // المسافة بين خطوط الكنتور
uniform float uRings;     // عدد الخطوط
uniform float uRingAlpha;
uniform vec4 uPhotoBox;   // موضع الصورة وحجمها (px)
uniform float uPhotoReady;
uniform float uFill;       // 0 = نص أبيض عادي، 1 = الصورة داخل الحروف
uniform vec3 uBg;
uniform vec3 uLine;
uniform vec3 uWarm;
out vec4 outColor;

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float dText = texture(uSdf, p / uRes).r - uSwell;
  float d = dText;
  if (uRectOn > 0.0) {
    vec2 c = uRect.xy + uRect.zw * 0.5;
    float dRect = sdRoundRect(p - c, uRect.zw * 0.5, uRectR) + (1.0 - uRectOn) * 400.0;
    d = smin(dText, dRect, uMelt);
  }

  vec3 color = uBg;
  // خطوط الكنتور حول الشكل (حروف أو إطار) — الأقرب ملوّن ببرتقالي خافت
  float k = d / uGap;
  float idx = floor(k + 0.5);
  if (idx >= 1.0 && idx <= uRings && uRingAlpha > 0.0) {
    float lw = max(fwidth(d), 1e-3);
    float line = 1.0 - smoothstep(0.5, 0.5 + 1.5 * lw, abs(d - idx * uGap));
    vec3 lc = idx == 1.0 ? uWarm : uLine;
    float a = (idx == 1.0 ? 0.55 : 0.14) * line * uRingAlpha * uFill;
    color = mix(color, lc, a);
  }

  // تنعيم بعرض بكسل جهاز واحد تقريباً (fwidth)، فتبقى الحواف حادة على الشاشات عالية الكثافة
  float aa = max(fwidth(d), 1e-3) * 0.75;
  float inside = 1.0 - smoothstep(-aa, aa, d);
  if (inside > 0.0) {
    vec2 uv = (p - uPhotoBox.xy) / uPhotoBox.zw;
    vec3 ph = mix(uBg, texture(uPhoto, uv).rgb, uPhotoReady);
    color = mix(color, mix(vec3(1.0), ph, uFill), inside);
  }
  outColor = vec4(color, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

// تحويل المسافة الإقليدية (Felzenszwalb) أحادي البعد
function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q += 1) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k -= 1; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k += 1; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

// تحويل مسافة ثنائي الأبعاد: لكل بكسل مربع بُعده عن أقرب بكسل «هدف»
function edt2d(isTarget, w, h) {
  const INF = 1e20;
  const grid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) grid[i] = isTarget(i) ? 0 : INF;
  const n = Math.max(w, h);
  const f = new Float32Array(n); const d = new Float32Array(n);
  const v = new Int32Array(n); const z = new Float32Array(n + 1);
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y += 1) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x += 1) grid[y * w + x] = d[x];
  }
  return grid;
}

// حقل مسافة موقَّع (بوحدة CSS): موجب خارج الحروف، سالب داخلها، والحافة عند الصفر.
// (حقل غير موقَّع كان يجعل داخل الحروف كله «على الحافة» فيظهر نصف شفاف: نص رمادي وصورة باهتة)
function distanceField(alpha, w, h, scale) {
  const inside = (i) => alpha[i * 4 + 3] > 127;
  const out = edt2d(inside, w, h);
  const inn = edt2d((i) => !inside(i), w, h);
  const field = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const a = alpha[i * 4 + 3];
    // بكسلات الحافة: موضع الحافة من تغطية الخط المنعَّم (دقة أقل من بكسل)، والبقية من تحويل المسافة
    const d = a > 0 && a < 255 ? 0.5 - a / 255 : (out[i] > 0 ? Math.sqrt(out[i]) - 0.5 : 0.5 - Math.sqrt(inn[i]));
    field[i] = d / scale;
  }
  return field;
}

const hex = (css) => {
  const m = css.trim().match(/^#?([0-9a-f]{6})$/i);
  const n = m ? parseInt(m[1], 16) : 0x1d1540;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function createAperture(canvas, { photoUrl }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
  } catch {
    return null;
  }
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = (name) => gl.getUniformLocation(program, name);
  const u = Object.fromEntries(['uSdf', 'uPhoto', 'uRes', 'uDpr', 'uSwell', 'uRect', 'uRectR', 'uRectOn', 'uMelt', 'uGap', 'uRings', 'uRingAlpha', 'uPhotoBox', 'uPhotoReady', 'uFill', 'uBg', 'uLine', 'uWarm'].map((n) => [n, U(n)]));

  const tex = (unit) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const sdfTex = tex(0);
  const photoTex = tex(1);
  gl.uniform1i(u.uSdf, 0);
  gl.uniform1i(u.uPhoto, 1);
  // لون صغير مؤقت حتى تُحمَّل الصورة
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([29, 21, 64, 255]));

  const styles = getComputedStyle(document.documentElement);
  gl.uniform3fv(u.uBg, hex(styles.getPropertyValue('--color-brand-purple-dark') || '#1d1540'));
  gl.uniform3fv(u.uLine, [1, 1, 1]);
  gl.uniform3fv(u.uWarm, hex(styles.getPropertyValue('--color-brand-orange-light') || '#f58a45'));

  let photoReady = 0;
  let disposed = false;
  let last = null;
  let layout = null;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (disposed) return;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, photoTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    photoReady = 1;
    if (last) draw(last);
  };
  img.src = photoUrl;

  // يُستدعى عند تغيّر الحجم أو اللغة: يرسم العنوان، يحسب حقل المسافات، ويعيد حجم الخط ومستطيل العنوان
  function setLayout({ W, H, lines, dir, fontFamily, fitW, fitH, centerY }) {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const SDF_SCALE = Math.min(1, Math.sqrt(SDF_MAX_PIXELS / (W * H)));
    const sw = Math.max(2, Math.round(W * SDF_SCALE));
    const sh = Math.max(2, Math.round(H * SDF_SCALE));
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.direction = dir;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // حجم الخط بحيث يملأ العنوان العرض المتاح دون تجاوز الارتفاع المتاح
    ctx.font = `700 100px ${fontFamily}`;
    const metrics = lines.map((line) => ctx.measureText(line));
    const widest = Math.max(...metrics.map((m) => m.width));
    const asc = Math.max(...metrics.map((m) => m.actualBoundingBoxAscent));
    const desc = Math.max(...metrics.map((m) => m.actualBoundingBoxDescent));
    const lineH = 102;
    const blockH = asc + desc + lineH * (lines.length - 1);
    const font = Math.min(fitW / widest, fitH / blockH) * 100;
    const k = font / 100;
    const top = centerY - (blockH * k) / 2;

    ctx.clearRect(0, 0, sw, sh);
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${font * SDF_SCALE}px ${fontFamily}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, (W / 2) * SDF_SCALE, (top + asc * k + i * lineH * k) * SDF_SCALE);
    });
    const field = distanceField(ctx.getImageData(0, 0, sw, sh).data, sw, sh, SDF_SCALE);

    // مستطيل العنوان الفعلي (لبداية الإطار)
    const widthPx = Math.max(...metrics.map((m) => m.width)) * k;
    const box = { x: W / 2 - widthPx / 2, y: top, w: widthPx, h: blockH * k };

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sdfTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, sw, sh, 0, gl.RED, gl.FLOAT, field);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uDpr, dpr);
    layout = { W, H, font, box };
    return layout;
  }

  function draw(params) {
    if (disposed || !layout) return;
    last = params;
    const { fill, swell, rect, rectR, rectOn, melt, gap, rings, ringAlpha, photo } = params;
    gl.uniform1f(u.uSwell, swell);
    gl.uniform4f(u.uRect, rect.x, rect.y, rect.w, rect.h);
    gl.uniform1f(u.uRectR, rectR);
    gl.uniform1f(u.uRectOn, rectOn);
    gl.uniform1f(u.uMelt, melt);
    gl.uniform1f(u.uGap, gap);
    gl.uniform1f(u.uRings, rings);
    gl.uniform1f(u.uRingAlpha, ringAlpha);
    gl.uniform4f(u.uPhotoBox, photo.x, photo.y, photo.w, photo.h);
    gl.uniform1f(u.uPhotoReady, photoReady);
    // حتى تُحمَّل الصورة يبقى النص أبيض
    gl.uniform1f(u.uFill, fill * photoReady);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    setLayout,
    draw,
    dispose() {
      disposed = true;
      img.onload = null;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
