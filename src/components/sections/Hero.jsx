import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Cloned array for seamless infinite horizontal slide show: [CloneLast, Slide0, Slide1, CloneFirst]
const TRACK_SLIDES = [
  SLIDES[SLIDES.length - 1],
  ...SLIDES,
  SLIDES[0],
];

// Slow and relaxed slideshow timings (6s per slide, 1.4s smooth horizontal gliding motion)
const AUTO_PLAY_INTERVAL = 6000; // 6 seconds display per slide
const SLIDE_TRANSITION_MS = 1400; // 1.4 seconds smooth, slow horizontal slide

const Hero = () => {
  // Starts at trackIndex 1 (real Slide 0: Welcome to Aurum FX)
  const [trackIndex, setTrackIndex] = useState(1);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isTransitioningRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Active indicator dot calculation based on original slides count
  const activeSlideIndex = (trackIndex - 1 + SLIDES.length) % SLIDES.length;

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
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setTrackIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setTrackIndex((prev) => prev - 1);
  }, []);

  const goToSlide = (index) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setTrackIndex(index + 1);
  };

  const handleTransitionEnd = () => {
    isTransitioningRef.current = false;
    // If reached end clone (Slide 0 clone at index 3), silently reset to real Slide 0 (index 1)
    if (trackIndex >= TRACK_SLIDES.length - 1) {
      setWithTransition(false);
      setTrackIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
    }
    // If reached start clone (Slide 1 clone at index 0), silently reset to real Slide 1 (index 2)
    else if (trackIndex <= 0) {
      setWithTransition(false);
      setTrackIndex(TRACK_SLIDES.length - 2);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Autoplay timer that restarts fresh on every slide change
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, AUTO_PLAY_INTERVAL);

    return () => clearTimeout(timer);
  }, [trackIndex, isPaused, nextSlide]);

  return (
    <section className="w-full overflow-hidden">
      {/* Full-Width Hero Slideshow - Fills exact screen height down to viewport bottom */}
      <div
        className="group relative w-full overflow-hidden bg-white aspect-[16/9] md:aspect-auto"
        style={heroHeight ? { height: heroHeight } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Aurum FX Academy Hero Carousel"
      >
        {/* Horizontal Slideshow Track (glides slowly from one image to another) */}
        <div
          className="flex h-full w-full select-none"
          style={{
            transform: `translateX(-${trackIndex * 100}%)`,
            transition: withTransition
              ? `transform ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.25, 1, 0.35, 1)`
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {TRACK_SLIDES.map((slide, index) => (
            <div
              key={`${slide.id}-${index}`}
              className="relative h-full w-full shrink-0 grow-0"
              aria-hidden={index !== trackIndex}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="block h-full w-full object-cover select-none pointer-events-none"
                style={{ objectPosition: slide.objectPosition || 'center 55%' }}
                loading={index === 1 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-amber-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-amber-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Carousel Indicators / Progress Pills */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute bottom-3 sm:bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-xs"
        >
          {SLIDES.map((slide, index) => {
            const isActive = index === activeSlideIndex;
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
