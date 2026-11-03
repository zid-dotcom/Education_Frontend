import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import hero1Image from '../../assets/hero1.png';
import heroLandingImage from '../../assets/hero-landing.jpeg';
import ScrollReveal from '../common/ScrollReveal';

const SLIDES = [
  {
    id: 'hero-academy',
    image: heroLandingImage,
    alt: 'Welcome to Aurum FX Academy - Learn, Practice, Grow',
    objectPosition: 'center 62%',
  },
  {
    id: 'hero-legacy',
    image: hero1Image,
    alt: 'Aurum FX Academy Students - Elevate Your Edge',
    objectPosition: 'center 50%',
  },
];

// Slow and relaxed carousel timings (8 seconds per slide, 1.6s smooth dissolve)
const AUTO_PLAY_INTERVAL = 8000; // 8 seconds per slide
const FADE_TRANSITION_MS = 1600; // 1.6 seconds slow, gentle cross-fade movement

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Dynamically compute exact height so hero fills the exact screen without any gap at the bottom
  const [heroHeight, setHeroHeight] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return `${Math.max(500, window.innerHeight - 76)}px`;
    }
    return null;
  });

  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header');
      const headerHeight = header
        ? header.offsetHeight || header.getBoundingClientRect().height
        : 76;
      if (window.innerWidth >= 768) {
        // Exact pixel height down to the bottom of the viewport
        setHeroHeight(`${Math.max(500, window.innerHeight - headerHeight)}px`);
      } else {
        setHeroHeight(null);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    const header = document.querySelector('header');
    let ro;
    if (header && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeight);
      ro.observe(header);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (ro) ro.disconnect();
    };
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, AUTO_PLAY_INTERVAL);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, nextSlide]);

  return (
    <section className="w-full overflow-hidden">
      {/* Full-Width Hero Carousel - Fills exact screen height down to viewport bottom with slow, relaxed transition */}
      <div
        className="group relative w-full overflow-hidden bg-white aspect-[16/9] md:aspect-auto"
        style={heroHeight ? { height: heroHeight } : undefined}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        aria-roledescription="carousel"
        aria-label="Aurum FX Academy Hero Carousel"
      >
        {/* Carousel Slides with Slow 1.6s Cross-Fade Movement */}
        {SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
              style={{ transitionDuration: `${FADE_TRANSITION_MS}ms` }}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="block w-full h-full object-cover select-none"
                style={{ objectPosition: slide.objectPosition || 'center 55%' }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-amber-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-amber-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Carousel Indicators / Progress Pills */}
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-xs">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-500 rounded-full focus:outline-none cursor-pointer ${
                  isActive
                    ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-[#f4b942] shadow-xs'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Mission & CTA Section */}
      <div className="bg-white px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <ScrollReveal className="mx-auto max-w-4xl" threshold={0.2} popup>
          <div className="mb-5 inline-flex items-center rounded-full border border-[#FCD34D]/80 bg-[#FFEAA5] px-4 py-1.5 text-xs font-extrabold text-[#78350F] shadow-xs">
            AurumFX: Elevate Your Edge.
          </div>
          <h1 className="text-3xl font-bold leading-[1.18] text-[#1C1917] sm:text-5xl lg:text-6xl">
            Bridging the Gap Between Talent and Industry Demands.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Welcome to AurumFX, a premier multi-disciplinary educational institution committed to bridging the gap between talent and industry demands. Founded on the principles of academic excellence, skill-based learning, and character building, AurumFX empowers individuals to transform their passions into successful, long-term careers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-300 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-amber-400 hover:shadow-lg sm:text-base"
            >
              Explore Courses
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1C1917] text-xs font-bold text-white">
                &rarr;
              </span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg sm:text-base"
            >
              Contact Us
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                &rarr;
              </span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Hero;
