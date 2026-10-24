import React, { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { FiTarget, FiCpu, FiTool } from 'react-icons/fi';

// مكون عداد الأرقام المحدث: يعد مرة واحدة فقط ويتوقف
function Counter({ from, to }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  React.useEffect(() => {
    const controls = animate(count, to, { 
      duration: 2,
      ease: "easeInOut"
    });
    return () => controls.stop();
  }, [count, to]);

  return <motion.span>{rounded}</motion.span>;
}

function About() {
  const { lang, t } = useContext(LanguageContext);
  const icons = [FiTarget, FiCpu, FiTool];
  const isAr = lang === 'AR';

  return (
    <section id='about' className="py-40 bg-white overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* الجانب النصي (يظهر في اليمين بالعربي، وفي اليسار بالإنجليزي) */}
          <motion.div 
            initial={{ x: isAr ? 100 : -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`}
          >
            <h2 className="text-4xl font-bold text-brand-purple leading-snug">{t.aboutTitle}</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{t.aboutDesc}</p>
            
            {/* الإحصائيات */}
            <div className="flex gap-12 pt-6">
              <div>
                <h3 className="text-4xl font-bold text-brand-orange">
                  <Counter from={0} to={40} />+
                </h3>
                <p className="text-gray-500">{t.stats.projects}</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-brand-orange">
                  <Counter from={0} to={500} />+
                </h3>
                <p className="text-gray-500">{t.stats.trainees}</p>
              </div>
            </div>
          </motion.div>

          {/* قسم النقاط والبطاقات (يظهر في اليسار بالعربي، وفي اليمين بالإنجليزي) */}
          <div className="space-y-8">
            {t.points.map((point, index) => {
              const Icon = icons[index];
              return (
              <motion.div 
                key={index}
                initial={{ x: isAr ? -100 : 100, opacity: 0 }}
                viewport={{ once: false }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.8, 
                  ease: "easeOut" 
                }}
                // استخدام border-s-4 لكي تتكيف الحدود البرتقالية تلقائياً مع الاتجاهين
                className={`flex gap-4 p-4 border-s-4 border-brand-orange bg-brand-tint rounded-lg shadow-sm ${isAr ? 'text-right' : 'text-left'}`}
              >
                <div className="text-brand-orange text-3xl mt-1">{Icon && <Icon aria-hidden="true" />}</div>
                <div>
                  {/* لون العنوان يطابق عناوين قسم الخدمات (brand-purple) */}
                  <h4 className="font-bold text-xl text-brand-purple">{point.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{point.desc}</p>
                </div>
              </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;