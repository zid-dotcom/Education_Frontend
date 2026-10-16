import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LevelSelector = () => {
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

  return (
    <section ref={sectionRef} className="py-16 sm:py-28 bg-white relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .ls-serif { font-family: 'Fraunces', serif; }
        .ls-sans { font-family: 'Inter', sans-serif; }

        .ls-fade {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ls-fade.ls-in { opacity: 1; transform: translateY(0); }

        .ls-photo {
          opacity: 0;
          transform: translateY(30px) rotate(-3deg) scale(0.94);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
        }
        .ls-photo.ls-in { opacity: 1; transform: translateY(0) rotate(-2deg) scale(1); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Headline */}
        <div className={`ls-fade ${inView ? 'ls-in' : ''} max-w-3xl mx-auto mb-16 text-center`}>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="ls-sans text-sm font-semibold text-amber-700 tracking-wide">Pick your starting point</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="ls-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.08] text-[#1C1917]">
            Choose a course that fits <span className="italic text-amber-700">where you are</span> today
          </h2>
        </div>

        {/* Banner */}
        <div className={`ls-fade ${inView ? 'ls-in' : ''} relative rounded-[2.5rem] border border-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center`} style={{ transitionDelay: '120ms' }}>

          {/* subtle gold wash, contained to the banner only */}
          <div className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 w-72 h-72 rounded-full bg-amber-50 blur-3xl" />

          {/* LEFT: Photo */}
          <div className="lg:col-span-5 relative p-8 lg:p-12 flex items-center justify-center min-h-[340px] lg:min-h-[440px]">
            <div className={`ls-photo ${inView ? 'ls-in' : ''} relative`}>
              {/* gold plate behind the photo */}
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300 to-amber-500 rotate-3" />
              <div className="relative w-56 sm:w-64 lg:w-72 h-72 lg:h-80 rounded-[1.75rem] overflow-hidden shadow-2xl shadow-amber-900/10 bg-stone-100">
                <img
                  src="/images/hero-student.png"
                  alt="AurumFX student"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Text */}
          <div className="lg:col-span-7 relative p-8 sm:p-12 lg:p-16 space-y-6 text-left">

            <h3 className="ls-serif text-2xl sm:text-3xl lg:text-4xl leading-snug text-[#1C1917]">
              Learn the world of technology from the basics, guaranteed to understand
            </h3>

            <p className="ls-sans text-base text-stone-600 leading-relaxed max-w-xl">
              Start your journey into the world of technology from the very basics, with
              easy-to-follow lessons designed to help you truly understand — even with no
              prior experience.
            </p>

            <div className="pt-2">
              <Link
                to="/courses"
                className="ls-sans group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1917] hover:bg-amber-700 text-white font-semibold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>Start learning</span>
                <span className="w-6 h-6 rounded-full bg-amber-400 group-hover:bg-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1C1917] transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default LevelSelector;