import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiCheckCircle, FiAlertCircle, FiArrowLeft, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { HiGlobeAlt } from 'react-icons/hi2';
import { LanguageContext } from '../LanguageContext';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';
import { getValidationErrors } from '../lib/apiError';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // SubmitFormRequest: PDF حتى 5 MB
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // نفس فحص نموذج التواصل؛ الـ backend يتحقق نهائياً
// وجهة «رجوع» حين لا توجد صفحة سابقة داخل الموقع (فتح الرابط مباشرة أو في تبويب جديد): قائمة الورش
const BACK_FALLBACK = '/#workshops';

const copy = {
  AR: {
    back: 'رجوع',
    kicker: 'التسجيل في ورشة',
    loading: 'جاري تحميل النموذج...',
    notFound: 'عذراً، هذا النموذج غير موجود أو تم إيقافه.',
    loadFailed: 'تعذر تحميل النموذج، يرجى المحاولة لاحقاً.',
    retry: 'إعادة المحاولة',
    untitled: 'نموذج تسجيل',
    untitledField: 'حقل بدون عنوان',
    requiredNote: 'الحقول المشار إليها بـ * إلزامية.',
    requiredSr: '(إلزامي)',
    choose: 'اختر من القائمة...',
    required: 'هذا الحقل مطلوب.',
    chooseOne: 'يرجى اختيار خيار واحد على الأقل.',
    invalidEmail: 'اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.',
    invalidNumber: 'يرجى إدخال رقم صحيح.',
    invalidDate: 'يرجى إدخال تاريخ صحيح.',
    invalidChoice: 'يرجى اختيار أحد الخيارات المتاحة.',
    invalid: 'القيمة المدخلة غير صالحة.',
    pdfOnly: 'يرجى رفع ملف بصيغة PDF.',
    tooLarge: 'حجم الملف يجب ألا يتجاوز 5 ميجابايت.',
    fileInvalid: 'يرجى رفع ملف PDF لا يتجاوز 5 ميجابايت.',
    fileHint: 'ملف PDF فقط، بحد أقصى 5 ميجابايت.',
    fixErrors: 'يرجى مراجعة الحقول المظللة باللون الأحمر.',
    throttled: 'محاولات كثيرة، يرجى الانتظار دقيقة ثم المحاولة مجدداً.',
    closed: 'هذا النموذج لم يعد يستقبل ردوداً.',
    networkError: 'تعذر الاتصال بالخادم، تحقق من اتصالك ثم حاول مجدداً.',
    genericError: 'حدث خطأ أثناء إرسال الرد، يرجى المحاولة لاحقاً.',
    submitting: 'جاري الإرسال...',
    submit: 'إرسال التسجيل',
    successTitle: 'تم إرسال ردك بنجاح!',
    successText: 'شكراً لك على تعبئة النموذج، سيتم تحويلك إلى الصفحة الرئيسية...',
    home: 'العودة للرئيسية',
    noFields: 'لا توجد حقول في هذا النموذج حالياً.',
    switchLang: 'English',
    site: 'منارة',
  },
  EN: {
    back: 'Back',
    kicker: 'Workshop registration',
    loading: 'Loading form...',
    notFound: 'Sorry, this form does not exist or is no longer active.',
    loadFailed: 'The form could not be loaded. Please try again later.',
    retry: 'Try again',
    untitled: 'Registration form',
    untitledField: 'Untitled field',
    requiredNote: 'Fields marked with * are required.',
    requiredSr: '(required)',
    choose: 'Choose from the list...',
    required: 'This field is required.',
    chooseOne: 'Please choose at least one option.',
    invalidEmail: 'Enter a valid email, e.g. name@example.com.',
    invalidNumber: 'Please enter a valid number.',
    invalidDate: 'Please enter a valid date.',
    invalidChoice: 'Please choose one of the available options.',
    invalid: 'The value entered is not valid.',
    pdfOnly: 'Please upload a PDF file.',
    tooLarge: 'The file must be 5 MB or smaller.',
    fileInvalid: 'Please upload a PDF file of 5 MB or smaller.',
    fileHint: 'PDF only, up to 5 MB.',
    fixErrors: 'Please review the fields highlighted in red.',
    throttled: 'Too many attempts. Please wait a minute and try again.',
    closed: 'This form is no longer accepting responses.',
    networkError: 'Could not reach the server. Check your connection and try again.',
    genericError: 'Something went wrong while submitting. Please try again later.',
    submitting: 'Submitting...',
    submit: 'Submit registration',
    successTitle: 'Your response was submitted!',
    successText: 'Thank you for filling out the form. Redirecting you to the home page...',
    home: 'Back to home',
    noFields: 'This form has no fields yet.',
    switchLang: 'العربية',
    site: 'Manara',
  },
};

const isEmptyAnswer = (value) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

// رسالة خطأ الخادم (422) بلغة الصفحة حسب نوع الحقل، بدلاً من نص Laravel الإنجليزي
const serverMessage = (field, value, text) => {
  if (isEmptyAnswer(value)) return field?.type === 'checkbox' ? text.chooseOne : text.required;
  switch (field?.type) {
    case 'email': return text.invalidEmail;
    case 'number': return text.invalidNumber;
    case 'date': return text.invalidDate;
    case 'file': return text.fileInvalid;
    case 'select':
    case 'radio':
    case 'checkbox': return text.invalidChoice;
    default: return text.invalid;
  }
};

// «رجوع»: إلى الصفحة السابقة فعلاً إن جاء الزائر من داخل الموقع (React Router يحفظ ترتيب الصفحة في history.state.idx)،
// وإلا إلى قائمة الورش. الرابط حقيقي، فيعمل الفتح في تبويب جديد أيضاً.
function BackLink({ text, isAr }) {
  const navigate = useNavigate();
  const Icon = isAr ? FiArrowRight : FiArrowLeft;
  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if ((window.history.state?.idx ?? 0) > 0) {
      e.preventDefault();
      navigate(-1);
    }
  };
  return (
    <Link
      to={BACK_FALLBACK}
      onClick={handleClick}
      className="inline-flex items-center gap-2 h-10 ps-3 pe-4 rounded-full text-sm font-semibold text-brand-purple bg-white border border-brand-purple/10 hover:border-brand-purple/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
    >
      <Icon aria-hidden="true" className="text-base" />
      {text.back}
    </Link>
  );
}

const PublicFormView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { lang, setLang } = useContext(LanguageContext);
  const text = copy[lang];
  const isAr = lang === 'AR';

  const [form, setForm] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const sending = useRef(false); // يمنع الإرسال المكرر بالنقر السريع قبل إعادة الرسم

  // GET /forms/{slug} — النماذج غير المنشورة تعيد 404
  const load = useCallback(() => {
    let cancelled = false;
    setLoadStatus('loading');

    axiosClient.get(`/forms/${slug}`)
      .then((response) => {
        if (cancelled) return;
        setForm(response.data.data);
        setLoadStatus('ready');
      })
      .catch((error) => {
        if (!cancelled) setLoadStatus(error.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => load(), [load]);

  // العودة للصفحة الرئيسية بعد 4 ثوانٍ من النجاح
  useEffect(() => {
    if (!submitted) return undefined;
    const timer = setTimeout(() => navigate('/'), 4000);
    return () => clearTimeout(timer);
  }, [submitted, navigate]);

  const formTitle = form ? localize(form.title, lang, text.untitled) : '';
  useEffect(() => {
    if (formTitle) document.title = `${formTitle} | ${text.site}`;
    return () => {
      document.title = 'منارة';
    };
  }, [formTitle, text.site]);

  const fields = [...(form?.fields || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const setAnswer = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleFileChange = (field, file) => {
    if (file && !(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setAnswer(field.id, null);
      setFieldErrors((prev) => ({ ...prev, [field.id]: text.pdfOnly }));
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setAnswer(field.id, null);
      setFieldErrors((prev) => ({ ...prev, [field.id]: text.tooLarge }));
      return;
    }
    setAnswer(field.id, file || null);
  };

  // التحقق في المتصفح بلغة الصفحة (بدل رسائل المتصفح الافتراضية)؛ الـ backend يبقى المرجع النهائي
  const validateClientSide = () => {
    const errors = {};
    fields.forEach((field) => {
      const value = answers[field.id];
      if (Boolean(field.is_required) && isEmptyAnswer(value)) {
        errors[field.id] = field.type === 'checkbox' ? text.chooseOne : text.required;
      } else if (field.type === 'email' && !isEmptyAnswer(value) && !EMAIL.test(String(value).trim())) {
        errors[field.id] = text.invalidEmail;
      }
    });
    return errors;
  };

  // نقل التركيز إلى أول حقل فيه خطأ (بترتيب الحقول) حتى يراه الزائر على الهاتف أيضاً
  const focusFirstError = (errors) => {
    const first = fields.find((field) => errors[field.id]);
    if (!first) return;
    const el = document.getElementById(`field-${first.id}`) || document.querySelector(`[name="field-${first.id}"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    setErrorMessage('');

    // أخطاء الملفات (الصيغة والحجم) تُحدَّد عند الاختيار وتبقى أولى من «مطلوب»
    const clientErrors = { ...validateClientSide(), ...Object.fromEntries(Object.entries(fieldErrors).filter(([, msg]) => msg)) };
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage(text.fixErrors);
      focusFirstError(clientErrors);
      return;
    }

    sending.current = true;
    setSubmitting(true);

    try {
      // POST /forms/{slug}/submit — answers[fieldId] (و answers[fieldId][] لخيارات checkbox)
      const dataToSend = new FormData();
      Object.entries(answers).forEach(([fieldId, value]) => {
        if (isEmptyAnswer(value)) return;
        if (Array.isArray(value)) {
          value.forEach((item) => dataToSend.append(`answers[${fieldId}][]`, item));
        } else {
          dataToSend.append(`answers[${fieldId}]`, value);
        }
      });

      await axiosClient.post(`/forms/${slug}/submit`, dataToSend);
      setSubmitted(true);
    } catch (error) {
      const status = error.response?.status;
      if (status === 422) {
        // أخطاء Laravel بالشكل answers.{fieldId} أو answers.{fieldId}.{index}
        const serverErrors = {};
        Object.keys(getValidationErrors(error)).forEach((key) => {
          const match = key.match(/^answers\.(\d+)/);
          if (match && !serverErrors[match[1]]) {
            const field = fields.find((f) => String(f.id) === match[1]);
            serverErrors[match[1]] = serverMessage(field, answers[match[1]], text);
          }
        });
        setFieldErrors(serverErrors);
        setErrorMessage(text.fixErrors);
        focusFirstError(serverErrors);
      } else if (status === 429) {
        setErrorMessage(text.throttled);
      } else if (status === 403 || status === 404) {
        setErrorMessage(text.closed);
      } else if (!error.response) {
        setErrorMessage(text.networkError);
      } else {
        setErrorMessage(text.genericError);
      }
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  const pageDir = isAr ? 'rtl' : 'ltr';

  // الشريط العلوي: رجوع، الشعار، تبديل اللغة — يبقى ظاهراً في كل حالات الصفحة
  const topBar = (
    <div className="max-w-2xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
      <div className="justify-self-start"><BackLink text={text} isAr={isAr} /></div>
      <Link to="/" aria-label={isAr ? 'منارة - الرئيسية' : 'Manara - Home'} className="justify-self-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
        <img src="/transparent BG.svg" alt={text.site} className="h-9 sm:h-10 w-auto" />
      </Link>
      <button
        type="button"
        onClick={setLang}
        lang={isAr ? 'en' : 'ar'}
        className="justify-self-end inline-flex items-center gap-2 h-10 px-3 rounded-full text-sm font-medium text-brand-purple bg-white border border-brand-purple/10 hover:border-brand-purple/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        <HiGlobeAlt aria-hidden="true" />
        {text.switchLang}
      </button>
    </div>
  );

  const cardClass = 'max-w-2xl mx-auto bg-white border border-brand-purple/10 rounded-3xl shadow-[0_30px_60px_-40px_rgb(49_35_100/0.35)] overflow-hidden';

  const page = (children) => (
    <div className="min-h-screen bg-brand-tint text-gray-800 py-5 sm:py-8 px-4 sm:px-6" dir={pageDir}>
      {topBar}
      {children}
    </div>
  );

  if (loadStatus === 'loading') {
    return page(
      <div className={`${cardClass} p-6 sm:p-10`} aria-busy="true">
        <span className="sr-only" role="status">{text.loading}</span>
        <div aria-hidden="true" className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded-full bg-brand-tint" />
          <div className="h-8 w-3/4 rounded-xl bg-brand-tint" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded-full bg-brand-tint" />
              <div className="h-12 rounded-xl bg-brand-tint" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadStatus !== 'ready') {
    return page(
      <div className={`${cardClass} p-8 sm:p-10 text-center space-y-4`} role="alert">
        <FiAlertCircle className="text-red-500 text-5xl mx-auto" aria-hidden="true" />
        <p className="text-gray-700 font-semibold">{loadStatus === 'not-found' ? text.notFound : text.loadFailed}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {loadStatus === 'error' && (
            <button type="button" onClick={load} className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-bold text-white bg-brand-orange hover:bg-brand-orange-dark transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/30">
              <FiRefreshCw aria-hidden="true" />{text.retry}
            </button>
          )}
          <Link to="/" className="inline-flex items-center h-11 px-5 rounded-full font-bold text-brand-purple border border-brand-purple/20 hover:bg-brand-tint transition-colors">{text.home}</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return page(
      <div className={`${cardClass} p-8 sm:p-12 text-center space-y-4`} role="status">
        <FiCheckCircle className="text-green-500 text-5xl mx-auto" aria-hidden="true" />
        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">{text.successTitle}</h1>
        <p className="text-gray-600 leading-7">{text.successText}</p>
        <Link to="/" className="inline-flex items-center h-11 px-6 mt-2 rounded-full font-bold text-white bg-brand-orange hover:bg-brand-orange-dark transition-colors">{text.home}</Link>
      </div>
    );
  }

  const coverUrl = resolveMediaUrl(form.image);
  const description = localize(form.description, lang);
  const hasRequired = fields.some((field) => Boolean(field.is_required));
  const inputClass = (hasError) =>
    `w-full rounded-xl px-4 py-3 text-base text-gray-800 border-[1.5px] outline-none transition-colors ${hasError ? 'bg-white border-red-400 focus:ring-4 focus:ring-red-100' : 'bg-brand-tint border-transparent focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15'}`;

  return page(
    <main className={cardClass}>
      {coverUrl && (
        <div className="w-full h-40 sm:h-52 bg-brand-tint">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6 sm:p-10">
        <header className="pb-6 mb-8 border-b border-brand-purple/10">
          <p className="text-sm font-bold text-brand-orange-dark">{text.kicker}</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-brand-purple leading-snug" dir="auto">{formTitle}</h1>
          {description && (
            <p className="mt-3 text-gray-600 leading-7 whitespace-pre-line" dir="auto">{description}</p>
          )}
          {hasRequired && <p className="mt-4 text-xs text-gray-500">{text.requiredNote}</p>}
        </header>

        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">{text.noFields}</p>
          ) : (
            <div className="space-y-7">
              {fields.map((field) => {
                const fieldId = field.id;
                // is_required قد يصل كـ 0/1 حسب قاعدة البيانات، لذا نحوله لقيمة منطقية
                const isRequired = Boolean(field.is_required);
                const inputId = `field-${fieldId}`;
                const errorId = `${inputId}-error`;
                const fieldError = fieldErrors[fieldId];
                const fieldLabel = localize(field.label, lang, text.untitledField);
                const options = Array.isArray(field.options) ? field.options : [];
                const isGroup = field.type === 'checkbox' || field.type === 'radio';
                const describedBy = [fieldError ? errorId : null, field.type === 'file' ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined;

                const labelContent = (
                  <>
                    {fieldLabel}
                    {isRequired && <><span className="text-brand-orange-dark ms-1" aria-hidden="true">*</span><span className="sr-only"> {text.requiredSr}</span></>}
                  </>
                );
                const labelClass = 'block mb-2 text-sm sm:text-base font-bold text-brand-purple';

                return (
                  <div key={fieldId}>
                    {isGroup ? (
                      <span id={`${inputId}-label`} className={labelClass} dir="auto">{labelContent}</span>
                    ) : (
                      <label htmlFor={inputId} className={labelClass} dir="auto">{labelContent}</label>
                    )}

                    {['text', 'email', 'number', 'date'].includes(field.type) && (
                      <input
                        id={inputId}
                        type={field.type}
                        required={isRequired}
                        autoComplete={field.type === 'email' ? 'email' : undefined}
                        inputMode={field.type === 'email' ? 'email' : field.type === 'number' ? 'decimal' : undefined}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={describedBy}
                        dir={field.type === 'email' || field.type === 'number' ? 'ltr' : 'auto'}
                        value={answers[fieldId] || ''}
                        onChange={(e) => setAnswer(fieldId, e.target.value)}
                        className={`${inputClass(fieldError)} ${isAr && (field.type === 'email' || field.type === 'number') ? 'text-right' : ''}`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        id={inputId}
                        required={isRequired}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={describedBy}
                        rows="4"
                        dir="auto"
                        value={answers[fieldId] || ''}
                        onChange={(e) => setAnswer(fieldId, e.target.value)}
                        className={`${inputClass(fieldError)} resize-y`}
                      />
                    )}

                    {/* قيمة الخيار المرسلة هي النص العربي الأصلي (الذي يتحقق منه الـ backend)، والمعروض حسب اللغة */}
                    {field.type === 'select' && (
                      <select
                        id={inputId}
                        required={isRequired}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={describedBy}
                        value={answers[fieldId] || ''}
                        onChange={(e) => setAnswer(fieldId, e.target.value)}
                        className={`${inputClass(fieldError)} cursor-pointer`}
                      >
                        <option value="" disabled>{text.choose}</option>
                        {options.map((opt, optIndex) => (
                          <option key={optIndex} value={localize(opt, 'AR')}>{localize(opt, lang)}</option>
                        ))}
                      </select>
                    )}

                    {isGroup && (
                      <div
                        role={field.type === 'radio' ? 'radiogroup' : 'group'}
                        aria-labelledby={`${inputId}-label`}
                        aria-describedby={describedBy}
                        aria-invalid={field.type === 'radio' ? Boolean(fieldError) : undefined}
                        className="grid gap-2 sm:grid-cols-2"
                      >
                        {options.map((opt, optIndex) => {
                          const value = localize(opt, 'AR');
                          const current = answers[fieldId];
                          const checked = field.type === 'checkbox'
                            ? Array.isArray(current) && current.includes(value)
                            : current === value;

                          return (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 min-h-12 px-4 py-2.5 rounded-xl border-[1.5px] cursor-pointer transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-orange/15 ${checked ? 'border-brand-orange bg-brand-orange/5' : fieldError ? 'border-red-300 bg-white' : 'border-brand-purple/10 bg-white hover:border-brand-purple/30'}`}
                            >
                              <input
                                type={field.type}
                                name={inputId}
                                value={value}
                                required={field.type === 'radio' && isRequired}
                                checked={checked}
                                onChange={(e) => {
                                  if (field.type === 'radio') {
                                    setAnswer(fieldId, e.target.value);
                                    return;
                                  }
                                  const currentValues = Array.isArray(current) ? current : [];
                                  setAnswer(fieldId, e.target.checked ? [...currentValues, value] : currentValues.filter((v) => v !== value));
                                }}
                                className="w-5 h-5 shrink-0 accent-brand-orange cursor-pointer focus:outline-none"
                              />
                              <span className="text-gray-700 font-medium" dir="auto">{localize(opt, lang)}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.type === 'file' && (
                      <>
                        <input
                          id={inputId}
                          type="file"
                          accept="application/pdf,.pdf"
                          required={isRequired}
                          aria-invalid={Boolean(fieldError)}
                          aria-describedby={describedBy}
                          onChange={(e) => handleFileChange(field, e.target.files[0])}
                          className={`w-full rounded-xl p-2 text-sm text-gray-600 border-[1.5px] border-dashed ${fieldError ? 'border-red-400' : 'border-brand-purple/20'} file:me-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple-dark file:cursor-pointer cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/15`}
                        />
                        <p id={`${inputId}-hint`} className="mt-2 text-xs text-gray-500">{text.fileHint}</p>
                      </>
                    )}

                    {fieldError && (
                      <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <FiAlertCircle aria-hidden="true" className="shrink-0" />{fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="mt-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-3 font-medium">
              <FiAlertCircle className="text-lg shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || fields.length === 0}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full font-bold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/30"
          >
            {submitting && <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {submitting ? text.submitting : text.submit}
          </button>
        </form>
      </div>
    </main>
  );
};

export default PublicFormView;
