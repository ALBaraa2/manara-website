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
        title: 'حين تصبح أبسط فرص التعلّم تحديًا',
        beats: [
          {
            text: ['في غزة، لم تعد رحلة التعلّم مقتصرة على المحاضرات والكتب، بل أصبحت مرتبطة بتحديات يومية تجعل **الوصول إلى المعرفة وتطبيقها** أمرًا صعبًا. انقطاع الكهرباء، وضعف الإنترنت، ونقص الأجهزة والموارد، كلها عوامل تؤثر في قدرة الطلاب على مواصلة تعلّمهم وتطوير مهاراتهم.'],
            visual: { kind: 'signals', items: [
              { icon: 'power', label: 'انقطاع الكهرباء' },
              { icon: 'wifi', label: 'ضعف الإنترنت' },
              { icon: 'device', label: 'نقص الأجهزة والموارد' },
            ] },
          },
          {
            text: ['ولا تتوقف الصعوبات عند حدود التعلّم النظري؛ فالطلاب في التخصصات التقنية والهندسية يحتاجون إلى بيئة تتيح لهم التجربة، والعمل على المشاريع، واكتساب **الخبرة العملية** التي تؤهلهم لدخول سوق العمل. لكن الوصول إلى هذه الفرص لا يزال تحديًا أمام الكثير منهم.'],
            visual: { kind: 'path', broken: true, steps: ['التعلّم النظري', 'التجربة', 'المشاريع', 'الخبرة العملية', 'سوق العمل'] },
          },
          {
            text: ['ورغم كل ذلك، لا يزال هناك طلاب يمتلكون **الشغف والاستعداد** للتعلّم والتطور. ما يحتاجونه ليس المعرفة وحدها، بل **فرصًا حقيقية** تساعدهم على تحويل ما يتعلمونه إلى مهارات يمكنهم البناء عليها في المستقبل.'],
          },
        ],
      },
      {
        id: 'about', tone: 'response',
        title: 'من واقع مليء بالتحديات، بدأت فكرة منارة',
        beats: [
          {
            text: ['تأسست منارة انطلاقًا من إيماننا بأن **الظروف الصعبة لا ينبغي أن تكون نهاية طموح الطالب**، وأن امتلاك المعرفة والرغبة في التطور يجب أن تقابلهما فرص حقيقية للتعلّم والتطبيق.'],
            // العلاقة بين ما عرضه الفصل الأول وما تسعى إليه منارة
            visual: { kind: 'map', from: 'ما يواجهه الطالب', to: 'ما تسعى إليه منارة', rows: [
              ['معرفة تبقى نظرية', 'ربط ما يتعلّمه أكاديميًا بالتطبيق العملي'],
              ['فرص محدودة للتجربة', 'ورشات تقنية ودورات تدريبية'],
              ['خبرة عملية صعبة المنال', 'تدريب ميداني ومشاريع واقعية'],
            ] },
          },
          {
            text: ['جاءت فكرة منارة لتكون **مساحة شبابية** تسعى إلى مساعدة الطلاب في غزة على تطوير مهاراتهم، وربط ما يتعلمونه أكاديميًا بالتطبيق العملي، من خلال ورشات تقنية ودورات تدريبية وفرص للتدريب الميداني، إلى جانب أنشطة تتيح لهم التعاون وتبادل الخبرات والعمل على مشاريع واقعية.'],
            visual: { kind: 'cards', variant: 'activity', items: [
              { icon: 'cpu', title: 'ورشات تقنية' },
              { icon: 'book', title: 'دورات تدريبية' },
              { icon: 'briefcase', title: 'تدريب ميداني' },
              { icon: 'users', title: 'تعاون ومشاريع واقعية' },
            ] },
          },
          {
            text: ['نؤمن بأن بناء المهارات لا يحدث بالاستماع إلى الشرح وحده، بل **بالتجربة والممارسة ومواجهة المشكلات الحقيقية**. لذلك، نسعى إلى توفير فرص تعليمية تساعد الطلاب على اكتشاف قدراتهم، وتطوير خبراتهم، والاستعداد بصورة أفضل لمستقبلهم المهني.'],
            // المسار نفسه الذي انقطع في الفصل الأول، مكتملاً هنا
            visual: { kind: 'path', steps: ['الشرح', 'التجربة', 'الممارسة', 'المشكلات الحقيقية', 'المستقبل المهني'] },
          },
          {
            visual: { kind: 'statement', text: 'منارة ليست مجرد أنشطة تدريبية، بل محاولة لبناء بيئة تساعد المعرفة على التحول إلى **مهارة**، والطموح إلى **فرصة**.' },
          },
        ],
      },
      {
        id: 'manara-challenges', tone: 'limit',
        title: 'الطموح وحده لا يكفي',
        beats: [
          {
            text: ['نسعى في منارة إلى توفير فرص تعليمية وتدريبية تساعد الطلاب على تطوير قدراتهم، لكن تحويل هذه الرؤية إلى **واقع مستمر** يحتاج إلى موارد وإمكانات تتجاوز ما يستطيع الفريق توفيره بمفرده.'],
            visual: { kind: 'gap', rows: [
              { label: 'ما نطمح إليه', text: 'فرص تعليمية وتدريبية مستمرة تصل إلى عدد أكبر من الطلاب', full: true },
              { label: 'ما هو متاح اليوم', text: 'جهود الفريق والمتطوعين وما يتوفّر من إمكانات' },
            ] },
          },
          {
            text: ['فالتدريب العملي يحتاج إلى أجهزة وأدوات تقنية، وتنفيذ الورشات يتطلب بيئة مناسبة وموارد تساعد على تنظيمها، كما أن استمرار الأنشطة وتوسيع نطاقها يحتاج إلى **دعم** يتيح لنا الوصول إلى عدد أكبر من الطلاب وتقديم تجارب تعليمية أكثر تنوعًا.'],
            visual: { kind: 'cards', variant: 'need', items: [
              { icon: 'device', title: 'أجهزة وأدوات تقنية', desc: 'يحتاجها التدريب العملي' },
              { icon: 'space', title: 'بيئة مناسبة وموارد', desc: 'يتطلبها تنفيذ الورشات' },
              { icon: 'growth', title: 'دعم مستمر', desc: 'لتوسيع الأنشطة والوصول إلى طلاب أكثر' },
            ] },
          },
          {
            text: ['وفي ظل الظروف التي يعيشها قطاع غزة، تصبح هذه الاحتياجات أكثر صعوبة، من توفير المعدات والموارد التعليمية إلى التعامل مع **تحديات الكهرباء والإنترنت** ومحدودية الإمكانات المتاحة.'],
            visual: { kind: 'signals', items: [
              { icon: 'resources', label: 'المعدات والموارد التعليمية' },
              { icon: 'power', label: 'الكهرباء والإنترنت' },
              { icon: 'limit', label: 'محدودية الإمكانات' },
            ] },
          },
          {
            text: [
              'ورغم هذه التحديات، نواصل العمل بما هو متاح، ونحاول الاستفادة من خبرات أعضاء الفريق والمتطوعين لبناء فرص جديدة للطلاب.',
              'لكننا ندرك أن ما يمكننا تقديمه اليوم قد لا يكون كافيًا للوصول إلى جميع من يحتاجون إلى هذه الفرص. وهنا تظهر أهمية وجود **أشخاص ومؤسسات يؤمنون بالفكرة**، ومستعدون للمساهمة في تطويرها واستمرارها.',
            ],
            visual: { kind: 'question', text: 'كيف يمكنك أن تساعد؟' },
          },
        ],
      },
      {
        id: 'support', tone: 'help',
        title: 'معًا، نستطيع الوصول إلى فرص أكبر',
        beats: [
          {
            text: ['كل فرصة تعليمية يحصل عليها طالب قد تساعده على اكتساب مهارة جديدة، وتنفيذ مشروع عملي، واتخاذ خطوة أقرب نحو مستقبله المهني. ولتوسيع هذه الفرص، تحتاج منارة إلى **أشخاص وجهات يؤمنون بأهمية الاستثمار في المعرفة والمهارات**.'],
            visual: { kind: 'path', steps: ['فرصة تعليمية', 'مهارة جديدة', 'مشروع عملي', 'خطوة نحو المستقبل'] },
          },
          {
            text: ['يمكنك أن تكون جزءًا من هذه الرحلة بطرق مختلفة؛ من خلال المساهمة في توفير الأجهزة والمعدات اللازمة للتدريب، أو مشاركة خبراتك التقنية في ورشة أو دورة، أو المساعدة في توفير فرص تدريب ميداني للطلاب، أو بناء شراكات تتيح لنا الوصول إلى موارد وخبرات جديدة.'],
            // كل وسيلة مرتبطة باحتياج ورد في الفصل الثالث
            visual: { kind: 'cards', variant: 'way', items: [
              { icon: 'device', title: 'الأجهزة والمعدات', meets: 'أجهزة وأدوات تقنية' },
              { icon: 'cpu', title: 'خبرتك في ورشة أو دورة', meets: 'تنفيذ الورشات' },
              { icon: 'briefcase', title: 'فرص تدريب ميداني', meets: 'تجارب تعليمية أكثر تنوعًا' },
              { icon: 'link', title: 'شراكات', meets: 'موارد وخبرات جديدة' },
            ] },
          },
          {
            text: [
              'وحتى مشاركة أنشطة منارة والتعريف برسالتها يمكن أن يساعدا في الوصول إلى أشخاص يمتلكون الخبرة أو الإمكانات التي نحتاج إليها.',
              'نحن لا نبحث فقط عمّن يقدم الدعم، بل عمّن يرى في **تعليم الشباب وتطوير مهاراتهم** فرصة لبناء مستقبل أفضل. فكل مساهمة مناسبة يمكن أن تساعدنا على توسيع أنشطتنا، وتحسين تجربتنا التعليمية، والوصول إلى مزيد من الطلاب.',
            ],
          },
          {
            visual: { kind: 'statement', text: 'ساعدنا في تحويل الإمكانات المحدودة إلى **فرص حقيقية للتعلّم والتطوّر**.' },
            // لا توجد صفحة تبرع أو نموذج تطوع مستقل في الموقع؛ الأزرار تفتح نموذج التواصل الحقيقي مع تحديد الموضوع
            actions: [
              { label: 'ادعم منارة', intent: 'support', primary: true },
              { label: 'تطوّع معنا', intent: 'volunteer' },
              { label: 'كن شريكًا', intent: 'partner' },
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
        title: 'When even the simplest learning opportunities become a challenge',
        beats: [
          {
            text: ['In Gaza, the learning journey is no longer limited to lectures and books; it is tied to daily challenges that make **accessing and applying knowledge** difficult. Power cuts, weak internet, and a shortage of devices and resources all affect students’ ability to keep learning and develop their skills.'],
            visual: { kind: 'signals', items: [
              { icon: 'power', label: 'Power cuts' },
              { icon: 'wifi', label: 'Weak internet' },
              { icon: 'device', label: 'Shortage of devices and resources' },
            ] },
          },
          {
            text: ['The difficulties do not stop at theoretical learning. Students in technical and engineering fields need an environment that lets them experiment, work on projects, and gain the **practical experience** that prepares them for the job market. Yet reaching these opportunities is still a challenge for many of them.'],
            visual: { kind: 'path', broken: true, steps: ['Theory', 'Experimenting', 'Projects', 'Practical experience', 'Job market'] },
          },
          {
            text: ['Despite all this, there are still students with **passion and readiness** to learn and grow. What they need is not knowledge alone, but **real opportunities** that help them turn what they learn into skills they can build on in the future.'],
          },
        ],
      },
      {
        id: 'about', tone: 'response',
        title: 'From a reality full of challenges, the idea of Manara began',
        beats: [
          {
            text: ['Manara was founded on our belief that **difficult circumstances should not be the end of a student’s ambition**, and that knowledge and the desire to grow must be met with real opportunities to learn and practise.'],
            visual: { kind: 'map', from: 'What students face', to: 'What Manara works toward', rows: [
              ['Knowledge that stays theoretical', 'Linking academic learning to practice'],
              ['Few chances to experiment', 'Technical workshops and training courses'],
              ['Practical experience out of reach', 'Field training and real projects'],
            ] },
          },
          {
            text: ['Manara was conceived as a **youth space** that helps students in Gaza develop their skills and connect what they learn academically with practice, through technical workshops, training courses and field training opportunities, alongside activities that let them collaborate, exchange experience and work on real projects.'],
            visual: { kind: 'cards', variant: 'activity', items: [
              { icon: 'cpu', title: 'Technical workshops' },
              { icon: 'book', title: 'Training courses' },
              { icon: 'briefcase', title: 'Field training' },
              { icon: 'users', title: 'Collaboration and real projects' },
            ] },
          },
          {
            text: ['We believe skills are not built by listening to explanations alone, but **through experimenting, practising and facing real problems**. That is why we aim to provide learning opportunities that help students discover their abilities, develop their experience, and prepare better for their careers.'],
            visual: { kind: 'path', steps: ['Explanation', 'Experimenting', 'Practice', 'Real problems', 'Career'] },
          },
          {
            visual: { kind: 'statement', text: 'Manara is not just training activities; it is an effort to build an environment where knowledge becomes a **skill**, and ambition becomes an **opportunity**.' },
          },
        ],
      },
      {
        id: 'manara-challenges', tone: 'limit',
        title: 'Ambition alone is not enough',
        beats: [
          {
            text: ['At Manara we aim to provide learning and training opportunities that help students develop their abilities, but turning this vision into a **lasting reality** needs resources and capacity beyond what the team can provide on its own.'],
            visual: { kind: 'gap', rows: [
              { label: 'What we aim for', text: 'Ongoing learning and training opportunities that reach more students', full: true },
              { label: 'What is available today', text: 'The efforts of the team and volunteers, and whatever means are at hand' },
            ] },
          },
          {
            text: ['Practical training needs devices and technical tools, running workshops requires a suitable environment and resources to organise them, and continuing and expanding activities needs **support** that lets us reach more students and offer more varied learning experiences.'],
            visual: { kind: 'cards', variant: 'need', items: [
              { icon: 'device', title: 'Devices and technical tools', desc: 'Needed for practical training' },
              { icon: 'space', title: 'A suitable environment and resources', desc: 'Required to run workshops' },
              { icon: 'growth', title: 'Ongoing support', desc: 'To expand activities and reach more students' },
            ] },
          },
          {
            text: ['Under the conditions in the Gaza Strip, these needs become even harder to meet, from providing equipment and learning resources to dealing with **electricity and internet challenges** and limited means.'],
            visual: { kind: 'signals', items: [
              { icon: 'resources', label: 'Equipment and learning resources' },
              { icon: 'power', label: 'Electricity and internet' },
              { icon: 'limit', label: 'Limited means' },
            ] },
          },
          {
            text: [
              'Despite these challenges, we keep working with what is available, drawing on the experience of team members and volunteers to build new opportunities for students.',
              'But we know that what we can offer today may not be enough to reach everyone who needs these opportunities. This is where **people and institutions who believe in the idea** matter, ready to help it grow and continue.',
            ],
            visual: { kind: 'question', text: 'How can you help?' },
          },
        ],
      },
      {
        id: 'support', tone: 'help',
        title: 'Together, we can reach bigger opportunities',
        beats: [
          {
            text: ['Every learning opportunity a student receives can help them gain a new skill, complete a practical project, and take a step closer to their career. To expand these opportunities, Manara needs **people and organisations who believe in investing in knowledge and skills**.'],
            visual: { kind: 'path', steps: ['A learning opportunity', 'A new skill', 'A practical project', 'A step toward the future'] },
          },
          {
            text: ['You can be part of this journey in different ways: by helping provide the devices and equipment needed for training, sharing your technical expertise in a workshop or course, helping provide field training opportunities for students, or building partnerships that give us access to new resources and expertise.'],
            visual: { kind: 'cards', variant: 'way', items: [
              { icon: 'device', title: 'Devices and equipment', meets: 'Devices and technical tools' },
              { icon: 'cpu', title: 'Your expertise in a workshop or course', meets: 'Running workshops' },
              { icon: 'briefcase', title: 'Field training opportunities', meets: 'More varied learning experiences' },
              { icon: 'link', title: 'Partnerships', meets: 'New resources and expertise' },
            ] },
          },
          {
            text: [
              'Even sharing Manara’s activities and spreading its message can help us reach people who have the expertise or means we need.',
              'We are not only looking for people who offer support, but for those who see in **educating young people and developing their skills** a chance to build a better future. Every suitable contribution can help us expand our activities, improve our learning experience, and reach more students.',
            ],
          },
          {
            visual: { kind: 'statement', text: 'Help us turn limited means into **real opportunities to learn and grow**.' },
            actions: [
              { label: 'Support Manara', intent: 'support', primary: true },
              { label: 'Volunteer with us', intent: 'volunteer' },
              { label: 'Become a partner', intent: 'partner' },
            ],
          },
        ],
      },
    ],
  },
};
