import React, { useId } from "react";

/* Premium waving hand: gold gradient line-art hand on a dark badge with a
   fine gold ring and two motion arcs. Uses the page's `ba-wave` animation
   (already disabled for prefers-reduced-motion in the dashboard CSS). */
const PremiumWave = ({ className = "h-12 w-12 sm:h-14 sm:w-14" }) => {
  const id = useId().replace(/:/g, "");
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 30% 25%, #2a241a 0%, #17140f 70%)",
        boxShadow:
          "0 0 0 1px #9c6b2e, 0 0 0 4px #faf8f4, 0 0 0 5px rgba(156,107,46,.35), 0 10px 22px -10px rgba(23,20,15,.6)",
      }}
    >
      <svg viewBox="0 0 32 32" className="ba-wave h-[58%] w-[58%]" fill="none">
        <defs>
          <linearGradient id={`${id}-g`} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fbe3a0" />
            <stop offset="0.5" stopColor="#f4b942" />
            <stop offset="1" stopColor="#b0803a" />
          </linearGradient>
        </defs>
        {/* hand */}
        <g
          transform="translate(4 5) scale(.95)"
          stroke={`url(#${id}-g)`}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
          <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </g>
        {/* motion arcs */}
        <path
          d="M26 2.5c1.8.7 3 2 3.6 3.8M23.6 1c2.6.8 4.4 2.6 5.4 5"
          stroke="#f4b942"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
    </span>
  );
};

export default PremiumWave;