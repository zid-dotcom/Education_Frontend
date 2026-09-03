import React from 'react';
import { Briefcase, Award, GraduationCap, Compass, CheckCircle2, UserCheck } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const PlacementSection = () => {
  const pillars = [
    {
      title: "100% Placement Assistance",
      desc: "Comprehensive guidance and job placement support provided to every eligible student upon course completion.",
      icon: Award,
      badge: "Full Placement Support"
    },
    {
      title: "Industry Internships & Live Projects",
      desc: "Real-world exposure through mandatory internships, hands-on field projects, and industry exposure trips before graduation.",
      icon: Compass,
      badge: "Real-World Experience"
    },
    {
      title: "Soft Skills & Interview Grooming",
      desc: "Specialized training modules focused on resume building, communication skills, personality development, and professional etiquette to ensure confidence in job interviews.",
      icon: UserCheck,
      badge: "Professional Readiness"
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/40 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge="Career Readiness"
          title="Dedicated Placement & Career Opportunities"
          subtitle="At AurumFX, education is complete only when it leads to meaningful employment. We take immense pride in our active Training & Placement Cell, which acts as a bridge between our graduates and leading industry employers."
        />

        {/* 3 Placement Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-amber-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group card-hover-lift"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                    <IconComponent className="w-7 h-7" />
                  </div>

                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                    {item.badge}
                  </span>

                  <h3 className="text-xl font-extrabold text-slate-950 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>Guaranteed Guidance at AurumFX</span>
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
