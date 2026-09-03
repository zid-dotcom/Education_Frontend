import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

const CTASection = ({ onOpenApplyModal }) => {
  return (
    <section className="py-16 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-amber-50/60 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-amber-200/80 text-slate-900">
          
          {/* Subtle Decorative Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-6 text-left">
            
            {/* Admissions Open Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-300 shadow-xs">
              <GraduationCap className="w-4 h-4 text-amber-800" />
              <span>Admissions Open for 2026 Batch</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 leading-tight tracking-tight">
              Start Your Journey Today
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-700 font-normal leading-relaxed">
              Whether you are aspiring to design the next fashion trend, build modern digital solutions, or deliver world-class hospitality experiences, AurumFX provides the environment, tools, and career support to help you achieve your goals.
            </p>

            <p className="text-sm sm:text-base font-bold text-amber-900">
              Unlock your potential. Gain industry skills. Launch your career with confidence.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenApplyModal}
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-amber-400 text-white hover:text-slate-950 font-extrabold text-sm sm:text-base rounded-full shadow-md hover:shadow-xl transition-all cursor-pointer border border-slate-900 hover:border-amber-400 group active:scale-95"
              >
                <span>Apply Online Now</span>
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 group-hover:bg-slate-950 group-hover:text-white flex items-center justify-center text-xs font-black transition-colors">
                  &rarr;
                </span>
              </button>

              <Link
                to="/admissions"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm sm:text-base rounded-full border border-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-95"
              >
                Admission Details
              </Link>
            </div>

            {/* Bottom Key Benefits Bar */}
            <div className="pt-6 border-t border-amber-200/70 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-700 font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> Limited Seats Per Batch
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> Zero Interest Installments
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> 100% Placement Assistance
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default CTASection;

