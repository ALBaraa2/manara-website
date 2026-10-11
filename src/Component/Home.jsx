import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import About from './About';
import Services from './Services';
import Contact from './Contact';
import Footer from './Footer';
import SuccessStories from './SuccessStories';
import LatestPostsSection from './LatestPostsSection';
import UserWorkshops from './UserWorkshops';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1a1a2e]">
      
      {/* محتوى الصفحة الرئيسية يعمل في الخلفية طوال فترة التحميل */}
      <div className="Navbar">
        <Navbar />
        <HeroSection />
        <About />
        <UserWorkshops />
        <Services />
        <LatestPostsSection />
        <Contact />
        <Footer />
      </div>

      {/* شاشة البداية العائمة مع إجبار المتصفح على تحديث اللوجو من مجلد public */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/80 backdrop-blur-sm transition-opacity duration-700">
          <div className="flex flex-col items-center justify-center p-4">
            <img 
              src="/transparent BG.svg?v=2" 
              alt="Manara Logo" 
              className="w-48 sm:w-60 md:w-72 h-auto animate-pulse drop-shadow-[0_0_25px_rgba(243,115,33,0.5)] object-contain" 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;