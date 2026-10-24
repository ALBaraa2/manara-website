import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import Services from './Services';
import Contact from './Contact';
import Footer from './Footer';
import SuccessStories from './SuccessStories';
import LatestPostsSection from './LatestPostsSection';
import UserWorkshops from './UserWorkshops';
import Splash from './Splash';

// شاشة الافتتاح تنتهي عند اكتمال التحميل بشرط أن تُعرض مدة كافية لتكتمل حركة الشعار، مع حد أقصى حتى لا تحجب المحتوى
const SPLASH_MIN_MS = 1500;
const SPLASH_MAX_MS = 2600;
// تُعرض مرة واحدة لكل تحميل للصفحة (لا عند العودة من صفحة أخرى داخل التطبيق)
let splashPlayed = false;

const Home = () => {
  const { hash } = useLocation();
  const [isLoading, setIsLoading] = useState(() => !splashPlayed);
  // الشاشة تبقى مرسومة أثناء حركة الخروج (isLoading تعني «المشهد لم يبدأ بعد»)
  const [splashGone, setSplashGone] = useState(() => splashPlayed);
  const hideSplash = useCallback(() => setSplashGone(true), []);

  useEffect(() => {
    if (!isLoading) return undefined;

    splashPlayed = true;
    let minTimer;
    const startedAt = performance.now();
    const hide = () => {
      minTimer = setTimeout(() => setIsLoading(false), Math.max(0, SPLASH_MIN_MS - (performance.now() - startedAt)));
    };
    const maxTimer = setTimeout(() => setIsLoading(false), SPLASH_MAX_MS);
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide, { once: true });

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      window.removeEventListener('load', hide);
    };
  }, [isLoading]);

  // عند القدوم من صفحة أخرى برابط مثل /#posts نمرّر إلى القسم المطلوب.
  // الأقسام التي تُحمَّل من الـ API (الورش، القصص) تغيّر ارتفاع الصفحة، لذا نعيد المحاذاة لفترة قصيرة.
  const mainRef = useRef(null);
  useEffect(() => {
    if (!hash) return undefined;
    // instant: القفز مباشرة عند الوصول من صفحة أخرى (التمرير الناعم يُستأنف مع كل تغيّر في الارتفاع)
    const align = () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'instant' });

    const first = setTimeout(align, 50);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(align) : null;
    if (observer && mainRef.current) observer.observe(mainRef.current);
    const stop = setTimeout(() => observer?.disconnect(), 2000);

    // إذا بدأ المستخدم بالتمرير بنفسه نتوقف عن إعادة المحاذاة
    const cancel = () => observer?.disconnect();
    window.addEventListener('wheel', cancel, { once: true, passive: true });
    window.addEventListener('touchstart', cancel, { once: true, passive: true });

    return () => {
      clearTimeout(first);
      clearTimeout(stop);
      observer?.disconnect();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    };
  }, [hash]);

  return (
    <div className="relative min-h-screen bg-brand-purple-dark">
      <Navbar />
      <main ref={mainRef}>
        <HeroSection ready={!isLoading} />
        <UserWorkshops />
        <Services />
        <SuccessStories />
        <LatestPostsSection />
        <Contact />
      </main>
      <Footer />

      {!splashGone && <Splash exiting={!isLoading} onDone={hideSplash} />}
    </div>
  );
};

export default Home;
