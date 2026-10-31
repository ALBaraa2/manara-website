// المشهد ثلاثي الأبعاد للواجهة الأولى: منارة تنهض من الركام وسط مدينة ليلية،
// وحزمة ضوئها الدوّارة تُضيء نوافذ كل بناء تمرّ عليه ("نور يبدد الظلام").
// يُحمَّل هذا الملف عند الحاجة فقط (import ديناميكي) حتى لا يثقل التحميل الأول للموقع.

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  Quaternion,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Euler,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { storyState } from './storyTimeline';

// ---------- ثوابت المشهد ----------

const LAMP_Y = 5.85; // ارتفاع مصباح المنارة
const GALLERY_TOP = 5.57; // سطح الشرفة (أرضية غرفة المصباح)
const OPTIC_BASE = LAMP_Y - 0.22; // أسفل العدسة الدوّارة
const SHORE_Z = -30; // خط الشاطئ: البحر أمامه والمدينة خلفه
const BEAM_PERIOD = 14; // ثوانٍ لكل دورة كاملة
const OMEGA = (Math.PI * 2) / BEAM_PERIOD;
const IGNITE_AT = 3.0; // لحظة انطلاق الحزمة بعد بدء الدخول
const FINAL_T = 60; // حالة "مكتملة" تُستخدم عند تقليل الحركة
const INTRO_END = 4.6; // نهاية الافتتاح: هبوط الكاميرا (3.8) واشتعال المصباح وانطلاق الحزمة (IGNITE_AT + 1.3)
const smooth01 = (x) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v); };
const BEAM_LENGTH = 30;
const BEAM_RADIUS = 2.4;
const BEAM_TILT = 0.035; // ميل الحزمة نحو الأسفل (راديان)
// ختام الحكاية: الكاميرا تبتعد عن المصباح لتكشف المدينة (مضاعف مسافة الراحة وارتفاع إضافي)، وتتسع الحزمة وتمتد
// فتصل إلى المدينة كلها، ثم يتسلّم القسم التالي الشاشة
const OUTRO_DISTANCE = 1.5;
const OUTRO_RISE = 1.4;
const OUTRO_ANCHOR_Y = 0.3; // موضع المصباح الرأسي في اللقطة الواسعة
const OUTRO_BEAM = { length: 0.45, spread: 0.9 };

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ألوان الهوية تُقرأ من متغيرات CSS (src/index.css) حتى يبقى مصدرها واحداً
function brandPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(`--color-brand-${name}`).trim() || fallback;
  return {
    night: new Color(read('night', '#0c0820')),
    storyDark: new Color(read('story-dark', '#05030e')),
    purpleDark: new Color(read('purple-dark', '#1d1540')),
    purple: new Color(read('purple', '#312364')),
    orange: new Color(read('orange', '#f37321')),
    orangeLight: new Color(read('orange-light', '#f58a45')),
  };
}

// الشيدرات المخصصة لا تمرّ بـ tone mapping حتى تبقى ألوان الهوية كما هي
const COLORSPACE_OUT = /* glsl */ `
  #include <colorspace_fragment>
`;

// ---------- الأنسجة المرسومة برمجياً ----------

// قناع الخطوط الحلزونية على جسم المنارة: الأبيض يبقى، والأشرطة المائلة (الأسود) تُقصّ فتصبح شفافة كما في الشعار
function stripeMask() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = '#000000';

  const period = 512 / 3;
  const band = period * 0.36;
  // ميل الشريط يساوي دورة كاملة عبر عرض النسيج حتى يلتحم الطرفان بلا فاصل
  for (let k = -2; k < 6; k += 1) {
    const y = k * period;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(90, y - period * 0.18, 170, y - period * 0.7, 256, y - period);
    ctx.lineTo(256, y - period + band);
    ctx.bezierCurveTo(170, y - period * 0.7 + band, 90, y - period * 0.18 + band, 0, y + band);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,236,214,0.75)');
  g.addColorStop(0.45, 'rgba(255,190,140,0.22)');
  g.addColorStop(1, 'rgba(255,170,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// ---------- مكونات المشهد ----------

function buildSky(palette) {
  const material = new ShaderMaterial({
    uniforms: {
      uHorizon: { value: palette.purpleDark.clone().lerp(palette.purple, 0.45) },
      uZenith: { value: palette.night },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uHorizon, uZenith;
      varying vec3 vDir;
      void main() {
        vec3 dir = normalize(vDir);
        vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.6, dir.y));
        gl_FragColor = vec4(col, 1.0);
        ${COLORSPACE_OUT}
      }
    `,
    depthWrite: false,
    side: BackSide,
    toneMapped: false,
  });
  const sky = new Mesh(new SphereGeometry(50, 32, 16), material);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  return sky;
}

function buildStars(rand) {
  const count = 650;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const u = rand();
    const y = 0.06 + u * u * 0.94; // كثافة أعلى قرب الأفق قليلاً
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3);
    sizes[i] = rand() > 0.92 ? 2.4 : 1 + rand() * 0.9;
    phases[i] = rand() * 100;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uFade: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime, uPixelRatio;
      varying float vAlpha;
      void main() {
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position * 45.0, 1.0);
        gl_Position = p.xyww;
        gl_PointSize = aSize * uPixelRatio;
        float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + fract(aPhase) * 1.4) + aPhase);
        vAlpha = twinkle * smoothstep(0.05, 0.35, position.y);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vec3(1.0, 0.97, 1.0), d * vAlpha * uFade * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(geometry, material);
  stars.frustumCulled = false;
  stars.renderOrder = -9;
  return stars;
}

// المدينة على الشاطئ المقابل: InstancedMesh واحد لكل الأبنية (استدعاء رسم واحد) مع نوافذ تُرسم داخل الـ shader
function buildCity(rand, palette, sharedUniforms) {
  const placements = [];
  const spacing = 2.7;
  for (let gx = -18; gx <= 18; gx += 1) {
    for (let gz = 0; gz >= -19; gz -= 1) {
      if (rand() < 0.3) continue; // شوارع وفراغات
      const x = gx * spacing + (rand() - 0.5) * 0.9;
      const z = SHORE_Z - 1.6 + gz * spacing + (rand() - 0.5) * 0.9;
      const depth = SHORE_Z - z;
      const w = 1 + rand() * 1.3;
      const d = 1 + rand() * 1.3;
      // الصف الأول على الكورنيش منخفض، والأفق خلفه أعلى
      const front = clamp01(depth / 10);
      // جهة النص (+x قبل الانعكاس) أخفض حتى لا تزاحم الأبنية العنوان
      const textSide = lerp(1, 0.35, clamp01((x - 1) / 10));
      const h = (1 + rand() * 2.2 + depth * 0.05 + (rand() > 0.92 ? 2.4 : 0)) * lerp(0.55, 1, front) * textSide;
      const tilt = rand() > 0.93 ? (rand() - 0.5) * 0.2 : 0; // أبنية متضررة هنا وهناك
      placements.push({ x, z, w, d, h, rotY: (rand() - 0.5) * 0.12, tilt, seed: rand() });
    }
  }

  const geometry = new BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  const material = new ShaderMaterial({
    uniforms: {
      ...sharedUniforms,
      uBase: { value: palette.night.clone().lerp(palette.purpleDark, 0.35) },
      uTop: { value: palette.purpleDark.clone().lerp(palette.purple, 0.3) },
      uMoon: { value: new Color('#7d6bd6') },
      uMoonDir: { value: new Vector3(-0.45, 0.65, 0.6).normalize() },
      uWindow: { value: palette.orangeLight },
      uWindowWarm: { value: new Color('#ffcf8a') },
      uBeamColor: { value: new Color('#ffb070') },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aScale;
      attribute float aSeed;
      varying vec3 vLocal;
      varying vec3 vNormalL;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vCenter;
      varying float vHeight;
      varying float vSeed;
      varying float vDepth;
      void main() {
        vLocal = position * aScale;
        vNormalL = normal;
        vHeight = aScale.y;
        vSeed = aSeed;
        mat4 m = modelMatrix * instanceMatrix;
        vNormalW = normalize(mat3(m) * normal);
        vec4 world = m * vec4(position, 1.0);
        vWorld = world.xyz;
        vCenter = (m * vec4(0.0, 0.0, 0.0, 1.0)).xz;
        vec4 mv = viewMatrix * world;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase, uTop, uMoon, uMoonDir, uWindow, uWindowWarm, uBeamColor, uFogColor, uLamp;
      uniform float uBeamAngle, uBeamStrength, uSweep, uSweepStart, uTime, uFogDensity, uCityLight;
      varying vec3 vLocal;
      varying vec3 vNormalL;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vCenter;
      varying float vHeight;
      varying float vSeed;
      varying float vDepth;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main() {
        vec3 n = normalize(vNormalW);
        float hN = clamp(vLocal.y / max(vHeight, 0.001), 0.0, 1.0);
        vec3 col = mix(uBase, uTop, hN * 0.7);
        col += uMoon * max(dot(n, uMoonDir), 0.0) * 0.09;

        // ضوء الحزمة على الواجهات
        vec2 d = vWorld.xz - uLamp.xz;
        float dist = length(d);
        vec2 dn = d / max(dist, 0.001);
        float c = dot(dn, vec2(cos(uBeamAngle), -sin(uBeamAngle)));
        float beam = pow(max(c, 0.0), 80.0) + pow(max(-c, 0.0), 80.0);
        beam *= uBeamStrength * smoothstep(-1.0, uLamp.y, vWorld.y) / (1.0 + dist * 0.07);
        col += uBeamColor * beam * 0.32;

        // النوافذ على الجدران فقط
        float wall = 1.0 - step(0.5, abs(vNormalL.y));
        float u = abs(vNormalL.x) > 0.5 ? vLocal.z : vLocal.x;
        vec2 cell = vec2(u / 0.46 + 0.5, vLocal.y / 0.58);
        vec2 id = floor(cell);
        vec2 f = fract(cell);
        vec2 aa = fwidth(cell);
        float wx = smoothstep(0.28 - aa.x, 0.28 + aa.x, f.x) * (1.0 - smoothstep(0.72 - aa.x, 0.72 + aa.x, f.x));
        float wy = smoothstep(0.3 - aa.y, 0.3 + aa.y, f.y) * (1.0 - smoothstep(0.76 - aa.y, 0.76 + aa.y, f.y));
        float face = vNormalL.x * 2.0 + vNormalL.z * 3.0;
        float rnd = hash(id + vec2(vSeed * 31.7, face * 7.3));
        float occupied = step(0.22, fract(vSeed * 7.13)); // بعض الأبنية مهجورة بلا أضواء
        float exists = step(rnd, 0.24) * occupied * step(0.5, vLocal.y) * step(vLocal.y, vHeight - 0.25);

        // تضيء نوافذ البناء بعد أن تمرّ عليه إحدى الحزمتين (حزمتان متقابلتان ← دورية π)
        vec2 cd = vCenter - uLamp.xz;
        float rel = mod(atan(-cd.y, cd.x) - uSweepStart, 3.14159265);
        float start = rel + hash(id + vSeed) * 0.9;
        float lit = smoothstep(start, start + 0.12, uSweep);
        float flicker = rnd < 0.025 ? 0.5 + 0.5 * step(0.0, sin(uTime * (1.5 + rnd * 90.0))) : 1.0;
        vec3 wcol = mix(uWindow, uWindowWarm, hash(id * 1.7 + vSeed));
        float w = wall * wx * wy * exists * lit * flicker * uCityLight;
        col = mix(col, wcol, w * 0.92);

        // الضباب يبتلع الأبنية البعيدة لكن أضواء النوافذ تبقى ظاهرة جزئياً
        float fog = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
        col = mix(col, uFogColor, fog * (1.0 - w * 0.45));
        gl_FragColor = vec4(col, 1.0);
        ${COLORSPACE_OUT}
      }
    `,
  });

  const mesh = new InstancedMesh(geometry, material, placements.length);
  const scales = new Float32Array(placements.length * 3);
  const seeds = new Float32Array(placements.length);
  const matrix = new Matrix4();
  const quat = new Quaternion();
  const euler = new Euler();
  placements.forEach((p, i) => {
    euler.set(p.tilt, p.rotY, p.tilt * 0.6);
    quat.setFromEuler(euler);
    matrix.compose(new Vector3(p.x, 0, p.z), quat, new Vector3(p.w, p.h, p.d));
    mesh.setMatrixAt(i, matrix);
    scales.set([p.w, p.h, p.d], i * 3);
    seeds[i] = p.seed;
  });
  geometry.setAttribute('aScale', new InstancedBufferAttribute(scales, 3));
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// جزيرة صغيرة من كتل الخرسانة المتكسرة تقف عليها المنارة (كأرصفة غزة البحرية المبنية من الركام)
function buildIslet(rand, palette) {
  const count = 120;
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshLambertMaterial({ color: 0xffffff });
  const mesh = new InstancedMesh(geometry, material, count);
  const matrix = new Matrix4();
  const quat = new Quaternion();
  const euler = new Euler();
  const color = new Color();
  const base = palette.purpleDark.clone().lerp(palette.purple, 0.25);

  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    let r;
    let y;
    let s;
    if (i < 28) {
      // كتل القاعدة الكبيرة
      r = 0.9 + rand() * 1.6;
      s = new Vector3(0.6 + rand() * 0.7, 0.35 + rand() * 0.35, 0.5 + rand() * 0.6);
      y = -0.15 + rand() * 0.25;
    } else if (i < 80) {
      // كتل أصغر مكدّسة فوقها
      r = 0.6 + rand() * 1.5;
      s = new Vector3(0.3 + rand() * 0.4, 0.15 + rand() * 0.2, 0.25 + rand() * 0.35);
      y = 0.15 + rand() * 0.3;
    } else {
      // قطع متناثرة نصف غارقة حول الجزيرة
      r = 2.6 + rand() * 4.5;
      s = new Vector3(0.2 + rand() * 0.45, 0.1 + rand() * 0.2, 0.2 + rand() * 0.4);
      y = -0.08;
    }
    euler.set((rand() - 0.5) * 0.8, rand() * Math.PI, (rand() - 0.5) * 0.8);
    quat.setFromEuler(euler);
    matrix.compose(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r), quat, s);
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, color.copy(base).multiplyScalar(0.7 + rand() * 0.6));
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// البحر: مرآة مستوية حقيقية (Reflector) بدقة منخفضة تتموّج بأمواج محسوبة في الـ fragment shader،
// فتنعكس عليه المنارة والقرص والحزمة وأضواء المدينة، مع ممر متلألئ تحت المصباح
function buildSea(palette, sharedUniforms, horizon) {
  const sea = new Reflector(new PlaneGeometry(400, 400), {
    textureWidth: 512,
    textureHeight: 512,
    multisample: 0,
    clipBias: 0.003,
    shader: {
      name: 'HeroSea',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uDeep: { value: palette.night.clone().lerp(palette.purpleDark, 0.45) },
        uHorizon: { value: horizon },
        uLampColor: { value: new Color('#ffd2a1') },
        uLampLevel: { value: 0 },
        uBeamColor: { value: new Color('#ffb070') },
      },
      vertexShader: /* glsl */ `
        uniform mat4 textureMatrix;
        varying vec4 vUvRefl;
        varying vec3 vWorld;
        varying float vDepth;
        void main() {
          vUvRefl = textureMatrix * vec4(position, 1.0);
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          vec4 mv = viewMatrix * world;
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec3 uDeep, uHorizon, uLampColor, uBeamColor, uFogColor, uLamp;
        uniform float uLampLevel, uBeamAngle, uBeamStrength, uTime, uFogDensity;
        varying vec4 vUvRefl;
        varying vec3 vWorld;
        varying float vDepth;

        vec2 wave(vec2 p, vec2 dir, float k, float speed, float amp) {
          vec2 d = normalize(dir);
          return d * k * amp * cos(dot(p, d) * k + uTime * speed);
        }

        void main() {
          vec2 p = vWorld.xz;
          vec2 g = wave(p, vec2(0.8, 0.6), 0.9, 1.1, 0.10)
                 + wave(p, vec2(-0.5, 0.9), 1.6, 1.6, 0.06)
                 + wave(p, vec2(0.2, -1.0), 2.9, 2.2, 0.035);
          // التفاصيل الدقيقة تخفت مع البعد حتى لا يتلألأ الأفق بشكل مزعج
          float near = 1.0 - smoothstep(12.0, 55.0, vDepth);
          g += (wave(p, vec2(-0.9, -0.3), 4.7, 3.0, 0.02) + wave(p, vec2(0.6, -0.7), 7.3, 3.8, 0.012)) * near;
          vec3 n = normalize(vec3(-g.x, 1.0, -g.y));

          vec3 v = normalize(cameraPosition - vWorld);
          float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);

          // الانعكاس الحقيقي مُزاحاً بالأمواج (يمتد عمودياً كما على الماء)
          vec4 uv = vUvRefl;
          uv.xy += vec2(n.x, n.z * 2.2) * 0.07 * uv.w * mix(0.35, 1.0, near);
          vec3 refl = texture2DProj(tDiffuse, uv).rgb;
          vec3 col = mix(uDeep, uHorizon, fresnel * 0.6);
          col = mix(col, refl, 0.6 + 0.35 * fresnel);

          // ممر المصباح المتلألئ
          vec3 r = reflect(-v, n);
          float lampDot = max(dot(r, normalize(uLamp - vWorld)), 0.0);
          col += uLampColor * (pow(lampDot, 400.0) * 1.8 + pow(lampDot, 50.0) * 0.12) * uLampLevel;

          // الحزمة تدفئ سطح الماء حين تمرّ
          vec2 d = vWorld.xz - uLamp.xz;
          float dist = length(d);
          float c = dot(d / max(dist, 0.001), vec2(cos(uBeamAngle), -sin(uBeamAngle)));
          float beam = (pow(max(c, 0.0), 60.0) + pow(max(-c, 0.0), 60.0)) * uBeamStrength / (1.0 + dist * 0.08);
          col += uBeamColor * beam * 0.14;

          float fog = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
          col = mix(col, uFogColor, fog);
          gl_FragColor = vec4(col, 1.0);
          ${COLORSPACE_OUT}
        }
      `,
    },
  });
  sea.rotation.x = -Math.PI / 2;
  // Reflector ينسخ الـ uniforms، فنعيد ربط المشتركة منها بالمرجع حتى تتحدّث مع المشهد
  ['uLamp', 'uBeamAngle', 'uBeamStrength', 'uTime', 'uFogColor', 'uFogDensity'].forEach((key) => {
    sea.material.uniforms[key] = sharedUniforms[key];
  });
  return sea;
}

function buildLighthouse(palette) {
  const group = new Group();
  const white = new MeshStandardMaterial({ color: '#f4f1fb', emissive: '#ffffff', emissiveIntensity: 0.12, roughness: 0.5 });
  const dark = new MeshStandardMaterial({ color: palette.purpleDark, roughness: 0.7 });
  const accent = new MeshStandardMaterial({ color: palette.orange, emissive: palette.orange, emissiveIntensity: 0.45, roughness: 0.45 });
  // الأشرطة مقصوصة (alphaTest) والوجه الخارجي فقط مرسوم، فتظهر السماء والبحر من خلال الفتحات كما في الشعار
  // توهج ذاتي خفيف على الأجزاء البيضاء فقط حتى لا يصبغها ضوء الليل البنفسجي
  const tower = new MeshStandardMaterial({
    color: '#f6f3fc',
    alphaMap: stripeMask(),
    alphaTest: 0.5,
    emissive: '#ffffff',
    emissiveIntensity: 0.16,
    roughness: 0.55,
  });

  const add = (geometry, material, y) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.y = y;
    group.add(mesh);
    return mesh;
  };

  add(new CylinderGeometry(1.0, 1.15, 0.45, 40), dark, 0.22);
  add(new CylinderGeometry(0.46, 0.8, 5.0, 48, 1, true), tower, 2.95);
  add(new CylinderGeometry(0.8, 0.66, 0.14, 48), white, 5.5);
  const rail = add(new TorusGeometry(0.75, 0.022, 6, 48), accent, 5.78);
  rail.rotation.x = Math.PI / 2;
  // قوائم الدرابزين: تحمل الحلقة فوق سطح الشرفة (أعلاه عند 5.57) بدل أن تطفو
  const stanchion = new CylinderGeometry(0.014, 0.014, 5.78 - GALLERY_TOP, 6);
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const post = add(stanchion, accent, (5.78 + GALLERY_TOP) / 2);
    post.position.x = Math.cos(a) * 0.75;
    post.position.z = Math.sin(a) * 0.75;
  }

  // قاعدة ثابتة تحمل العدسة الدوّارة (العدسة نفسها في buildOptic)
  const metal = new MeshStandardMaterial({ color: '#9a93ab', roughness: 0.35, metalness: 0.6 });
  add(new CylinderGeometry(0.05, 0.09, OPTIC_BASE - GALLERY_TOP, 20), metal, (OPTIC_BASE + GALLERY_TOP) / 2);

  // غرفة المصباح: زجاج مضيء شفاف بما يكفي لتظهر العدسة، وأعمدة رفيعة
  const glass = new MeshBasicMaterial({ color: '#ffe2c4', transparent: true, opacity: 0.28, depthWrite: false });
  add(new CylinderGeometry(0.38, 0.38, 0.62, 24, 1, true), glass, LAMP_Y);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const post = add(new BoxGeometry(0.035, 0.62, 0.035), accent, LAMP_Y);
    post.position.x = Math.cos(a) * 0.385;
    post.position.z = Math.sin(a) * 0.385;
  }
  add(new CylinderGeometry(0.5, 0.5, 0.06, 40), white, 6.19);
  add(new SphereGeometry(0.44, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, 6.2);
  add(new CylinderGeometry(0.018, 0.018, 0.2, 8), accent, 6.72);
  add(new SphereGeometry(0.07, 16, 10), accent, 6.85);

  return { group, glass };
}

// نقش عدسة «عين الثور» (Fresnel): بؤرة ساطعة تحيط بها حلقات منشورية متناوبة تخفت نحو الحافة
function bullseyeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const c = 64;
  const core = ctx.createRadialGradient(c, c, 0, c, c, 64);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.2, 'rgba(255,240,215,0.95)');
  core.addColorStop(0.55, 'rgba(255,180,110,0.7)');
  core.addColorStop(1, 'rgba(190,90,80,0.6)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(c, c, 63, 0, Math.PI * 2);
  ctx.fill();
  // الحلقات: حافة مضيئة وظل داخلي لكل حلقة، كما ينكسر الضوء في درجات العدسة
  for (let r = 18; r < 62; r += 9) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(110,40,70,0.7)';
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,250,235,0.9)';
    ctx.beginPath();
    ctx.arc(c, c, r + 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// الحلقات المنشورية الأفقية لجسم العدسة (أعلى وأسفل النطاق الأوسط)
function prismTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < 64; y += 8) {
    const band = ctx.createLinearGradient(0, y, 0, y + 8);
    band.addColorStop(0, 'rgba(255,250,240,0.95)');
    band.addColorStop(0.35, 'rgba(255,196,130,0.55)');
    band.addColorStop(1, 'rgba(120,52,70,0.75)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y, 4, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// الجهاز البصري الدوّار: مصدر ضوء ثابت في المركز تدور حوله «خلية نحل» زجاجية بعدستين متقابلتين.
// كل عدسة تجمع الضوء في إحدى الحزمتين (المخروطان في buildBeams يتجهان نحو ±x)، فتدور المجموعة بزاوية الحزمة نفسها.
function buildOptic(palette) {
  const group = new Group();
  group.position.y = LAMP_Y;
  const rotor = new Group(); // الجزء الدوّار؛ المصدر في المركز لا يحتاج دوراناً
  group.add(rotor);

  const brass = new MeshStandardMaterial({ color: palette.orange, emissive: palette.orange, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.2 });
  const prism = new MeshBasicMaterial({ map: prismTexture(), transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
  const core = new MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false });

  const R = 0.2;
  const H = 0.3;
  const place = (mesh, y = 0) => { mesh.position.y = y; rotor.add(mesh); return mesh; };

  // المصدر: نقطة ساطعة عند LAMP_Y تماماً، رأس مخروطي الحزمة
  const source = new Mesh(new SphereGeometry(0.05, 16, 10), core);
  source.renderOrder = 1.5;
  group.add(source);

  // جسم العدسة وقمتاها المستدقتان (شكل خلية النحل المعروف لعدسات Fresnel)
  const drum = place(new Mesh(new CylinderGeometry(R, R, H, 32, 1, true), prism));
  const top = place(new Mesh(new CylinderGeometry(R * 0.5, R, 0.07, 32, 1, true), prism), H / 2 + 0.035);
  const bottom = place(new Mesh(new CylinderGeometry(R, R * 0.5, 0.07, 32, 1, true), prism), -H / 2 - 0.035);
  // ترتيب الرسم: كلها بعد توهج المصباح (Sprite إضافي يُشبع مركز الغرفة بالأبيض) وإلا ذابت تفاصيلها فيه؛
  // ثم من الخلف للأمام: العدسة البعيدة (1) ← المصدر (1.5) ← الجسم الزجاجي (2) ← العدسة القريبة (3)
  [drum, top, bottom].forEach((m) => { m.renderOrder = 2; });

  // الإطار النحاسي: حلقتان وأربعة قوائم بين العدستين
  const ring = new TorusGeometry(R + 0.004, 0.015, 6, 40);
  [H / 2, -H / 2].forEach((y) => { place(new Mesh(ring, brass), y).rotation.x = Math.PI / 2; });
  const bar = new BoxGeometry(0.026, H, 0.026);
  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const post = place(new Mesh(bar, brass));
    post.position.set(Math.cos(a) * (R + 0.004), 0, Math.sin(a) * (R + 0.004));
  }
  place(new Mesh(new CylinderGeometry(R * 0.55, R * 0.55, 0.025, 24), brass), -H / 2 - 0.08);

  // العدستان: كل واحدة على محور حزمتها (+x و -x) بإطار نحاسي
  const lensTexture = bullseyeTexture();
  const lensGeometry = new CircleGeometry(0.125, 32);
  const rim = new TorusGeometry(0.125, 0.016, 6, 32);
  const lenses = [1, -1].map((dir) => {
    const material = new MeshBasicMaterial({ map: lensTexture, transparent: true, depthWrite: false, toneMapped: false });
    const face = new Group();
    face.position.x = dir * (R + 0.006);
    face.rotation.y = dir * (Math.PI / 2); // وجه الدائرة (+z) نحو ±x
    const lens = new Mesh(lensGeometry, material);
    face.add(lens, new Mesh(rim, brass));
    rotor.add(face);
    return { lens, material, dir };
  });

  const toCamera = new Vector3();
  return {
    group,
    // angle هي زاوية الحزمة نفسها؛ lamp شدة الاشتعال (0..1)
    update(angle, lamp, cameraPosition) {
      rotor.rotation.y = angle;
      core.color.setRGB(lerp(0.55, 1.0, lamp), lerp(0.5, 0.94, lamp), lerp(0.62, 0.82, lamp));
      prism.color.setRGB(lerp(0.5, 1.0, lamp), lerp(0.46, 0.9, lamp), lerp(0.62, 0.85, lamp));
      // العدسة المواجهة للمشاهد تومض لحظة مرور حزمتها عليه، كما في المنارات الحقيقية
      toCamera.set(cameraPosition.x, 0, cameraPosition.z).normalize();
      const nx = Math.cos(angle);
      const nz = -Math.sin(angle);
      lenses.forEach(({ lens, material, dir }) => {
        const toward = dir * (nx * toCamera.x + nz * toCamera.z);
        lens.renderOrder = toward > 0 ? 3 : 1;
        const facing = Math.max(0, toward);
        const glow = lerp(0.45, 1.0, lamp) * (1 + 0.9 * lamp * facing ** 6);
        material.color.setRGB(glow, glow * lerp(1, 0.9, lamp), glow * lerp(1, 0.78, lamp));
      });
    },
  };
}

// حزمتا الضوء: مخروطان متقابلان بمادة إضافية تتلاشى مع المسافة وعند الحواف (إيحاء بحجم الضوء)
function buildBeams() {
  const length = BEAM_LENGTH;
  const material = new ShaderMaterial({
    uniforms: { uStrength: { value: 0 }, uWarm: { value: new Color('#ffe8d2') }, uTint: { value: new Color('#ff9c5a') } },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vNormalW;
      varying vec3 vView;
      void main() {
        vAlong = 1.0 - uv.y;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      uniform vec3 uWarm, uTint;
      varying float vAlong;
      varying vec3 vNormalW;
      varying vec3 vView;
      void main() {
        float fade = pow(1.0 - vAlong, 1.8) * smoothstep(0.0, 0.025, vAlong);
        float facing = pow(abs(dot(normalize(vNormalW), normalize(vView))), 1.4);
        float a = uStrength * fade * facing * 0.32;
        gl_FragColor = vec4(mix(uWarm, uTint, smoothstep(0.0, 0.5, vAlong)), a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
  });

  const pivot = new Group();
  pivot.position.y = LAMP_Y;
  [1, -1].forEach((dir) => {
    const geometry = new ConeGeometry(BEAM_RADIUS, length, 40, 1, true);
    geometry.translate(0, -length / 2, 0); // رأس المخروط عند المصباح
    geometry.rotateZ((dir * Math.PI) / 2); // يتجه أفقياً نحو +x أو -x
    const cone = new Mesh(geometry, material);
    cone.rotation.z = dir * -BEAM_TILT; // ميل خفيف نحو المدينة
    pivot.add(cone);
  });
  return { pivot, material };
}

// غبار عائم لا يظهر إلا داخل الحزمة
function buildDust(rand) {
  const count = 260;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const r = 1.2 + rand() * 16;
    positions.set([Math.cos(a) * r, LAMP_Y + (rand() - 0.5) * 3.2, Math.sin(a) * r], i * 3);
    phases[i] = rand() * 100;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBeamAngle: { value: 0 },
      uStrength: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime, uPixelRatio, uBeamAngle;
      varying float vBeam;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.21 + aPhase) * 0.45;
        p.y += sin(uTime * 0.17 + aPhase * 1.7) * 0.3;
        p.z += cos(uTime * 0.19 + aPhase * 0.6) * 0.45;
        vec2 dn = normalize(p.xz);
        float c = dot(dn, vec2(cos(uBeamAngle), -sin(uBeamAngle)));
        vBeam = pow(max(c, 0.0), 40.0) + pow(max(-c, 0.0), 40.0);
        vBeam *= exp(-pow((p.y - ${LAMP_Y.toFixed(2)}) / 1.3, 2.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.6 + fract(aPhase) * 1.6) * uPixelRatio * (14.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      varying float vBeam;
      void main() {
        float d = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(1.0, 0.86, 0.7, d * vBeam * uStrength * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return new Points(geometry, material);
}

// ---------- الواجهة العامة ----------

export function createHeroScene(container, { mirrored = false, reducedMotion = false, getComposition, onContextLost, onBeam }) {
  const rand = seeded(1948);
  const palette = brandPalette();
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 1.75);
  let reflectionScale = isCoarse ? 0.35 : 0.5; // الانعكاس بدقة أقل من الشاشة (توفير للـ GPU)

  const renderer = new WebGLRenderer({
    antialias: (window.devicePixelRatio || 1) < 1.5,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(palette.night);

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const scene = new Scene();
  const fog = new FogExp2(palette.purpleDark.clone().lerp(palette.purple, 0.45), 0.02);
  scene.fog = fog;

  const camera = new PerspectiveCamera(34, 1, 0.1, 160);

  // إضاءة: سماء ليلية بنفسجية + ضوء قمر بارد + ضوء المصباح الدافئ
  scene.add(new HemisphereLight('#7f72c8', palette.night, 0.9));
  const moon = new DirectionalLight('#d4caff', 1.5);
  moon.position.set(-6, 10, 8);
  scene.add(moon);

  const sharedUniforms = {
    uLamp: { value: new Vector3(0, LAMP_Y, 0) },
    uBeamAngle: { value: 0 },
    uBeamStrength: { value: 0 },
    uCityLight: { value: 1 },
    uSweep: { value: 0 },
    uSweepStart: { value: 0 },
    uTime: { value: 0 },
    uFogColor: { value: fog.color },
    uFogDensity: { value: fog.density },
  };

  const sky = buildSky(palette);
  const heroHorizon = sky.material.uniforms.uHorizon.value.clone();
  const storyBackground = new Color();
  const stars = buildStars(rand);
  const city = buildCity(rand, palette, sharedUniforms);
  const islet = buildIslet(rand, palette);
  const { group: lighthouse, glass } = buildLighthouse(palette);
  const optic = buildOptic(palette);
  lighthouse.add(optic.group);
  const { pivot: beams, material: beamMaterial } = buildBeams();
  const dust = buildDust(rand);

  const sea = buildSea(palette, sharedUniforms, fog.color);

  // اليابسة خلف خط الشاطئ
  const land = new Mesh(new PlaneGeometry(400, 200), new MeshLambertMaterial({ color: palette.night.clone().lerp(palette.purpleDark, 0.35) }));
  land.rotation.x = -Math.PI / 2;
  land.position.set(0, 0.04, SHORE_Z - 100);

  const lampLight = new PointLight('#ffb36b', 0, 0, 1.6);
  lampLight.position.y = LAMP_Y;
  const lampGlow = new Sprite(new SpriteMaterial({
    map: glowTexture(),
    color: '#ffd6b0',
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  }));
  lampGlow.position.y = LAMP_Y;
  lighthouse.add(lampLight, lampGlow);

  scene.add(sky, stars, sea, land, city, islet, lighthouse, beams, dust);

  // ---------- التكوين والكاميرا ----------

  const rest = { pos: new Vector3(), target: new Vector3() };
  const current = { scroll: 0 };
  // جهة النص: +1 يمين (عربي)، -1 يسار (إنجليزي). العالم نفسه لا ينعكس أبداً؛ اللغة تحدد فقط
  // من أي زاوية تنظر الكاميرا وأين تقع المنارة في الإطار. sideNow يتحرك بسلاسة من sideFrom إلى side.
  let side = mirrored ? -1 : 1;
  let sideFrom = side;
  let sideNow = side;
  let sideStart = -Infinity;
  const SIDE_SECONDS = 1.4;
  // دوران الكاميرا حول محور المنارة: عربي ← من اليسار قليلاً، إنجليزي ← من اليمين، فتتغير زاوية الرؤية
  // للمدينة والبحر نفسيهما (اختلاف منظور حقيقي) بدل قلب المشهد
  const SIDE_YAW = 0.18;
  const restNdc = new Vector3();
  let width = 1;
  let height = 1;
  const heroOffset = { x: 0, y: 0 };
  let mobileComp = 0.5;
  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
  // موضع المنارة الأفقي في الواجهة: 25% (عربي) ← 75% (إنجليزي) على الشاشات العريضة، والوسط على الهاتف
  const compX = () => (isMobile() ? mobileComp : 0.5 - 0.25 * sideNow);
  function updateHeroOffset() {
    heroOffset.x = ((restNdc.x + 1) / 2) * width - compX() * width;
  }

  function layout() {
    width = Math.max(container.clientWidth, 1);
    height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    sea.getRenderTarget().setSize(
      Math.max(Math.round(width * pixelRatio * reflectionScale), 64),
      Math.max(Math.round(height * pixelRatio * reflectionScale), 64),
    );

    const comp = getComposition(width, height);
    const aspect = width / height;
    camera.fov = aspect < 1 ? 40 : 34;
    camera.aspect = aspect;

    // المسافة بحيث يشغل ارتفاع المنارة (القاعدة ← المصباح) النسبة المطلوبة من الشاشة
    const halfTan = Math.tan((camera.fov * Math.PI) / 360);
    const distance = LAMP_Y / (2 * comp.height * halfTan);
    rest.target.set(0, LAMP_Y * 0.5, 0);
    rest.pos.set(0, LAMP_Y * 0.4, distance);

    fog.density = 0.95 / (distance + 58);
    sharedUniforms.uFogDensity.value = fog.density;
    camera.far = distance + 120;

    // إزاحة الإطار (view offset) لتقع المنارة في المكان المحدد دون تدوير الكاميرا
    camera.clearViewOffset();
    camera.position.copy(rest.pos);
    camera.lookAt(rest.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    restNdc.set(0, LAMP_Y, 0).project(camera);
    mobileComp = comp.x;
    heroOffset.y = ((1 - restNdc.y) / 2) * height - comp.y * height;
    updateHeroOffset();
    camera.setViewOffset(width, height, heroOffset.x, heroOffset.y, width, height);

    stars.material.uniforms.uPixelRatio.value = pixelRatio;
    dust.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  // مقدار الانتقال بين الجهتين الآن (0..1) — يُحسب من الزمن الحقيقي فيعمل حتى بعد تجميد حركة الواجهة
  function stepSide(now = performance.now()) {
    const k = reducedMotion ? 1 : clamp01((now - sideStart) / (SIDE_SECONDS * 1000));
    sideNow = lerp(sideFrom, side, easeInOutCubic(k));
    return k < 1;
  }
  // تدوير نقطة حول المحور الرأسي المار بالمنارة (الأصل)
  function orbit(v, yaw) {
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const x = v.x * c + v.z * sn;
    v.z = -v.x * sn + v.z * c;
    v.x = x;
    return v;
  }

  // ---------- التحديث لكل إطار ----------

  const startOffset = new Vector3();
  const tmp = new Vector3();
  const tmpTarget = new Vector3();
  const closePos = new Vector3();
  const closeTarget = new Vector3();
  const widePos = new Vector3();
  const lampPoint = new Vector3();
  let elapsed = 0;
  let started = false;
  // زاوية بداية ثابتة للحزمة في العالم (لا تقفز عند تبديل اللغة)
  const staticAngle = () => -0.35;

  function update(t) {
    const story = storyState(current.scroll);
    const zoom = reducedMotion ? (current.scroll > 0.8 ? 1 : 0) : story.zoom;
    // مع تقليل الحركة لا تتحرك الكاميرا في الختام: يبقى المشهد ثابتاً ويتسلّمه القسم التالي بالتدرّج وحده
    const pull = reducedMotion ? 0 : story.pull;
    const clock = t; // الزمن الحقيقي: يبقي دوران الحزمة مستمراً بعد مغادرة الواجهة
    const k = (a, b) => clamp01((t - a) / (b - a));

    // الكاميرا: هبوط سينمائي من الأعلى والخلف إلى وضع الراحة
    const fly = easeInOutCubic(k(0, 3.8));
    stepSide();
    startOffset.set(-sideNow * 7, 7.5, 14);
    // الكاميرا ثابتة أمام المؤشر؛ يبقى انجراف بطيء جداً والارتفاع مع التمرير
    const drift = reducedMotion ? 0 : fly * (1 - story.pull);
    tmp.copy(rest.pos).addScaledVector(startOffset, 1 - fly);
    tmp.x += Math.sin(t * 0.11) * 0.45 * drift;
    tmp.y += Math.sin(t * 0.16) * 0.18 * drift;

    tmpTarget.copy(rest.target);
    tmpTarget.y += (1 - fly) * 2.5;
    // اللقطة الواسعة (الختام) تُشتق من وضع الراحة نفسه، فتبقى المنارة في جهتها وتتغير اللغة كما في الواجهة
    widePos.copy(tmp);
    widePos.z *= OUTRO_DISTANCE;
    widePos.y += OUTRO_RISE;
    tmp.lerp(closePos.set(0, LAMP_Y + 0.12, isMobile() ? 8.5 : 5.8), zoom);
    tmpTarget.lerp(closeTarget.set(0, LAMP_Y, 0), zoom);
    if (pull > 0) {
      tmp.lerp(widePos, pull);
      tmpTarget.y = lerp(tmpTarget.y, LAMP_Y * 0.55, pull);
    }
    // زاوية الرؤية بحسب اللغة (على الهاتف المنارة في الوسط للغتين، فلا دوران)
    const yaw = isMobile() ? 0 : -SIDE_YAW * sideNow;
    orbit(tmp, yaw);
    orbit(tmpTarget, yaw);
    camera.position.copy(tmp);
    camera.lookAt(tmpTarget);
    camera.clearViewOffset();
    camera.updateMatrixWorld();
    const lampNdc = lampPoint.set(0, LAMP_Y, 0).project(camera);
    const mobile = isMobile();
    const anchorX = mobile ? 0.5 : 0.5 - 0.25 * sideNow;
    updateHeroOffset();
    const anchorY = lerp(mobile ? 0.29 : 0.43, OUTRO_ANCHOR_Y, pull);
    camera.setViewOffset(width, height,
      lerp(heroOffset.x, ((lampNdc.x + 1) / 2 - anchorX) * width, zoom),
      lerp(heroOffset.y, ((1 - lampNdc.y) / 2 - anchorY) * height, zoom), width, height);

    // المنارة تنهض من تحت الركام
    lighthouse.position.y = lerp(-7.4, 0, easeOutCubic(k(0.2, 2.9)));

    // اشتعال المصباح مع ارتعاش خفيف لحظة الاشتعال
    const ignite = k(2.5, 3.3);
    const flicker = ignite < 1 ? 0.65 + 0.35 * Math.abs(Math.sin(t * 47)) : 1;
    const lamp = ignite * flicker * story.light;
    const pulse = 1 + Math.sin(t * 1.3) * 0.04 * (reducedMotion ? 0 : 1);
    lampLight.intensity = lamp * 9;
    lampGlow.material.opacity = lamp * 0.95;
    lampGlow.scale.setScalar(2.3 * pulse);
    glass.color.setRGB(lerp(0.35, 1.0, lamp), lerp(0.3, 0.88, lamp), lerp(0.4, 0.76, lamp));

    // لون موحّد خلف النص والمنارة؛ يتغيّر مع ضوء الفصول وتنعكس حالته في البحر والضباب.
    storyBackground.copy(palette.storyDark).lerp(heroHorizon, story.light);
    sky.material.uniforms.uHorizon.value.copy(heroHorizon).lerp(storyBackground, zoom);
    sky.material.uniforms.uZenith.value.copy(palette.night).lerp(storyBackground, zoom);
    fog.color.copy(heroHorizon).lerp(storyBackground, zoom);
    // العالم يبقى حاضراً خلف بطاقات الحكاية: ضباب أخف عند اللقطة القريبة، وبعض نوافذ المدينة تبقى مضاءة
    // حتى في الفصول المعتمة (كانت تنطفئ كلها ويختفي الأفق، فيبدو الفصل الأول مكاناً آخر)
    sharedUniforms.uCityLight.value = lerp(1, Math.max(story.light, 0.35), zoom);
    fog.density = lerp(lerp(0.95 / (rest.pos.z + 58), 0.038, zoom), 0.95 / (rest.pos.z * OUTRO_DISTANCE + 58), pull);
    sharedUniforms.uFogDensity.value = fog.density;
    sea.material.uniforms.uLampLevel.value = lamp;

    // الحزمة والمسح
    const beamIn = easeOutCubic(k(IGNITE_AT, IGNITE_AT + 1.3)) * story.light;
    const sweep = Math.max(0, clock - IGNITE_AT) * OMEGA;
    const sweepStart = staticAngle();
    // الحزمة تدور بالزمن فقط وبالسرعة نفسها دائماً؛ التمرير لا يغيّر زاويتها
    const angle = reducedMotion ? sweepStart : sweepStart + sweep;
    beams.rotation.y = angle;
    optic.update(angle, lamp, camera.position); // العدسة والحزمة جهاز واحد: الزاوية نفسها في كل إطار
    beams.scale.set(1 + OUTRO_BEAM.length * pull, 1 + OUTRO_BEAM.spread * pull, 1 + OUTRO_BEAM.spread * pull);
    beamMaterial.uniforms.uStrength.value = beamIn;
    sharedUniforms.uBeamAngle.value = angle;
    sharedUniforms.uBeamStrength.value = beamIn;
    sharedUniforms.uSweep.value = reducedMotion ? 100 : sweep;
    sharedUniforms.uSweepStart.value = sweepStart;
    sharedUniforms.uTime.value = t;

    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uBeamAngle.value = angle;
    dust.material.uniforms.uStrength.value = beamIn;

    stars.material.uniforms.uTime.value = t;
    stars.material.uniforms.uFade.value = easeOutCubic(k(0, 2.4));

    // السماء والنجوم تتبعان الكاميرا
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
  }

  // ---------- إسقاط الحزمة على الشاشة (لمزامنة لمعان العنوان مع الضوء) ----------

  const BEAM_SAMPLES = 9;
  const beamSamples = Array.from({ length: BEAM_SAMPLES }, () => ({ x: 0, y: 0, half: 0, fade: 0 }));
  const samplePoint = new Vector3();
  const sampleEdge = new Vector3();
  const viewPoint = new Vector3();

  // نقاط على امتداد الحزمة التي تتجه نحو جهة النص: موضعها على اللوحة (px) ونصف سماكتها وشدّتها
  function reportBeam(angle, strength) {
    if (!onBeam) return;
    camera.updateMatrixWorld();
    let dx = Math.cos(angle);
    let dz = -Math.sin(angle);
    if (dx * (sideNow || side) < 0) {
      dx = -dx;
      dz = -dz;
    }
    const dy = -Math.sin(BEAM_TILT);
    let behind = false;
    beamSamples.forEach((sample, i) => {
      const along = (i / (BEAM_SAMPLES - 1)) * 0.85 * BEAM_LENGTH;
      samplePoint.set(dx * along, LAMP_Y + dy * along, dz * along);
      viewPoint.copy(samplePoint).applyMatrix4(camera.matrixWorldInverse);
      if (viewPoint.z > -camera.near * 4) behind = true; // تجاوزت الكاميرا (حين تتجه الحزمة نحو الزائر)
      sampleEdge.copy(samplePoint);
      sampleEdge.y += (BEAM_RADIUS * along) / BEAM_LENGTH;
      samplePoint.project(camera);
      sampleEdge.project(camera);
      sample.x = ((samplePoint.x + 1) / 2) * width;
      sample.y = ((1 - samplePoint.y) / 2) * height;
      sample.half = Math.abs(((1 - sampleEdge.y) / 2) * height - sample.y);
      // نفس تلاشي الـ shader على امتداد المخروط
      sample.fade = behind ? 0 : strength * (1 - along / BEAM_LENGTH) ** 1.8;
    });
    onBeam(beamSamples);
  }

  // ---------- حلقة الرسم ----------

  let raf = 0;
  let last = 0;
  let inView = true;
  let disposed = false;
  let compiled = false; // لا رسم قبل اكتمال ترجمة الـ shaders
  let slowFrames = 0;
  let sampledFrames = 0;

  function renderOnce() {
    if (!compiled) return;
    update(reducedMotion ? FINAL_T : elapsed);
    renderer.render(scene, camera);
    reportBeam(beams.rotation.y, beamMaterial.uniforms.uStrength.value);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); // لا قفزات بعد العودة لتبويب مخفي
    last = now;
    if (started) elapsed += dt;
    // من يبدأ التمرير قبل انتهاء الافتتاح (هبوط الكاميرا، نهوض المنارة، اشتعال المصباح) يُسرّعه التمرير
    // بسلاسة نحو نهايته، فيصل إليها مع وصول الكاميرا إلى الفصل الأول. الزمن لا يعود للخلف أبداً، فالرجوع
    // للأعلى لا يعيد الافتتاح (كان يقفز سابقاً إلى الحالة النهائية دفعة واحدة عند 0.95 من التمرير).
    if (started && elapsed < INTRO_END && current.scroll > 0) {
      elapsed += (INTRO_END - elapsed) * Math.min(1, dt * 6 * smooth01(current.scroll / 0.9));
    }
    update(elapsed);
    renderer.render(scene, camera);
    reportBeam(beams.rotation.y, beamMaterial.uniforms.uStrength.value);

    // جودة تكيفية: إن كان الجهاز بطيئاً نخفض دقة البكسل مرة واحدة
    if (started && elapsed > 4.5 && sampledFrames < 90) {
      sampledFrames += 1;
      if (dt > 0.026) slowFrames += 1;
      if (sampledFrames === 90 && slowFrames > 45) {
        pixelRatio = 1;
        reflectionScale = 0.3;
        renderer.setPixelRatio(pixelRatio);
        layout();
      }
    }
  }

  function startLoop() {
    // لا رسم مستمر قبل start(): المشهد مخفي خلف شاشة الافتتاح ويزاحمها على المعالج الرسومي
    if (raf || !started || !compiled || reducedMotion || disposed || !inView || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // إيقاف الرسم حين يخرج القسم من الشاشة
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) { renderOnce(); startLoop(); }
    else stopLoop();
  });
  io.observe(container);

  const ro = new ResizeObserver(() => {
    layout();
    if (reducedMotion || current.scroll >= 0.95) renderOnce();
  });
  ro.observe(container);

  const handleContextLost = (event) => {
    event.preventDefault();
    stopLoop();
    onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);

  const visibilityChanged = () => {
    if (document.hidden) stopLoop();
    else { renderOnce(); startLoop(); }
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  layout();
  // ترجمة الـ shaders بالتوازي (KHR_parallel_shader_compile) بدلاً من ترجمة متزامنة تجمّد الصفحة كلها
  // (بما فيها حركة شاشة الافتتاح) لأكثر من ثانية على بعض الأجهزة. لا رسم قبل اكتمالها.
  renderer.compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      if (disposed) return;
      compiled = true;
      renderOnce();
      startLoop();
    });

  return {
    start() {
      started = true;
      startLoop();
    },
    // تبديل اللغة: لا يُلمس العالم؛ تبدأ الكاميرا انتقالاً سلساً من زاويتها الحالية إلى زاوية اللغة الجديدة.
    // كل انتقال يبدأ من sideNow الفعلي (حتى لو كان الانتقال السابق لم يكتمل) وينتهي بقيمة ثابتة ±1، فلا تراكم.
    setMirrored(value) {
      const next = value ? -1 : 1;
      if (next === side) return;
      stepSide();
      sideFrom = sideNow;
      side = next;
      sideStart = performance.now();
      if (reducedMotion) stepSide();
      // الحلقة تعمل عادةً؛ إن كانت متوقفة (قبل البدء أو مع تقليل الحركة) نرسم الحالة مباشرة
      if (!raf) renderOnce();
    },
    relayout() {
      layout();
      if (reducedMotion || current.scroll >= 0.95) renderOnce();
    },
    setScroll(value) {
      current.scroll = value;
      if (reducedMotion) { if (inView && !document.hidden) renderOnce(); }
      else startLoop();
    },
    dispose() {
      disposed = true;
      stopLoop();
      document.removeEventListener('visibilitychange', visibilityChanged);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      scene.traverse((object) => {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material) return;
          material.map?.dispose();
          material.alphaMap?.dispose();
          material.dispose();
        });
      });
      sea.dispose(); // يحرر render target الانعكاس
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
