import React, { useEffect, useRef, useState } from 'react';
import { Award, Compass, UserCheck, CheckCircle2 } from 'lucide-react';

const PlacementSection = () => {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const pillars = [
    {
      title: 'Placement assistance for every student',
      desc: 'Comprehensive guidance and job placement support provided to every eligible student upon course completion.',
      icon: Award,
      badge: 'Full placement support',
    },
    {
      title: 'Industry internships & live projects',
      desc: 'Real-world exposure through mandatory internships, hands-on field projects, and industry exposure trips before graduation.',
      icon: Compass,
      badge: 'Real-world experience',
    },
    {
      title: 'Soft skills & interview grooming',
      desc: 'Specialized training modules focused on resume building, communication skills, personality development, and professional etiquette to ensure confidence in job interviews.',
      icon: UserCheck,
      badge: 'Professional readiness',
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-28 bg-white relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .pl-serif { font-family: 'Fraunces', serif; }
        .pl-sans { font-family: 'Inter', sans-serif; }

        .pl-fade {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pl-fade.pl-in { opacity: 1; transform: translateY(0); }

        .pl-card {
          opacity: 0;
          transform: translateY(28px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pl-card.pl-in { opacity: 1; transform: translateY(0) scale(1); }
      `}</style>

      {/* contained warm wash, not a full-bleed gradient */}
      <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-amber-100/50 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Centered heading */}
        <div className={`pl-fade ${inView ? 'pl-in' : ''} max-w-2xl mx-auto text-center mb-16`}>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="pl-sans text-sm font-semibold text-amber-700 tracking-wide">Career readiness</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="pl-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
            Dedicated placement & <span className="italic text-amber-700">career</span> opportunities
          </h2>
          <p className="pl-sans mt-5 text-base text-stone-600 leading-relaxed">
            At AurumFX, education is complete only when it leads to meaningful employment. Our active
            Training & Placement Cell bridges the gap between our graduates and leading industry employers.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className={`pl-card ${inView ? 'pl-in' : ''} group relative bg-white rounded-[1.75rem] p-8 border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_45px_-15px_rgba(28,25,23,0.2)] hover:border-amber-300 transition-all duration-500 flex flex-col justify-between`}
                style={{ transitionDelay: inView ? `${idx * 130}ms` : '0ms' }}
              >
                <div className="space-y-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6">
                    <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>

                  <span className="pl-sans text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                    {item.badge}
                  </span>

                  <h3 className="pl-serif text-xl text-[#1C1917] leading-snug">
                    {item.title}
                  </h3>

                  <p className="pl-sans text-sm text-stone-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-[#1C1917]">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>Guaranteed guidance at AurumFX</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PlacementSection;