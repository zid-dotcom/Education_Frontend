import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Wallet, GraduationCap, Building2, HeartHandshake, ArrowRight } from 'lucide-react';

const WhyChooseUs = () => {
  const cards = [
    {
      id: 1,
      title: 'Holistic Development',
      description: 'We look beyond classroom lectures to nurture leadership qualities, emotional intelligence, teamwork, and critical thinking for overall personal and professional growth.',
      icon: Award,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Inclusive for All',
      description: 'An open-door policy welcoming learners from all backgrounds, ages, and skill levels, fostering an equal-opportunity environment driven by mutual respect.',
      icon: Users,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Affordable Fee Structure',
      description: 'Premium education made accessible through pocket-friendly tuition fees, flexible installment plans, and transparent pricing with no hidden costs.',
      icon: Wallet,
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: 4,
      title: 'Experienced Faculty',
      description: 'Mentorship from seasoned educators and industry practitioners who bring years of real-world insights, domain expertise, and practical guidance to the classroom.',
      icon: GraduationCap,
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: 5,
      title: 'Premium Infrastructure',
      description: 'Modern, air-conditioned classrooms, specialized fashion labs, advanced computer studios, and simulated hospitality setups designed to mirror actual workplace environments.',
      icon: Building2,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: 6,
      title: 'Social Commitment',
      description: 'Dedicated community initiatives aimed at upskilling underrepresented groups, supporting local community programs, and driving positive social change through accessible education.',
      icon: HeartHandshake,
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80&auto=format&fit=crop',
    },
  ];

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
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-28 bg-[#FBF8F2] relative overflow-hidden">
      {/* Google Fonts + local keyframes, scoped to this section */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .wcu-serif { font-family: 'Fraunces', serif; }
        .wcu-sans { font-family: 'Inter', sans-serif; }

        .wcu-card {
          opacity: 0;
          transform: translateY(28px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .wcu-card.wcu-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .wcu-head {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .wcu-head.wcu-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* faint background texture */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Heading */}
        <div className={`wcu-head ${inView ? 'wcu-in' : ''} max-w-2xl mb-16`}>
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="wcu-sans text-sm font-semibold text-amber-700 tracking-wide">Why choose AurumFX</span>
          </div>
          <h2 className="wcu-serif text-4xl sm:text-6xl leading-[1.05] text-[#1C1917]">
            Six reasons students <span className="italic text-amber-700">stay</span> and grow with us
          </h2>
          <p className="wcu-sans mt-5 text-base text-stone-600 leading-relaxed">
            A premier institution built around holistic skill development, practical mastery,
            and genuine student success — not just certificates.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className={`wcu-card ${inView ? 'wcu-in' : ''} group relative`}
                style={{ transitionDelay: inView ? `${index * 110}ms` : '0ms' }}
              >
                <div className="relative rounded-[26px] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_45px_-15px_rgba(28,25,23,0.25)] transition-shadow duration-500">

                  {/* Image */}
                  <div className="relative h-44 overflow-hidden rounded-t-[26px]">
                    <img
                      src={card.image}
                      alt={card.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  </div>

                  {/* Icon medallion, overlapping image and body */}
                  <div className="absolute left-6 top-[9.5rem] w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-900/20 flex items-center justify-center ring-4 ring-white transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6">
                    <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>

                  {/* Body */}
                  <div className="px-6 pt-11 pb-7">
                    <h3 className="wcu-serif text-xl text-[#1C1917] mb-2.5">
                      {card.title}
                    </h3>
                    <p className="wcu-sans text-sm leading-relaxed text-stone-600">
                      {card.description}
                    </p>

                    <Link
                      to="/about"
                      className="wcu-sans mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C1917] group-hover:text-amber-700 transition-colors"
                    >
                      <span>Discover more</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
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