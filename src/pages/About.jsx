import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Target, Eye, CheckCircle2, ShieldCheck, Quote } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import PlacementSection from '../components/sections/PlacementSection';
import { instituteInfo } from '../data/instituteInfo';

const About = ({ onOpenApplyModal }) => {
  return (
    <div className="bg-white">
      
      {/* PAGE HEADER BANNER */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-amber-100/60 to-white border-b border-amber-200/60 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-300 mb-4">
            <Award className="w-4 h-4 text-amber-700" />
            <span>Elevate Your Edge</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            About AurumFX
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A premier multi-disciplinary educational institution committed to bridging the gap between talent and industry demands.
          </p>
        </div>
      </section>

      {/* MISSION & VISION CARDS */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-950 font-bold">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950">Our Mission</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                To deliver high-impact, accessible, and affordable vocational skill training that empowers every student to achieve financial independence, professional growth, and career excellence.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-900 text-amber-300 flex items-center justify-center font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950">Our Vision</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {instituteInfo.vision}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* MANAGING DIRECTOR QUOTE SECTION */}
      <section className="py-14 bg-slate-950 text-white relative overflow-hidden border-y border-amber-400/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Quote className="w-6 h-6" />
          </div>
          <blockquote className="text-lg sm:text-2xl font-semibold italic text-amber-100 max-w-3xl mx-auto leading-relaxed">
            "{instituteInfo.mdQuote}"
          </blockquote>
          <div className="pt-2">
            <div className="text-sm font-extrabold tracking-wider text-amber-400 uppercase">— Managing Director, AurumFX</div>
          </div>
        </div>
      </section>

      {/* PLACEMENT & CAREER OPPORTUNITIES */}
      <PlacementSection />

    </div>
  );
};

export default About;
