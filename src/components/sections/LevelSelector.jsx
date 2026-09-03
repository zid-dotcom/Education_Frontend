import React from 'react';
import { Link } from 'react-router-dom';

const LevelSelector = () => {
  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] leading-tight tracking-tight">
            Choose a course that aligns with the skills you have right now, so you can grow at your own pace!
          </h2>
        </div>

        {/* CLEAN BANNER CARD WITH SOFT LIGHT BACKGROUND */}
        <div className="rounded-[2.5rem] bg-slate-50/60 border border-slate-200/80 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          
          {/* LEFT VISUAL COLUMN: CLEAN SOFT LIGHT BG */}
          <div className="lg:col-span-5 bg-slate-50/60 relative p-8 lg:p-12 flex items-center justify-center min-h-[340px] lg:min-h-[400px]">
            
            {/* Student Photo */}
            <div className="relative z-10 text-center">
              <div className="w-56 sm:w-64 lg:w-72 h-72 bg-[#F5B718] rounded-3xl overflow-hidden shadow-xl mx-auto flex items-end justify-center pt-4 transform hover:scale-105 transition-transform border border-amber-300/80">
                <img
                  src="/images/hero-student.png"
                  alt="Aurumfx Student"
                  className="w-full h-full object-cover object-top drop-shadow-md translate-y-2"
                />
              </div>
            </div>

          </div>

          {/* RIGHT TEXT COLUMN */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 space-y-6 text-left bg-slate-50/60">
            
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C1917] leading-snug">
              Learn the world of technology from the basics, guaranteed to understand
            </h3>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
              Start your journey into the world of technology from the very basics, with easy-to-follow lessons designed to help you truly understand—even with no prior experience.
            </p>

            <div className="pt-2">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-amber-300 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-400 active:scale-98"
              >
                <span>Start Learning</span>
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-xs font-bold">
                  &rarr;
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


