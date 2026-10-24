import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiCopy, FiMail, FiMapPin, FiPhone, FiRefreshCw, FiSend } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa6';
import { LanguageContext } from '../LanguageContext';
import { Kicker } from './brand';
import { EASE, reveal } from '../lib/brand';
import { CONTACT_INTENT_EVENT } from '../lib/contactIntent';

// النموذج يرسل إلى بريد الفريق عبر formsubmit (نفس الخدمة السابقة، بلا خادم خاص)؛ الحقول: name, email, message،
// و _subject بحسب الموضوع، و _honey حقل مخفي لصدّ الرسائل الآلية.
// الأزرار في بقية الصفحة (الحكاية، الخدمات، الورش) تحدد الموضوع عبر CONTACT_INTENT_EVENT.
const ENDPOINT = 'https://formsubmit.co/ajax/manara.gaza.pal@gmail.com';

const TOPICS = {
  general: { AR: ['استفسار عام', ''], EN: ['General question', ''] },
  workshop: { AR: ['الورش والدورات', 'أودّ معرفة المزيد عن ورش منارة ودوراتها القادمة.'], EN: ['Workshops & courses', 'I would like to know more about upcoming Manara workshops and courses.'] },
  volunteer: { AR: ['التطوّع', 'أرغب في التطوّع مع منارة. مجال خبرتي: '], EN: ['Volunteering', 'I would like to volunteer with Manara. My area of expertise: '] },
  partner: { AR: ['شراكة', 'أمثّل جهة ترغب في بناء شراكة مع منارة: '], EN: ['Partnership', 'I represent an organisation interested in partnering with Manara: '] },
  support: { AR: ['دعم منارة', 'أرغب في دعم منارة، وأودّ معرفة الاحتياجات الحالية وطرق الدعم المتاحة.'], EN: ['Supporting Manara', 'I would like to support Manara and learn about your current needs and the ways to help.'] },
};
const CHIPS = ['general', 'workshop', 'volunteer', 'partner', 'support'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values, isAr) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = isAr ? 'اكتب اسمك (حرفان على الأقل).' : 'Enter your name (at least 2 characters).';
  if (!EMAIL.test(values.email.trim())) errors.email = isAr ? 'اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.' : 'Enter a valid email, e.g. name@example.com.';
  if (values.message.trim().length < 10) errors.message = isAr ? 'اكتب رسالتك (10 أحرف على الأقل).' : 'Write your message (at least 10 characters).';
  return errors;
}

function Channel({ icon: Icon, label, value, href, copy, isAr, ltr }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(copy); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* الحافظة غير متاحة؛ يبقى الرابط */ }
  };
  return (
    <li className="contact-channel">
      <span className="contact-channel-icon" aria-hidden="true"><Icon /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-brand-gray">{label}</span>
        {href
          ? <a href={href} className="contact-channel-value" dir={ltr ? 'ltr' : undefined}>{value}</a>
          : <span className="contact-channel-value">{value}</span>}
      </span>
      {copy && (
        <button type="button" onClick={doCopy} className="contact-copy" aria-label={`${isAr ? 'نسخ' : 'Copy'} ${label}`}>
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          <span className="sr-only" aria-live="polite">{copied ? (isAr ? 'تم النسخ' : 'Copied') : ''}</span>
        </button>
      )}
    </li>
  );
}

function Contact() {
  const { lang, t } = useContext(LanguageContext);
  const isAr = lang === 'AR';
  const uid = useId().replace(/:/g, '');

  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [touched, setTouched] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | failed
  const [topic, setTopic] = useState(null);
  const [serviceLabel, setServiceLabel] = useState('');
  const prefilled = useRef('');
  const refs = { name: useRef(null), email: useRef(null), message: useRef(null) };
  const sending = useRef(false);

  const errors = validate(values, isAr);
  const showError = (field) => touched[field] && errors[field];

  const topicLabel = topic === 'service' ? serviceLabel : topic ? TOPICS[topic][lang][0] : '';
  const prefillFor = (key, label) => {
    if (key === 'service') return isAr ? `أرغب في معرفة المزيد عن خدمة: ${label}.` : `I would like to know more about the “${label}” service.`;
    return TOPICS[key]?.[lang][1] || '';
  };

  // تغيير الموضوع: لا نمسح ما كتبه الزائر؛ نملأ النص المقترح فقط إن كان الحقل فارغاً أو ما زال يحمل اقتراحاً سابقاً
  const chooseTopic = (key, label = '') => {
    setTopic(key === 'general' ? null : key);
    if (key === 'service') setServiceLabel(label);
    if (state === 'sent' || state === 'failed') setState('idle');
    setValues(v => {
      if (v.message.trim() && v.message !== prefilled.current) return v;
      const text = prefillFor(key, label);
      prefilled.current = text;
      return { ...v, message: text };
    });
  };

  useEffect(() => {
    const onIntent = (event) => {
      const detail = event.detail;
      if (detail && typeof detail === 'object' && detail.topic === 'service') chooseTopic('service', detail.label);
      else if (TOPICS[detail]) chooseTopic(detail);
      else return;
      setTimeout(() => refs.message.current?.focus({ preventScroll: true }), 700);
    };
    window.addEventListener(CONTACT_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(CONTACT_INTENT_EVENT, onIntent);
  });

  const update = (field) => (e) => setValues(v => ({ ...v, [field]: e.target.value }));
  const blur = (field) => () => setTouched(tc => ({ ...tc, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending.current) return; // لا إرسال مكرر
    setTouched({ name: true, email: true, message: true });
    const first = ['name', 'email', 'message'].find(f => errors[f]);
    if (first) { refs[first].current?.focus(); return; }

    sending.current = true;
    setState('sending');
    const formData = new FormData(e.target);
    formData.delete('topic-choice'); // اختيار الموضوع واجهة فقط؛ يصل الموضوع في _subject
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
      const body = await response.json().catch(() => ({}));
      // formsubmit يعيد success: "false" أحياناً مع حالة 200
      if (response.ok && String(body.success) !== 'false') {
        setState('sent');
        setValues({ name: '', email: '', message: '' });
        setTouched({});
        setTopic(null);
        prefilled.current = '';
      } else setState('failed');
    } catch {
      setState('failed');
    } finally {
      sending.current = false;
    }
  };

  const field = (name) => ({
    id: `${uid}-${name}`,
    ref: refs[name],
    name,
    value: values[name],
    onChange: update(name),
    onBlur: blur(name),
    'aria-invalid': showError(name) ? 'true' : undefined,
    'aria-describedby': showError(name) ? `${uid}-${name}-error` : undefined,
    className: `contact-input${showError(name) ? ' is-invalid' : ''}`,
  });
  const errorText = (name) => (showError(name)
    ? <p id={`${uid}-${name}-error`} className="contact-error"><FiAlertCircle aria-hidden="true" />{errors[name]}</p> : null);

  const phoneHref = `tel:${String(t.phone || '').replace(/[^\d+]/g, '')}`;
  const mailBody = encodeURIComponent(values.message);

  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="container mx-auto px-6 md:px-10" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

          {/* الدعوة وقنوات التواصل */}
          <motion.div {...reveal()} className="lg:col-span-5 contact-invite">
            <span className="contact-invite-beam" aria-hidden="true" />
            <Kicker tone="dark">{isAr ? 'تواصل معنا' : 'Contact us'}</Kicker>
            <h2 id="contact-title" className="mt-4 text-3xl md:text-[2.4rem] font-bold text-white leading-tight">{t.contactTitle}</h2>
            <p className="mt-4 text-brand-gray leading-8">{t.contactDesc}</p>
            <p className="mt-4 text-sm text-brand-tint/80 leading-7">{isAr ? 'نرحّب بأسئلتكم عن الورش، وبالتطوّع، والشراكات التعليمية، وكل فكرة تدعم تعلّم الطلاب.' : 'We welcome questions about workshops, volunteering, educational partnerships, and any idea that supports students’ learning.'}</p>

            <ul className="mt-8 space-y-3">
              <Channel icon={FiMail} label={isAr ? 'البريد الإلكتروني' : 'Email'} value={t.email} href={`mailto:${t.email}`} copy={t.email} isAr={isAr} ltr />
              <Channel icon={FiPhone} label={isAr ? 'الهاتف' : 'Phone'} value={t.phone} href={phoneHref} copy={t.phone} isAr={isAr} ltr />
              <Channel icon={FiMapPin} label={isAr ? 'العنوان' : 'Address'} value={t.address} isAr={isAr} />
            </ul>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-xs text-brand-gray">{isAr ? 'تابعنا' : 'Follow us'}</span>
              <a href="https://www.facebook.com/profile.php?id=61591327107257" target="_blank" rel="noopener noreferrer" className="contact-social" aria-label="Facebook"><FaFacebookF aria-hidden="true" /></a>
              <a href="https://www.linkedin.com/company/manara03/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="contact-social" aria-label="LinkedIn"><FaLinkedinIn aria-hidden="true" /></a>
              <a href="https://www.instagram.com/manara.pal/" target="_blank" rel="noopener noreferrer" className="contact-social" aria-label="Instagram"><FaInstagram aria-hidden="true" /></a>
            </div>
          </motion.div>

          {/* النموذج */}
          <motion.div {...reveal(0.1)} className="lg:col-span-7 contact-card">
            <AnimatePresence mode="wait" initial={false}>
              {state === 'sent' ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}
                  className="contact-sent" role="status">
                  <span className="contact-sent-mark" aria-hidden="true"><FiCheck /></span>
                  <h3 className="mt-6 text-2xl font-bold text-brand-purple">{isAr ? 'وصلت رسالتك' : 'Your message was sent'}</h3>
                  <p className="mt-3 text-gray-600 leading-7 max-w-md">{isAr ? 'شكراً لتواصلك مع منارة. وصلت رسالتك إلى الفريق، ويكون الرد عبر بريدك الإلكتروني.' : 'Thank you for contacting Manara. Your message reached the team, and replies come to your email.'}</p>
                  <button type="button" onClick={() => setState('idle')} className="contact-ghost mt-8">{isAr ? 'إرسال رسالة أخرى' : 'Send another message'}</button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} noValidate aria-busy={state === 'sending'}>
                  <input type="hidden" name="_template" value="table" />
                  {topicLabel && <input type="hidden" name="_subject" value={`${isAr ? 'منارة — ' : 'Manara — '}${topicLabel}`} />}
                  {/* فخ للرسائل الآلية: مخفي عن الزوار وقارئات الشاشة */}
                  <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                  <fieldset>
                    <legend className="text-sm font-bold text-brand-purple mb-3">{isAr ? 'عمّ تودّ أن تكتب؟' : 'What is your message about?'}</legend>
                    <div className="flex flex-wrap gap-2">
                      {CHIPS.map(key => {
                        const selected = key === 'general' ? !topic : topic === key;
                        return (
                          <label key={key} className={`contact-chip${selected ? ' is-selected' : ''}`}>
                            <input type="radio" name="topic-choice" className="sr-only" checked={selected} onChange={() => chooseTopic(key)} />
                            {TOPICS[key][lang][0]}
                          </label>
                        );
                      })}
                      {topic === 'service' && (
                        <span className="contact-chip is-selected">{serviceLabel}</span>
                      )}
                    </div>
                  </fieldset>

                  <div className="grid md:grid-cols-2 gap-5 mt-7">
                    <div>
                      <label htmlFor={`${uid}-name`} className="contact-label">{isAr ? 'الاسم' : 'Name'}</label>
                      <input type="text" autoComplete="name" placeholder={t.namePlaceholder} {...field('name')} />
                      {errorText("name")}
                    </div>
                    <div>
                      <label htmlFor={`${uid}-email`} className="contact-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input type="email" autoComplete="email" inputMode="email" dir="ltr" placeholder={t.emailPlaceholder} {...field('email')} />
                      {errorText("email")}
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor={`${uid}-message`} className="contact-label">{isAr ? 'الرسالة' : 'Message'}</label>
                      <span className="text-xs text-gray-400 tabular-nums" aria-hidden="true">{values.message.length}</span>
                    </div>
                    <textarea rows={6} placeholder={t.messagePlaceholder} {...field('message')} />
                    {errorText("message")}
                  </div>

                  {state === 'failed' && (
                    <div className="contact-failed" role="alert">
                      <FiAlertCircle aria-hidden="true" className="shrink-0 mt-0.5" />
                      <span>
                        {isAr ? 'لم تُرسل الرسالة بسبب مشكلة في الاتصال. حاول مرة أخرى، أو ' : 'The message was not sent because of a connection problem. Try again, or '}
                        <a href={`mailto:${t.email}?body=${mailBody}`} className="underline font-semibold">{isAr ? 'أرسلها من بريدك مباشرة' : 'send it from your email app'}</a>.
                      </span>
                    </div>
                  )}

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <button type="submit" disabled={state === 'sending'} className="contact-submit">
                      {state === 'sending'
                        ? <><span className="contact-spinner" aria-hidden="true" />{isAr ? 'جاري الإرسال…' : 'Sending…'}</>
                        : state === 'failed'
                          ? <><FiRefreshCw aria-hidden="true" />{isAr ? 'إعادة المحاولة' : 'Try again'}</>
                          : <><FiSend aria-hidden="true" className={isAr ? '-scale-x-100' : ''} />{t.sendBtn}</>}
                    </button>
                    <p className="text-xs text-gray-500">{isAr ? 'يصل الرد إلى بريدك الإلكتروني.' : 'Replies come to your email.'}</p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
