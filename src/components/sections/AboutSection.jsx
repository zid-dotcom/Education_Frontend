import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutSection = () => {
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
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: '5,000+', label: 'Students trained' },
    { value: '20+', label: 'Job-ready courses' },
    { value: '30+', label: 'Expert instructors' },
    { value: '94%', label: 'Placement record' },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-28 bg-[linear-gradient(115deg,#fffaf0_0%,#ffffff_46%,#fff4c7_100%)] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .ab-serif { font-family: 'Fraunces', serif; }
        .ab-sans { font-family: 'Inter', sans-serif; }

        .ab-fade {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ab-fade.ab-in { opacity: 1; transform: translateY(0); }

        .ab-photo {
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
        }
        .ab-photo.ab-in { opacity: 1; transform: translateX(0); }

        .ab-copy {
          opacity: 0;
          transform: translateX(24px);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.25s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.25s;
        }
        .ab-copy.ab-in { opacity: 1; transform: translateX(0); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Centered heading */}
        <div className={`ab-fade ${inView ? 'ab-in' : ''} max-w-2xl mx-auto text-center mb-16`}>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="ab-sans text-sm font-semibold text-amber-700 tracking-wide">About AurumFX</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="ab-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
            Bridging the gap between <span className="italic text-amber-700">talent</span> and industry demand
          </h2>
        </div>

        {/* Content: image + copy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">

          {/* LEFT: Image + badge */}
          <div className={`ab-photo ${inView ? 'ab-in' : ''} lg:col-span-5 relative`}>
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl">
              <img
                src="/images/computer-category.jpg"
                alt="AurumFX campus lab"
                className="w-full h-80 sm:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Overlapping badge */}
            <div className="absolute -bottom-6 -right-2 sm:right-6 bg-white p-5 rounded-2xl shadow-lg border border-stone-100 max-w-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                10+
              </div>
              <div>
                <div className="ab-sans text-sm font-bold text-[#1C1917] leading-tight">Years of excellence</div>
                <div className="ab-sans text-xs text-stone-500 mt-0.5">Transforming careers</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Copy + stats */}
          <div className={`ab-copy ${inView ? 'ab-in' : ''} lg:col-span-7 space-y-6`}>

            <p className="ab-sans text-sm sm:text-base text-stone-600 leading-relaxed">
              AurumFX is a premier multi-disciplinary educational institution committed to
              bridging the gap between talent and industry demands. Founded on academic
              excellence, skill-based learning, and character building, AurumFX empowers
              individuals to turn their passions into long-term careers.
            </p>

            <p className="ab-sans text-sm sm:text-base text-stone-600 leading-relaxed">
              We offer specialized, career-focused programs through three dedicated academies:{' '}
              <span className="font-semibold text-[#1C1917]">Fashion Designing Institute</span>,{' '}
              <span className="font-semibold text-[#1C1917]">Computer Training Institute</span>, and{' '}
              <span className="font-semibold text-[#1C1917]">Hospitality Management Institute</span>.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 transition-colors duration-300"
                >
                  <div className="ab-serif text-2xl text-[#1C1917]">{stat.value}</div>
                  <div className="ab-sans text-xs font-semibold text-stone-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/about"
                className="ab-sans group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1917] hover:bg-amber-700 text-white font-semibold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>Learn more about us</span>
                <span className="w-6 h-6 rounded-full bg-amber-400 group-hover:bg-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1C1917] transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;