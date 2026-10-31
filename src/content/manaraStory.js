// حكاية منارة: أربعة فصول مترابطة — المشكلة ← الاستجابة ← الحدود ← المشاركة.
// النصوص العربية معتمدة من فريق منارة كما وردت؛ الإنجليزية ترجمة أمينة لها.
// كل فصل مقسّم إلى «مشاهد» (beats): فقرة واحدة أو اثنتان مع عنصر بصري يشرحها، تتبدّل داخل البطاقة المثبّتة أثناء التمرير.
// **نص** = عبارة مُبرَزة. عناوين العناصر البصرية مأخوذة من النص نفسه؛ لا أرقام ولا بيانات غير موجودة.
//
// أنواع العناصر البصرية (visual.kind):
//   signals   مؤشرات عوائق (أيقونة + وصف)        path      مسار مراحل؛ broken = ينقطع بعد أول مرحلة
//   map       ما ينقص ← ما تقدمه منارة             cards     بطاقات (activity | need | way)
//   gap       الطموح مقابل المتاح (وصفي، بلا نسب)   statement عبارة ختامية بارزة
//   question  سؤال انتقالي يمهّد للفصل التالي (نص فقط)       actions   أزرار المشاركة (intent يحدد موضوع رسالة التواصل)
export const manaraStory = {
  AR: {
    label: 'حكاية منارة', scroll: 'اتبع الضوء لتكتشف حكايتنا',
    meets: 'تلبّي:', step: 'المشهد',
    chapters: [
      {
        id: 'student-challenges', tone: 'problem',
        title: 'بدايةٌ ليست الأسهل',
        beats: [
          {
            text: [
              'في غزة، يمتلك كثير من الطلاب **الشغف والرغبة في التعلّم**، لكن فرص التدريب والتوجيه ليست دائمًا قريبة منهم.',
              'وأحيانًا، كل ما يحتاجه الطالب هو من يدلّه على **الخطوة الأولى**.',
            ],
          },
          {
            visual: { kind: 'statement', text: '“نحن نؤمن أن الموهبة موجودة، وما ينقصها أحيانًا هو **الفرصة**.”' },
          },
        ],
      },
      {
        id: 'about', tone: 'response',
        title: 'من هنا بدأت منارة',
        beats: [
          {
            text: [
              'وُجدت منارة لتكون أقرب إلى الطلاب؛ مساحة يتعلّمون فيها، يجرّبون، يسألون، ويكتشفون **المسار الأنسب لهم**.',
              'نحاول أن نحوّل الحيرة إلى خطوة، والخطوة إلى فرصة.',
            ],
          },
          {
            // عبارة إنجليزية داخل صفحة عربية: كل كلمة inline-block فيلزم اتجاه ltr ليبقى ترتيب الكلمات صحيحاً
            visual: { kind: 'statement', dir: 'ltr', text: '**From confusion to clarity.**' },
          },
        ],
      },
      {
        id: 'manara-challenges', tone: 'limit',
        title: 'ومنارة أيضًا تواجه التحديات',
        beats: [
          {
            text: [
              'ليس من السهل دائمًا توفير كل ما نطمح إليه.',
              'مواردٌ محدودة، ظروفٌ صعبة، والوصول إلى كل طالب يحتاج إلى فرصة ليس أمرًا سهلًا.',
              'نواصل المحاولة، وننمو **خطوة بخطوة**.',
            ],
          },
        ],
      },
      {
        id: 'support', tone: 'help',
        title: 'يمكنك أن تكون جزءًا من الأثر',
        beats: [
          {
            text: [
              'إذا كانت لديك خبرة، أو وقت، أو فرصة، أو قدرة على الدعم، فقد تصنع مساهمتك **فرقًا حقيقيًا**.',
              'قد تكون ورشة، أو توجيهًا، أو شراكة، أو دعمًا بسيطًا سببًا في **بداية جديدة** لطالب.',
            ],
          },
          {
            visual: { kind: 'statement', text: '**شارك في فتح المزيد من الفرص.**' },
            // لا توجد صفحة تبرع أو نموذج تطوع مستقل في الموقع؛ الأزرار تفتح نموذج التواصل الحقيقي مع تحديد الموضوع
            actions: [
              { label: 'ادعم منارة', intent: 'support', primary: true },
              { label: 'تطوّع معنا', intent: 'volunteer' },
            ],
          },
        ],
      },
    ],
  },
  EN: {
    label: 'The Manara story', scroll: 'Follow the light to discover our story',
    meets: 'Meets:', step: 'Scene',
    chapters: [
      {
        id: 'student-challenges', tone: 'problem',
        title: 'A beginning that isn’t the easiest',
        beats: [
          {
            text: [
              'In Gaza, many students have the **passion and desire to learn**, but training and guidance opportunities are not always within their reach.',
              'And sometimes, all a student needs is someone to point them to the **first step**.',
            ],
          },
          {
            visual: { kind: 'statement', text: '“We believe talent is there; what it sometimes lacks is the **opportunity**.”' },
          },
        ],
      },
      {
        id: 'about', tone: 'response',
        title: 'This is where Manara began',
        beats: [
          {
            text: [
              'Manara exists to be closer to students: a space where they learn, experiment, ask, and discover **the path that suits them best**.',
              'We try to turn confusion into a step, and a step into an opportunity.',
            ],
          },
          {
            visual: { kind: 'statement', text: '**From confusion to clarity.**' },
          },
        ],
      },
      {
        id: 'manara-challenges', tone: 'limit',
        title: 'Manara faces challenges too',
        beats: [
          {
            text: [
              'It is not always easy to provide everything we aspire to.',
              'Limited resources, difficult conditions, and reaching every student who needs an opportunity is no easy task.',
              'We keep trying, and we grow **step by step**.',
            ],
          },
        ],
      },
      {
        id: 'support', tone: 'help',
        title: 'You can be part of the impact',
        beats: [
          {
            text: [
              'If you have experience, time, an opportunity, or the means to support, your contribution can make a **real difference**.',
              'A workshop, mentoring, a partnership, or even simple support could be the start of a **new beginning** for a student.',
            ],
          },
          {
            visual: { kind: 'statement', text: '**Help open more opportunities.**' },
            actions: [
              { label: 'Support Manara', intent: 'support', primary: true },
              { label: 'Volunteer with us', intent: 'volunteer' },
            ],
          },
        ],
      },
    ],
  },
};
