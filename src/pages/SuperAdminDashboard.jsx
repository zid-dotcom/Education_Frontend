import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Building2, CalendarCheck, GraduationCap, IndianRupee,
  Loader2, MessageCircle, RefreshCw, ShoppingCart, TrendingUp, UserPlus, Users,
  CheckCircle, Clock, KeyRound, Wallet, X, Layers, Crown, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminDashboardOverviewApi } from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .4s ease both; }
.sa-fade { animation: sa-fade .3s ease both; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);

/* Background watermark graphics matching exact design */
const BarsGraphic = ({ color }) => (
  <svg className="w-16 h-12" viewBox="0 0 64 48" fill="none">
    <rect x="6" y="28" width="9" height="20" rx="3" fill={color} fillOpacity="0.14" />
    <rect x="20" y="20" width="9" height="28" rx="3" fill={color} fillOpacity="0.19" />
    <rect x="34" y="12" width="9" height="36" rx="3" fill={color} fillOpacity="0.25" />
    <rect x="48" y="4" width="9" height="44" rx="3" fill={color} fillOpacity="0.32" />
  </svg>
);

const WaveGraphic = ({ color }) => (
  <svg
    className="w-28 sm:w-36 h-11 sm:h-13 pointer-events-none select-none block"
    viewBox="0 0 120 48"
    preserveAspectRatio="none"
    fill="none"
  >
    <path
      d="M0 48 C 20 48, 36 36, 56 30 C 76 24, 94 26, 108 18 C 114 14, 118 10, 120 8 L 120 48 L 0 48 Z"
      fill={color}
      fillOpacity="0.14"
    />
    <path
      d="M0 48 C 20 48, 36 36, 56 30 C 76 24, 94 26, 108 18 C 114 14, 118 10, 120 8"
      stroke={color}
      strokeWidth="2"
      strokeOpacity="0.38"
    />
  </svg>
);

const BuildingGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <rect x="10" y="12" width="36" height="44" rx="4" stroke={color} strokeWidth="1.5" strokeOpacity="0.22" fill={color} fillOpacity="0.04" />
    <rect x="16" y="18" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="25" y="18" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="34" y="18" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="16" y="28" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="25" y="28" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="34" y="28" width="6" height="6" rx="1.5" fill={color} fillOpacity="0.22" />
    <rect x="23" y="40" width="10" height="16" rx="2" fill={color} fillOpacity="0.2" />
  </svg>
);

const BookGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <path
      d="M8 18 C 18 14, 28 16, 28 20 C 28 16, 38 14, 48 18 L 48 44 C 38 40, 28 42, 28 46 C 28 42, 18 40, 8 44 Z"
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.24"
      fill={color}
      fillOpacity="0.06"
    />
    <line x1="28" y1="20" x2="28" y2="46" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
    <path d="M14 24 C 18 22, 22 23, 24 24" stroke={color} strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
    <path d="M14 29 C 18 27, 22 28, 24 29" stroke={color} strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
    <path d="M32 24 C 34 23, 38 22, 42 24" stroke={color} strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
    <path d="M32 29 C 34 28, 38 27, 42 29" stroke={color} strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
  </svg>
);

const LayersGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <path d="M10 24 L 28 15 L 46 24 L 28 33 Z" stroke={color} strokeWidth="1.5" strokeOpacity="0.28" fill={color} fillOpacity="0.08" />
    <path d="M10 31 L 28 40 L 46 31" stroke={color} strokeWidth="1.5" strokeOpacity="0.24" fill="none" />
    <path d="M10 38 L 28 47 L 46 38" stroke={color} strokeWidth="1.5" strokeOpacity="0.2" fill="none" />
  </svg>
);

const StudentsGraphic = ({ color }) => (
  <svg className="w-16 h-12" viewBox="0 0 64 48" fill="none">
    <circle cx="18" cy="18" r="5.5" fill={color} fillOpacity="0.2" />
    <path d="M8 38 C 8 30, 13 27, 18 27 C 23 27, 28 30, 28 38 Z" fill={color} fillOpacity="0.16" />
    <circle cx="32" cy="14" r="6.5" fill={color} fillOpacity="0.25" />
    <path d="M20 38 C 20 28, 26 24, 32 24 C 38 24, 44 28, 44 38 Z" fill={color} fillOpacity="0.22" />
    <circle cx="46" cy="18" r="5.5" fill={color} fillOpacity="0.2" />
    <path d="M36 38 C 36 30, 41 27, 46 27 C 51 27, 56 30, 56 38 Z" fill={color} fillOpacity="0.16" />
  </svg>
);

const ClockGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <circle cx="32" cy="32" r="21" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" fill={color} fillOpacity="0.04" />
    <polyline points="32,18 32,32 40,36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" />
  </svg>
);

const ActiveBranchGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <rect x="8" y="16" width="30" height="36" rx="3" stroke={color} strokeWidth="1.5" strokeOpacity="0.22" fill={color} fillOpacity="0.04" />
    <rect x="13" y="22" width="5" height="5" rx="1" fill={color} fillOpacity="0.2" />
    <rect x="22" y="22" width="5" height="5" rx="1" fill={color} fillOpacity="0.2" />
    <rect x="13" y="31" width="5" height="5" rx="1" fill={color} fillOpacity="0.2" />
    <rect x="22" y="31" width="5" height="5" rx="1" fill={color} fillOpacity="0.2" />
    <rect x="17" y="42" width="8" height="10" rx="1.5" fill={color} fillOpacity="0.22" />
    <circle cx="40" cy="38" r="12" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeOpacity="0.32" />
    <path d="M35 38 L 38 41 L 45 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
  </svg>
);

const DiplomaGraphic = ({ color }) => (
  <svg className="w-15 h-14" viewBox="0 0 60 56" fill="none">
    <polygon points="30,8 52,18 30,27 8,18" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeOpacity="0.28" strokeLinejoin="round" />
    <path d="M17 22 V 32 C 17 38, 43 38, 43 32 V 22" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
    <path d="M48 20 V 34 M45 34 H 51" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
    <rect x="14" y="40" width="32" height="9" rx="2.5" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.4" strokeOpacity="0.3" />
    <circle cx="30" cy="44.5" r="3" fill={color} fillOpacity="0.32" />
    <path d="M28 47 L 26 53 M32 47 L 34 53" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
  </svg>
);

const PaidWalletGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <rect x="16" y="10" width="28" height="16" rx="2.5" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.3" strokeOpacity="0.22" />
    <line x1="20" y1="15" x2="28" y2="15" stroke={color} strokeWidth="1.2" strokeOpacity="0.25" strokeLinecap="round" />
    <rect x="8" y="18" width="40" height="30" rx="5" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.28" />
    <path d="M30 27 H 48 V 39 H 30 C 27 39, 27 27, 30 27 Z" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.4" strokeOpacity="0.32" />
    <circle cx="37" cy="33" r="2.5" fill={color} fillOpacity="0.4" />
    <path d="M15 33 L 19 37 L 25 30" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.32" />
  </svg>
);

const TeacherStaffGraphic = ({ color }) => (
  <svg className="w-16 h-13" viewBox="0 0 64 52" fill="none">
    <circle cx="20" cy="18" r="6" fill={color} fillOpacity="0.24" />
    <path d="M10 44 C 10 33, 15 28, 20 28 C 25 28, 30 33, 30 44 Z" fill={color} fillOpacity="0.18" />
    <path d="M25 32 L 36 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
    <rect x="33" y="10" width="26" height="24" rx="3" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.26" />
    <line x1="37" y1="16" x2="52" y2="16" stroke={color} strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round" />
    <line x1="37" y1="21" x2="48" y2="21" stroke={color} strokeWidth="1.4" strokeOpacity="0.24" strokeLinecap="round" />
    <line x1="37" y1="26" x2="44" y2="26" stroke={color} strokeWidth="1.4" strokeOpacity="0.2" strokeLinecap="round" />
    <path d="M39 34 L 37 46 M 53 34 L 55 46" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" strokeLinecap="round" />
  </svg>
);

const AdminKeyGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <path
      d="M28 8 L 44 14 V 28 C 44 38, 36 46, 28 49 C 20 46, 12 38, 12 28 V 14 Z"
      fill={color}
      fillOpacity="0.08"
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.25"
    />
    <circle cx="28" cy="23" r="5.5" stroke={color} strokeWidth="2" strokeOpacity="0.35" fill="none" />
    <circle cx="28" cy="23" r="2.5" fill={color} fillOpacity="0.25" />
    <line x1="28" y1="28.5" x2="28" y2="41" stroke={color} strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
    <line x1="28" y1="34" x2="33" y2="34" stroke={color} strokeWidth="1.8" strokeOpacity="0.35" strokeLinecap="round" />
    <line x1="28" y1="38" x2="32" y2="38" stroke={color} strokeWidth="1.8" strokeOpacity="0.35" strokeLinecap="round" />
  </svg>
);

const EnquiriesChatGraphic = ({ color }) => (
  <svg className="w-15 h-13" viewBox="0 0 60 52" fill="none">
    <path
      d="M20 8 H 44 C 49 8, 53 12, 53 17 V 29 C 53 34, 49 38, 44 38 H 36 L 27 45 V 38 H 20 C 15 38, 11 34, 11 29 V 17 C 11 12, 15 8, 20 8 Z"
      fill={color}
      fillOpacity="0.08"
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.22"
    />
    <path
      d="M14 18 H 36 C 40 18, 43 21, 43 25 V 35 C 43 39, 40 42, 36 42 H 28 L 20 48 V 42 H 14 C 10 42, 7 39, 7 35 V 25 C 7 21, 10 18, 14 18 Z"
      fill={color}
      fillOpacity="0.16"
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.32"
    />
    <circle cx="17" cy="30" r="2" fill={color} fillOpacity="0.35" />
    <circle cx="25" cy="30" r="2" fill={color} fillOpacity="0.35" />
    <circle cx="33" cy="30" r="2" fill={color} fillOpacity="0.35" />
  </svg>
);

const TodayEnquiriesGraphic = ({ color }) => (
  <svg className="w-15 h-14" viewBox="0 0 60 56" fill="none">
    <path
      d="M12 16 H 38 C 43 16, 47 20, 47 25 V 37 C 47 42, 43 46, 38 46 H 26 L 16 52 V 46 H 12 C 7 46, 3 42, 3 37 V 25 C 3 20, 7 16, 12 16 Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.26"
    />
    <line x1="12" y1="28" x2="32" y2="28" stroke={color} strokeWidth="1.8" strokeOpacity="0.28" strokeLinecap="round" />
    <line x1="12" y1="34" x2="24" y2="34" stroke={color} strokeWidth="1.8" strokeOpacity="0.24" strokeLinecap="round" />
    <circle cx="45" cy="14" r="8" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.4" strokeOpacity="0.35" />
    <path d="M45 8 V 10 M45 18 V 20 M39 14 H 41 M49 14 H 51" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
    <circle cx="45" cy="14" r="2.5" fill={color} fillOpacity="0.45" />
  </svg>
);

const StaffAttendanceGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <rect x="10" y="12" width="36" height="38" rx="4" fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
    <path d="M10 16 C 10 13.8, 11.8 12, 14 12 H 42 C 44.2 12, 46 13.8, 46 16 V 20 H 10 Z" fill={color} fillOpacity="0.22" />
    <rect x="18" y="8" width="3" height="7" rx="1.5" fill={color} fillOpacity="0.35" />
    <rect x="35" y="8" width="3" height="7" rx="1.5" fill={color} fillOpacity="0.35" />
    <path d="M18 34 L 24 40 L 38 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.38" />
  </svg>
);

const AdminAttendanceGraphic = ({ color }) => (
  <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
    <rect x="11" y="12" width="34" height="40" rx="4" fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
    <rect x="21" y="8" width="14" height="7" rx="2" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.3" strokeOpacity="0.3" />
    <circle cx="28" cy="11.5" r="1.5" fill={color} fillOpacity="0.4" />
    <path d="M18 24 L 21 27 L 27 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.38" />
    <line x1="31" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.5" strokeOpacity="0.26" strokeLinecap="round" />
    <path d="M18 33 L 21 36 L 27 30" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.38" />
    <line x1="31" y1="33" x2="40" y2="33" stroke={color} strokeWidth="1.5" strokeOpacity="0.26" strokeLinecap="round" />
    <path d="M18 42 L 21 45 L 27 39" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.38" />
    <line x1="31" y1="42" x2="37" y2="42" stroke={color} strokeWidth="1.5" strokeOpacity="0.22" strokeLinecap="round" />
  </svg>
);

const CardWatermark = ({ type, color }) => {
  switch (type) {
    case 'building':
      return <BuildingGraphic color={color} />;
    case 'active-branch':
      return <ActiveBranchGraphic color={color} />;
    case 'book':
      return <BookGraphic color={color} />;
    case 'layers':
      return <LayersGraphic color={color} />;
    case 'students':
      return <StudentsGraphic color={color} />;
    case 'diploma':
      return <DiplomaGraphic color={color} />;
    case 'paid-wallet':
      return <PaidWalletGraphic color={color} />;
    case 'clock':
      return <ClockGraphic color={color} />;
    case 'staff':
      return <TeacherStaffGraphic color={color} />;
    case 'key':
      return <AdminKeyGraphic color={color} />;
    case 'enquiries':
      return <EnquiriesChatGraphic color={color} />;
    case 'today-enquiries':
      return <TodayEnquiriesGraphic color={color} />;
    case 'staff-attendance':
      return <StaffAttendanceGraphic color={color} />;
    case 'admin-attendance':
      return <AdminAttendanceGraphic color={color} />;
    case 'admin':
      return <AdminGraphic color={color} />;
    case 'wave':
      return <WaveGraphic color={color} />;
    case 'bars':
    default:
      return <BarsGraphic color={color} />;
  }
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent = '#9c6b2e',
  watermark = 'bars',
  delay = 0,
  size = 'md', // 'lg' (Row 1 - biggest) | 'md' (Row 2) | 'sm' (Row 3) | 'xs' (Row 4)
}) => {
  const displayValue = value !== undefined && value !== null ? value : 0;

  const sizeConfig = {
    lg: {
      cardClass: 'p-5 sm:p-6 min-h-[148px] sm:min-h-[158px] rounded-3xl',
      iconBox: 'h-12 w-12 sm:h-13 sm:w-13 rounded-2xl',
      iconSize: 'h-6 w-6 stroke-[2]',
      labelClass: 'text-[11.5px] sm:text-[12px]',
      valueClass: 'text-3xl sm:text-[2.25rem] mt-2 sm:mt-2.5',
      watermarkScale: 'scale-115',
    },
    md: {
      cardClass: 'p-4.5 sm:p-5 min-h-[132px] sm:min-h-[140px] rounded-2xl',
      iconBox: 'h-11 w-11 sm:h-11.5 sm:w-11.5 rounded-2xl',
      iconSize: 'h-5.5 w-5.5 stroke-[2]',
      labelClass: 'text-[10.5px] sm:text-[11px]',
      valueClass: 'text-2xl sm:text-[1.85rem] mt-1.5',
      watermarkScale: 'scale-100',
    },
    sm: {
      cardClass: 'p-4 sm:p-4.5 min-h-[118px] sm:min-h-[124px] rounded-2xl',
      iconBox: 'h-9.5 w-9.5 sm:h-10 sm:w-10 rounded-xl',
      iconSize: 'h-4.5 w-4.5 stroke-[2]',
      labelClass: 'text-[10px] sm:text-[10.5px]',
      valueClass: 'text-xl sm:text-[1.5rem] mt-1',
      watermarkScale: 'scale-90',
    },
    xs: {
      cardClass: 'p-3.5 sm:p-4 min-h-[104px] sm:min-h-[110px] rounded-2xl',
      iconBox: 'h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl',
      iconSize: 'h-4 w-4 stroke-[2]',
      labelClass: 'text-[9.5px] sm:text-[10px]',
      valueClass: 'text-lg sm:text-[1.35rem] mt-1',
      watermarkScale: 'scale-85',
    },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`sa-rise relative flex flex-col justify-between bg-white shadow-[0_2px_12px_rgba(23,20,15,0.03)] hover:shadow-[0_8px_24px_rgba(23,20,15,0.08)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${cfg.cardClass}`}
      style={{
        animationDelay: `${delay}ms`,
        border: `1.5px solid ${accent}38`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}85`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accent}38`; }}
    >
      {/* Top Row: Icon Container + Label */}
      <div className="flex items-center gap-2.5 sm:gap-3 z-10 w-full min-w-0">
        <div
          className={`flex shrink-0 items-center justify-center ${cfg.iconBox}`}
          style={{ backgroundColor: `${accent}16` }}
        >
          <Icon className={cfg.iconSize} style={{ color: accent }} />
        </div>
        <span
          className={`font-bold uppercase tracking-wider text-[#8A8175] truncate ${cfg.labelClass}`}
          title={label}
        >
          {label}
        </span>
      </div>

      {/* Bottom: Metric Value */}
      <div className="mt-2.5 z-10">
        <p
          className={`font-black text-[#17140F] tracking-tight leading-none tabular-nums truncate ${cfg.valueClass}`}
          title={String(displayValue)}
        >
          {displayValue}
        </p>
      </div>

      {/* Bottom Watermark / Graphic */}
      {watermark === 'wave' ? (
        <div className="absolute bottom-0 right-0 pointer-events-none select-none z-0 overflow-hidden leading-none">
          <CardWatermark type={watermark} color={accent} />
        </div>
      ) : (
        <div className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 pointer-events-none select-none z-10 ${cfg.watermarkScale} origin-bottom-right`}>
          <CardWatermark type={watermark} color={accent} />
        </div>
      )}
    </div>
  );
};

// Payment bar
const PaymentDistribution = ({ methods }) => {
  const total = ['cash', 'upi', 'razorpay'].reduce((a, key) => a + Number(methods?.[key] || 0), 0);
  if (total === 0) return <p className="text-sm font-medium" style={{ color: '#a39a8c' }}>No payment data available.</p>;

  const getWidth = (val) => `${((Number(val) / total) * 100).toFixed(1)}%`;
  
  const colors = {
    cash: '#10b981',
    upi: '#8b5cf6',
    razorpay: '#0ea5e9'
  };

  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full shadow-inner bg-slate-100">
        {methods.cash > 0 && <div style={{ width: getWidth(methods.cash), background: colors.cash }} title="Cash" />}
        {methods.upi > 0 && <div style={{ width: getWidth(methods.upi), background: colors.upi }} title="UPI" />}
        {methods.razorpay > 0 && <div style={{ width: getWidth(methods.razorpay), background: colors.razorpay }} title="Razorpay" />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Cash', key: 'cash', color: colors.cash },
          { label: 'UPI', key: 'upi', color: colors.upi },
          { label: 'Razorpay', key: 'razorpay', color: colors.razorpay }
        ].map(m => methods[m.key] > 0 && (
          <div key={m.key} className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8a8175' }}>{m.label}</span>
            </div>
            <span className="text-sm font-bold mt-1" style={{ color: '#17140f' }}>{fmt(methods[m.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BranchDetailsModal = ({ branch, onClose }) => {
  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex w-full max-w-4xl max-h-full flex-col overflow-hidden rounded-2xl bg-[#faf8f4] shadow-2xl sa-rise">
        
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b px-6 py-5 bg-[#ffffff]" style={{ borderColor: '#e3ddd0' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>{branch.branch_name}</h2>
            <div className="mt-1.5 flex items-center gap-3">
              <p className="text-sm font-medium" style={{ color: '#5b5346' }}>{branch.location}</p>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: branch.status === 'Active' ? '#ecfdf5' : '#fef2f2', color: branch.status === 'Active' ? '#065f46' : '#991b1b' }}>
                {branch.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-[#f1ede4]">
            <X className="h-5 w-5" style={{ color: '#17140f' }} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Academic & Staff (Left Column) */}
            <div className="space-y-6">
              
              {/* Academic Overview */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sky-600" />
                    Academic Overview
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Courses</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_courses}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Active Courses</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{branch.active_courses}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Students</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.total_students}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Staff & Admin */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-600" />
                    Staff & Administration
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Staff</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_staff}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Staff Present Today</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.staff_attendance_today}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Branch Admins</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_branch_admins}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Admins Present Today</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.branch_admin_attendance_today}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Enrollments & Revenue (Right Column) */}
            <div className="space-y-6">
              
              {/* Enrollments & Enquiries */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-sky-600" />
                    Enrollments & Enquiries
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Enrollments</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Paid Enrollments</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{branch.paid_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Pending Enrollments</td>
                      <td className="px-5 py-3 font-bold text-amber-600">{branch.pending_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Today's Enrollments</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Enquiries</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enquiries}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Today's Enquiries</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enquiries}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Revenue Summary */}
              <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-sky-50/30">
                <div className="p-4 border-b border-sky-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    Revenue Summary
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-sky-50">
                    <tr className="hover:bg-sky-50/50 transition">
                      <td className="px-5 py-3 text-slate-600 font-medium w-1/2">Total Received</td>
                      <td className="px-5 py-3 font-bold text-emerald-700 text-base">{fmt(branch.total_received)}</td>
                    </tr>
                    <tr className="hover:bg-sky-50/50 transition">
                      <td className="px-5 py-3 text-slate-600 font-medium">Received Today</td>
                      <td className="px-5 py-3 font-bold text-emerald-600 text-base">{fmt(branch.today_received)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="mt-6 bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-sky-600" />
                Payment Methods Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f4] border-b border-[#e3ddd0]">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1ede4]">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">Cash</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.cash)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">UPI</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.upi)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">Razorpay</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.razorpay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSuperAdminDashboardOverviewApi(token);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const overview = dashboardData?.overview || {};
  const methods = dashboardData?.payment_methods || {};
  const branches = dashboardData?.branches || [];

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="dashboard" />

      <main className="min-w-0 flex-1 relative">
        <header className="flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#17140f' }}>Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {dashboardData?.date && (
              <span className="hidden text-sm font-semibold sm:block" style={{ color: '#8a8175' }}>
                {new Date(dashboardData.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
            <button onClick={load} disabled={loading} className="rounded-xl p-2.5 transition hover:bg-[#f1ede4]" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm shadow-sm" style={{ background: '#17140f', color: '#f4b942' }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-8">
          {/* ── Welcome Header Banner (Warm Light Theme - Matching Staff & Student Portals) ── */}
          <div className="sa-rise bg-white rounded-3xl p-5 sm:p-6 border border-[#E3DDD0] shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Soft warm background gradient glow */}
            <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#FAF8F4] via-[#F1EDE4]/50 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight">
                  Welcome super admin 👋
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                  <Crown className="h-3 w-3 text-[#9C6B2E]" />
                  Super Admin Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5B5346] font-medium">
                Here's an overview of what's happening across all branches today.
              </p>

              {dashboardData && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-[#F1EDE4] text-[11px] text-[#8A8175]">
                  <span className="flex items-center gap-1.5 font-semibold text-[#17140F]">
                    <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                    <span>{overview?.total_branches ?? 0} Branches Active</span>
                  </span>
                  <span className="text-[#D9D0C1]">•</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Full System Control
                  </span>
                </div>
              )}
            </div>

            {/* 3D-styled Super Admin Animated Emblem (Crown & Shield in Warm Gold Theme) */}
            <div className="hidden sm:flex items-center justify-center shrink-0 pr-2 sm:pr-4 relative z-10">
              <div className="relative flex items-center justify-center group cursor-default">
                {/* Floating decorative elements in warm amber & gold theme */}
                <div className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-gradient-to-tr from-[#9C6B2E] to-[#F4B942] shadow-md shadow-[#9C6B2E]/40 animate-bounce flex items-center justify-center text-white" title="Master Security & Authority">
                  <ShieldCheck className="h-3.5 w-3.5 text-white stroke-[2.3]" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#F4B942] shadow-md shadow-[#F4B942]/30 animate-pulse" />
                <div className="absolute top-1/2 -right-4 h-5 w-5 rounded-full bg-[#9C6B2E] shadow-md shadow-[#9C6B2E]/30 flex items-center justify-center text-[10px] font-black text-white">
                  ★
                </div>

                {/* Center Floating Super Admin Emblem */}
                <div className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FAF8F4] via-[#F1EDE4] to-[#FAF8F4] backdrop-blur-md border border-[#E3DDD0] shadow-lg shadow-[#9C6B2E]/10 transform hover:rotate-3 hover:scale-105 transition-all duration-300">
                  <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-[#9C6B2E] drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-5 py-4 text-sm font-semibold" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={load} className="underline hover:text-red-900 transition">Retry Request</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#9c6b2e' }} />
              <p className="text-sm font-semibold" style={{ color: '#8a8175' }}>Loading dashboard data...</p>
            </div>
          ) : dashboardData ? (
            <>
              {/* Overview Cards (Hierarchical: Row 1 biggest, Row 2 smaller, Row 3 smaller, Row 4 compact) */}
              <div className="space-y-4 sm:space-y-5">
                {/* Row 1: Branches & Courses (Size: lg - biggest) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <StatCard size="lg" icon={Building2} label="Total Branches" value={overview.total_branches} accent="#F97316" watermark="building" delay={0} />
                  <StatCard size="lg" icon={Building2} label="Active Branches" value={overview.active_branches} accent="#10B981" watermark="active-branch" delay={20} />
                  <StatCard size="lg" icon={BookOpen} label="Total Courses" value={overview.total_courses} accent="#3B82F6" watermark="book" delay={40} />
                  <StatCard size="lg" icon={Layers} label="Active Courses" value={overview.active_courses} accent="#06B6D4" watermark="layers" delay={60} />
                </div>

                {/* Row 2: Students & Enrollments (Size: md - smaller than first) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <StatCard size="md" icon={Users} label="Total Students" value={overview.total_students} accent="#8B5CF6" watermark="students" delay={80} />
                  <StatCard size="md" icon={GraduationCap} label="Total Enrollments" value={overview.total_enrollments} accent="#0EA5E9" watermark="diploma" delay={100} />
                  <StatCard size="md" icon={Wallet} label="Paid Enrollments" value={overview.paid_enrollments} accent="#10B981" watermark="paid-wallet" delay={120} />
                  <StatCard size="md" icon={Clock} label="Pending Enrollments" value={overview.pending_enrollments} accent="#F59E0B" watermark="clock" delay={140} />
                </div>

                {/* Row 3: Staff & Enquiries (Size: sm - smaller than second) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <StatCard size="sm" icon={UserPlus} label="Total Staff" value={overview.total_staff} accent="#EC4899" watermark="staff" delay={160} />
                  <StatCard size="sm" icon={KeyRound} label="Branch Admins" value={overview.total_branch_admins} accent="#F43F5E" watermark="key" delay={180} />
                  <StatCard size="sm" icon={MessageCircle} label="Total Enquiries" value={overview.total_enquiries} accent="#F97316" watermark="enquiries" delay={200} />
                  <StatCard size="sm" icon={MessageCircle} label="Today's Enquiries" value={overview.today_enquiries} accent="#EAB308" watermark="today-enquiries" delay={220} />
                </div>

                {/* Row 4: Revenue & Attendance (Size: xs - smaller than third / compact) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <StatCard size="xs" icon={IndianRupee} label="Total Received" value={fmt(overview.total_received)} accent="#10B981" watermark="wave" delay={240} />
                  <StatCard size="xs" icon={TrendingUp} label="Today Received" value={fmt(overview.today_received)} accent="#059669" watermark="wave" delay={260} />
                  <StatCard size="xs" icon={CalendarCheck} label="Staff Attendance Today" value={overview.staff_attendance_today} accent="#0284C7" watermark="staff-attendance" delay={280} />
                  <StatCard size="xs" icon={CalendarCheck} label="Admin Attendance Today" value={overview.branch_admin_attendance_today} accent="#8B5CF6" watermark="admin-attendance" delay={300} />
                </div>
              </div>

              {/* Payment Methods */}
              <section className="sa-rise rounded-2xl p-6 sm:p-8" style={{ background: '#ffffff', border: '1px solid #e3ddd0', animationDelay: '350ms' }}>
                <div className="mb-6">
                  <h2 className="text-lg font-bold" style={{ color: '#17140f' }}>Payment Methods Distribution</h2>
                  <p className="text-xs mt-1" style={{ color: '#8a8175' }}>Overall revenue breakdown by payment type</p>
                </div>
                <PaymentDistribution methods={methods} />
              </section>

              {/* Branches Overview Table */}
              <section className="sa-rise rounded-2xl overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #e3ddd0', animationDelay: '400ms' }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1ede4', background: '#faf8f4' }}>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#17140f' }}>Branch Overview</h2>
                    <p className="text-xs mt-1" style={{ color: '#8a8175' }}>Quick overview of all registered branches</p>
                  </div>
                  <button
                    onClick={() => navigate('/super-admin/branch-overview')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:bg-[#f1ede4] border"
                    style={{ color: '#9c6b2e', borderColor: '#e3ddd0', background: '#ffffff' }}
                  >
                    View Full Overview &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e3ddd0' }}>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap sticky top-0 bg-[#faf8f4]" style={{ color: '#a39a8c', zIndex: 10 }}>Branch</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Courses</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Students</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Enrollments</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Revenue</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-medium" style={{ color: '#a39a8c' }}>No branches found.</td></tr>
                      ) : branches.map((b) => (
                        <tr key={b.branch_id} className="transition hover:bg-[#faf8f4]" style={{ borderBottom: '1px solid #f1ede4' }}>
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            <p className="font-bold text-base" style={{ color: '#17140f' }}>{b.branch_name}</p>
                            <p className="text-xs mt-1 font-medium" style={{ color: '#5b5346' }}>{b.location}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_courses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_students}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_enrollments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-semibold" style={{ color: '#10b981' }}>
                            {fmt(b.total_received)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            <button onClick={() => setSelectedBranch(b)} className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition hover:-translate-y-0.5 shadow-sm" style={{ background: '#ffffff', color: '#9c6b2e', border: '1px solid #e3ddd0' }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
        
        {/* Branch Details Modal */}
        <BranchDetailsModal branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
