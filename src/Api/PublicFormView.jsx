import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { HiGlobeAlt } from 'react-icons/hi2';
import { LanguageContext } from '../LanguageContext';
import { localize } from '../lib/localize';
import { resolveMediaUrl } from '../lib/media';
import { getValidationErrors } from '../lib/apiError';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // SubmitFormRequest: PDF حتى 5 MB

const copy = {
  AR: {
    loading: 'جاري تحميل النموذج...',
    notFound: 'عذراً، هذا النموذج غير موجود أو تم إيقافه.',
    loadFailed: 'تعذر تحميل النموذج، يرجى المحاولة لاحقاً.',
    untitled: 'نموذج تسجيل',
    untitledField: 'حقل بدون عنوان',
    choose: 'اختر من القائمة...',
    required: 'هذا الحقل مطلوب.',
    chooseOne: 'يرجى اختيار خيار واحد على الأقل.',
    pdfOnly: 'يرجى رفع ملف بصيغة PDF.',
    tooLarge: 'حجم الملف يجب ألا يتجاوز 5 ميجابايت.',
    fileHint: 'ملف PDF فقط، بحد أقصى 5 ميجابايت.',
    fixErrors: 'يرجى مراجعة الحقول المظللة باللون الأحمر.',
    throttled: 'محاولات كثيرة، يرجى الانتظار دقيقة ثم المحاولة مجدداً.',
    closed: 'هذا النموذج لم يعد يستقبل ردوداً.',
    genericError: 'حدث خطأ أثناء إرسال الرد، يرجى المحاولة لاحقاً.',
    submitting: 'جاري الإرسال...',
    submit: 'إرسال النموذج',
    successTitle: 'تم إرسال ردك بنجاح!',
    successText: 'شكراً لك على تعبئة النموذج، سيتم تحويلك إلى الصفحة الرئيسية...',
    home: 'العودة للرئيسية',
    noFields: 'لا توجد حقول في هذا النموذج حالياً.',
    switchLang: 'English',
  },
  EN: {
    loading: 'Loading form...',
    notFound: 'Sorry, this form does not exist or is no longer active.',
    loadFailed: 'The form could not be loaded. Please try again later.',
    untitled: 'Registration form',
    untitledField: 'Untitled field',
    choose: 'Choose from the list...',
    required: 'This field is required.',
    chooseOne: 'Please choose at least one option.',
    pdfOnly: 'Please upload a PDF file.',
    tooLarge: 'The file must be 5 MB or smaller.',
    fileHint: 'PDF only, up to 5 MB.',
    fixErrors: 'Please review the fields highlighted in red.',
    throttled: 'Too many attempts. Please wait a minute and try again.',
    closed: 'This form is no longer accepting responses.',
    genericError: 'Something went wrong while submitting. Please try again later.',
    submitting: 'Submitting...',
    submit: 'Submit',
    successTitle: 'Your response was submitted!',
    successText: 'Thank you for filling out the form. Redirecting you to the home page...',
    home: 'Back to home',
    noFields: 'This form has no fields yet.',
    switchLang: 'العربية',
  },
};

const isEmptyAnswer = (value) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

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

  // GET /forms/{slug} — النماذج غير المنشورة تعيد 404
  useEffect(() => {
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

  // العودة للصفحة الرئيسية بعد 4 ثوانٍ من النجاح
  useEffect(() => {
    if (!submitted) return undefined;
    const timer = setTimeout(() => navigate('/'), 4000);
    return () => clearTimeout(timer);
  }, [submitted, navigate]);

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

  // المتصفح لا يتحقق من مجموعات checkbox المطلوبة، لذا نتحقق منها هنا (والـ backend يتحقق من الكل)
  const validateClientSide = () => {
    const errors = {};
    fields.forEach((field) => {
      if (Boolean(field.is_required) && field.type === 'checkbox' && isEmptyAnswer(answers[field.id])) {
        errors[field.id] = text.chooseOne;
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const clientErrors = { ...validateClientSide(), ...Object.fromEntries(Object.entries(fieldErrors).filter(([, msg]) => msg)) };
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage(text.fixErrors);
      return;
    }

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
        Object.entries(getValidationErrors(error)).forEach(([key, messages]) => {
          const match = key.match(/^answers\.(\d+)/);
          if (match && !serverErrors[match[1]]) {
            serverErrors[match[1]] = isEmptyAnswer(answers[match[1]]) ? text.required : messages[0];
          }
        });
        setFieldErrors(serverErrors);
        setErrorMessage(text.fixErrors);
      } else if (status === 429) {
        setErrorMessage(text.throttled);
      } else if (status === 403 || status === 404) {
        setErrorMessage(text.closed);
      } else {
        setErrorMessage(text.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pageDir = isAr ? 'rtl' : 'ltr';

  const langToggle = (
    <button
      type="button"
      onClick={setLang}
      lang={isAr ? 'en' : 'ar'}
      className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:border-brand-orange hover:text-brand-orange-dark transition"
    >
      <HiGlobeAlt aria-hidden="true" />
      {text.switchLang}
    </button>
  );

  if (loadStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-tint text-gray-500 text-sm" dir={pageDir}>
        <div className="animate-pulse flex gap-2 items-center" role="status">
          <div className="w-3 h-3 bg-brand-orange rounded-full"></div>
          <div className="w-3 h-3 bg-brand-orange rounded-full"></div>
          <div className="w-3 h-3 bg-brand-orange rounded-full"></div>
          <span className="ms-3 font-medium">{text.loading}</span>
        </div>
      </div>
    );
  }

  if (loadStatus !== 'ready') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-brand-tint text-gray-700 p-4" dir={pageDir}>
        <div className="bg-white border border-gray-100 p-8 rounded-2xl text-center max-w-md w-full space-y-4 shadow-xl shadow-brand-purple/5">
          <FiAlertCircle className="text-red-500 text-5xl mx-auto" aria-hidden="true" />
          <p className="text-red-600 text-sm font-semibold">{loadStatus === 'not-found' ? text.notFound : text.loadFailed}</p>
          <Link to="/" className="inline-block text-sm font-semibold text-brand-orange-dark hover:underline">{text.home}</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-tint text-gray-800 p-4" dir={pageDir}>
        <div role="status" className="bg-white p-8 rounded-2xl border border-gray-100 text-center max-w-md w-full shadow-xl shadow-brand-purple/5 space-y-4">
          <FiCheckCircle className="text-green-500 text-5xl mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-bold text-brand-purple">{text.successTitle}</h1>
          <p className="text-sm text-gray-600">{text.successText}</p>
          <Link to="/" className="inline-block text-sm font-semibold text-brand-orange-dark hover:underline">{text.home}</Link>
        </div>
      </div>
    );
  }

  const coverUrl = resolveMediaUrl(form.image);
  const description = localize(form.description, lang);
  const inputClass = (hasError) =>
    `w-full bg-white border rounded-xl p-3 text-sm sm:text-base text-gray-800 focus:outline-none focus:ring-2 transition-all shadow-sm ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/20'}`;

  return (
    <div className="min-h-screen bg-brand-tint text-gray-800 py-6 px-4 sm:px-6 text-sm sm:text-base" dir={pageDir}>
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-4">
        <Link to="/" aria-label={isAr ? 'منارة - الرئيسية' : 'Manara - Home'}>
          <img src="/transparent BG.svg" alt={isAr ? 'منارة' : 'Manara'} className="h-10 w-auto" />
        </Link>
        {langToggle}
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-brand-purple/5">

        {coverUrl && (
          <div className="w-full h-56 sm:h-72 overflow-hidden border-b border-gray-100 bg-gray-50">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-purple mb-3" dir="auto">
            {localize(form.title, lang, text.untitled)}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600 mb-8 pb-4 border-b border-gray-100 leading-relaxed whitespace-pre-line" dir="auto">
              {description}
            </p>
          )}

          {errorMessage && (
            <div role="alert" className="p-4 mb-6 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 font-medium">
              <FiAlertCircle className="text-lg shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">{text.noFields}</p>
            ) : (
              <div className="space-y-6">
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
                      {fieldLabel} {isRequired && <span className="text-brand-orange-dark ms-1" aria-hidden="true">*</span>}
                    </>
                  );

                  return (
                    <div key={fieldId} className={`space-y-2.5 p-5 rounded-2xl border transition-all shadow-sm ${fieldError ? 'bg-red-50/40 border-red-200' : 'bg-brand-tint/70 border-brand-purple/10 hover:bg-brand-tint'}`}>
                      {isGroup ? (
                        <span id={`${inputId}-label`} className="block text-sm sm:text-base font-bold text-brand-purple">{labelContent}</span>
                      ) : (
                        <label htmlFor={inputId} className="block text-sm sm:text-base font-bold text-brand-purple">{labelContent}</label>
                      )}

                      {['text', 'email', 'number', 'date'].includes(field.type) && (
                        <input
                          id={inputId}
                          type={field.type}
                          required={isRequired}
                          aria-invalid={Boolean(fieldError)}
                          aria-describedby={describedBy}
                          dir={field.type === 'email' || field.type === 'number' ? 'ltr' : 'auto'}
                          value={answers[fieldId] || ''}
                          onChange={(e) => setAnswer(fieldId, e.target.value)}
                          className={inputClass(fieldError)}
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
                          className={inputClass(fieldError)}
                        >
                          <option value="" disabled>{text.choose}</option>
                          {options.map((opt, optIndex) => (
                            <option key={optIndex} value={localize(opt, 'AR')}>{localize(opt, lang)}</option>
                          ))}
                        </select>
                      )}

                      {isGroup && (
                        <div role={field.type === 'radio' ? 'radiogroup' : 'group'} aria-labelledby={`${inputId}-label`} aria-describedby={describedBy} className="space-y-3 pt-2">
                          {options.map((opt, optIndex) => {
                            const value = localize(opt, 'AR');
                            const current = answers[fieldId];
                            const checked = field.type === 'checkbox'
                              ? Array.isArray(current) && current.includes(value)
                              : current === value;

                            return (
                              <label key={optIndex} className="flex items-center gap-3 text-sm sm:text-base text-gray-700 cursor-pointer">
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
                                  className="w-5 h-5 border-gray-300 text-brand-orange focus:ring-brand-orange accent-brand-orange"
                                />
                                <span className="font-medium">{localize(opt, lang)}</span>
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
                            className="w-full text-sm text-gray-600 file:me-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple-dark cursor-pointer transition-all"
                          />
                          <p id={`${inputId}-hint`} className="text-xs text-gray-500">{text.fileHint}</p>
                        </>
                      )}

                      {fieldError && (
                        <p id={errorId} className="text-xs font-medium text-red-600">{fieldError}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
              <button
                type="submit"
                disabled={submitting || fields.length === 0}
                className="w-full sm:w-auto bg-brand-orange text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 transition-all duration-300 flex items-center justify-center disabled:opacity-50 text-sm sm:text-base cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/30"
              >
                {submitting ? text.submitting : text.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicFormView;
