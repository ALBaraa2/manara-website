// «لحظات حقيقية»: تجربة من مرحلتين بصور ومقاطع حقيقية من ورش منارة ومبادراتها (الإعلانات الرسمية في قسم المنشورات).
//   المرحلة الأولى (Activities.jsx — مثبّتة ويتحكم بها التمرير): العنوان الكبير نافذة على صورة الافتتاح، تنتفخ حروفه
//   حتى تصير إطاراً يملأ الشاشة، ثم تصغر الصورة إلى أول لقطة في شريط تُوزَّع بقية لقطاته من رزمة ويتحرك أفقياً.
//   المرحلة الثانية: بقية اللقطات والأفلام الكاملة، بترقيم يكمل ترقيم الشريط.
// الصور والمقاطع من مجلدات المصدر الحالية فقط (المقاطع: «التدريب الميداني»، «ورشة GITHUB»، «ورشة ai»…). الملفات في public/media/activities/<مجلد>/ نسخ ويب من الأصل: صور WebP بعرضين (800 و1600)، مقطع قصير صامت (loop.mp4)،
// وفيلم كامل (reel.mp4 مع reel-poster.webp). الأوصاف تصف ما يظهر في الصورة فقط؛ الأسماء من مجلدات المصدر.

export const ACTIVITY_MEDIA_BASE = '/media/activities';

export const ACTIVITY_NAMES = {
  first: { AR: 'ورشة عمل حول الأمن السيبراني', EN: 'Cybersecurity Workshop' },
  field: { AR: 'التدريب الميداني', EN: 'Field Training' },
  github: { AR: 'ورشة GitHub', EN: 'GitHub Workshop' },
  games: { AR: 'ورشة تصميم الألعاب', EN: 'Game Design Workshop' },
  amanha: { AR: 'مبادرة أمانها قوة', EN: 'Amanha Quwwa Initiative' },
  ai: { AR: 'ورشة الذكاء الاصطناعي', EN: 'AI Workshop' },
  intro2: { AR: 'لقاء تعريفي — التدريب الميداني ٢', EN: 'Field Training Intro Meeting 2' },
  team: { AR: 'اجتماع الفريق', EN: 'Team Meeting' },
};

// ترتيب شريط الأنشطة أعلى المرحلة الأولى (يُضاء النشاط الذي تنتمي إليه اللقطة الحالية)
export const RIBBON = ['first', 'field', 'games', 'github', 'amanha', 'ai', 'team'];

// العنوان الذي يصير نافذة الافتتاح: سطر واحد على الشاشات العريضة، وسطران على الهاتف
export const APERTURE_WORDS = {
  AR: { wide: ['لحظات حقيقية'], narrow: ['لحظات', 'حقيقية'] },
  EN: { wide: ['REAL MOMENTS'], narrow: ['REAL', 'MOMENTS'] },
};

const img = (src, ar, pos, activity, alt) => ({ type: 'image', src, ar, pos, activity, alt });

// لقطات الشريط بالترتيب؛ الأولى صورة الافتتاح (IMG_4817). ar = العرض/الارتفاع، pos = موضع القص؛ يُكتب تحت كل لقطة اسم ورشتها.
export const strip = [
  img('first/1', 16 / 9, '50% 60%', 'first',
    { AR: 'الحضور في القاعة يتابعون المتحدثين في المقدمة', EN: 'The audience in the hall following the speakers at the front' }),
  img('field/1', 4 / 3, '50% 55%', 'field',
    { AR: 'المدرّب يتحدث مع مشاركتين', EN: 'The trainer talking with two participants' }),
  {
    type: 'loop', src: 'field', reel: 'field/reel', ar: 9 / 16, activity: 'field',
    alt: { AR: 'لقطة حيّة من التدريب الميداني', EN: 'A live moment from the field training' },
  },
  img('games/4', 3 / 4, '50% 60%', 'games',
    { AR: 'المشاركون يستمعون إلى الشرح أمام الشاشة', EN: 'Participants listening to the presentation in front of the screen' }),
  {
    type: 'loop', src: 'github', reel: 'github/reel', ar: 9 / 16, activity: 'github',
    alt: { AR: 'لقطة حيّة من ورشة GitHub', EN: 'A live moment from the GitHub workshop' },
  },
  img('amanha/1', 4 / 3, '50% 60%', 'amanha',
    { AR: 'مقدّما الجلسة أمام النساء الجالسات في الخيمة', EN: 'The facilitators before the women seated in the tent' }),
  img('ai/4', 3 / 4, '50% 60%', 'ai',
    { AR: 'حلقة النقاش، ومشاركة تكتب على حاسوبها', EN: 'The discussion circle, with a participant typing on her laptop' }),
  {
    type: 'loop', src: 'ai', reel: 'ai/reel', ar: 9 / 16, activity: 'ai',
    alt: { AR: 'لقطة حيّة من ورشة الذكاء الاصطناعي', EN: 'A live moment from the AI workshop' },
  },
  img('first/2', 4 / 3, '50% 60%', 'first',
    { AR: 'مشاركون ومشاركات جالسون في القاعة', EN: 'Participants seated in the hall' }),
  img('games/6', 9 / 16, '50% 55%', 'games',
    { AR: 'المدرّب يتحدث واقفاً إلى المشاركين حول الطاولة', EN: 'The trainer standing and speaking to participants around the table' }),
  img('github/1', 4 / 3, '50% 60%', 'github',
    { AR: 'المشاركون والمشاركات حول طاولة ورشة GitHub', EN: 'Participants gathered around the GitHub workshop table' }),
  {
    type: 'loop', src: 'team', reel: 'team/reel', ar: 9 / 16, activity: 'team',
    alt: { AR: 'لقطة حيّة من اجتماع فريق منارة حول طاولة الاجتماعات', EN: 'A live moment from the Manara team meeting around the conference table' },
  },
];

// المرحلة الثانية: بقية الصور الموجودة في مجلدات المصدر (لا تتكرر صور الشريط)، ثم الأفلام الكاملة
export const morePhotos = [
  img('first/3', 4 / 3, '50% 60%', 'first',
    { AR: 'القاعة من الخلف والحضور يواجهون المتحدثين', EN: 'The hall from the back, with the audience facing the speakers' }),
  img('github/4', 3 / 4, '50% 60%', 'github',
    { AR: 'المشاركون حول الطاولة والشاشة في آخر القاعة', EN: 'Participants around the table, with the screen at the end of the room' }),
  img('field/2', 4 / 3, '50% 55%', 'field',
    { AR: 'مدرّبة بجانب الشاشة والمشاركون على الطاولات', EN: 'A trainer by the screen, with participants at the tables' }),
  img('games/5', 9 / 16, '50% 55%', 'games',
    { AR: 'المدرّب يتحدث إلى المشاركين حول الطاولة', EN: 'The trainer speaking to participants around the table' }),
  img('amanha/3', 4 / 3, '50% 62%', 'amanha',
    { AR: 'الخيمة من الداخل والحاضرون جالسون على الأرض', EN: 'Inside the tent, with attendees seated on the floor' }),
  img('field/3', 4 / 3, '50% 60%', 'field',
    { AR: 'مشاركون ومشاركات جالسون على الطاولات', EN: 'Participants seated at the tables' }),
  img('ai/5', 3 / 4, '50% 60%', 'ai',
    { AR: 'المشاركون جالسون في دائرة داخل القاعة', EN: 'Participants seated in a circle in the room' }),
  img('github/5', 4 / 3, '50% 60%', 'github',
    { AR: 'المشاركون والمشاركات جالسون حول الطاولة', EN: 'Participants seated around the table' }),
  img('field/5', 4 / 3, '50% 55%', 'field',
    { AR: 'مشاركون يتحدثون واقفين بين الطاولات', EN: 'Participants talking while standing between the tables' }),
  img('ai/3', 4 / 3, '50% 60%', 'ai',
    { AR: 'المشاركون جالسون في دائرة واحدة', EN: 'Participants seated in a single circle' }),
  img('field/4', 4 / 3, '50% 60%', 'field',
    { AR: 'مشاركات ومشاركون في الصفوف الأمامية', EN: 'Participants in the front rows' }),
  img('intro2/1', 4 / 3, '50% 60%', 'intro2',
    { AR: 'المشاركون في اللقاء التعريفي حول الطاولة', EN: 'Participants of the intro meeting around the table' }),
];

export const films = [
  { src: 'field/reel', duration: '0:18', activity: 'field', alt: { AR: 'فيلم من التدريب الميداني', EN: 'Film from the field training' } },
  { src: 'github/reel', duration: '0:38', activity: 'github', alt: { AR: 'فيلم من ورشة GitHub', EN: 'Film from the GitHub workshop' } },
  { src: 'team/reel', duration: '0:12', activity: 'team', alt: { AR: 'فيلم من اجتماع فريق منارة', EN: 'Film from the Manara team meeting' } },
  { src: 'amanha/reel', duration: '0:31', activity: 'amanha', alt: { AR: 'فيلم من مبادرة أمانها قوة', EN: 'Film from the Amanha Quwwa initiative' } },
  { src: 'ai/reel', duration: '1:24', activity: 'ai', alt: { AR: 'فيلم من ورشة الذكاء الاصطناعي', EN: 'Film from the AI workshop' } },
];

export const mediaUrl = (src, suffix) => `${ACTIVITY_MEDIA_BASE}/${src}${suffix}`;
export const imageSrcSet = (src) => `${mediaUrl(src, '-800.webp')} 800w, ${mediaUrl(src, '-1600.webp')} 1600w`;
