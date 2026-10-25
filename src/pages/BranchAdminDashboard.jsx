import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRoundCog,
  Users,
  Wallet,
  Menu,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getBranchAdminDashboardApi } from "../services/branchadmindashboard";

/* Same display-font pairing used across the branch admin pages
   (Fraunces headings, Inter body). No-op if already injected. */
const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

/* Page-scoped keyframes. Motion is disabled for users who prefer reduced motion. */
const PAGE_CSS = `
@keyframes ba-rise { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ba-toast { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ba-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes ba-wave { 0%,100% { transform: rotate(0); } 15% { transform: rotate(16deg); } 30% { transform: rotate(-8deg); } 45% { transform: rotate(14deg); } 60% { transform: rotate(-4deg); } }
@keyframes ba-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes ba-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ba-drift {
  0%   { transform: translate(0,0) scale(1); }
  50%  { transform: translate(-18px,14px) scale(1.15); }
  100% { transform: translate(0,0) scale(1); }
}
.ba-rise  { opacity: 0; animation: ba-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-toast { animation: ba-toast .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-wave  { display: inline-block; transform-origin: 70% 80%; animation: ba-wave 2.2s ease-in-out infinite; }
.ba-grow  { transform-origin: left; animation: ba-grow 1.1s cubic-bezier(.2,.7,.2,1) .6s both; }
.ba-drift { animation: ba-drift 9s ease-in-out infinite; }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}

/* Cards: lift on hover, a light sheen sweeps across, icon floats */
.ba-card {
  position: relative; overflow: hidden;
  transition: box-shadow .3s ease, border-color .3s ease, transform .3s ease;
}
.ba-card::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, transparent 35%, rgba(244,185,66,.16) 50%, transparent 65%);
  transform: translateX(-120%); transition: transform .9s cubic-bezier(.2,.7,.2,1);
}
.ba-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 16px 36px -20px rgba(23,20,15,.32);
  transform: translateY(-4px);
}
.ba-card:hover::after { transform: translateX(120%); }
.ba-card:hover .ba-icon { animation: ba-float 1.6s ease-in-out infinite; }

.ba-press { transition: transform .15s ease, border-color .2s ease, background-color .2s ease; }
.ba-press:hover { transform: translateY(-2px); }
.ba-press:active { transform: translateY(0) scale(.98); }
.ba-arrow { transition: transform .25s ease; }
.ba-press:hover .ba-arrow { transform: translate(3px,-3px); }

/* Table styles */
.ba-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.ba-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.ba-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8a8175;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e3ddd0;
  white-space: nowrap;
}
.ba-table td {
  font-size: 0.875rem;
  color: #1c1a17;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f1ede4;
  white-space: nowrap;
}
.ba-table tbody tr {
  transition: background-color .2s ease;
}
.ba-table tbody tr:hover {
  background-color: #faf8f4;
}
.ba-table tbody tr:last-child td {
  border-bottom: none;
}

@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-toast, .ba-skeleton, .ba-wave, .ba-grow, .ba-drift { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-press, .ba-arrow, .ba-card::after { transition: none !important; }
  .ba-card:hover, .ba-press:hover { transform: none; }
  .ba-card:hover .ba-icon { animation: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

/* Counts up from 0 to the target on first render. Skips motion if the user prefers reduced motion. */
const useCountUp = (target, duration = 1100) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const end = Number(target || 0);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
};

const CountUp = ({ value, currency }) => {
  const animated = useCountUp(value);
  return <>{currency ? formatCurrency(animated) : animated.toLocaleString("en-IN")}</>;
};

/* ── 10 Custom 3D-styled Watermark Graphics Matching the Screenshot ── */
const Books3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="blue-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="book-blue-pages" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dbeafe" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#blue-card-glow)" />
    {/* Book 1 (Bottom) */}
    <g transform="translate(15, 38)">
      <polygon points="12,18 42,32 82,14 52,0" fill="#2563eb" />
      <polygon points="42,32 82,14 82,22 42,40" fill="url(#book-blue-pages)" />
      <polygon points="12,18 42,32 42,40 12,26" fill="#1d4ed8" />
    </g>
    {/* Book 2 (Middle) */}
    <g transform="translate(18, 26)">
      <polygon points="12,18 42,32 82,14 52,0" fill="#3b82f6" />
      <polygon points="42,32 82,14 82,22 42,40" fill="url(#book-blue-pages)" />
      <polygon points="12,18 42,32 42,40 12,26" fill="#2563eb" />
    </g>
    {/* Book 3 (Top) */}
    <g transform="translate(20, 14)">
      <polygon points="12,18 42,32 82,14 52,0" fill="#60a5fa" />
      <polygon points="42,32 82,14 82,22 42,40" fill="url(#book-blue-pages)" />
      <polygon points="12,18 42,32 42,40 12,26" fill="#3b82f6" />
      <line x1="22" y1="19" x2="48" y2="31" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.8" />
    </g>
  </svg>
);

const Students3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="purple-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="purple-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c4b5fd" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="purple-side-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ddd6fe" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#purple-card-glow)" />
    <g transform="translate(18, 30)">
      <circle cx="12" cy="10" r="7" fill="url(#purple-side-body)" />
      <path d="M0 36 C 0 22, 5 18, 12 18 C 19 18, 24 22, 24 36 Z" fill="url(#purple-side-body)" />
    </g>
    <g transform="translate(56, 30)">
      <circle cx="12" cy="10" r="7" fill="url(#purple-side-body)" />
      <path d="M0 36 C 0 22, 5 18, 12 18 C 19 18, 24 22, 24 36 Z" fill="url(#purple-side-body)" />
    </g>
    <g transform="translate(34, 18)">
      <circle cx="16" cy="12" r="9.5" fill="url(#purple-body)" />
      <path d="M0 48 C 0 30, 7 24, 16 24 C 25 24, 32 30, 32 48 Z" fill="url(#purple-body)" />
    </g>
  </svg>
);

const Enrollments3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="green-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="clipboard-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d1fae5" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#green-card-glow)" />
    <g transform="translate(36, 12)">
      <rect x="0" y="8" width="46" height="58" rx="8" fill="url(#clipboard-bg)" stroke="#a7f3d0" strokeWidth="1.5" />
      <rect x="14" y="4" width="18" height="8" rx="3" fill="#34d399" />
      <rect x="18" y="7" width="10" height="2" rx="1" fill="#ffffff" />
      <line x1="10" y1="22" x2="36" y2="22" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="30" x2="30" y2="30" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="38" x2="26" y2="38" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="36" cy="52" r="11" fill="#10b981" />
      <circle cx="36" cy="52" r="11" stroke="#ffffff" strokeWidth="2" />
      <path d="M31 52 L 34.5 55.5 L 41.5 48.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const Staff3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="orange-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="orange-team" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fb923c" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#orange-card-glow)" />
    <g transform="translate(18, 22)">
      <circle cx="16" cy="14" r="7.5" fill="url(#orange-team)" fillOpacity="0.75" />
      <path d="M4 38 C 4 24, 9 20, 16 20 C 23 20, 28 24, 28 38 Z" fill="url(#orange-team)" fillOpacity="0.75" />
      <circle cx="44" cy="14" r="7.5" fill="url(#orange-team)" fillOpacity="0.75" />
      <path d="M32 38 C 32 24, 37 20, 44 20 C 51 20, 56 24, 56 38 Z" fill="url(#orange-team)" fillOpacity="0.75" />
      <circle cx="30" cy="10" r="9" fill="url(#orange-team)" />
      <path d="M14 44 C 14 26, 21 21, 30 21 C 39 21, 46 26, 46 44 Z" fill="url(#orange-team)" />
      <rect x="22" y="32" width="16" height="22" rx="3" fill="#ffedd5" stroke="#f97316" strokeWidth="1.2" />
      <line x1="25" y1="37" x2="35" y2="37" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="42" x2="32" y2="42" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="30" cy="48" r="2" fill="#f97316" />
    </g>
  </svg>
);

const TodayEnrollments3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="teal-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cal-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ccfbf1" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#teal-card-glow)" />
    <g transform="translate(34, 14)">
      <rect x="0" y="8" width="46" height="50" rx="8" fill="url(#cal-bg)" stroke="#99f6e4" strokeWidth="1.5" />
      <rect x="0" y="8" width="46" height="12" rx="8" fill="#2dd4bf" />
      <rect x="0" y="16" width="46" height="4" fill="#2dd4bf" />
      <rect x="8" y="4" width="4" height="7" rx="2" fill="#0f766e" />
      <rect x="34" y="4" width="4" height="7" rx="2" fill="#0f766e" />
      <circle cx="12" cy="28" r="2" fill="#5eead4" />
      <circle cx="23" cy="28" r="2" fill="#5eead4" />
      <circle cx="34" cy="28" r="2" fill="#5eead4" />
      <circle cx="12" cy="38" r="2" fill="#5eead4" />
      <circle cx="23" cy="38" r="2" fill="#5eead4" />
      <circle cx="38" cy="48" r="11" fill="#0d9488" />
      <circle cx="38" cy="48" r="11" stroke="#ffffff" strokeWidth="2" />
      <path d="M38 43 V 53 M33 48 H 43" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

const NewStudents3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="rose-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rose-user-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#rose-card-glow)" />
    <g transform="translate(30, 16)">
      <circle cx="22" cy="14" r="11" fill="url(#rose-user-grad)" />
      <path d="M2 54 C 2 34, 11 26, 22 26 C 33 26, 42 34, 42 54 Z" fill="url(#rose-user-grad)" />
      <circle cx="36" cy="42" r="9" fill="#e11d48" />
      <circle cx="36" cy="42" r="9" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M36 38 V 46 M32 42 H 40" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);

const FullyPaid3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="amber-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="gold-coin-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#amber-card-glow)" />
    <g transform="translate(36, 16)">
      <ellipse cx="20" cy="46" rx="16" ry="6" fill="#b45309" />
      <path d="M4 42 C 4 45.3, 11.2 48, 20 48 C 28.8 48, 36 45.3, 36 42 V 46 C 36 49.3, 28.8 52, 20 52 C 11.2 52, 4 49.3, 4 46 Z" fill="url(#gold-coin-grad)" />
      <path d="M4 34 C 4 37.3, 11.2 40, 20 40 C 28.8 40, 36 37.3, 36 34 V 38 C 36 41.3, 28.8 44, 20 44 C 11.2 44, 4 41.3, 4 38 Z" fill="url(#gold-coin-grad)" />
      <path d="M4 26 C 4 29.3, 11.2 32, 20 32 C 28.8 32, 36 29.3, 36 26 V 30 C 36 33.3, 28.8 36, 20 36 C 11.2 36, 4 33.3, 4 30 Z" fill="url(#gold-coin-grad)" />
      <ellipse cx="20" cy="22" rx="16" ry="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <ellipse cx="20" cy="22" rx="11" ry="4" stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 1" />
      <circle cx="34" cy="46" r="10" fill="#d97706" />
      <circle cx="34" cy="46" r="10" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M29.5 46 L 32.5 49 L 38.5 43" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const Balance3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="emerald-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cash-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ecfdf5" />
        <stop offset="100%" stopColor="#a7f3d0" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#emerald-card-glow)" />
    <g transform="translate(24, 22)">
      <rect x="8" y="0" width="50" height="32" rx="5" fill="#a7f3d0" stroke="#34d399" strokeWidth="1.2" transform="rotate(-5 8 0)" />
      <rect x="4" y="8" width="50" height="32" rx="5" fill="url(#cash-grad)" stroke="#10b981" strokeWidth="1.4" />
      <rect x="8" y="12" width="42" height="24" rx="3" stroke="#34d399" strokeWidth="0.8" strokeDasharray="3 1.5" fill="none" />
      <circle cx="29" cy="24" r="6" stroke="#059669" strokeWidth="1.2" fill="#ecfdf5" />
      <text x="26.5" y="27.5" fill="#059669" fontSize="10" fontWeight="bold">₹</text>
      <circle cx="52" cy="10" r="5" fill="#ef4444" />
      <circle cx="52" cy="10" r="5" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

const DueStudents3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="red-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="invoice-red-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fee2e2" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#red-card-glow)" />
    <g transform="translate(36, 12)">
      <rect x="0" y="4" width="44" height="58" rx="6" fill="url(#invoice-red-bg)" stroke="#fca5a5" strokeWidth="1.5" />
      <rect x="6" y="10" width="22" height="4" rx="2" fill="#ef4444" fillOpacity="0.6" />
      <line x1="6" y1="20" x2="34" y2="20" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="28" x2="38" y2="28" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="36" x2="26" y2="36" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="50" r="11" fill="#dc2626" />
      <circle cx="36" cy="50" r="11" stroke="#ffffff" strokeWidth="2" />
      <text x="33.5" y="55" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">!</text>
    </g>
  </svg>
);

const DueInstallments3DGraphic = () => (
  <svg className="w-[74px] h-[66px] sm:w-[84px] sm:h-[76px]" viewBox="0 0 100 90" fill="none">
    <defs>
      <radialGradient id="violet-card-glow" cx="80%" cy="80%" r="65%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="invoice-purple-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ede9fe" />
      </linearGradient>
    </defs>
    <ellipse cx="65" cy="55" rx="35" ry="30" fill="url(#violet-card-glow)" />
    <g transform="translate(36, 12)">
      <rect x="0" y="4" width="44" height="58" rx="6" fill="url(#invoice-purple-bg)" stroke="#c4b5fd" strokeWidth="1.5" />
      <rect x="6" y="10" width="20" height="4" rx="2" fill="#8b5cf6" fillOpacity="0.6" />
      <line x1="6" y1="20" x2="34" y2="20" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="28" x2="30" y2="28" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="36" x2="24" y2="36" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="50" r="11" fill="#7c3aed" />
      <circle cx="36" cy="50" r="11" stroke="#ffffff" strokeWidth="2" />
      <text x="32" y="55" fill="#ffffff" fontSize="13" fontWeight="bold">₹</text>
    </g>
  </svg>
);

/* 10 overview statistic cards mapped to overview.* fields */
const OVERVIEW_METRICS = [
  {
    key: "total_courses",
    label: "Total Courses",
    helper: "Programs managed",
    icon: BookOpen,
    iconBg: "bg-blue-50/90 text-blue-600 border border-blue-200/60",
    gradient: "from-white via-white to-blue-50/50",
    Graphic: Books3DGraphic,
  },
  {
    key: "total_students",
    label: "Total Students",
    helper: "Learners in your branch",
    icon: Users,
    iconBg: "bg-purple-50/90 text-purple-600 border border-purple-200/60",
    gradient: "from-white via-white to-purple-50/50",
    Graphic: Students3DGraphic,
  },
  {
    key: "total_enrollments",
    label: "Total Enrollments",
    helper: "All enrollments",
    icon: ClipboardList,
    iconBg: "bg-emerald-50/90 text-emerald-600 border border-emerald-200/60",
    gradient: "from-white via-white to-emerald-50/50",
    Graphic: Enrollments3DGraphic,
  },
  {
    key: "total_staff",
    label: "Total Staff",
    helper: "Active branch team",
    icon: UserRoundCog,
    iconBg: "bg-orange-50/90 text-orange-600 border border-orange-200/60",
    gradient: "from-white via-white to-orange-50/50",
    Graphic: Staff3DGraphic,
  },
  {
    key: "today_enrollments",
    label: "Today's Enrollments",
    helper: "Enrolled today",
    icon: CalendarPlus,
    iconBg: "bg-teal-50/90 text-teal-600 border border-teal-200/60",
    gradient: "from-white via-white to-teal-50/50",
    Graphic: TodayEnrollments3DGraphic,
  },
  {
    key: "today_new_students",
    label: "Today's New Students",
    helper: "Registered today",
    icon: UserPlus,
    iconBg: "bg-rose-50/90 text-rose-600 border border-rose-200/60",
    gradient: "from-white via-white to-rose-50/50",
    Graphic: NewStudents3DGraphic,
  },
  {
    key: "fully_paid_students",
    label: "Fully Paid Students",
    helper: "Completed payments",
    icon: Wallet,
    iconBg: "bg-amber-50/90 text-amber-600 border border-amber-200/60",
    gradient: "from-white via-white to-amber-50/50",
    Graphic: FullyPaid3DGraphic,
  },
  {
    key: "students_with_balance",
    label: "Students With Balance",
    helper: "Partial payments",
    icon: Wallet,
    iconBg: "bg-emerald-50/90 text-emerald-600 border border-emerald-200/60",
    gradient: "from-white via-white to-emerald-50/50",
    Graphic: Balance3DGraphic,
  },
  {
    key: "due_students",
    label: "Due Students",
    helper: "Awaiting payment",
    icon: Clock,
    iconBg: "bg-red-50/90 text-red-600 border border-red-200/60",
    gradient: "from-white via-white to-red-50/50",
    Graphic: DueStudents3DGraphic,
  },
  {
    key: "due_installments",
    label: "Due Installments",
    helper: "Pending installments",
    icon: IndianRupee,
    iconBg: "bg-indigo-50/90 text-indigo-600 border border-indigo-200/60",
    gradient: "from-white via-white to-indigo-50/50",
    Graphic: DueInstallments3DGraphic,
  },
];

const ACTIONS = [
  { label: "Manage courses", path: "/branch-admin/courses", icon: BookOpen },
  { label: "View students", path: "/branch-admin/enrollments", icon: Users },
  { label: "Manage staff", path: "/branch-admin/staff", icon: UserRoundCog },
  { label: "Course approvals", path: "/branch-admin/purchases", icon: CheckCircle2 },
  { label: "Course enrollments", path: "/branch-admin/course-enrollments", icon: Users },
  { label: "Branch profit", path: "/branch-admin/profit", icon: TrendingUp },
];

const SkeletonView = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
    <div className="ba-skeleton h-24 w-2/3 rounded-2xl" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
          <div className="ba-skeleton h-3 w-24 rounded" />
          <div className="ba-skeleton mt-4 h-9 w-20 rounded" />
          <div className="ba-skeleton mt-4 h-3 w-32 rounded" />
        </div>
      ))}
    </div>
    <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
      <div className="ba-skeleton h-5 w-56 rounded" />
      <div className="ba-skeleton mt-6 h-40 w-full rounded-xl" />
    </div>
  </div>
);

/* Course enrollment table columns */
const ENROLLMENT_COLUMNS = [
  { key: "course_title",          label: "Course" },
  { key: "total_enrollments",     label: "Total Enrollments" },
  { key: "total_students",        label: "Total Students" },
  { key: "students_with_payment", label: "Students With Payment" },
  { key: "fully_paid_students",   label: "Fully Paid Students" },
  { key: "students_with_balance", label: "Students With Balance" },
];

const BranchAdminDashboard = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError("");
        const data = await getBranchAdminDashboardApi(token);
        if (isMounted) setDashboard(data);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load branch dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const displayName = user?.name || "Branch admin";
  const branchName = dashboard?.branch_name || "Your branch";
  const overview = dashboard?.overview || {};
  const courseEnrollments = dashboard?.course_enrollments || [];
  const dueStudents = dashboard?.due_students || [];

  return (
    <div
      className="branch-dashboard-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={() => navigate("/branch-admin/courses", { state: { openCreate: true } })}
        activePage="dashboard"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header (Matching Student Dashboard length & structure) ---- */}
        <header
          className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-xl bg-[#faf8f4] border border-[#e3ddd0] p-2 text-[#17140f] hover:bg-[#f1ede4] transition md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Dashboard
              </h2>
            </div>
            {branchName && (
              <span
                className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: "#f1ede4", color: "#825a25", border: "1px solid #e3ddd0" }}
              >
                <Building2 className="h-3 w-3" />
                {branchName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {branchName || "Branch Administrator"}
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1580px] space-y-8 px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div
              role="alert"
              className="ba-toast rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}

          {loading && <SkeletonView />}

          {!loading && !error && dashboard && (
            <>
              {/* ── Welcome Header Banner (Warm Light Theme - Matching Super Admin Portal) ── */}
              <div className="ba-rise bg-white rounded-3xl p-5 sm:p-6 border border-[#E3DDD0] shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Soft warm background gradient glow */}
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#FAF8F4] via-[#F1EDE4]/50 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight flex items-center gap-1.5">
                      <span>Welcome back, {displayName}</span>
                      <span className="ba-wave inline-block select-none text-xl sm:text-2xl">👋</span>
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                      <Building2 className="h-3 w-3 text-[#9C6B2E]" />
                      Branch Portal
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#5B5346] font-medium">
                    Here's an overview of what's happening at{" "}
                    <span className="font-semibold text-[#17140F]">{branchName}</span> today.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-[#F1EDE4] text-[11px] text-[#8A8175]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#17140F]">
                      <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                      <span>{branchName}</span>
                    </span>
                    {dashboard.branch_location && (
                      <>
                        <span className="text-[#D9D0C1]">•</span>
                        <span className="flex items-center gap-1 font-medium text-[#5B5346]">
                          <MapPin className="h-3.5 w-3.5 text-[#9C6B2E]" />
                          <span>{dashboard.branch_location}</span>
                        </span>
                      </>
                    )}
                    <span className="text-[#D9D0C1]">•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Branch Active
                    </span>
                  </div>
                </div>

                {/* 3D-styled Branch Admin Animated Emblem (Building & Academy in Warm Gold Theme) */}
                <div className="hidden sm:flex items-center justify-center shrink-0 pr-2 sm:pr-4 relative z-10">
                  <div className="relative flex items-center justify-center group cursor-default">
                    {/* Floating decorative elements in warm amber & gold theme */}
                    <div
                      className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-gradient-to-tr from-[#9C6B2E] to-[#F4B942] shadow-md shadow-[#9C6B2E]/40 animate-bounce flex items-center justify-center text-white"
                      title="Branch Academy"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-white stroke-[2.3]" />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#F4B942] shadow-md shadow-[#F4B942]/30 animate-pulse" />
                    <div className="absolute top-1/2 -right-4 h-5 w-5 rounded-full bg-[#9C6B2E] shadow-md shadow-[#9C6B2E]/30 flex items-center justify-center text-[10px] font-black text-white">
                      ★
                    </div>

                    {/* Center Floating Branch Admin Emblem */}
                    <div className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FAF8F4] via-[#F1EDE4] to-[#FAF8F4] backdrop-blur-md border border-[#E3DDD0] shadow-lg shadow-[#9C6B2E]/10 transform hover:rotate-3 hover:scale-105 transition-all duration-300">
                      <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-[#9C6B2E] drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- Overview Section Header ---- */}
              <section className="ba-rise" style={{ animationDelay: "80ms" }}>
                <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                  Overview
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                  Key metrics at a glance for your branch.
                </p>
              </section>

              {/* ---- Overview Metric Cards (10 cards) ---- */}
              <section className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {OVERVIEW_METRICS.map(
                  ({ key, label, helper, icon: Icon, iconBg, gradient, Graphic }, index) => (
                    <article
                      key={key}
                      className={`ba-card ba-rise relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e3ddd0] p-4 sm:p-4.5 lg:p-5 shadow-xs bg-gradient-to-br ${gradient} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                      style={{
                        animationDelay: `${100 + index * 40}ms`,
                      }}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
                        <div
                          className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${iconBg} shadow-2xs`}
                        >
                          <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 leading-snug">
                            {label}
                          </p>
                          <p
                            className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900 leading-none tabular-nums"
                            style={{ ...serif, fontWeight: 500 }}
                          >
                            <CountUp value={overview[key]} />
                          </p>
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400 leading-snug">
                            {helper}
                          </p>
                        </div>
                      </div>

                      {/* 3D Illustrated Watermark Graphic */}
                      <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 pointer-events-none select-none z-0">
                        <Graphic />
                      </div>
                    </article>
                  )
                )}
              </section>

              {/* ---- Total Due Amount (highlighted monetary card) ---- */}
              <section
                className="ba-card ba-rise rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs border border-[#e3ddd0] relative overflow-hidden transition-all duration-300 hover:shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #FAF8F4 0%, #FFFFFF 55%, #F7F3EB 100%)",
                  animationDelay: "700ms",
                }}
              >
                {/* Soft warm accent background glow */}
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#FAF6EE] to-transparent pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <span
                      className="ba-icon flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 shadow-2xs border border-[#E3DDD0]"
                      style={{ background: "#F1EDE4", color: "#9C6B2E" }}
                    >
                      <IndianRupee className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="text-xs font-bold tracking-wider uppercase text-[#8A8175]">
                        Total Due Amount
                      </p>
                      <p
                        className="mt-1 text-3xl sm:text-4xl leading-none tabular-nums font-bold text-[#17140F]"
                        style={{ ...serif, fontWeight: 600 }}
                      >
                        <CountUp value={overview.total_due_amount} currency />
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-5 max-w-xs text-[#5B5346] font-medium">
                    Outstanding amount across all students with pending payments in your branch.
                  </p>
                </div>
              </section>

              {/* ---- Course Enrollment Overview Table ---- */}
              <section
                className="ba-rise rounded-2xl p-6 sm:p-7"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "780ms" }}
              >
                <div className="pb-5" style={{ borderBottom: "1px solid #e3ddd0" }}>
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Course Enrollment Overview
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Enrollment and payment breakdown per course.
                  </p>
                </div>

                {courseEnrollments.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full mb-4"
                      style={{ background: "#f1ede4", color: "#a39a8c" }}
                    >
                      <BookOpen className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium" style={{ color: "#5b5346" }}>
                      No course enrollment data available.
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "#a39a8c" }}>
                      Course data will appear here once enrollments are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="ba-table-wrap mt-5 rounded-xl" style={{ border: "1px solid #f1ede4" }}>
                    <table className="ba-table">
                      <thead>
                        <tr style={{ background: "#faf8f4" }}>
                          {ENROLLMENT_COLUMNS.map((col) => (
                            <th key={col.key}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {courseEnrollments.map((course) => (
                          <tr key={course.course_id}>
                            <td>
                              <span className="font-medium" style={{ color: "#17140f" }}>
                                {course.course_title}
                              </span>
                            </td>
                            <td>
                              <span
                                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                                style={{ background: "#eef0ff", color: "#6366f1" }}
                              >
                                {course.total_enrollments}
                              </span>
                            </td>
                            <td className="tabular-nums">{course.total_students}</td>
                            <td className="tabular-nums">{course.students_with_payment}</td>
                            <td>
                              <span
                                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                                style={{ background: "#eef2ea", color: "#5c7a5a" }}
                              >
                                {course.fully_paid_students}
                              </span>
                            </td>
                            <td>
                              <span
                                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                                style={{
                                  background: course.students_with_balance > 0 ? "#fef3c7" : "#f1ede4",
                                  color: course.students_with_balance > 0 ? "#d97706" : "#8a8175",
                                }}
                              >
                                {course.students_with_balance}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ---- Students With Pending Payments ---- */}
              <section
                className="ba-rise rounded-2xl p-6 sm:p-7"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "860ms" }}
              >
                <div className="pb-5" style={{ borderBottom: "1px solid #e3ddd0" }}>
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Students With Pending Payments
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Students who have outstanding dues or upcoming installments.
                  </p>
                </div>

                {dueStudents.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full mb-4"
                      style={{ background: "#eef2ea", color: "#5c7a5a" }}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium" style={{ color: "#5b5346" }}>
                      No students have pending payments.
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "#a39a8c" }}>
                      All students are up to date with their payments.
                    </p>
                  </div>
                ) : (
                  <div className="ba-table-wrap mt-5 rounded-xl" style={{ border: "1px solid #f1ede4" }}>
                    <table className="ba-table">
                      <thead>
                        <tr style={{ background: "#faf8f4" }}>
                          <th>#</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Course Title</th>
                          <th>Amount</th>
                          <th>Paid Amount</th>
                          <th>Remaining Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dueStudents.flatMap(student => {
                          const dues = student.due_enrollments || [];
                          if (dues.length === 0) {
                            return [{
                              id: `${student.student_id}-0`,
                              student_id: student.student_id,
                              name: student.name,
                              phone: student.phone,
                              course_title: "—",
                              amount: student.total_due_amount,
                              paid_amount: 0,
                              remaining_amount: student.total_due_amount,
                              due_date: "—",
                              status: "pending"
                            }];
                          }
                          return dues.flatMap(enr => {
                            const installs = enr.due_installments || [];
                            if (installs.length === 0) {
                               return [{
                                 id: `${student.student_id}-${enr.enrollment_id}-0`,
                                 student_id: student.student_id,
                                 name: student.name,
                                 phone: student.phone,
                                 course_title: enr.course_title,
                                 amount: "—",
                                 paid_amount: "—",
                                 remaining_amount: "—",
                                 due_date: "—",
                                 status: "pending"
                               }];
                            }
                            return installs.map(inst => ({
                              id: `${student.student_id}-${enr.enrollment_id}-${inst.installment_id || inst.installment_number}`,
                              student_id: student.student_id,
                              name: student.name,
                              phone: student.phone,
                              course_title: enr.course_title,
                              amount: inst.amount,
                              paid_amount: inst.paid_amount,
                              remaining_amount: inst.remaining_amount,
                              due_date: inst.due_date,
                              status: inst.status
                            }));
                          });
                        }).map((row, index) => (
                          <tr key={row.id}>
                            <td className="tabular-nums font-medium" style={{ color: "#a39a8c" }}>{index + 1}</td>
                            <td>{row.name || "—"}</td>
                            <td className="tabular-nums">{row.phone || "—"}</td>
                            <td><span className="font-medium" style={{ color: "#17140f" }}>{row.course_title || "—"}</span></td>
                            <td className="tabular-nums font-medium" style={{ color: "#17140f" }}>
                              {row.amount !== "—" ? formatCurrency(row.amount) : "—"}
                            </td>
                            <td className="tabular-nums font-medium" style={{ color: "#5c7a5a" }}>
                              {row.paid_amount !== "—" ? formatCurrency(row.paid_amount) : "—"}
                            </td>
                            <td className="tabular-nums font-medium" style={{ color: "#a24a3a" }}>
                              {row.remaining_amount !== "—" ? formatCurrency(row.remaining_amount) : "—"}
                            </td>
                            <td className="tabular-nums">{row.due_date || "—"}</td>
                            <td>
                              <span
                                className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  background: row.status?.toLowerCase() === "pending" ? "#fef3c7" : "#eef2ea",
                                  color: row.status?.toLowerCase() === "pending" ? "#d97706" : "#5c7a5a",
                                }}
                              >
                                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ---- Quick actions ---- */}
              <section
                className="ba-rise rounded-2xl p-6 sm:p-7"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "940ms" }}
              >
                <div className="pb-5" style={{ borderBottom: "1px solid #e3ddd0" }}>
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Manage your branch
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>Jump straight to the work.</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ACTIONS.map(({ label, path, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigate(path)}
                      className={`ba-press flex items-center justify-between gap-3 rounded-xl p-4 text-left text-sm font-medium hover:border-[#9c6b2e] hover:bg-[#faf8f4] ${FOCUS_RING}`}
                      style={{ border: "1px solid #e3ddd0", color: "#17140f", background: "#ffffff" }}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                        {label}
                      </span>
                      <ArrowUpRight className="ba-arrow h-4 w-4" style={{ color: "#a39a8c" }} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchAdminDashboard;