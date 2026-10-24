// LanguageContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { translations } from './translations';

const STORAGE_KEY = 'manara_lang';

const readSavedLang = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'EN' ? 'EN' : 'AR';
  } catch {
    return 'AR';
  }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(readSavedLang);
  const toggleLang = () => setLang(prev => (prev === 'AR' ? 'EN' : 'AR'));

  // حفظ اختيار اللغة ومزامنة lang/dir على <html> لقارئات الشاشة والمتصفح
  useEffect(() => {
    document.documentElement.lang = lang === 'AR' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // التخزين غير متاح — يبقى الاختيار للجلسة الحالية فقط
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: toggleLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};
