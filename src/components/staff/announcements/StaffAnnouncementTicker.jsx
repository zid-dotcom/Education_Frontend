import React, { useRef, useState, useEffect } from 'react';
import {
  Megaphone,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
} from 'lucide-react';
import { getRelativeTimeAgo, isNewOrRecent } from '../../../utils/announcements';

const StaffAnnouncementTicker = ({
  announcements = [],
  loading = false,
  onSelectAnnouncement,
  onViewAll,
}) => {
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // If loading and no announcements yet, show a subtle pulse pill
  if (loading && (!announcements || announcements.length === 0)) {
    return (
      <div className="rounded-2xl border border-[#E3DDD0] bg-white/70 p-2.5 px-4 shadow-xs flex items-center gap-2.5 animate-pulse">
        <div className="h-6 w-20 bg-[#F1EDE4] rounded-xl" />
        <div className="h-4 flex-1 bg-[#FAF8F4] rounded-lg" />
      </div>
    );
  }

  // If no announcements, hide or show a subtle compact indicator without taking up space
  if (!announcements || announcements.length === 0) {
    return null;
  }

  // Duplicate items if needed so ticker loops smoothly
  const displayItems =
    announcements.length >= 3
      ? [...announcements, ...announcements]
      : announcements;

  // Manual scroll helper
  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E3DDD0] shadow-xs group/ticker transition-all hover:border-[#9C6B2E]/40">
      <style>{`
        @keyframes staff-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .staff-ticker-track {
          display: flex;
          width: max-content;
          animation: staff-ticker-scroll ${Math.max(28, announcements.length * 9)}s linear infinite;
        }

        .staff-ticker-track.paused {
          animation-play-state: paused !important;
        }

        .staff-ticker-container:hover .staff-ticker-track {
          animation-play-state: paused;
        }

        .staff-ticker-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
          mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          .staff-ticker-track {
            animation: none !important;
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:px-3">
        {/* Left Ticker Label Pill */}
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F1EDE4] border border-[#E3DDD0] text-[#9C6B2E] text-[11px] font-extrabold select-none shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9C6B2E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9C6B2E]" />
          </span>
          <Megaphone className="h-3.5 w-3.5 text-[#9C6B2E] stroke-[2.5]" />
          <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Announcements</span>
        </div>

        {/* Center Marquee Viewport */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="staff-ticker-container staff-ticker-mask flex-1 overflow-hidden py-0.5"
        >
          <div className={`staff-ticker-track gap-3 sm:gap-4 ${isPaused ? 'paused' : ''}`}>
            {displayItems.map((ann, idx) => {
              const isCourse = ann.type === 'course';
              const isRecent = isNewOrRecent(ann);
              const snippet = (ann.message || ann.content || '').replace(/\s+/g, ' ').trim();

              return (
                <div
                  key={`${ann.uniqueId || ann.id}-${idx}`}
                  onClick={() => onSelectAnnouncement && onSelectAnnouncement(ann)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] hover:bg-[#F1EDE4] hover:border-[#9C6B2E]/60 px-3 py-1.5 text-xs text-[#17140F] transition cursor-pointer shrink-0 shadow-2xs"
                  title="Click to view full announcement"
                >
                  {/* Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      isCourse
                        ? 'bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]'
                        : 'bg-amber-100/70 text-amber-900 border-amber-200'
                    }`}
                  >
                    {isCourse ? (
                      <BookOpen className="h-2.5 w-2.5" />
                    ) : (
                      <Building2 className="h-2.5 w-2.5" />
                    )}
                    <span>{isCourse ? 'Course' : 'Notice'}</span>
                  </span>

                  {/* New indicator dot if fresh */}
                  {isRecent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Recent announcement" />
                  )}

                  {/* Title */}
                  <span className="font-bold text-[#17140F] max-w-[180px] sm:max-w-[260px] truncate">
                    {ann.title}
                  </span>

                  {/* Snippet preview on larger screens */}
                  {snippet && (
                    <span className="text-[#5B5346] max-w-[140px] sm:max-w-[200px] truncate hidden md:inline text-[11px]">
                      — {snippet}
                    </span>
                  )}

                  {/* Relative Timestamp */}
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    • {getRelativeTimeAgo(ann.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Pause/Play & Manual Scroll Buttons */}
        <div className="shrink-0 flex items-center gap-1 pl-1">
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-[#9C6B2E] hover:bg-[#FAF8F4] transition cursor-pointer"
            title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            aria-label={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="p-1 rounded-lg text-slate-400 hover:text-[#9C6B2E] hover:bg-[#FAF8F4] transition cursor-pointer"
            title="Scroll previous"
            aria-label="Scroll previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="p-1 rounded-lg text-slate-400 hover:text-[#9C6B2E] hover:bg-[#FAF8F4] transition cursor-pointer"
            title="Scroll next"
            aria-label="Scroll next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {typeof onViewAll === 'function' && (
            <button
              type="button"
              onClick={onViewAll}
              className="hidden lg:inline-flex items-center gap-1 ml-1 px-2 py-1 text-[11px] font-bold text-[#9C6B2E] hover:text-[#855923] hover:bg-[#F1EDE4] rounded-lg transition cursor-pointer"
            >
              <span>All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAnnouncementTicker;
