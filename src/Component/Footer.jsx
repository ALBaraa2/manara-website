// Footer.jsx

import React, { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';
import { FiMail, FiMapPin } from 'react-icons/fi';
import SectionLink from './SectionLink';

function Footer() {
  const { lang, t } = useContext(LanguageContext);
  const isAr = lang === 'AR';

  return (
    <footer className="bg-brand-purple-dark text-white pt-20 pb-10 overflow-hidden" dir="ltr">
      <div className="container mx-auto px-6 md:px-10">
        
        {/* شبكة الأعمدة (ثابتة الاتجاه وموزعة بانتظام) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 border-b border-white/10">
          
          {/* العمود الأول: معلومات التواصل */}
          <div className={`space-y-6 flex flex-col ${isAr ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
            <h3 className={`text-xl font-bold text-white relative inline-block pb-2 after:content-[''] after:absolute after:bottom-0 ${isAr ? 'after:right-0' : 'after:left-0'} after:w-12 after:h-0.5 after:bg-brand-orange`}>
              {t.footerContactTitle || "تواصل مباشر"}
            </h3>
            <ul className="space-y-4 text-brand-gray w-full">
              <li className={`flex items-center gap-3 justify-center ${isAr ? 'md:justify-end' : 'md:justify-start'}`}>
                {isAr ? (
                  <>
                    <span>{t.email || "manara.gaza.pal@gmail.com"}</span>
                    <FiMail className="text-brand-orange text-lg shrink-0" />
                  </>
                ) : (
                  <>
                    <FiMail className="text-brand-orange text-lg shrink-0" />
                    <span>{t.email || "manara.gaza.pal@gmail.com"}</span>
                  </>
                )}
              </li>
              <li className={`flex items-center gap-3 justify-center ${isAr ? 'md:justify-end' : 'md:justify-start'}`}>
                {isAr ? (
                  <>
                    <span>{t.address}</span>
                    <FiMapPin className="text-brand-orange text-lg shrink-0" />
                  </>
                ) : (
                  <>
                    <FiMapPin className="text-brand-orange text-lg shrink-0" />
                    <span>{t.address}</span>
                  </>
                )}
              </li>
            </ul>
          </div>

          {/* العمود الثاني: روابط سريعة */}
          <div className={`space-y-6 flex flex-col ${isAr ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
            <h3 className={`text-xl font-bold text-white relative inline-block pb-2 after:content-[''] after:absolute after:bottom-0 ${isAr ? 'after:right-0' : 'after:left-0'} after:w-12 after:h-0.5 after:bg-brand-orange`}>
              {t.footerLinksTitle || "روابط سريعة"}
            </h3>
            <ul className="space-y-3 text-brand-gray">
              <li><SectionLink id="about" className="hover:text-brand-orange-light transition-colors block">{t.navAbout || "من نحن"}</SectionLink></li>
              <li><SectionLink id="services" className="hover:text-brand-orange-light transition-colors block">{t.navServices || "خدمات التدريب"}</SectionLink></li>
              <li><SectionLink id="stories" className="hover:text-brand-orange-light transition-colors block">{t.navStories || "قصص النجاح"}</SectionLink></li>
              <li><SectionLink id="contact" className="hover:text-brand-orange-light transition-colors block">{t.navContact || "اتصل بنا"}</SectionLink></li>
            </ul>
          </div>

          {/* العمود الثالث: الشعار والنبذة */}
          <div className={`space-y-6 flex flex-col items-center ${isAr ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} text-center`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-wider">
                <img src="/Logo.png" alt={isAr ? 'منارة' : 'Manara'} className="h-10 object-contain" />
              </span>
            </div>
            <p className="text-brand-gray text-sm leading-relaxed max-w-sm">
              {t.footerDesc || "مبادرة تعليمية تقنية ولدت من رحم المعاناة في غزة، لتمكين الشباب الفلسطيني في المجال البرمجي والتقني والمهاري وفق أعلى المعايير الدولية."}
            </p>
          </div>

        </div>

        {/* حقوق النشر */}
        <div className="pt-8 text-center text-brand-gray/70 text-sm">
          <p>{t.footerRights || "© 2026 منارة. جميع الحقوق محفوظة. مبادرة تقنية من قلب التحدي."}</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;