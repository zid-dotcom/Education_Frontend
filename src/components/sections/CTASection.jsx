import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

const CTASection = ({ onOpenApplyModal }) => {
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
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    { n: '01', label: 'Limited seats per batch' },
    { n: '02', label: 'Zero-interest installments' },
    { n: '03', label: '100% placement assistance' },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 bg-white relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .cta-serif { font-family: 'Fraunces', serif; }
        .cta-sans { font-family: 'Inter', sans-serif; }

        .cta-fade {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cta-fade.cta-in { opacity: 1; transform: translateY(0); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top rule + badge */}
        <div className={`cta-fade ${inView ? 'cta-in' : ''} flex items-center gap-3 mb-10 border-t border-stone-200 pt-8`}>
          <GraduationCap className="w-4 h-4 text-amber-600" />
          <span className="cta-sans text-sm font-semibold text-amber-700 tracking-wide">
            Admissions open for the 2026 batch
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* LEFT: headline, copy, actions */}
          <div className={`cta-fade ${inView ? 'cta-in' : ''} lg:col-span-7`} style={{ transitionDelay: '80ms' }}>
            <h2 className="cta-serif text-4xl sm:text-6xl leading-[1.05] text-[#1C1917] mb-6">
              Start Your Journey <span className="italic text-amber-700">Today</span>
            </h2>

            <p className="cta-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mb-4">
              Whether you are aspiring to design the next fashion trend, build modern digital solutions, or deliver world-class hospitality experiences, AurumFX provides the environment, tools, and career support to help you achieve your goals.
            </p>

            <p className="cta-sans text-sm sm:text-base font-semibold text-amber-800 mb-8">
              Unlock your potential. Gain industry skills. Launch your career with confidence.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenApplyModal}
                className="cta-sans group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1917] hover:bg-stone-800 text-white font-semibold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              >
                <span>Apply online now</span>
                <span className="w-6 h-6 rounded-full bg-amber-400 group-hover:bg-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1C1917] transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </button>

              <Link
                to="/admissions"
                className="cta-sans inline-flex items-center justify-center px-8 py-4 bg-white text-[#1C1917] font-semibold text-sm sm:text-base rounded-full border border-stone-300 hover:border-stone-400 hover:bg-stone-50 transition-all duration-300 active:scale-[0.98]"
              >
                Admission details
              </Link>
            </div>
          </div>

          {/* RIGHT: bordered benefits panel */}
          <div className={`cta-fade ${inView ? 'cta-in' : ''} lg:col-span-5`} style={{ transitionDelay: '160ms' }}>
            <div className="border border-stone-200 rounded-[1.75rem] p-2">
              <div className="rounded-[1.4rem] bg-amber-50/50 divide-y divide-stone-200/70">
                {benefits.map((b) => (
                  <div key={b.n} className="flex items-center gap-4 px-6 py-5">
                    <span className="cta-serif text-2xl text-amber-700 w-8 shrink-0">{b.n}</span>
                    <span className="cta-sans text-sm sm:text-base font-medium text-[#1C1917]">{b.label}</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CTASection;