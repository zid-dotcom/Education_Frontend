import React, { useEffect, useRef, useState } from 'react';
import { Target, Eye, Quote, ArrowRight } from 'lucide-react';
import PlacementSection from '../components/sections/PlacementSection';
import { instituteInfo } from '../data/instituteInfo';

// Small helper: reveals its children with a fade-up once scrolled into view
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
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

  return (
    <div
      ref={ref}
      className={`ab-reveal ${inView ? 'ab-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

const About = ({ onOpenApplyModal }) => {
  return (
    <div className="bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .ab-serif { font-family: 'Fraunces', serif; }
        .ab-sans { font-family: 'Inter', sans-serif; }

        .ab-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ab-reveal.ab-in { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* HERO */}
      <section className="pt-14 pb-16 sm:pt-20 sm:pb-24 bg-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-1/2 w-1/3 rounded-br-full bg-gradient-to-r from-amber-300/40 via-orange-200/20 to-transparent blur-2xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Text */}
            <Reveal className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-amber-500" />
                <span className="ab-sans text-sm font-semibold text-amber-700 tracking-wide">About AurumFX</span>
              </div>
              <h1 className="ab-serif text-4xl sm:text-6xl leading-[1.05] text-[#1C1917] mb-6">
                Where talent meets <span className="italic text-amber-700">industry-ready</span> skill
              </h1>
              <p className="ab-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mb-6">
                Career-focused programs across fashion, technology, and hospitality —
                built to close the gap between talent and industry demand.
              </p>

              {/* Academy tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Fashion Design', 'Computer Training', 'Hospitality Management'].map((tag) => (
                  <span
                    key={tag}
                    className="ab-sans text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={onOpenApplyModal}
                className="ab-sans group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1917] hover:bg-stone-800 text-white font-semibold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>Apply now</span>
                <span className="w-6 h-6 rounded-full bg-amber-400 group-hover:bg-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1C1917] transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </button>

              {/* Quick stats, fills the space beneath the CTA */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-stone-200 max-w-lg">
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">3</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Academies</div>
                </div>
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">5,000+</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Students trained</div>
                </div>
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">94%</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Placement record</div>
                </div>
              </div>
            </Reveal>

            {/* Image */}
            <Reveal delay={140} className="lg:col-span-5 relative">
              <div className="relative">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300 to-amber-500 rotate-3" />
                <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-amber-900/10 h-[440px] sm:h-[560px]">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop"
                    alt="Students at AurumFX"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>

                {/* Floating badge, fills the empty corner */}
                <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white p-4 rounded-2xl shadow-lg border border-stone-100 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                    10+
                  </div>
                  <div>
                    <div className="ab-sans text-sm font-bold text-[#1C1917] leading-tight">Years of excellence</div>
                    <div className="ab-sans text-xs text-stone-500 mt-0.5">Transforming careers</div>
                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

            <Reveal>
              <div className="h-full bg-white rounded-[1.75rem] overflow-hidden border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_45px_-15px_rgba(28,25,23,0.2)] hover:border-amber-300 transition-all duration-500">
                <div className="relative h-60 overflow-visible sm:h-72">
                  <img
                    src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80&auto=format&fit=crop"
                    alt=""
                    className="w-full h-full rounded-t-[1.75rem] object-cover"
                  />
                  <div className="absolute inset-0 rounded-t-[1.75rem] bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-[-1.75rem] left-6 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20 ring-4 ring-white">
                    <Target className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="p-8 pt-9 space-y-3">
                  <h3 className="ab-serif text-2xl text-[#1C1917]">Our mission</h3>
                  <p className="ab-sans text-sm text-stone-600 leading-relaxed">
                    To deliver accessible, affordable vocational training that helps every
                    student build a stable, skilled career.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="h-full bg-white rounded-[1.75rem] overflow-hidden border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_45px_-15px_rgba(28,25,23,0.2)] hover:border-amber-300 transition-all duration-500">
                <div className="relative h-60 overflow-visible sm:h-72">
                  <img
                    src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80&auto=format&fit=crop"
                    alt=""
                    className="w-full h-full rounded-t-[1.75rem] object-cover"
                  />
                  <div className="absolute inset-0 rounded-t-[1.75rem] bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-[-1.75rem] left-6 w-14 h-14 rounded-full bg-[#1C1917] flex items-center justify-center shadow-lg ring-4 ring-white">
                    <Eye className="w-6 h-6 text-amber-400" strokeWidth={2} />
                  </div>
                </div>
                <div className="p-8 pt-9 space-y-3">
                  <h3 className="ab-serif text-2xl text-[#1C1917]">Our vision</h3>
                  <p className="ab-sans text-sm text-stone-600 leading-relaxed line-clamp-4">
                    {instituteInfo.vision}
                  </p>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* MD QUOTE, full-bleed photo with overlay */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/90 via-[#1C1917]/80 to-[#1C1917]/90" />
        </div>

        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Quote className="w-6 h-6 text-[#1C1917]" />
          </div>
          <blockquote className="ab-serif italic text-2xl sm:text-3xl text-white leading-relaxed">
            "{instituteInfo.mdQuote}"
          </blockquote>
          <div className="ab-sans mt-6 text-sm font-semibold text-amber-300 tracking-wide">
            Managing Director, AurumFX
          </div>
        </Reveal>
      </section>

      {/* PLACEMENT & CAREER OPPORTUNITIES */}
      <PlacementSection />

    </div>
  );
};

export default About;