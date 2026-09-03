import React from 'react';
import { testimonials } from '../../data/testimonials';

const Testimonials = () => {
  const items = testimonials.slice(0, 3);

  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight">
            What Our Students Say About Aurumfx
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-slate-600 font-bold max-w-xl mx-auto leading-relaxed">
            Thousands of graduates have transformed their careers with AurumFX. Hear how our industry-aligned programs helped them succeed.
          </p>
        </div>

        {/* 3 White Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group card-hover-lift"
            >
              <div>
                {/* Big Double Quotes Icon */}
                <div className="text-[#1C1917] font-serif text-5xl leading-none mb-3 font-extrabold select-none">
                  “
                </div>

                {/* Quote Content */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {item.quote}
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <div className="text-xs font-black text-[#1C1917]">
                    {item.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
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

