import React, { useEffect, useRef, useState } from 'react';
import {
  Target,
  Eye,
  Quote,
  ArrowRight,
  Scissors,
  Laptop,
  Hotel,
  Award,
  Users,
  Wallet,
  GraduationCap,
  Building2,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PlacementSection from '../components/sections/PlacementSection';
import CTASection from '../components/sections/CTASection';
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
  const academyIcons = {
    fashion: Scissors,
    computer: Laptop,
    hospitality: Hotel
  };

  const whyChooseIcons = [
    Award,
    Users,
    Wallet,
    GraduationCap,
    Building2,
    HeartHandshake
  ];

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

      {/* 1. HERO & WELCOME */}
      <section className="pt-14 pb-16 sm:pt-20 sm:pb-24 bg-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-1/2 w-1/3 rounded-br-full bg-gradient-to-r from-amber-300/40 via-orange-200/20 to-transparent blur-2xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Text */}
            <Reveal className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-amber-300 bg-amber-100/70 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-xs">
                {instituteInfo.tagline}
              </div>
              
              <h1 className="ab-serif text-4xl sm:text-6xl leading-[1.05] text-[#1C1917] mb-6">
                Bridging the Gap Between <span className="italic text-amber-700">Talent</span> and Industry Demands
              </h1>

              <p className="ab-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mb-8">
                {instituteInfo.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4">
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

                <Link
                  to="/courses"
                  className="ab-sans inline-flex items-center justify-center px-8 py-4 bg-white text-[#1C1917] font-semibold text-sm sm:text-base rounded-full border border-stone-300 hover:border-amber-400 hover:bg-amber-50/40 transition-all duration-300"
                >
                  Explore Academies
                </Link>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-stone-200 max-w-lg">
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">3</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Dedicated Academies</div>
                </div>
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">5,000+</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Students trained</div>
                </div>
                <div>
                  <div className="ab-serif text-3xl text-[#1C1917]">100%</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-1">Placement support</div>
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

                {/* Floating badge */}
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

      {/* 2. DEDICATED ACADEMIES SHOWCASE */}
      <section className="py-16 sm:py-24 bg-[#FCFBF8] border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ab-sans text-sm font-semibold text-amber-700 tracking-wide uppercase">Dedicated Academies</span>
              <span className="w-8 h-px bg-amber-500" />
            </div>
            <h2 className="ab-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              Specialized, <span className="italic text-amber-700">Career-Focused</span> Programs
            </h2>
            <p className="ab-sans mt-5 text-base text-stone-600 leading-relaxed">
              We offer specialized, career-focused programs through three dedicated academies:
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {instituteInfo.academies.map((academy, idx) => {
              const IconComp = academyIcons[academy.id] || GraduationCap;
              return (
                <Reveal key={academy.id} delay={idx * 120} className="h-full">
                  <div className="h-full bg-white rounded-3xl p-8 border border-stone-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-amber-100/80 group-hover:bg-amber-400 text-amber-900 group-hover:text-slate-950 flex items-center justify-center mb-6 transition-colors shadow-sm">
                        <IconComp className="w-7 h-7" strokeWidth={2} />
                      </div>
                      <h3 className="ab-serif text-2xl text-[#1C1917] mb-3 group-hover:text-amber-700 transition-colors">
                        {academy.title}
                      </h3>
                      <p className="ab-sans text-sm text-stone-600 leading-relaxed">
                        {academy.tagline}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-stone-100">
                      <Link
                        to={academy.link}
                        className="ab-sans inline-flex items-center gap-2 text-sm font-bold text-[#1C1917] group-hover:text-amber-700 transition-colors"
                      >
                        <span>Explore academy courses</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MISSION & VISION */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Reveal className="max-w-3xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ab-sans text-sm font-semibold text-amber-700 tracking-wide uppercase">Purpose & Direction</span>
              <span className="w-8 h-px bg-amber-500" />
            </div>
            <h2 className="ab-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              Our <span className="italic text-amber-700">Vision</span> & Mission
            </h2>
            <p className="ab-sans mt-5 text-base text-stone-600 leading-relaxed">
              Guiding educational excellence from foundational schooling to career entry.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

            {/* Vision Card */}
            <Reveal className="h-full">
              <div className="h-full bg-gradient-to-br from-amber-50/60 via-white to-white rounded-[2rem] p-8 sm:p-10 border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#1C1917] flex items-center justify-center shadow-md">
                      <Eye className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="ab-sans text-xs font-bold uppercase tracking-widest text-amber-800">Our Strategic Outlook</span>
                      <h3 className="ab-serif text-2xl sm:text-3xl text-[#1C1917]">Vision</h3>
                    </div>
                  </div>
                  <p className="ab-sans text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                    {instituteInfo.vision}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-amber-100 flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Leading a global transformation in school & vocational education</span>
                </div>
              </div>
            </Reveal>

            {/* Mission Card */}
            <Reveal delay={120} className="h-full">
              <div className="h-full bg-gradient-to-br from-stone-50 via-white to-white rounded-[2rem] p-8 sm:p-10 border border-stone-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#1C1917] text-amber-400 flex items-center justify-center shadow-md">
                      <Target className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="ab-sans text-xs font-bold uppercase tracking-widest text-stone-500">Our Everyday Commitment</span>
                      <h3 className="ab-serif text-2xl sm:text-3xl text-[#1C1917]">Mission</h3>
                    </div>
                  </div>
                  <p className="ab-sans text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                    {instituteInfo.mission}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Accessible, high-impact education across school, fashion, tech & hospitality</span>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* 4. MD QUOTE */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80&auto=format&fit=crop"
            alt="AurumFX Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917]/95 via-[#1C1917]/85 to-[#1C1917]/95" />
        </div>

        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Quote className="w-7 h-7 text-[#1C1917]" />
          </div>
          <blockquote className="ab-serif italic text-2xl sm:text-3xl lg:text-4xl text-white leading-relaxed font-normal">
            "{instituteInfo.mdQuote}"
          </blockquote>
          <div className="ab-sans mt-8 text-sm sm:text-base font-bold text-amber-400 tracking-wide">
            Managing Director, AurumFX
          </div>
        </Reveal>
      </section>

      {/* 5. WHY CHOOSE AURUMFX? (KEY FEATURE | WHAT WE OFFER) */}
      <section className="py-16 sm:py-24 bg-[#FBF8F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mb-14">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ab-sans text-sm font-semibold text-amber-700 tracking-wide uppercase">Key Features & What We Offer</span>
            </div>
            <h2 className="ab-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              Why Choose <span className="italic text-amber-700">AurumFX?</span>
            </h2>
            <p className="ab-sans mt-5 text-base text-stone-600 leading-relaxed">
              We look beyond classroom lectures to deliver an open, affordable, faculty-led, and community-driven learning environment.
            </p>
          </Reveal>

          {/* Structured Key Feature / What We Offer Table & Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instituteInfo.whyChooseUs.map((item, idx) => {
              const IconComp = whyChooseIcons[idx % whyChooseIcons.length];
              return (
                <Reveal key={item.keyFeature} delay={idx * 80} className="h-full">
                  <div className="h-full bg-white rounded-3xl p-7 border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-xs">
                          <IconComp className="w-6 h-6" strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Key Feature
                        </span>
                      </div>

                      <h3 className="ab-serif text-xl font-bold text-[#1C1917] mb-3">
                        {item.keyFeature}
                      </h3>

                      <p className="ab-sans text-sm text-stone-600 leading-relaxed">
                        {item.whatWeOffer}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-amber-900">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Guaranteed standard at AurumFX</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. DEDICATED PLACEMENT & CAREER OPPORTUNITIES */}
      <PlacementSection />

      {/* 7. START YOUR JOURNEY TODAY (CTA) */}
      <CTASection onOpenApplyModal={onOpenApplyModal} />

    </div>
  );
};

export default About;