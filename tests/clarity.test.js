import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, splitWords, wordProgress, wordScatter } from '../src/lib/clarity.js';

test('splitting by words preserves the exact text, including Arabic', () => {
  for (const text of ['الطموح حاضر. والطريق ليس سهلاً.', 'Ambition is here.  The path — not easy.']) {
    assert.equal(splitWords(text).map(p => p.part).join(''), text);
  }
  assert.equal(countWords('الطموح حاضر. والطريق ليس سهلاً.'), 5);
});

test('scatter is deterministic and bounded', () => {
  for (let i = 0; i < 200; i += 1) {
    assert.deepEqual(wordScatter(i), wordScatter(i));
    const s = wordScatter(i);
    assert.ok(Math.abs(s.dx) <= 0.9 && Math.abs(s.dy) <= 0.55 && Math.abs(s.r) <= 5 && s.blur >= 3 && s.blur <= 7 && Math.abs(s.s) <= 1);
  }
});

test('every word is blurred at the start and clear at the end; earlier words resolve first', () => {
  for (const t of [0, 0.3, 1]) {
    assert.equal(wordProgress(0, t), 0);
    assert.equal(wordProgress(1, t), 1);
  }
  assert.ok(wordProgress(0.6, 0) > wordProgress(0.6, 1));
});

test('emphasis markers are never shown or counted as words', async () => {
  const { parseEmphasis, plainText } = await import('../src/lib/clarity.js');
  const text = 'تنقطع **الدراسة الجامعية** مراراً';
  assert.equal(plainText(text), 'تنقطع الدراسة الجامعية مراراً');
  assert.equal(countWords(text), 4);
  assert.deepEqual(parseEmphasis(text).map(s => s.em), [false, true, false]);
  assert.equal(parseEmphasis(text).map(s => s.text).join(''), plainText(text));
});

test('the four chapters tell the story with the approved texts, and every action leads to the real contact form', async () => {
  const { manaraStory } = await import('../src/content/manaraStory.js');
  const ar = manaraStory.AR.chapters;
  assert.deepEqual(ar.map(c => c.title), [
    'حين تصبح أبسط فرص التعلّم تحديًا',
    'من واقع مليء بالتحديات، بدأت فكرة منارة',
    'الطموح وحده لا يكفي',
    'معًا، نستطيع الوصول إلى فرص أكبر',
  ]);
  for (const lang of ['AR', 'EN']) {
    const chapters = manaraStory[lang].chapters;
    assert.deepEqual(chapters.map(c => c.tone), ['problem', 'response', 'limit', 'help']);
    for (const c of chapters) {
      // كل مشهد يحمل نصاً أو عنصراً بصرياً، ولا مشهد فارغ
      for (const beat of c.beats) assert.ok((beat.text && beat.text.length) || beat.visual);
    }
    const actions = chapters[3].beats.flatMap(b => b.actions || []);
    assert.deepEqual(actions.map(a => a.intent), ['support', 'volunteer', 'partner']);
    // نهاية الفصل الثالث سؤال انتقالي يمهّد للفصل الرابع
    assert.equal(chapters[2].beats.at(-1).visual.kind, 'question');
  }
  // النص الكامل لكل فصل موجود (لا اختزال إلى شعارات): نطابق جملة مميزة من كل فقرة
  const all = ar.flatMap(c => c.beats.flatMap(b => [...(b.text || []), b.visual?.text || ''])).map(t => t.split('**').join('')).join(' ');
  for (const phrase of ['انقطاع الكهرباء، وضعف الإنترنت، ونقص الأجهزة والموارد', 'التخصصات التقنية والهندسية', 'ما يحتاجونه ليس المعرفة وحدها',
    'مساحة شبابية', 'بالتجربة والممارسة ومواجهة المشكلات الحقيقية', 'والطموح إلى فرصة', 'تتجاوز ما يستطيع الفريق توفيره بمفرده',
    'التدريب العملي يحتاج إلى أجهزة وأدوات تقنية', 'في ظل الظروف التي يعيشها قطاع غزة', 'خبرات أعضاء الفريق والمتطوعين',
    'أشخاص ومؤسسات يؤمنون بالفكرة', 'الاستثمار في المعرفة والمهارات', 'فرص تدريب ميداني للطلاب', 'مشاركة أنشطة منارة والتعريف برسالتها',
    'لا نبحث فقط عمّن يقدم الدعم', 'تحويل الإمكانات المحدودة إلى فرص حقيقية للتعلّم والتطوّر']) {
    assert.ok(all.includes(phrase), phrase);
  }
});
