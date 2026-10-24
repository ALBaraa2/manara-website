import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../LanguageContext';

// صفحة 404 للمسارات غير الموجودة (العامة وداخل لوحة التحكم)
function NotFound({ variant = 'public' }) {
  const { lang } = useContext(LanguageContext);

  if (variant === 'admin') {
    return (
      <div className="p-8 min-h-screen bg-brand-purple-dark text-center space-y-4" dir="ltr">
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-brand-gray">This admin page does not exist.</p>
        <Link to="/admin/forms" className="inline-block text-brand-orange-light text-sm font-semibold hover:underline">Back to forms</Link>
      </div>
    );
  }

  const isAr = lang === 'AR';

  return (
    <main className="min-h-screen bg-brand-purple-dark text-white flex flex-col items-center justify-center gap-5 p-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <img src="/Logo.png" alt={isAr ? 'منارة' : 'Manara'} className="h-12" />
      <p className="text-6xl font-bold text-brand-orange">404</p>
      <h1 className="text-2xl font-bold">{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</h1>
      <p className="text-brand-gray text-sm max-w-md">
        {isAr ? 'ربما تم نقل هذه الصفحة أو أن الرابط غير صحيح.' : 'This page may have moved, or the link is incorrect.'}
      </p>
      <Link to="/" className="bg-brand-orange hover:bg-brand-orange-dark text-white px-7 py-3 rounded-full font-bold transition-all text-sm">
        {isAr ? 'العودة للرئيسية' : 'Back to home'}
      </Link>
    </main>
  );
}

export default NotFound;
