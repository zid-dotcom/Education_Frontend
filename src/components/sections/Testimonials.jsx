import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { testimonials as defaultTestimonials } from '../../data/testimonials';
import { getPublicReviewsApi } from '../../services/reviews';

const Testimonials = () => {
  const [reviewsList, setReviewsList] = useState(defaultTestimonials);

  useEffect(() => {
    let isMounted = true;
    getPublicReviewsApi(30)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((rev, idx) => ({
            id: rev.id || `rev-${idx}`,
            name: rev.student_name || 'AurumFX Student',
            course: rev.course_title || 'Course Graduate',
            batch: rev.branch_name || 'AurumFX Academy',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              rev.student_name || 'Student'
            )}&background=f4b942&color=17140f&bold=true&rounded=true`,
            rating: rev.rating || 5,
            quote: rev.review,
          }));
          // Combine or display real reviews; if less than 4, pad with defaults
          if (mapped.length < 4) {
            setReviewsList([...mapped, ...defaultTestimonials]);
          } else {
            setReviewsList(mapped);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load live public reviews:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Duplicate the list so the marquee loops seamlessly
  const track = [...reviewsList, ...reviewsList];

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
                <div className="flex items-center justify-between mb-3">
                  <div className="tm-serif text-[#1C1917] text-4xl leading-none select-none">
                    "
                  </div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= (item.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="tm-sans text-sm text-stone-700 leading-relaxed line-clamp-4">
                  {item.quote}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-amber-200/60 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-amber-200"
                />
                <div className="min-w-0">
                  <div className="tm-sans text-xs font-bold text-[#1C1917] truncate">
                    {item.name}
                  </div>
                  <div className="tm-sans text-[11px] font-semibold text-stone-500 truncate">
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
