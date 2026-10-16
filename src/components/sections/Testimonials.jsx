import React from 'react';
import { testimonials } from '../../data/testimonials';

const Testimonials = () => {
  // Duplicate the list so the marquee loops seamlessly
  const track = [...testimonials, ...testimonials];

  return (
    <section className="py-16 sm:py-28 bg-[linear-gradient(115deg,#fffaf0_0%,#ffffff_46%,#fff4c7_100%)] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .tm-serif { font-family: 'Fraunces', serif; }
        .tm-sans { font-family: 'Inter', sans-serif; }

        @keyframes tm-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .tm-track {
          animation: tm-scroll 42s linear infinite;
        }
        .tm-track:hover {
          animation-play-state: paused;
        }

        .tm-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation: none; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="tm-sans text-sm font-semibold text-amber-700 tracking-wide">Student voices</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="tm-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
            What our students say <span className="italic text-amber-700">about us</span>
          </h2>
          <p className="tm-sans mt-5 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Thousands of graduates have transformed their careers with AurumFX. Hear how our
            industry-aligned programs helped them succeed.
          </p>
        </div>
      </div>

      {/* Marquee row, right to left, full-bleed and edge-masked */}
      <div className="tm-mask">
        <div className="tm-track flex gap-6 w-max px-4">
          {track.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-[300px] sm:w-[340px] shrink-0 bg-white rounded-[1.75rem] p-6 sm:p-8 border border-amber-100 shadow-[0_1px_2px_rgba(28,25,23,0.06)] flex flex-col justify-between"
            >
              <div>
                <div className="tm-serif text-[#1C1917] text-5xl leading-none mb-3 select-none">
                  "
                </div>
                <p className="tm-sans text-sm text-stone-700 leading-relaxed">
                  {item.quote}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-amber-200/60 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-amber-200"
                />
                <div>
                  <div className="tm-sans text-xs font-bold text-[#1C1917]">
                    {item.name}
                  </div>
                  <div className="tm-sans text-[11px] font-semibold text-stone-500">
                    {item.course} • {item.batch}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default Testimonials;