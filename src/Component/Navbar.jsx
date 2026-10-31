import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LanguageContext } from '../LanguageContext';
import { HiMenu, HiX } from 'react-icons/hi';
import SectionLink from './SectionLink';

// activities و contact يُتتبَّعان دون رابط في القائمة: عند الوصول إليهما لا يبقى الرابط السابق مميَّزاً
const SECTION_IDS = ['home', 'workshops', 'services', 'activities', 'stories', 'posts', 'contact'];

// خارج الرئيسية: الرابط النشط يُستنتج من المسار (صفحة مقال ← المنشورات، صفحة تسجيل ورشة ← ورش العمل)
const sectionForRoute = (pathname) => {
  if (pathname.startsWith('/posts/')) return 'posts';
  if (pathname.startsWith('/forms/')) return 'workshops';
  return null;
};

function Navbar() {
  const { lang, setLang, t } = useContext(LanguageContext);
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [trackedSection, setTrackedSection] = useState('home');
  const activeSection = pathname === '/' ? trackedSection : sectionForRoute(pathname);
  const isAr = lang === 'AR';
  // DIN Next يرسم الحروف أسفل منتصف السطر (قياساً: ~3px بالعربية و~1.5px بالإنجليزية عند 16px)؛
  // حشوة سفلية بضعف الإزاحة داخل زر بارتفاع ثابت ترفع النص إلى المنتصف بصرياً
  const centerText = isAr ? 'pb-[6px]' : 'pb-[3px]';
  // في الصفحة الرئيسية: ظاهر في الواجهة، يختفي حين تبدأ فصول الحكاية بالظهور (مشهد سينمائي نظيف)، ويعود بعد انتهائها
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (pathname !== '/') { setHidden(false); return undefined; }
    let raf = 0;
    const check = () => {
      raf = 0;
      const journey = document.querySelector('.manara-journey');
      // يختفي مع بداية ذوبان الواجهة في الحكاية (ربع شاشة من التمرير)، ويعود حين يبدأ قسم الورش بالصعود فوق مشهد الختام
      setHidden(Boolean(journey)
        && window.scrollY > window.innerHeight * 0.25
        && journey.getBoundingClientRect().bottom > window.innerHeight * 1.1);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pathname]);
  useEffect(() => { if (hidden) setIsOpen(false); }, [hidden]);

  // مصفوفة الروابط لتسهيل تكرارها وتحديد حالتها النشطة
  const navLinks = [
    { id: 'home', label: isAr ? 'الرئيسية' : (t.home || 'Home') },
    { id: 'workshops', label: isAr ? 'ورش العمل' : 'Workshops' },
    { id: 'services', label: isAr ? 'الخدمات' : (t.services || 'Services') },
    { id: 'stories', label: isAr ? 'أصوات من الميدان' : 'Field Voices' },
    { id: 'posts', label: isAr ? 'المنشورات' : 'Posts' },
  ];

  // النقر على رابط: نميّزه فوراً ونجمّد التتبع أثناء التمرير الناعم حتى لا تومض الأقسام التي يعبرها
  const clickLock = useRef(0);
  const selectSection = (id) => {
    setTrackedSection(id);
    clickLock.current = Date.now() + 1500;
  };

  // تتبع القسم الحالي (في الصفحة الرئيسية فقط): القسم النشط هو آخر قسم تجاوز أعلاه «خط القراءة» (35% من الشاشة).
  // كان سابقاً IntersectionObserver بعتبة 30% يفعّل آخر قسم ظهر، فيأخذ القسم التالي للأقسام القصيرة
  // (مثل الخدمات) التمييز، وتومض الأقسام التي يعبرها التمرير الناعم بعد النقر.
  useEffect(() => {
    if (pathname !== '/') return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (Date.now() < clickLock.current) return;
      const line = window.innerHeight * 0.35;
      let current = 'home';
      SECTION_IDS.forEach((id) => {
        const section = document.getElementById(id); // بعض الأقسام لا تظهر إلا بعد تحميل بياناتها
        if (section && section.getBoundingClientRect().top <= line) current = id;
      });
      // آخر الصفحة: القسم الأخير قد لا يبلغ خط القراءة أبداً
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = [...SECTION_IDS].reverse().find(id => document.getElementById(id));
        if (last && document.getElementById(last).getBoundingClientRect().top < window.innerHeight) current = last;
      }
      setTrackedSection(current);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    // عند انتهاء التمرير الناتج عن النقر نُعيد الحساب من الموضع الفعلي
    const onScrollEnd = () => { clickLock.current = 0; schedule(); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scrollend', onScrollEnd);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, [pathname]);


  const linkStyle = (id) => `
    relative cursor-pointer transition-colors duration-300 font-medium pb-1
    ${activeSection === id ? 'text-brand-orange-light font-semibold' : 'text-white hover:text-brand-orange-light'}
    after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-orange
    after:transition-transform after:duration-300
    ${activeSection === id ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}
  `;

  return (
    <nav inert={hidden} className={`fixed top-4 left-0 right-0 w-[89%] mx-auto z-50 rounded-[50px] bg-brand-purple-dark/80 backdrop-blur-md border border-white/10 shadow-lg transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none ${hidden ? '-translate-y-[160%] opacity-0 pointer-events-none' : ''}`} aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center flex-row" dir="rtl">

        {/* 1. الشعار */}
        <Link to="/" className="text-2xl font-bold flex items-center" aria-label={isAr ? 'منارة - الرئيسية' : 'Manara - Home'}>
          <img src="/Logo.png" alt={isAr ? 'منارة' : 'Manara'} className="h-10" />
        </Link>

        {/* 2. روابط التنقل للشاشات الكبيرة */}
        <ul className="hidden lg:flex gap-5 xl:gap-8 items-center whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
          {navLinks.map((link) => (
            <li key={link.id}>
              <SectionLink
                id={link.id}
                onClick={() => selectSection(link.id)}
                className={linkStyle(link.id)}
              >
                {link.label}
              </SectionLink>
            </li>
          ))}
        </ul>

        {/* 3. الأزرار */}
        <div className="flex gap-4 items-center" dir="ltr">
          {/* مبدّل اللغة: الخياران ظاهران معاً، ومؤشر ينزلق إلى اللغة الحالية */}
          <div role="group" aria-label={isAr ? 'اللغة' : 'Language'} className="relative flex h-10 items-center rounded-full border border-white/15 bg-white/5 p-1">
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${isAr ? 'translate-x-full' : 'translate-x-0'}`}
            />
            {[
              { code: 'EN', label: 'EN', name: 'English', htmlLang: 'en', nudge: '' },
              // «ع» بلا صاعد فيبدو منخفضاً؛ حشوة سفلية ترفعه بصرياً إلى المنتصف
              { code: 'AR', label: 'ع', name: 'العربية', htmlLang: 'ar', nudge: 'pb-[6px]' },
            ].map((option) => {
              const active = lang === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  lang={option.htmlLang}
                  aria-pressed={active}
                  aria-label={option.name}
                  onClick={() => { if (!active) setLang(); }}
                  className={`relative z-10 flex h-8 w-10 items-center justify-center rounded-full text-sm font-bold leading-none ${option.nudge} transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange-light ${active ? 'text-brand-purple-dark cursor-default' : 'text-white/70 hover:text-white'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <SectionLink id="contact" className={`hidden lg:inline-flex h-10 items-center justify-center whitespace-nowrap bg-brand-orange px-6 rounded-full font-bold leading-none ${centerText} hover:bg-brand-orange-dark active:scale-95 transition-all duration-200 text-white`}>
            {t.contact || 'Contact Us'}
          </SectionLink>

          <button
            className="lg:hidden text-3xl text-white hover:text-brand-orange-light transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? (isAr ? 'إغلاق القائمة' : 'Close menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <HiX /> : <HiMenu />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {isOpen && (
        <div id="mobile-menu" className="absolute top-full left-0 w-full bg-brand-purple-dark/95 backdrop-blur-sm flex flex-col items-center gap-6 py-8 lg:hidden border-t border-brand-line z-40 rounded-b-2xl" dir={isAr ? 'rtl' : 'ltr'}>
          <ul className="flex flex-col gap-5 text-center">
            {navLinks.map((link) => (
              <li key={link.id}>
                <SectionLink
                  id={link.id}
                  onClick={() => {
                    selectSection(link.id);
                    setIsOpen(false);
                  }}
                  className={linkStyle(link.id)}
                >
                  {link.label}
                </SectionLink>
              </li>
            ))}
          </ul>
          <SectionLink id="contact" onClick={() => setIsOpen(false)} className={`flex h-11 items-center justify-center bg-brand-orange px-8 rounded-full font-bold leading-none ${centerText} text-white hover:bg-brand-orange-dark w-4/5 max-w-xs transition-colors`}>
            {t.contact || 'Contact Us'}
          </SectionLink>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
