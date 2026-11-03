import React from 'react';

/**
 * Common shared defs for student banner vector illustrations.
 * Ensures consistent gradients, drop shadows, and warm Aurum FX aesthetic.
 */
const CommonIllustrationDefs = ({ idPrefix }) => (
  <defs>
    <linearGradient id={`${idPrefix}_warmGoldGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FDE6B0" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#F5B942" stopOpacity="0.8" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_warmAmberSoft`} x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#FCF0D6" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#F9CB65" stopOpacity="0.6" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_goldClipGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFE494" />
      <stop offset="50%" stopColor="#EAB338" />
      <stop offset="100%" stopColor="#B47818" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_navyGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1E293B" />
      <stop offset="100%" stopColor="#0F172A" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_blueBookGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3B82F6" />
      <stop offset="100%" stopColor="#1D4ED8" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_emeraldGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#34D399" />
      <stop offset="100%" stopColor="#059669" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_gold3D_1`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFF4D0" />
      <stop offset="50%" stopColor="#F5B942" />
      <stop offset="100%" stopColor="#C98616" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_gold3D_2`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#EAB338" />
      <stop offset="100%" stopColor="#9C640C" />
    </linearGradient>

    <linearGradient id={`${idPrefix}_penGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#334155" />
      <stop offset="50%" stopColor="#0F172A" />
      <stop offset="100%" stopColor="#1E293B" />
    </linearGradient>

    <filter id={`${idPrefix}_softShadow`} x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8B5E1E" floodOpacity="0.14" />
    </filter>

    <filter id={`${idPrefix}_deepShadow`} x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8B5E1E" floodOpacity="0.18" />
    </filter>
  </defs>
);

/**
 * 1. CoursesBannerIllustration
 * Open book, certificate scroll with gold seal, graduation cap, and bookmark
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const CoursesBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="courses" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#courses_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#courses_warmGoldGrad)"
    />

    {/* Subtle Star Sparkles in Sky */}
    <g fill="#D99824" opacity="0.6">
      <circle cx="280" cy="20" r="2" />
      <circle cx="295" cy="20" r="2" />
      <circle cx="310" cy="20" r="2" />
      <circle cx="288" cy="32" r="2" />
      <circle cx="302" cy="32" r="2" />
    </g>

    {/* Stack of foundational textbooks (touches bottom y=240 flush) */}
    <g filter="url(#courses_softShadow)">
      {/* Bottom Book */}
      <rect x="110" y="204" width="135" height="36" rx="4" fill="url(#courses_blueBookGrad)" />
      <rect x="125" y="208" width="115" height="26" rx="2" fill="#FFFFFF" stroke="#E2E8F0" />
      <line x1="130" y1="214" x2="235" y2="214" stroke="#CBD5E1" strokeWidth="1" />
      <line x1="130" y1="222" x2="235" y2="222" stroke="#CBD5E1" strokeWidth="1" />

      {/* Middle Book */}
      <rect x="120" y="170" width="130" height="36" rx="4" fill="#9C6B2E" />
      <rect x="135" y="174" width="110" height="26" rx="2" fill="#FFFFFF" stroke="#E2E8F0" />
      <line x1="140" y1="180" x2="240" y2="180" stroke="#CBD5E1" strokeWidth="1" />
      <line x1="140" y1="188" x2="240" y2="188" stroke="#CBD5E1" strokeWidth="1" />
    </g>

    {/* Main Open Course Curriculum Book */}
    <g transform="rotate(-3 285 125)" filter="url(#courses_softShadow)">
      <rect x="190" y="38" width="175" height="172" rx="14" fill="url(#courses_navyGrad)" />
      <rect x="198" y="46" width="76" height="154" rx="6" fill="#FFFFFF" />
      <rect x="281" y="46" width="76" height="154" rx="6" fill="#F8FAFC" />
      <line x1="278" y1="46" x2="278" y2="200" stroke="#E2E8F0" strokeWidth="2" />

      {/* Book Lines Left Page */}
      <rect x="208" y="60" width="56" height="6" rx="3" fill="#0F172A" />
      <line x1="208" y1="78" x2="266" y2="78" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="208" y1="90" x2="266" y2="90" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="208" y1="102" x2="256" y2="102" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <rect x="208" y="118" width="56" height="32" rx="6" fill="#FAF5ED" stroke="#ECD8B5" strokeWidth="1" />
      <path d="M 220 136 L 228 144 L 244 128" fill="none" stroke="#9C6B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Book Lines Right Page */}
      <rect x="290" y="60" width="50" height="6" rx="3" fill="#3B82F6" />
      <line x1="290" y1="76" x2="348" y2="76" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="290" y1="88" x2="348" y2="88" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="290" y1="100" x2="340" y2="100" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="290" y1="112" x2="344" y2="112" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="290" y1="124" x2="328" y2="124" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

      {/* Gold Ribbon Bookmark reaching top edge */}
      <path d="M 274 30 L 284 30 L 284 85 L 279 78 L 274 85 Z" fill="#F4B942" stroke="#D99824" strokeWidth="1" />
    </g>

    {/* Graduation Mortarboard Cap (Upper Right, reaches near top edge y=20) */}
    <g filter="url(#courses_softShadow)">
      <polygon points="345,62 415,22 485,62 415,100" fill="url(#courses_navyGrad)" stroke="#334155" strokeWidth="1" />
      <ellipse cx="415" cy="62" rx="6" ry="4" fill="#F4B942" stroke="#D99824" strokeWidth="1.2" />
      <path d="M 415 62 Q 450 68 468 94" fill="none" stroke="#F4B942" strokeWidth="3" strokeLinecap="round" />
      <polygon points="464,98 460,135 474,135 470,98" fill="#F4B942" />
    </g>

    {/* Certificate Gold Seal Ribbon (Lower Right, touches bottom y=240, reaches x=495) */}
    <g transform="translate(382, 128)" filter="url(#courses_softShadow)">
      <circle cx="38" cy="38" r="34" fill="url(#courses_goldClipGrad)" />
      <circle cx="38" cy="38" r="26" fill="#FFFFFF" />
      <polygon points="38,22 42,32 53,33 45,41 47,52 38,47 29,52 31,41 23,33 34,32" fill="#9C6B2E" />
      {/* Ribbons hanging all the way to y=240 */}
      <path d="M 24 64 L 14 112 L 30 102 L 46 112 L 36 64" fill="#B47818" />
      <path d="M 40 64 L 50 112 L 64 102 L 74 112 L 60 64" fill="#9C6B2E" />
    </g>
  </svg>
);

/**
 * 2. AnnouncementsBannerIllustration
 * 3D Megaphone with broadcast soundwaves, bell badge, and notice board pins
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const AnnouncementsBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="announcements" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#announcements_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#announcements_warmGoldGrad)"
    />

    {/* Broadcast Soundwave Arcs reaching near top edge y=10 and right edge x=495 */}
    <g opacity="0.85">
      <path d="M 370 55 A 65 65 0 0 1 415 160" fill="none" stroke="#F4B942" strokeWidth="5" strokeLinecap="round" />
      <path d="M 398 35 A 95 95 0 0 1 455 185" fill="none" stroke="#EAB338" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="7 9" />
      <path d="M 425 15 A 125 125 0 0 1 490 205" fill="none" stroke="#B47818" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
    </g>

    {/* Sparkle Stars */}
    <g fill="#F59E0B">
      <polygon points="415,12 418,22 428,25 418,28 415,38 412,28 402,25 412,22" />
      <polygon points="465,65 467,72 474,74 467,76 465,83 463,76 456,74 463,72" />
      <polygon points="350,195 352,201 358,203 352,205 350,211 348,205 342,203 348,201" />
    </g>

    {/* Notice Board Card with Pushpin (starts near y=35) */}
    <g transform="rotate(-6 230 130)" filter="url(#announcements_softShadow)">
      <rect x="145" y="42" width="130" height="175" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <line x1="162" y1="78" x2="258" y2="78" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="162" y1="96" x2="246" y2="96" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="112" x2="252" y2="112" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="128" x2="236" y2="128" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="144" x2="226" y2="144" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Red Pushpin near top */}
      <circle cx="210" cy="54" r="7" fill="#EF4444" stroke="#DC2626" strokeWidth="1.8" />
      <circle cx="208" cy="52" r="2.5" fill="#FFFFFF" opacity="0.8" />
    </g>

    {/* 3D Bold Megaphone Speaker */}
    <g transform="rotate(-12 310 115)" filter="url(#announcements_softShadow)">
      {/* Handle */}
      <path d="M 250 135 L 228 190 A 7 7 0 0 0 239 195 L 268 142 Z" fill="#0F172A" stroke="#334155" strokeWidth="1" />

      {/* Body Cone */}
      <polygon points="245,85 355,50 355,175 245,140" fill="url(#announcements_warmGoldGrad)" stroke="#B47818" strokeWidth="1.8" />
      <ellipse cx="245" cy="112" rx="14" ry="28" fill="#0F172A" />

      {/* Front Bell Rim */}
      <ellipse cx="355" cy="112" rx="20" ry="62" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
      <ellipse cx="355" cy="112" rx="14" ry="50" fill="#F4B942" />

      {/* Gold Trim Accents */}
      <rect x="288" y="74" width="14" height="78" rx="3" fill="#B47818" />
    </g>

    {/* Golden Notification Bell (Lower Right, rests flush at y=240, reaches x=495) */}
    <g transform="translate(378, 126)" filter="url(#announcements_softShadow)">
      <path d="M 40 14 C 24 14 20 26 20 42 L 12 70 L 68 70 L 60 42 C 60 26 56 14 40 14 Z" fill="url(#announcements_goldClipGrad)" />
      <circle cx="40" cy="10" r="5" fill="#9C6B2E" />
      <ellipse cx="40" cy="74" rx="9" ry="6" fill="#B47818" />
      {/* Stand base touching y=240 */}
      <path d="M 20 74 L 16 114 L 64 114 L 60 74 Z" fill="#9C6B2E" opacity="0.15" />
      {/* Notification Counter Badge */}
      <circle cx="56" cy="20" r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
      <text x="56" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">1</text>
    </g>
  </svg>
);

/**
 * 3. InstitutionBannerIllustration
 * Academy campus facade (columns, pediment), sealed institutional scroll & crest
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const InstitutionBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="institution" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#institution_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#institution_warmGoldGrad)"
    />

    {/* Architectural Academy Campus Building (Reaches pediment top y=18, foundation flush at y=240) */}
    <g filter="url(#institution_softShadow)">
      {/* Foundation Steps touching bottom y=240 flush */}
      <rect x="220" y="215" width="260" height="25" rx="3" fill="#0F172A" />
      <rect x="230" y="202" width="240" height="15" rx="2" fill="#1E293B" />
      <rect x="240" y="190" width="220" height="13" rx="2" fill="#334155" />

      {/* Classical Greek Columns (4 Columns) */}
      {[255, 305, 355, 405].map((x, idx) => (
        <g key={idx}>
          {/* Capital */}
          <rect x={x - 4} y="98" width="26" height="8" rx="2" fill="url(#institution_goldClipGrad)" />
          {/* Shaft */}
          <rect x={x} y="106" width="18" height="84" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
          <line x1={x + 5} y1="106" x2={x + 5} y2="190" stroke="#CBD5E1" strokeWidth="1" />
          <line x1={x + 12} y1="106" x2={x + 12} y2="190" stroke="#CBD5E1" strokeWidth="1" />
          {/* Base */}
          <rect x={x - 4} y="184" width="26" height="7" rx="2" fill="url(#institution_goldClipGrad)" />
        </g>
      ))}

      {/* Architrave & Entablature */}
      <rect x="235" y="86" width="230" height="13" rx="2" fill="#1E293B" />

      {/* Triangular Pediment reaching near top edge y=18 */}
      <polygon points="225,86 350,18 475,86" fill="url(#institution_navyGrad)" stroke="#334155" strokeWidth="1.2" />
      {/* Circular Emblem Inside Pediment */}
      <circle cx="350" cy="58" r="16" fill="url(#institution_goldClipGrad)" stroke="#B47818" strokeWidth="1.2" />
      <polygon points="350,48 354,56 363,58 357,64 359,72 350,68 341,72 343,64 337,58 346,56" fill="#1E293B" />
    </g>

    {/* Official Rolled Notice Scroll with Gold Ribbon (Left of Building) */}
    <g transform="rotate(-10 185 130)" filter="url(#institution_softShadow)">
      <rect x="135" y="42" width="95" height="165" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <rect x="146" y="60" width="72" height="7" rx="3.5" fill="#0F172A" />
      <line x1="146" y1="78" x2="218" y2="78" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="92" x2="218" y2="92" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="106" x2="206" y2="106" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="120" x2="212" y2="120" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="134" x2="196" y2="134" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

      {/* Red Wax Seal */}
      <circle cx="182" cy="168" r="16" fill="#DC2626" stroke="#991B1B" strokeWidth="1.8" />
      <circle cx="182" cy="168" r="10" fill="#B91C1C" />
      <path d="M 178 163 L 182 173 L 186 163" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Ribbons hanging down towards bottom */}
      <path d="M 174 182 L 168 205 L 180 198 L 186 205 L 182 182" fill="#B91C1C" />
    </g>

    {/* Golden Laurel Branch in Upper Right touching near top y=12 and right edge x=495 */}
    <g fill="#F4B942" stroke="#D99824" strokeWidth="0.8" transform="translate(435, 14)">
      <ellipse cx="12" cy="12" rx="7" ry="3.5" transform="rotate(-30 12 12)" />
      <ellipse cx="24" cy="18" rx="7" ry="3.5" transform="rotate(20 24 18)" />
      <ellipse cx="16" cy="30" rx="7" ry="3.5" transform="rotate(-40 16 30)" />
      <ellipse cx="28" cy="40" rx="7" ry="3.5" transform="rotate(30 28 40)" />
    </g>
  </svg>
);

/**
 * 4. StudyMaterialsBannerIllustration
 * High-definition 3D yellow folder with multi-format tabs (PDF, PPT, DOC, XLS),
 * stacked blue & dark reference books, 3D red PDF tile, and emerald download badge.
 * Matches user's exact design reference, fitted flush with NO spaces in top, right, or bottom.
 */
export const StudyMaterialsBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 520 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="studymat" />

    <defs>
      {/* Folder Yellow 3D Gradients */}
      <linearGradient id="sm_folderBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>

      <linearGradient id="sm_folderFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      {/* Red PDF Icon 3D Gradient */}
      <linearGradient id="sm_redPdf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>

      {/* Green Download Badge 3D Gradient */}
      <linearGradient id="sm_greenDownload" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>

    {/* Subtle ground reflection */}
    <ellipse cx="340" cy="238" rx="150" ry="6" fill="#EADEC9" opacity="0.6" />

    {/* 1. STACK OF BOOKS ON LEFT (touches bottom y=240 flush) */}
    <g transform="translate(80, 155)" filter="url(#studymat_deepShadow)">
      {/* Bottom Dark Navy Book */}
      <rect x="0" y="45" width="135" height="40" rx="4" fill="#0F172A" />
      <rect x="0" y="45" width="12" height="40" rx="2" fill="#1E293B" />
      <rect x="12" y="50" width="120" height="30" rx="2" fill="#FFFFFF" />
      <line x1="16" y1="58" x2="128" y2="58" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="16" y1="65" x2="128" y2="65" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="16" y1="72" x2="128" y2="72" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Top Cobalt Blue Book */}
      <rect x="12" y="12" width="125" height="36" rx="4" fill="#2563EB" />
      <rect x="12" y="12" width="10" height="36" rx="2" fill="#60A5FA" opacity="0.7" />
      <rect x="22" y="16" width="112" height="28" rx="2" fill="#FFFFFF" />
      <line x1="26" y1="23" x2="130" y2="23" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="26" y1="30" x2="130" y2="30" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="26" y1="37" x2="130" y2="37" stroke="#E2E8F0" strokeWidth="1.5" />
    </g>

    {/* 2. LARGE 3D GOLDEN FOLDER (TABS AT TOP y=8, FOLDER BASE AT y=240 FLUSH) */}
    <g transform="translate(205, 0)" filter="url(#studymat_deepShadow)">
      {/* Folder Back Wall */}
      <rect x="25" y="38" width="195" height="202" rx="16" fill="url(#sm_folderBody)" />

      {/* 4 FORMAT TABS ON TOP (start near top edge at y=8) */}
      {/* Tab 1: PDF (Blue) */}
      <g transform="translate(42, 8)">
        <rect x="0" y="0" width="34" height="28" rx="6" fill="#2563EB" />
        <rect x="0" y="12" width="34" height="16" fill="#2563EB" />
        <text x="17" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">PDF</text>
      </g>

      {/* Tab 2: PPT (Orange) */}
      <g transform="translate(80, 8)">
        <rect x="0" y="0" width="34" height="28" rx="6" fill="#EA580C" />
        <rect x="0" y="12" width="34" height="16" fill="#EA580C" />
        <text x="17" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">PPT</text>
      </g>

      {/* Tab 3: DOC (Indigo) */}
      <g transform="translate(118, 8)">
        <rect x="0" y="0" width="34" height="28" rx="6" fill="#4F46E5" />
        <rect x="0" y="12" width="34" height="16" fill="#4F46E5" />
        <text x="17" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">DOC</text>
      </g>

      {/* Tab 4: XLS (Green) */}
      <g transform="translate(156, 8)">
        <rect x="0" y="0" width="34" height="28" rx="6" fill="#16A34A" />
        <rect x="0" y="12" width="34" height="16" fill="#16A34A" />
        <text x="17" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">XLS</text>
      </g>

      {/* White Paper Inside Folder */}
      <g transform="translate(38, 28)">
        <rect x="0" y="0" width="168" height="150" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        <line x1="18" y1="24" x2="150" y2="24" stroke="#94A3B8" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="18" y1="38" x2="140" y2="38" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="50" x2="144" y2="50" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="62" x2="130" y2="62" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="74" x2="115" y2="74" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Folder Front Flap (touches bottom y=240 flush) */}
      <path
        d="M 18 72 Q 12 76 12 86 L 22 240 L 210 240 L 224 86 Q 226 76 216 72 L 140 72 Q 130 72 124 80 L 118 86 Q 112 90 102 90 L 28 90 Q 20 90 18 72 Z"
        fill="url(#sm_folderFront)"
        stroke="#D97706"
        strokeWidth="1"
      />
      <path
        d="M 22 91 L 102 91 Q 112 91 118 87 L 124 81 Q 130 73 140 73 L 215 73"
        stroke="#FEF3C7"
        strokeWidth="1.5"
        fill="none"
      />
    </g>

    {/* 3. 3D RED PDF ICON BLOCK (Touches bottom y=240 flush, reaches x=495) */}
    <g transform="translate(412, 126)" filter="url(#studymat_deepShadow)">
      <rect x="0" y="0" width="80" height="114" rx="14" fill="url(#sm_redPdf)" />
      <path d="M 52 0 L 80 28 L 52 28 Z" fill="#DC2626" opacity="0.6" />
      <path d="M 52 0 L 52 28 L 80 28" fill="#FCA5A5" opacity="0.8" />
      <text
        x="40"
        y="68"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        PDF
      </text>
    </g>

    {/* 4. FLOATING GREEN DOWNLOAD BADGE (Upper Right, reaches near top edge y=15) */}
    <g transform="translate(432, 45)" filter="url(#studymat_deepShadow)">
      <circle cx="34" cy="34" r="32" fill="url(#sm_greenDownload)" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="34" y1="20" x2="34" y2="36" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 25 31 L 34 40 L 43 31" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="22" y1="47" x2="46" y2="47" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  </svg>
);

/**
 * 5. MessagesBannerIllustration
 * Faculty chat speech bubbles with verified teacher check badge, paper plane, and conversation card
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const MessagesBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="messages" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#messages_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#messages_warmGoldGrad)"
    />

    {/* Dynamic 3D Golden Paper Airplane flying in Upper Right (reaches y=10 and x=490) */}
    <g transform="translate(395, 15) rotate(16)" filter="url(#messages_softShadow)">
      <polygon points="10,48 70,12 48,78 36,54" fill="url(#messages_goldClipGrad)" stroke="#B47818" strokeWidth="1.2" />
      <polygon points="10,48 36,54 70,12" fill="#FFE494" />
      <path d="M 36,54 L 42,72 L 48,60 Z" fill="#B47818" />
    </g>

    {/* Student Chat Bubble (Left/Center) */}
    <g transform="rotate(-4 220 130)" filter="url(#messages_softShadow)">
      <rect x="145" y="72" width="145" height="82" rx="18" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <path d="M 175 154 L 170 172 L 192 154 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      {/* Student Avatar */}
      <circle cx="172" cy="100" r="16" fill="#3B82F6" />
      <circle cx="172" cy="96" r="6" fill="#FFFFFF" />
      <path d="M 162 112 C 162 106 166 104 172 104 C 178 104 182 106 182 112 Z" fill="#FFFFFF" />
      {/* Chat Lines */}
      <rect x="198" y="92" width="76" height="6" rx="3" fill="#0F172A" />
      <rect x="198" y="104" width="56" height="5" rx="2.5" fill="#94A3B8" />
    </g>

    {/* Faculty Chat Bubble (Right/Foreground, reaches near top y=30) */}
    <g transform="rotate(2 340 120)" filter="url(#messages_softShadow)">
      <rect x="245" y="42" width="180" height="106" rx="20" fill="url(#messages_navyGrad)" />
      <path d="M 375 148 L 392 168 L 386 148 Z" fill="#0F172A" />

      {/* Teacher Verified Badge */}
      <circle cx="278" cy="74" r="16" fill="url(#messages_goldClipGrad)" />
      <text x="278" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900">T</text>
      <circle cx="291" cy="62" r="6" fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
      <path d="M 288 62 L 290 64 L 293 61" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

      {/* Faculty Message Lines */}
      <rect x="304" y="66" width="96" height="7" rx="3.5" fill="#FFFFFF" />
      <rect x="304" y="78" width="80" height="6" rx="3" fill="#F4B942" />
      <rect x="304" y="90" width="62" height="5" rx="2.5" fill="#94A3B8" />

      {/* Typing Indicator Dots */}
      <g fill="#94A3B8" opacity="0.8">
        <circle cx="308" cy="116" r="3.5" />
        <circle cx="319" cy="116" r="3.5" />
        <circle cx="330" cy="116" r="3.5" />
      </g>
    </g>

    {/* Grounding Status Card & Notification Badge (touches bottom y=240, reaches x=495) */}
    <g transform="translate(372, 145)" filter="url(#messages_softShadow)">
      {/* Background card base resting at bottom y=240 */}
      <rect x="10" y="20" width="105" height="75" rx="14" fill="#FAF6EE" stroke="#ECDDC6" strokeWidth="1" />
      <circle cx="45" cy="52" r="24" fill="#EF4444" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M 36 52 L 42 58 L 54 46" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/**
 * 6. ReceiptsBannerIllustration
 * Official fee receipt voucher, Rupee coin, checkmark stamp, and security lock shield
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const ReceiptsBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="receipts" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#receipts_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#receipts_warmGoldGrad)"
    />

    {/* Official Tax Invoice Voucher Paper (reaches near top y=18, base touches y=240) */}
    <g transform="rotate(-4 275 125)" filter="url(#receipts_softShadow)">
      {/* Paper Sheet */}
      <rect x="190" y="16" width="165" height="222" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

      {/* Top Header Strip */}
      <rect x="190" y="16" width="165" height="28" rx="12" fill="url(#receipts_navyGrad)" />
      <text x="272" y="34" textAnchor="middle" fill="#F4B942" fontSize="10" fontWeight="900" letterSpacing="1">
        FEE RECEIPT
      </text>

      {/* Receipt Details Lines */}
      <line x1="206" y1="58" x2="338" y2="58" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="206" y="68" width="65" height="6" rx="3" fill="#0F172A" />
      <rect x="292" y="68" width="46" height="6" rx="3" fill="#10B981" />

      <line x1="206" y1="86" x2="338" y2="86" stroke="#F1F5F9" strokeWidth="1" />
      <rect x="206" y="96" width="55" height="5" rx="2.5" fill="#94A3B8" />
      <rect x="302" y="96" width="36" height="5" rx="2.5" fill="#64748B" />

      <rect x="206" y="110" width="60" height="5" rx="2.5" fill="#94A3B8" />
      <rect x="302" y="110" width="36" height="5" rx="2.5" fill="#64748B" />

      <line x1="206" y1="128" x2="338" y2="128" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />

      {/* Total Amount Row */}
      <rect x="206" y="140" width="44" height="7" rx="3.5" fill="#0F172A" />
      <text x="338" y="148" textAnchor="end" fill="#0F172A" fontSize="13" fontWeight="900">₹ PAID</text>

      {/* Barcode Strip */}
      <g transform="translate(222, 168)">
        {[0, 5, 10, 16, 21, 26, 32, 39, 44, 50, 55, 62, 68, 73, 80, 86, 92, 98].map((x, idx) => (
          <line key={idx} x1={x} y1="0" x2={x} y2="20" stroke="#0F172A" strokeWidth={idx % 3 === 0 ? "2.8" : "1.4"} />
        ))}
      </g>

      {/* Emerald "VERIFIED" Official Stamp Badge */}
      <g transform="translate(242, 102) rotate(-15)">
        <rect x="0" y="0" width="85" height="32" rx="7" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.8" />
        <text x="42.5" y="21" textAnchor="middle" fill="#059669" fontSize="14" fontWeight="900" letterSpacing="2">
          VERIFIED
        </text>
      </g>
    </g>

    {/* Golden Rupee Currency Coins (Lower Right, base touches y=240, reaches x=495) */}
    <g transform="translate(378, 120)" filter="url(#receipts_softShadow)">
      {/* Back Coin */}
      <circle cx="32" cy="62" r="32" fill="#B47818" />
      <circle cx="32" cy="62" r="28" fill="url(#receipts_goldClipGrad)" />
      <text x="32" y="73" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="bold">₹</text>

      {/* Front Coin touching bottom y=240 */}
      <circle cx="56" cy="46" r="34" fill="#9C6B2E" />
      <circle cx="56" cy="46" r="30" fill="url(#receipts_goldClipGrad)" />
      <text x="56" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="bold">₹</text>
    </g>

    {/* Security Shield Lock in Upper Right (reaches near top y=12 and right edge x=490) */}
    <g transform="translate(395, 15)" filter="url(#receipts_softShadow)">
      <path d="M 34 6 L 62 17 L 62 46 C 62 66 48 82 34 88 C 20 82 6 66 6 46 L 6 17 Z" fill="url(#receipts_navyGrad)" stroke="#334155" strokeWidth="1.2" />
      <circle cx="34" cy="41" r="9" fill="url(#receipts_goldClipGrad)" />
      <rect x="28" cy="38" width="12" height="18" rx="2.5" fill="url(#receipts_goldClipGrad)" />
      <circle cx="34" cy="47" r="2.5" fill="#0F172A" />
    </g>
  </svg>
);

/**
 * 7. ReviewsBannerIllustration
 * Modern 3D faceted golden star trophy, layered crisp testimonial cards,
 * 5-star rating cluster, and prestigious Aurum medallion seal.
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const ReviewsBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="reviews" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#reviews_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#reviews_warmGoldGrad)"
    />

    {/* Subtle Star Sparkles in Sky */}
    <g fill="#D99824" opacity="0.6">
      <path d="M 160 25 Q 160 35 150 35 Q 160 35 160 45 Q 160 35 170 35 Q 160 35 160 25 Z" />
      <path d="M 470 35 Q 470 42 462 42 Q 470 42 470 49 Q 470 42 478 42 Q 470 42 470 35 Z" />
    </g>

    {/* LAYER 1: Secondary Testimonial Card in Background */}
    <g transform="rotate(6 310 140)" filter="url(#reviews_softShadow)" opacity="0.85">
      <rect x="200" y="55" width="190" height="155" rx="16" fill="#FFFDF8" stroke="#ECDDC6" strokeWidth="1.2" />
      <circle cx="225" cy="80" r="12" fill="#E2E8F0" />
      <rect x="245" y="76" width="65" height="8" rx="4" fill="#CBD5E1" />
      <line x1="220" y1="105" x2="365" y2="105" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="220" y1="120" x2="345" y2="120" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* LAYER 2: Primary Crisp Testimonial Review Card */}
    <g transform="rotate(-4 245 125)" filter="url(#reviews_softShadow)">
      {/* Card Body (starts near y=25, reaches down to y=220) */}
      <rect x="145" y="24" width="215" height="186" rx="18" fill="#FFFFFF" stroke="#ECDDC6" strokeWidth="1.2" />

      {/* Student Profile Header */}
      <g transform="translate(162, 42)">
        {/* Avatar Circle with Gold Border */}
        <circle cx="18" cy="18" r="18" fill="url(#reviews_navyGrad)" />
        <circle cx="18" cy="18" r="17" fill="none" stroke="url(#reviews_gold3D_1)" strokeWidth="1.5" />
        <circle cx="18" cy="14" r="6" fill="#F4B942" />
        <path d="M 9 29 C 9 23 13 21 18 21 C 23 21 27 23 27 29 Z" fill="#F4B942" />

        {/* Student Meta Details */}
        <rect x="46" y="8" width="65" height="7" rx="3.5" fill="#0F172A" />
        <rect x="46" y="20" width="48" height="5" rx="2.5" fill="#9C6B2E" opacity="0.8" />

        {/* 5 Dimensional Golden Stars inside Header */}
        <g transform="translate(118, 10)">
          {[0, 14, 28, 42, 56].map((offset, idx) => (
            <path
              key={idx}
              d={`M ${offset + 6} 0 L ${offset + 7.8} 4 L ${offset + 12} 4.6 L ${offset + 9} 7.5 L ${offset + 9.8} 12 L ${offset + 6} 9.8 L ${offset + 2.2} 12 L ${offset + 3} 7.5 L ${offset} 4.6 L ${offset + 4.2} 4 Z`}
              fill="url(#reviews_gold3D_1)"
              stroke="#C98616"
              strokeWidth="0.5"
            />
          ))}
        </g>
      </g>

      {/* Realistic Review Feedback Text Lines */}
      <line x1="166" y1="98" x2="340" y2="98" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="166" y1="114" x2="325" y2="114" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="166" y1="130" x2="285" y2="130" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Refined Gold Pill: Verified Student Review */}
      <g transform="translate(162, 156)">
        <rect x="0" y="0" width="180" height="25" rx="12.5" fill="#FAF6EE" stroke="#ECDDC6" strokeWidth="1" />
        <circle cx="12.5" cy="12.5" r="5" fill="#D97706" />
        <path d="M 10 12.5 L 11.7 14.2 L 15 10.8" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="23" y="15.5" fill="#9C6B2E" fontSize="8" fontWeight="800" letterSpacing="0.25" fontFamily="sans-serif">
          VERIFIED STUDENT REVIEW
        </text>
      </g>
    </g>

    {/* LAYER 3: Large 3D Faceted Golden Star Trophy (Upper Right, top point reaches near y=8) */}
    <g transform="translate(370, 8)" filter="url(#reviews_softShadow)">
      {/* Subtle Star Ambient Glow */}
      <circle cx="55" cy="55" r="48" fill="#FDE6B0" opacity="0.4" />

      {/* 3D Faceted 5-Point Star */}
      <polygon points="55,55 55,8 70,38" fill="#FFEAA8" />
      <polygon points="55,55 55,8 40,38" fill="#F5B942" />

      <polygon points="55,55 102,42 74,64" fill="#F5B942" />
      <polygon points="55,55 102,42 70,38" fill="#FFEAA8" />

      <polygon points="55,55 84,97 55,75" fill="#C98616" />
      <polygon points="55,55 84,97 74,64" fill="#EAB338" />

      <polygon points="55,55 26,97 36,64" fill="#C98616" />
      <polygon points="55,55 26,97 55,75" fill="#9C640C" />

      <polygon points="55,55 8,42 40,38" fill="#FFEAA8" />
      <polygon points="55,55 8,42 36,64" fill="#EAB338" />

      {/* Star Crisp Edge Contour */}
      <polygon
        points="55,8 70,38 102,42 74,64 84,97 55,75 26,97 36,64 8,42 40,38"
        fill="none"
        stroke="#B47818"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </g>

    {/* LAYER 4: Prestigious Aurum Rating Seal (Lower Right, touches bottom y=240, reaches x=495) */}
    <g transform="translate(376, 116)" filter="url(#reviews_softShadow)">
      {/* Silk Ribbon Tails hanging flush to y=240 */}
      <path d="M 34 65 L 22 124 L 42 112 L 52 124 L 48 65 Z" fill="#9C6B2E" />
      <path d="M 52 65 L 62 124 L 76 112 L 86 124 L 74 65 Z" fill="#B47818" />

      {/* Outer Scalloped Gold Medallion Rim */}
      <circle cx="54" cy="54" r="46" fill="url(#reviews_gold3D_1)" stroke="#B47818" strokeWidth="1.8" />
      <circle cx="54" cy="54" r="40" fill="#FFFFFF" />
      <circle cx="54" cy="54" r="36" fill="url(#reviews_navyGrad)" />

      {/* Rating Inside Medallion */}
      <path
        d="M 54 28 L 56.5 33 L 61 33.5 L 57.5 37 L 58.5 42 L 54 39.5 L 49.5 42 L 50.5 37 L 47 33.5 L 51.5 33 Z"
        fill="#F59E0B"
      />
      <text x="54" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="19" fontWeight="900" fontFamily="sans-serif">
        5.0
      </text>
      <text x="54" y="73" textAnchor="middle" fill="#F4B942" fontSize="8" fontWeight="800" letterSpacing="1.2" fontFamily="sans-serif">
        RATING
      </text>
    </g>
  </svg>
);

/**
 * 8. EnquiriesBannerIllustration
 * Official admissions consultation portfolio, formal student inquiry sheet,
 * launching 3D gold origami airplane, navy dialog bubble, and executive fountain pen.
 * Fitted flush with NO spaces in top, right, or bottom.
 */
export const EnquiriesBannerIllustration = ({ className = "w-full h-full block" }) => (
  <svg
    viewBox="0 0 500 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMaxYMax slice"
  >
    <CommonIllustrationDefs idPrefix="enquiries" />

    {/* Background Warm Organic Shapes touching (500, 0) top right and (500, 240) bottom right */}
    <path
      d="M 40 240 C 110 150, 170 80, 270 40 C 360 4, 430 0, 500 0 L 500 240 Z"
      fill="url(#enquiries_warmAmberSoft)"
    />
    <path
      d="M 140 240 C 200 160, 270 100, 360 60 C 430 30, 480 15, 500 10 L 500 240 Z"
      fill="url(#enquiries_warmGoldGrad)"
    />

    {/* Modern 3D Golden Origami Airplane launching into top-right (reaches near top edge y=8 and right edge x=495) */}
    <path
      d="M 330 115 C 360 80, 390 45, 430 30"
      fill="none"
      stroke="#EAB338"
      strokeWidth="1.8"
      strokeDasharray="4 4"
      opacity="0.8"
    />
    <g transform="translate(405, 8) rotate(18)" filter="url(#enquiries_softShadow)">
      <polygon points="10,48 72,10 48,80 36,52" fill="url(#enquiries_goldClipGrad)" stroke="#B47818" strokeWidth="1.2" />
      <polygon points="10,48 36,52 72,10" fill="#FFEAA8" />
      <polygon points="36,52 42,72 48,62" fill="#9C640C" />
    </g>

    {/* LAYER 1: Background Dossier Folder / Consultation Portfolio */}
    <g transform="rotate(6 295 130)" filter="url(#enquiries_softShadow)" opacity="0.9">
      <rect x="195" y="55" width="190" height="165" rx="14" fill="#FAF1DF" stroke="#ECDDC6" strokeWidth="1.2" />
      <rect x="215" y="70" width="85" height="7" rx="3.5" fill="#ECDDC6" />
      <line x1="215" y1="94" x2="355" y2="94" stroke="#ECDDC6" strokeWidth="2" strokeLinecap="round" />
      <line x1="215" y1="108" x2="330" y2="108" stroke="#ECDDC6" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* LAYER 2: Primary Official Admission Enquiry Sheet */}
    <g transform="rotate(-3 245 125)" filter="url(#enquiries_softShadow)">
      {/* Clean White Sheet (reaches near top y=22) */}
      <rect x="145" y="22" width="210" height="190" rx="16" fill="#FFFFFF" stroke="#ECDDC6" strokeWidth="1.2" />

      {/* Top Header Strip with Aurum Dark Navy & Gold */}
      <path d="M 145 38 C 145 29 152 22 161 22 L 339 22 C 348 22 355 29 355 38 L 355 60 L 145 60 Z" fill="url(#enquiries_navyGrad)" />

      {/* Header Title Text & Gold Dot */}
      <circle cx="165" cy="41" r="4.5" fill="url(#enquiries_goldClipGrad)" />
      <text x="178" y="45" fill="#FDE6B0" fontSize="9.5" fontWeight="800" letterSpacing="0.8" fontFamily="sans-serif">
        STUDENT ADMISSION ENQUIRY
      </text>

      {/* Subject & Query Fields inside Card */}
      <g transform="translate(165, 74)">
        {/* Field 1: Category Tag */}
        <rect x="0" y="0" width="76" height="18" rx="9" fill="#FAF6EE" stroke="#ECDDC6" strokeWidth="0.8" />
        <text x="38" y="12.5" textAnchor="middle" fill="#9C6B2E" fontSize="8" fontWeight="700">COURSE INFO</text>

        {/* Field 2: Direct Desk Pill */}
        <rect x="82" y="0" width="68" height="18" rx="9" fill="#FAF6EE" stroke="#ECDDC6" strokeWidth="0.8" />
        <text x="116" y="12.5" textAnchor="middle" fill="#5C5549" fontSize="8" fontWeight="600">DIRECT DESK</text>

        {/* Inquiry Content Lines */}
        <line x1="0" y1="34" x2="170" y2="34" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="0" y1="48" x2="158" y2="48" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="0" y1="62" x2="164" y2="62" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="0" y1="76" x2="125" y2="76" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />

        {/* Fast Resolution Counseling Badge */}
        <g transform="translate(0, 94)">
          <rect x="0" y="0" width="170" height="28" rx="14" fill="#FAF6EE" stroke="#ECDDC6" strokeWidth="1" />
          <circle cx="14" cy="14" r="6.5" fill="#D97706" />
          <path d="M 14 9.5 L 15.4 12.6 L 18.5 14 L 15.4 15.4 L 14 18.5 L 12.6 15.4 L 9.5 14 L 12.6 12.6 Z" fill="#FFFFFF" />
          <text x="28" y="18" fill="#9C6B2E" fontSize="8.5" fontWeight="800" letterSpacing="0.4" fontFamily="sans-serif">
            OFFICIAL COUNSELING TEAM
          </text>
        </g>
      </g>
    </g>

    {/* LAYER 3: Elegant Consultation Speech Bubble */}
    <g transform="translate(348, 62)" filter="url(#enquiries_softShadow)">
      <rect x="0" y="0" width="118" height="56" rx="18" fill="url(#enquiries_navyGrad)" stroke="#334155" strokeWidth="1" />
      <polygon points="20,54 10,70 30,54" fill="#0F172A" />
      <circle cx="24" cy="28" r="11" fill="url(#enquiries_goldClipGrad)" />
      <text x="24" y="33" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="900">?</text>
      <rect x="44" y="20" width="60" height="6" rx="3" fill="#FFFFFF" />
      <rect x="44" y="30" width="46" height="5" rx="2.5" fill="#94A3B8" />
    </g>

    {/* LAYER 4: Sleek Executive Fountain Pen Resting at Bottom (Grounds the banner flush at y=240, reaches x=495) */}
    <g transform="translate(325, 185) rotate(-6)" filter="url(#enquiries_softShadow)">
      {/* Pen Barrel */}
      <rect x="25" y="12" width="145" height="16" rx="8" fill="url(#enquiries_penGrad)" stroke="#0F172A" strokeWidth="1" />

      {/* Gold Accent Rings */}
      <rect x="48" y="12" width="6" height="16" fill="url(#enquiries_goldClipGrad)" />
      <rect x="145" y="12" width="5" height="16" fill="url(#enquiries_goldClipGrad)" />

      {/* Gold Pocket Clip */}
      <rect x="52" y="8" width="42" height="3.5" rx="1.75" fill="url(#enquiries_goldClipGrad)" />
      <circle cx="94" cy="9.75" r="3" fill="url(#enquiries_goldClipGrad)" />

      {/* Pen Nib (Gold) */}
      <polygon points="25,13 6,20 25,27" fill="url(#enquiries_goldClipGrad)" stroke="#B47818" strokeWidth="1" />
      <line x1="25" y1="20" x2="10" y2="20" stroke="#9C640C" strokeWidth="1" />
      <circle cx="17" cy="20" r="1.5" fill="#0F172A" />
    </g>
  </svg>
);
