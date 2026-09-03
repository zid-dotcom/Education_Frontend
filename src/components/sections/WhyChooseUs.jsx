import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Wallet, GraduationCap, Building2, HeartHandshake, ArrowRight, ShieldCheck } from 'lucide-react';

const WhyChooseUs = () => {
  const cards = [
    {
      id: 1,
      title: 'Holistic Development',
      description: 'We look beyond classroom lectures to nurture leadership qualities, emotional intelligence, teamwork, and critical thinking for overall personal and professional growth.',
      icon: Award,
    },
    {
      id: 2,
      title: 'Inclusive for All',
      description: 'An open-door policy welcoming learners from all backgrounds, ages, and skill levels, fostering an equal-opportunity environment driven by mutual respect.',
      icon: Users,
    },
    {
      id: 3,
      title: 'Affordable Fee Structure',
      description: 'Premium education made accessible through pocket-friendly tuition fees, flexible installment plans, and transparent pricing with no hidden costs.',
      icon: Wallet,
    },
    {
      id: 4,
      title: 'Experienced Faculty',
      description: 'Mentorship from seasoned educators and industry practitioners who bring years of real-world insights, domain expertise, and practical guidance to the classroom.',
      icon: GraduationCap,
    },
    {
      id: 5,
      title: 'Premium Infrastructure',
      description: 'Modern, air-conditioned classrooms, specialized fashion labs, advanced computer studios, and simulated hospitality setups designed to mirror actual workplace environments.',
      icon: Building2,
    },
    {
      id: 6,
      title: 'Social Commitment',
      description: 'Dedicated community initiatives aimed at upskilling underrepresented groups, supporting local community programs, and driving positive social change through accessible education.',
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading matching reference text */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Why Choose AurumFX?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1C1917] tracking-tight">
            Key Features That Elevate Your Edge
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Discover what sets AurumFX apart as a premier institution committed to holistic skill development, practical mastery, and student success.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 text-[#1C1917] shadow-xs hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between group card-hover-lift"
              >
                <div>
                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xs font-bold transition-transform group-hover:scale-105 bg-slate-100 text-[#1C1917] border border-slate-200">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg sm:text-xl font-extrabold mb-3 text-[#1C1917]">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed font-normal text-slate-600">
                    {card.description}
                  </p>
                </div>

                {/* Discover More Link */}
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1C1917] hover:text-amber-700 transition-colors"
                  >
                    <span>Discover More</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;

