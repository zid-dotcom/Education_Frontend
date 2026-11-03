import React from 'react';

/**
 * AssignmentBannerIllustration
 * High-definition vector illustration matching the coursework & graduation theme:
 * - Graduation cap (mortarboard) with gold tassel
 * - Clipboard with checklist
 * - Stack of blue books
 * - Executive fountain pen
 * - Warm organic golden shapes & dot accents
 */
export const AssignmentBannerIllustration = ({ className = "w-full h-full block" }) => {
  return (
    <svg
      viewBox="0 0 500 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMaxYMax slice"
    >
      <defs>
        {/* Warm Golden Gradients */}
        <linearGradient id="warmGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE6B0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F5B942" stopOpacity="0.75" />
        </linearGradient>

        <linearGradient id="warmAmberSoft" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FCF0D6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F9CB65" stopOpacity="0.5" />
        </linearGradient>

        <linearGradient id="goldClipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE494" />
          <stop offset="50%" stopColor="#EAB338" />
          <stop offset="100%" stopColor="#B47818" />
        </linearGradient>

        <linearGradient id="penBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#273449" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="book1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="book2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8B5E1E" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* ========================================================= */}
      {/* 1. BACKGROUND ORGANIC WARM SHAPES & DOTS                  */}
      {/* ========================================================= */}
      {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
      <path
        d="M 40 240 C 100 150, 160 80, 260 40 C 350 4, 430 0, 500 0 L 500 240 Z"
        fill="url(#warmAmberSoft)"
      />
      <path
        d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
        fill="url(#warmGoldGrad)"
      />

      {/* Subtle Star Sparkles & Golden Dot Matrix in Sky */}
      <g fill="#D99824" opacity="0.6">
        <circle cx="280" cy="18" r="2" />
        <circle cx="295" cy="18" r="2" />
        <circle cx="310" cy="18" r="2" />
        <circle cx="288" cy="28" r="2" />
        <circle cx="302" cy="28" r="2" />
        <path d="M 470 16 Q 470 23 462 23 Q 470 23 470 30 Q 470 23 478 23 Q 470 23 470 16 Z" />
      </g>

      {/* ========================================================= */}
      {/* 2. STACK OF BOOKS (LOWER LEFT OF CLIPBOARD)               */}
      {/* ========================================================= */}
      {/* Bottom Book */}
      <g filter="url(#softShadow)">
        <rect x="135" y="195" width="125" height="23" rx="4" fill="url(#book1Grad)" />
        <path d="M 135 195 Q 130 206 135 218 L 144 218 Q 139 206 144 195 Z" fill="#1E40AF" />
        <rect x="150" y="199" width="105" height="15" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="154" y1="204" x2="250" y2="204" stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1="154" y1="210" x2="250" y2="210" stroke="#CBD5E1" strokeWidth="0.8" />
      </g>

      {/* Top Book */}
      <g filter="url(#softShadow)">
        <rect x="140" y="172" width="125" height="23" rx="4" fill="url(#book2Grad)" />
        <path d="M 140 172 Q 135 183 140 195 L 149 195 Q 144 183 149 172 Z" fill="#172554" />
        <rect x="155" y="176" width="105" height="15" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="159" y1="181" x2="255" y2="181" stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1="159" y1="187" x2="255" y2="187" stroke="#CBD5E1" strokeWidth="0.8" />
      </g>

      {/* ========================================================= */}
      {/* 3. CLIPBOARD WITH CHECKLIST (CENTER)                      */}
      {/* ========================================================= */}
      <g transform="rotate(-6 270 120)" filter="url(#softShadow)">
        {/* Dark Cobalt Clipboard Frame */}
        <rect x="210" y="32" width="135" height="186" rx="14" fill="#0F172A" />
        <rect x="212" y="34" width="131" height="182" rx="12" fill="#1E293B" stroke="#334155" strokeWidth="1" />

        {/* Gold Metal Clip */}
        <rect x="250" y="24" width="55" height="20" rx="4" fill="url(#goldClipGrad)" stroke="#B47818" strokeWidth="1" />
        <path d="M 268 24 C 268 15, 287 15, 287 24" fill="none" stroke="#D99824" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="258" cy="34" r="1.8" fill="#78350F" />
        <circle cx="297" cy="34" r="1.8" fill="#78350F" />

        {/* Crisp White Paper Sheet */}
        <rect x="218" y="44" width="119" height="166" rx="8" fill="#FFFFFF" />

        {/* Paper Header */}
        <text x="277.5" y="68" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1E293B" letterSpacing="1">
          CHECKLIST
        </text>
        <line x1="232" y1="76" x2="323" y2="76" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Task Item 1 (Green Checked) */}
        <rect x="228" y="85" width="99" height="34" rx="7" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
        <rect x="235" y="92" width="20" height="20" rx="5" fill="#22C55E" />
        <path d="M 239 102 L 243 106 L 251 98" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="262" y="95" width="56" height="5" rx="2.5" fill="#0F172A" />
        <rect x="262" y="104" width="42" height="4" rx="2" fill="#94A3B8" />

        {/* Task Item 2 (Blue Checked) */}
        <rect x="228" y="126" width="99" height="34" rx="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <rect x="235" y="133" width="20" height="20" rx="5" fill="#3B82F6" />
        <path d="M 239 143 L 243 147 L 251 139" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="262" y="136" width="52" height="5" rx="2.5" fill="#0F172A" />
        <rect x="262" y="145" width="38" height="4" rx="2" fill="#94A3B8" />

        {/* Footer Task Lines */}
        <rect x="232" y="172" width="65" height="4" rx="2" fill="#E2E8F0" />
        <rect x="232" y="180" width="48" height="4" rx="2" fill="#F1F5F9" />
      </g>

      {/* ========================================================= */}
      {/* 4. GRADUATION CAP (MORTARBOARD - UPPER RIGHT)             */}
      {/* ========================================================= */}
      <g transform="translate(6, -18)" filter="url(#softShadow)">
        {/* Skull Cap Dome */}
        <path d="M 370 85 Q 405 120 440 85 L 440 95 Q 405 130 370 95 Z" fill="#0F172A" />

        {/* 3D Mortarboard Facets */}
        <polygon points="350,68 405,102 405,108 350,74" fill="#0F172A" />
        <polygon points="405,102 460,65 460,71 405,108" fill="#1E293B" />

        {/* Diamond Top */}
        <polygon points="350,68 405,32 460,65 405,102" fill="url(#capGrad)" stroke="#334155" strokeWidth="0.8" />

        {/* Gold Button on Top */}
        <ellipse cx="405" cy="67" rx="5" ry="3.5" fill="#F4B942" stroke="#D99824" strokeWidth="1" />

        {/* Gold Silky Tassel */}
        <path d="M 405 67 Q 435 72 448 92" fill="none" stroke="#F4B942" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="448" cy="94" r="2.8" fill="#D99824" />
        <polygon points="445,96 442,126 454,126 451,96" fill="#F4B942" />
        <line x1="445" y1="102" x2="444" y2="125" stroke="#D99824" strokeWidth="0.8" />
        <line x1="451" y1="102" x2="452" y2="125" stroke="#D99824" strokeWidth="0.8" />
      </g>

      {/* ========================================================= */}
      {/* 5. EXECUTIVE FOUNTAIN PEN (BOTTOM RIGHT)                  */}
      {/* ========================================================= */}
      <g transform="rotate(-42 405 185)" filter="url(#softShadow)">
        {/* Blue Barrel */}
        <rect x="360" y="178" width="80" height="14" rx="4" fill="url(#penBodyGrad)" stroke="#1E3A8A" strokeWidth="0.8" />
        <line x1="362" y1="181" x2="438" y2="181" stroke="#93C5FD" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />

        {/* Chrome Center Band */}
        <rect x="355" y="177" width="5" height="16" rx="1" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.8" />

        {/* Grip Section */}
        <rect x="340" y="179" width="15" height="12" rx="1.5" fill="#0F172A" />

        {/* Metallic Nib */}
        <polygon points="340,179 322,185 340,191" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
        <polygon points="338,181 329,185 338,189" fill="#F59E0B" />
        <line x1="337" y1="185" x2="324" y2="185" stroke="#475569" strokeWidth="0.8" />

        {/* Cap End & Clip */}
        <rect x="440" y="179" width="8" height="12" rx="2" fill="#1E3A8A" />
        <circle cx="448" cy="185" r="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
        <rect x="395" y="174" width="40" height="3" rx="1.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.6" />
        <circle cx="395" cy="175.5" r="2.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
      </g>
    </svg>
  );
};

export default AssignmentBannerIllustration;
