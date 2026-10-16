import React from 'react';
import { Link } from 'react-router-dom';
import hero1Image from '../../assets/hero1.png';
import ScrollReveal from '../common/ScrollReveal';

const Hero = () => {
  return (
    <section className="w-full overflow-hidden">
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 h-1/2 w-1/3 rounded-br-full bg-gradient-to-r from-amber-300/40 via-orange-200/20 to-transparent blur-2xl"
        />
        <img
          src={hero1Image}
          alt=""
          className="hero-pop-in block h-auto w-full lg:-translate-y-3"
        />
      </div>

      <div className="bg-white px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <ScrollReveal className="mx-auto max-w-4xl" threshold={0.2} popup>
          <div className="mb-5 inline-flex items-center rounded-full border border-[#FCD34D]/80 bg-[#FFEAA5] px-4 py-1.5 text-xs font-extrabold text-[#78350F] shadow-xs">
            Learning Platform for you
          </div>
          <h1 className="text-3xl font-bold leading-[1.18] text-[#1C1917] sm:text-5xl lg:text-6xl">
            Bridging the Gap Between Talent and Industry Demands.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Welcome to AurumFX, a premier multi-disciplinary educational institution. Founded on academic excellence, skill-based learning, and character building, we empower individuals to transform their passions into successful, long-term careers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-300 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-amber-400 hover:shadow-lg sm:text-base"
            >
              Explore Courses
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1C1917] text-xs font-bold text-white">
                &rarr;
              </span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg sm:text-base"
            >
              Contact Us
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                &rarr;
              </span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Hero;

