import React from 'react';
import { Link } from 'react-router-dom';

const Hero = ({ onOpenApplyModal }) => {
  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-14 sm:pt-8 sm:pb-16 lg:pt-8 lg:pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP HERO CONTAINER WITH SOFT LIGHT COLOR BACKGROUND */}
        <div className="relative rounded-[2.5rem] bg-slate-50/60 border border-slate-200/80 shadow-md overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[480px] lg:min-h-[520px]">
            
            {/* LEFT COLUMN: SOFT LIGHT BG, HEADLINE & ACTIONS */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center space-y-6 text-left relative z-10 bg-slate-50/60">
              
              {/* Top Yellow Pill Badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#FFEAA5] text-[#78350F] border border-[#FCD34D]/80 shadow-xs">
                  <span>Learning Platform for you</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] leading-[1.18]">
                Bridging the Gap Between Talent and Industry Demands.
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Welcome to AurumFX, a premier multi-disciplinary educational institution. Founded on academic excellence, skill-based learning, and character building, we empower individuals to transform their passions into successful, long-term careers.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-5">
                
                {/* Primary Yellow Explore Courses Button */}
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-amber-300 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-400 active:scale-98"
                >
                  <span>Explore Courses</span>
                  <span className="w-5 h-5 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-xs font-bold">
                    &rarr;
                  </span>
                </Link>

                {/* Secondary Dark Contact Us Button */}
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#1C1917] hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer group active:scale-98"
                >
                  <span>Contact Us</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </Link>

              </div>

            </div>

            {/* RIGHT COLUMN: RICH VIBRANT LIGHT GOLDEN YELLOW BG WITH STUDENT PHOTO */}
            <div className="lg:col-span-5 relative bg-[#F5B718] flex items-end justify-center pt-8 px-6 lg:px-8 min-h-[380px] lg:min-h-[520px] rounded-b-[2.5rem] lg:rounded-b-none lg:rounded-r-[2.5rem] overflow-hidden">
              
              {/* Student Photo with transparent background */}
              <img
                src="/images/hero-student.png"
                alt="Aurumfx Student Model"
                className="w-full max-w-sm sm:max-w-md h-full object-cover object-top relative z-10 drop-shadow-xl translate-y-2 lg:translate-y-4"
              />

            </div>

          </div>
        </div>

        {/* MID-BANNER STRIP BELOW HERO */}
        <div className="text-center">
          
          {/* Highlight Sentence */}
          <p className="text-sm sm:text-base font-normal text-slate-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            <span className="text-[#D97706] font-extrabold">AurumFX</span> offers specialized, career-focused programs through three dedicated academies: <span className="font-semibold text-slate-900">Fashion Designing Institute</span>, <span className="font-semibold text-slate-900">Computer Training Institute</span>, and <span className="font-semibold text-slate-900">Hospitality Management Institute</span>.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center py-6 border-y border-slate-200/80">
            
            <div className="space-y-1 border-r border-slate-200/60 last:border-0">
              <div className="text-3xl sm:text-4xl font-black text-[#1C1917]">20K</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classes</div>
            </div>

            <div className="space-y-1 border-r border-slate-200/60 last:border-0">
              <div className="text-3xl sm:text-4xl font-black text-[#1C1917]">400K</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Members</div>
            </div>

            <div className="space-y-1 border-r border-slate-200/60 last:border-0">
              <div className="text-3xl sm:text-4xl font-black text-[#1C1917]">10K</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mentors</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#1C1917] flex items-center justify-center gap-1">
                4.9
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;

