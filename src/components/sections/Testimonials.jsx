import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getPublicReviewsApi } from '../../services/reviews';

const Testimonials = () => {
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setReviewsList(mapped);
        } else {
          setReviewsList([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load live public reviews:', err);
        if (isMounted) setReviewsList([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // If there are no approved/real reviews yet, don't show dummy data
  if (!loading && reviewsList.length === 0) {
    return null;
  }

  // Duplicate the list so the marquee loops seamlessly across all screen sizes
  const repeatCount = reviewsList.length > 0 ? Math.max(2, Math.ceil(8 / reviewsList.length)) : 1;
  const track = Array(repeatCount).fill(reviewsList).flat();

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
              {/* Quote Mark & Rating */}
              <div className="flex items-center justify-between mb-6">
                <span className="tm-serif text-4xl text-amber-500/70 leading-none">“</span>
                <div className="flex gap-1" aria-label={`${item.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < item.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-stone-200 text-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Quote Text */}
              <p className="tm-sans text-stone-700 text-sm sm:text-base leading-relaxed line-clamp-4 flex-1">
                {item.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-amber-100/60">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-100"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <h4 className="tm-sans text-xs sm:text-sm font-semibold text-[#1C1917] truncate">
                    {item.name}
                  </h4>
                  <p className="tm-sans text-[11px] text-stone-600 truncate mt-0.5">
                    {item.course} {item.batch ? `• ${item.batch}` : ''}
                  </p>
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
