import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  Copy,
  CreditCard,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Maximize2,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  UserCheck,
  UserRound,
  Users,
  FileText,
  Wallet,
  X,
  XCircle,
  FolderDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCourseImageUrl } from '../services/courses';
import { getMyEnrollmentsApi, getEnrollmentInstallmentsApi } from '../services/enrollments';
import { createPaymentOrderApi, loadRazorpayScript, verifyPaymentApi } from '../services/payments';
import { getStudentAssignmentsApi } from '../services/studentassignments';

import {
  getUserAnnouncementsApi,
  getStudentAllCourseAnnouncementsApi,
  getStudentCourseAnnouncementsApi,
} from '../services/userannouncements';
import { getStudentUnreadCountApi } from '../services/studentStaffMessages';
import { useStudentModalBlur } from '../utils/useStudentModalBlur';

// Load modern Plus Jakarta Sans + Inter + Fraunces fonts
const useDashboardFonts = () => {
  useEffect(() => {
    const id = 'student-portal-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';
    document.head.appendChild(link);
  }, []);
};

const formatDate = (date) => {
  if (!date) return 'Date unavailable';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(date);
  }
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

export const isInstallmentPaidOrSubmitted = (inst) => {
  if (!inst) return false;
  if (inst.is_rejected_resolved) return false;
  const statusStr = String(inst.status || '').toLowerCase().trim();
  const approvalStatusStr = String(inst.approval_status || '').toLowerCase().trim();
  if (statusStr === 'rejected' || approvalStatusStr === 'rejected') return false;
  if (inst.is_paid_resolved !== undefined) return Boolean(inst.is_paid_resolved);
  const paymentStatusStr = String(inst.payment_status || '').toLowerCase().trim();
  const hasRef = Boolean(inst.payment_reference && String(inst.payment_reference).trim());
  return (
    paymentStatusStr === 'paid' ||
    statusStr === 'paid' ||
    statusStr === 'pending_review' ||
    hasRef
  );
};

export const enrichInstallmentsWithPayments = (installments = [], enrollment = {}) => {
  if (!Array.isArray(installments)) return [];

  const paymentSources = [
    ...(Array.isArray(enrollment) ? enrollment : []),
    ...(Array.isArray(enrollment?.payments) ? enrollment.payments : []),
    ...(Array.isArray(enrollment?.payment_history) ? enrollment.payment_history : []),
    ...(Array.isArray(enrollment?.installment_payments) ? enrollment.installment_payments : []),
    ...(Array.isArray(enrollment?.recent_payments) ? enrollment.recent_payments : []),
    ...(Array.isArray(enrollment?.transactions) ? enrollment.transactions : []),
    ...(Array.isArray(enrollment?.records) ? enrollment.records : []),
    ...(Array.isArray(enrollment?.all_payments) ? enrollment.all_payments : []),
  ];

  return installments.map((inst, index) => {
    const instNum = Number(inst.installment_number ?? index + 1);
    const instId = inst.installment_id || inst.id;

    // 1. Try to find explicit matching payments in any payment array
    const matchingPayments = paymentSources.filter((p) => {
      if (!p) return false;
      if (p.installment_number !== undefined && p.installment_number !== null) {
        return Number(p.installment_number) === instNum;
      }
      if (instId && p.installment_id !== undefined && p.installment_id !== null) {
        return String(p.installment_id) === String(instId);
      }
      return false;
    });

    // Sort matching payments so the latest reviewed or most authoritative comes first
    matchingPayments.sort((a, b) => {
      const timeA = new Date(a.reviewed_at || a.payment_date || a.created_at || 0).getTime();
      const timeB = new Date(b.reviewed_at || b.payment_date || b.created_at || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.payment_id || b.id || 0) - Number(a.payment_id || a.id || 0);
    });

    let matchingPayment = matchingPayments[0];

    // 2. Check if the installment itself has payment fields
    const rawStatus = String(inst.status || '').toLowerCase().trim();
    const rawPayStatus = String(inst.payment_status || '').toLowerCase().trim();
    const rawHasRef = Boolean(inst.payment_reference && String(inst.payment_reference).trim());

    if (!matchingPayment && (rawPayStatus === 'paid' || rawStatus === 'pending_review' || rawStatus === 'paid' || rawHasRef)) {
      matchingPayment = inst;
    }

    // 3. Fallback: If installment has cash/upi amounts or paid_amount
    if (!matchingPayment) {
      const cashAmt = Number(inst.cash_amount || 0);
      const upiAmt = Number(inst.upi_amount || 0);
      const paidAmt = Number(inst.paid_amount || 0);
      if (cashAmt > 0 || upiAmt > 0 || paidAmt > 0) {
        matchingPayment = {
          payment_status: 'paid',
          status: inst.status || 'paid',
          amount: inst.amount,
          paid_amount: paidAmt || (cashAmt + upiAmt) || inst.amount,
          payment_reference: inst.payment_reference || enrollment.razorpay_payment_id,
        };
      }
    }

    if (!matchingPayment) {
      return inst;
    }

    const payStatus = String(matchingPayment.status || '').toLowerCase().trim();
    const payMethodStatus = String(matchingPayment.payment_status || '').toLowerCase().trim();
    const payApprovalStatus = String(matchingPayment.approval_status || '').toLowerCase().trim();
    const hasRef = Boolean(matchingPayment.payment_reference && String(matchingPayment.payment_reference).trim());

    const isRejected =
      payStatus === 'rejected' ||
      payApprovalStatus === 'rejected' ||
      String(matchingPayment.approval_status || '').toLowerCase() === 'rejected';

    const isApproved =
      !isRejected &&
      (payApprovalStatus === 'approved' ||
        (payStatus === 'paid' && matchingPayment.credited_to_balance === true));

    const isPaid =
      !isRejected &&
      (payMethodStatus === 'paid' ||
        payStatus === 'paid' ||
        payStatus === 'pending_review' ||
        hasRef ||
        Number(matchingPayment.paid_amount || matchingPayment.amount || 0) > 0);

    const isPendingReview =
      !isRejected &&
      isPaid &&
      !isApproved &&
      (
        payStatus === 'pending_review' ||
        payApprovalStatus === 'pending' ||
        matchingPayment.credited_to_balance === false
      );

    return {
      ...inst,
      ...matchingPayment,
      installment_number: instNum,
      status: isRejected ? 'rejected' : isPendingReview ? 'pending_review' : isPaid ? 'paid' : matchingPayment.status || inst.status,
      payment_status: matchingPayment.payment_status || (isPaid ? 'paid' : inst.payment_status),
      approval_status: isRejected ? 'rejected' : matchingPayment.approval_status || (isPendingReview ? 'pending' : 'approved'),
      payment_reference: matchingPayment.payment_reference || inst.payment_reference,
      payment_date: matchingPayment.payment_date || matchingPayment.paid_date || inst.payment_date || inst.paid_date,
      paid_amount: isRejected ? 0 : matchingPayment.paid_amount || matchingPayment.amount || inst.paid_amount || inst.amount,
      is_paid_resolved: isPaid,
      is_pending_review_resolved: isPendingReview,
      is_rejected_resolved: isRejected,
      rejection_reason: matchingPayment.rejection_reason || matchingPayment.reason || '',
      reviewed_at: matchingPayment.reviewed_at || inst.reviewed_at,
    };
  });
};

export const getInstallmentPaymentDetails = (inst) => {
  if (!inst) {
    return {
      isPaid: false,
      isPendingReview: false,
      isApproved: false,
      isRejected: false,
      rejectionReason: '',
      approvalStatus: 'pending',
      paymentReference: '',
      paymentDate: null,
      amount: 0,
      paidAmount: 0,
    };
  }

  const isRejected = Boolean(
    inst.is_rejected_resolved ||
    String(inst.status || '').toLowerCase().trim() === 'rejected' ||
    String(inst.approval_status || '').toLowerCase().trim() === 'rejected'
  );

  const rejectionReason = inst.rejection_reason || inst.reason || '';

  if (isRejected) {
    return {
      isPaid: false,
      isPendingReview: false,
      isApproved: false,
      isRejected: true,
      rejectionReason,
      approvalStatus: 'rejected',
      paymentReference: inst.payment_reference || '',
      paymentDate: inst.payment_date || inst.paid_date || null,
      amount: Number(inst.amount || 0),
      paidAmount: 0,
    };
  }

  if (inst.is_paid_resolved !== undefined) {
    return {
      isPaid: Boolean(inst.is_paid_resolved),
      isPendingReview: Boolean(inst.is_pending_review_resolved),
      isApproved: Boolean(inst.is_paid_resolved) && !inst.is_pending_review_resolved,
      isRejected: false,
      rejectionReason: '',
      approvalStatus: inst.approval_status || (inst.is_pending_review_resolved ? 'pending' : 'approved'),
      paymentReference: inst.payment_reference || '',
      paymentDate: inst.payment_date || inst.paid_date || null,
      amount: Number(inst.amount || 0),
      paidAmount: Number(inst.paid_amount || inst.amount || 0),
    };
  }

  const statusStr = String(inst.status || '').toLowerCase().trim();
  const paymentStatusStr = String(inst.payment_status || '').toLowerCase().trim();
  const approvalStatusStr = String(inst.approval_status || '').toLowerCase().trim();
  const hasRef = Boolean(inst.payment_reference && String(inst.payment_reference).trim());

  const isPaid =
    paymentStatusStr === 'paid' ||
    statusStr === 'paid' ||
    statusStr === 'pending_review' ||
    hasRef;

  const isPendingReview =
    isPaid &&
    (
      statusStr === 'pending_review' ||
      approvalStatusStr === 'pending' ||
      inst.credited_to_balance === false
    );

  const isApproved = isPaid && !isPendingReview;

  const amount = Number(inst.amount || 0);
  const paidAmount = Number(
    inst.paid_amount !== undefined && Number(inst.paid_amount) > 0
      ? inst.paid_amount
      : isPaid
      ? amount
      : 0
  );

  return {
    isPaid,
    isPendingReview,
    isApproved,
    isRejected: false,
    rejectionReason: '',
    approvalStatus: inst.approval_status || (isPendingReview ? 'pending' : isApproved ? 'approved' : 'pending'),
    paymentReference: inst.payment_reference || '',
    paymentDate: inst.payment_date || inst.paid_date || null,
    amount,
    paidAmount,
  };
};

// Card 1 Illustration: 3D Stack of Books with Graduation Cap (Darker, rich contrast matching reference screenshot)
const Card1BooksWithCapWatermark = () => (
  <svg
    className="w-24 h-24 sm:w-28 sm:h-28 pointer-events-none select-none drop-shadow-xs"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Bottom Book */}
    {/* Left spine */}
    <path d="M18 67 L48 81 L48 89 L18 75 Z" fill="#4F46E5" />
    {/* Right pages */}
    <path d="M48 81 L82 67 L82 75 L48 89 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
    <path d="M50 83 L80 70 M50 85 L80 72 M50 87 L80 74" stroke="#94A3B8" strokeWidth="0.9" />
    {/* Top cover */}
    <path d="M18 67 L50 53 L82 67 L48 81 Z" fill="#A5B4FC" />

    {/* Top Book */}
    {/* Left spine */}
    <path d="M18 53 L48 67 L48 75 L18 61 Z" fill="#6366F1" />
    {/* Right pages */}
    <path d="M48 67 L82 53 L82 61 L48 75 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
    <path d="M50 69 L80 56 M50 71 L80 58 M50 73 L80 60" stroke="#94A3B8" strokeWidth="0.9" />
    {/* Top cover */}
    <path d="M18 53 L50 39 L82 53 L48 67 Z" fill="#C7D2FE" />

    {/* Graduation Cap on top */}
    {/* Skull cap under mortarboard */}
    <path d="M38 39 C38 48, 62 48, 62 39 L62 44 C62 52, 38 52, 38 44 Z" fill="#3730A3" />
    {/* Diamond mortarboard board */}
    <polygon points="50,18 80,32 50,45 20,32" fill="#4F46E5" stroke="#818CF8" strokeWidth="1.5" />
    {/* Inner shadow/highlight on board */}
    <polygon points="50,20 77,32 50,43 23,32" fill="#6366F1" />
    {/* Center button */}
    <ellipse cx="50" cy="32" rx="3" ry="2" fill="#E0E7FF" />
    {/* Tassel line & brush */}
    <path d="M50 32 Q68 35 72 46" stroke="#C7D2FE" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <polygon points="70,46 75,46 73,56 71,56" fill="#C7D2FE" />
  </svg>
);

// Card 2 Illustration: Stacks of Golden Coins (Darker, rich gold contrast)
const Card2CoinsWatermark = () => (
  <svg
    className="w-24 h-24 sm:w-28 sm:h-28 pointer-events-none select-none drop-shadow-xs"
    viewBox="0 0 95 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Back / Right Stack (5 coins, taller) */}
    <g>
      {/* Coin 1 (bottom) */}
      <ellipse cx="66" cy="80" rx="18" ry="6.5" fill="#D97706" />
      <path d="M48 72 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="66" cy="72" rx="18" ry="6.5" fill="#F59E0B" />

      {/* Coin 2 */}
      <path d="M48 62 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="66" cy="62" rx="18" ry="6.5" fill="#FBBF24" />

      {/* Coin 3 */}
      <path d="M48 52 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="66" cy="52" rx="18" ry="6.5" fill="#F59E0B" />

      {/* Coin 4 */}
      <path d="M48 42 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="66" cy="42" rx="18" ry="6.5" fill="#FBBF24" />

      {/* Coin 5 (top) */}
      <path d="M48 32 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="66" cy="32" rx="18" ry="6.5" fill="#FDE68A" />
      <ellipse cx="66" cy="32" rx="13" ry="4.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
    </g>

    {/* Front / Left Stack (3 coins) */}
    <g>
      {/* Coin 1 */}
      <ellipse cx="34" cy="80" rx="18" ry="6.5" fill="#D97706" />
      <path d="M16 72 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="34" cy="72" rx="18" ry="6.5" fill="#F59E0B" />

      {/* Coin 2 */}
      <path d="M16 62 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="34" cy="62" rx="18" ry="6.5" fill="#FBBF24" />

      {/* Coin 3 (top) */}
      <path d="M16 52 v8 c0 3.6 8 6.5 18 6.5 s18 -2.9 18 -6.5 v-8 Z" fill="#B45309" />
      <ellipse cx="34" cy="52" rx="18" ry="6.5" fill="#FDE68A" />
      <ellipse cx="34" cy="52" rx="13" ry="4.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
    </g>
  </svg>
);

// Card 3 Illustration: Document Sheet with Checkmark (Darker, rich emerald contrast)
const Card3DocumentWatermark = () => (
  <svg
    className="w-22 h-26 sm:w-26 sm:h-30 pointer-events-none select-none drop-shadow-xs"
    viewBox="0 0 75 88"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document sheet */}
    <rect x="6" y="4" width="58" height="76" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
    
    {/* Folded corner */}
    <path d="M46 4 L64 22 L46 22 Z" fill="#A7F3D0" />
    <path d="M46 4 L46 22 L64 22" stroke="#6EE7B7" strokeWidth="1.5" />

    {/* Top left return arrow */}
    <path d="M22 18 H14 M17 15 L14 18 L17 21" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Document content lines */}
    <rect x="14" y="28" width="36" height="3.5" rx="1.75" fill="#34D399" />
    <rect x="14" y="37" width="36" height="3.5" rx="1.75" fill="#34D399" />
    <rect x="14" y="46" width="28" height="3.5" rx="1.75" fill="#34D399" />

    {/* Bottom right checkmark circle badge */}
    <circle cx="52" cy="66" r="11" fill="#10B981" stroke="white" strokeWidth="2" />
    <path d="M47 66 L50.5 70 L57 62" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Card 4 Illustration: Hourglass Sand Timer (Darker, rich warm peach contrast)
const Card4HourglassWatermark = () => (
  <svg
    className="w-20 h-26 sm:w-24 sm:h-30 pointer-events-none select-none drop-shadow-xs"
    viewBox="0 0 60 88"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top wooden bar */}
    <rect x="6" y="4" width="48" height="6" rx="3" fill="#EA580C" />

    {/* Glass bulb top */}
    <path
      d="M10 10 C 10 32, 26 38, 30 42 C 34 38, 50 32, 50 10 Z"
      fill="#FFEDD5"
      stroke="#FB923C"
      strokeWidth="2.2"
    />
    {/* Sand in top bulb */}
    <path
      d="M17 17 C 17 28, 27 34, 30 38 C 33 34, 43 28, 43 17 Z"
      fill="#F97316"
    />

    {/* Falling sand stream */}
    <line x1="30" y1="38" x2="30" y2="58" stroke="#EA580C" strokeWidth="2.5" strokeDasharray="3 2" />

    {/* Glass bulb bottom */}
    <path
      d="M10 78 C 10 56, 26 50, 30 46 C 34 50, 50 56, 50 78 Z"
      fill="#FFEDD5"
      stroke="#FB923C"
      strokeWidth="2.2"
    />
    {/* Sand pile in bottom bulb */}
    <path
      d="M15 77 C 18 64, 42 64, 45 77 Z"
      fill="#EA580C"
    />

    {/* Bottom wooden bar */}
    <rect x="6" y="78" width="48" height="6" rx="3" fill="#EA580C" />
  </svg>
);

const formatRelativeNoticeTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

// Continuous Moving Announcements Ticker (Distinct Student Portal Design - Light Color Theme)
const StudentMovingAnnouncements = ({ announcements = [], onSelectAnnouncement }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!announcements || announcements.length === 0) return null;

  // Prepare balanced duplicated list for seamless infinite loop at translateX(-50%)
  const baseItems =
    announcements.length < 4
      ? [...announcements, ...announcements]
      : announcements;
  const displayItems = [...baseItems, ...baseItems];

  const scrollDuration = Math.max(24, Math.min(60, displayItems.length * 3.5));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#E6DFD3] shadow-[0_2px_8px_rgba(23,20,15,0.03)] mb-7 hover:border-[#9C6B2E]/50 transition-colors">
      <style>{`
        @keyframes student-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .student-ticker-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: student-ticker-scroll ${scrollDuration}s linear infinite;
        }
        .student-ticker-track.paused {
          animation-play-state: paused !important;
        }
        .student-ticker-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent);
          mask-image: linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .student-ticker-track {
            animation: none !important;
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="flex items-center gap-3 p-2.5 px-3 sm:px-4">
        {/* Left Distinctive Student Pill Badge (Light Color Theme) */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0] text-[11px] font-extrabold tracking-wide shadow-2xs select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9C6B2E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9C6B2E]" />
          </span>
          <Megaphone className="h-3.5 w-3.5 text-[#9C6B2E]" />
          <span className="uppercase tracking-wider text-[10px]">Announcements</span>
        </div>

        {/* Center Marquee Viewport */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="student-ticker-mask flex-1 overflow-hidden py-0.5"
        >
          <div className={`student-ticker-track gap-3 sm:gap-4 ${isPaused ? 'paused' : ''}`}>
            {displayItems.map((ann, idx) => {
              const snippet = (ann.message || ann.content || '').replace(/\s+/g, ' ').trim();
              const timeAgo = formatRelativeNoticeTime(ann.created_at);
              const courseTag = ann.course_title || ann.course_name;

              return (
                <button
                  type="button"
                  key={`${ann.id || idx}-${idx}`}
                  onClick={() => onSelectAnnouncement && onSelectAnnouncement(ann)}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#E5DFD3] bg-white hover:bg-[#FAF8F4] hover:border-[#9C6B2E] px-4 py-1.5 text-xs text-[#17140F] shadow-2xs hover:shadow-xs transition duration-200 shrink-0 group cursor-pointer text-left"
                  title="Click to view details"
                >
                  <span className="h-2 w-2 rounded-full bg-[#9C6B2E] shrink-0 group-hover:scale-125 transition-transform" />
                  
                  {courseTag && (
                    <span className="text-[10px] font-extrabold text-[#9C6B2E] bg-[#F1EDE4] border border-[#E3DDD0] px-2 py-0.5 rounded-full whitespace-nowrap">
                      {courseTag}
                    </span>
                  )}

                  <span className="font-bold text-[#17140F] group-hover:text-[#9C6B2E] transition-colors whitespace-nowrap">
                    {ann.title || 'Course Announcement'}
                  </span>

                  {snippet && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-normal max-w-[260px] sm:max-w-[360px] truncate whitespace-nowrap">
                        {snippet}
                      </span>
                    </>
                  )}

                  {timeAgo && (
                    <span className="ml-1 text-[10px] font-semibold text-[#8A8175] bg-[#F4EFE6] px-2 py-0.5 rounded-full whitespace-nowrap">
                      {timeAgo}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right View All Action */}
        <Link
          to="/student-dashboard/announcements"
          className="shrink-0 hidden md:inline-flex items-center gap-1.5 rounded-xl border border-[#E3DDD0] bg-white px-3 py-1.5 text-xs font-bold text-[#9C6B2E] hover:bg-[#FAF8F4] hover:text-[#805420] shadow-2xs transition hover:border-[#9C6B2E]/60"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

// Announcement Detail Modal Card (Matching Staff Portal Modal Experience)
const StudentAnnouncementDetailModal = ({
  announcement,
  isOpen,
  onClose,
  onNavigateToAll,
}) => {
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setViewingImage(null);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingImage) {
          setViewingImage(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewingImage, onClose]);

  if (!isOpen || !announcement) return null;

  const isCourse = announcement.type === 'course' || Boolean(announcement.course_title || announcement.course_name);

  const rawEventTime =
    announcement.scheduled_event_time ||
    announcement.event_time ||
    announcement.exam_time ||
    announcement.scheduled_time;

  let formattedEventTime = null;
  if (rawEventTime) {
    try {
      const d = new Date(rawEventTime);
      if (!isNaN(d.getTime())) {
        formattedEventTime = d.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      } else {
        formattedEventTime = String(rawEventTime);
      }
    } catch {
      formattedEventTime = String(rawEventTime);
    }
  }

  const handleOpenPage = () => {
    onClose();
    if (typeof onNavigateToAll === 'function') {
      onNavigateToAll();
    }
  };

  const courseName = announcement.course_title || announcement.course_name || '';
  const branchName = announcement.branch_name || '';
  const messageText = announcement.message || announcement.content || 'No additional details provided in this announcement.';
  const author = announcement.publisher || announcement.instructor_name || announcement.created_by_name || 'Academic Faculty';

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-announcement-title"
        onClick={onClose}
      >
        <div
          className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl p-5 sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-xl bg-[#FAF8F4] p-2 text-slate-400 border border-[#E3DDD0] transition hover:bg-[#F1EDE4] hover:text-[#17140F] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Badges Header */}
          <div className="flex flex-wrap items-center gap-2 pr-10 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]">
              {isCourse ? (
                <BookOpen className="h-3.5 w-3.5 text-[#9C6B2E]" />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
              )}
              <span>{isCourse ? 'Course Announcement' : 'Campus Notice'}</span>
            </span>

            {courseName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] px-3 py-1 text-[11px] font-semibold text-[#5B5346] border border-[#E3DDD0] truncate max-w-xs">
                📚 {courseName}
              </span>
            )}

            {branchName && !courseName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] px-3 py-1 text-[11px] font-semibold text-[#5B5346] border border-[#E3DDD0] truncate max-w-xs">
                🏛️ {branchName}
              </span>
            )}
          </div>

          {/* Announcement Title */}
          <h2
            id="student-modal-announcement-title"
            className="text-lg sm:text-xl font-bold text-[#17140F] leading-snug tracking-tight mb-3"
          >
            {announcement.title || 'Announcement'}
          </h2>

          {/* Metadata Row: Published Time, Author/Publisher */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8A8175] pb-3 mb-4 border-b border-[#E3DDD0]">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Published: {formatDate(announcement.created_at)}</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <User className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Source: <strong className="text-[#17140F] font-semibold">{author}</strong></span>
            </div>
          </div>

          {/* Optional Event / Exam Time Callout */}
          {formattedEventTime && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl p-3.5 bg-[#FAF8F4] border border-[#E3DDD0]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C6B2E]">
                  Scheduled Exam / Event Time
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#17140F]">
                  {formattedEventTime}
                </div>
              </div>
            </div>
          )}

          {/* Announcement Full Message Text */}
          <div className="prose prose-sm max-w-none mb-5">
            <p className="whitespace-pre-line text-xs sm:text-sm text-[#5B5346] leading-relaxed">
              {messageText}
            </p>
          </div>

          {/* Attached Image with Lightbox click */}
          {announcement.image && (
            <div className="mb-6">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175] mb-2">
                Attached Media
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 flex items-center justify-center max-h-80">
                <img
                  src={getCourseImageUrl(announcement.image)}
                  alt={announcement.title}
                  className="max-h-72 w-auto max-w-full rounded-xl object-contain shadow-xs cursor-pointer transition hover:scale-[1.01]"
                  onClick={() =>
                    setViewingImage({
                      url: getCourseImageUrl(announcement.image),
                      title: announcement.title,
                    })
                  }
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() =>
                    setViewingImage({
                      url: getCourseImageUrl(announcement.image),
                      title: announcement.title,
                    })
                  }
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-slate-900 cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Enlarge</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer with Actions */}
          <div className="pt-4 border-t border-[#E3DDD0] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOpenPage}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#9C6B2E] hover:text-[#855923] py-2 px-3 rounded-xl hover:bg-[#F1EDE4] transition cursor-pointer"
            >
              <span>Open Course Announcements Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-6 py-2.5 text-xs font-bold text-white bg-[#9C6B2E] hover:bg-[#855923] transition cursor-pointer shadow-sm text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full Resolution Image View */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3 bg-[#FAF8F4]">
              <h3 className="text-sm font-bold text-[#17140F] truncate pr-4">
                {viewingImage.title || 'Announcement Attachment'}
              </h3>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 bg-[#F1EDE4] flex items-center justify-center overflow-auto max-h-[calc(92vh-60px)]">
              <img
                src={viewingImage.url}
                alt={viewingImage.title || 'Announcement Media'}
                className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

const StudentDashboard = () => {
  useDashboardFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementCount, setAnnouncementCount] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPaymentEnrollment, setSelectedPaymentEnrollment] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Installment payment states
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [payingInstallmentNumber, setPayingInstallmentNumber] = useState(null);
  const [installmentError, setInstallmentError] = useState('');
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');

  const handleClosePaymentModal = () => {
    setSelectedPaymentEnrollment(null);
    setInstallmentError('');
    setPaymentSuccessMessage('');
    setPayingInstallmentNumber(null);
  };

  const handleOpenPaymentModal = async (enrollment) => {
    if (!enrollment) return;
    setSelectedPaymentEnrollment(enrollment);
    setInstallmentError('');
    setPaymentSuccessMessage('');
    setPayingInstallmentNumber(null);

    const enrollmentId = enrollment.enrollment_id || enrollment.id;
    if (!enrollmentId || !token) return;

    setIsLoadingInstallments(true);
    try {
      const details = await getEnrollmentInstallmentsApi(enrollmentId, token);
      if (details) {
        setSelectedPaymentEnrollment((prev) => {
          if (!prev) return details;
          const detailsArray = Array.isArray(details) ? details : [];
          const detailsObj = Array.isArray(details) ? {} : (details || {});

          const rawInstList =
            detailsObj.installments ||
            detailsObj.schedule ||
            (detailsArray.length > 0 && detailsArray[0]?.due_date ? detailsArray : prev.installments) ||
            [];

          const combinedPayments = [
            ...detailsArray,
            ...(Array.isArray(detailsObj.payments) ? detailsObj.payments : []),
            ...(Array.isArray(detailsObj.payment_history) ? detailsObj.payment_history : []),
            ...(Array.isArray(detailsObj.installment_payments) ? detailsObj.installment_payments : []),
            ...(Array.isArray(detailsObj.recent_payments) ? detailsObj.recent_payments : []),
            ...(Array.isArray(detailsObj.transactions) ? detailsObj.transactions : []),
            ...(Array.isArray(detailsObj.records) ? detailsObj.records : []),
            ...(Array.isArray(prev?.payments) ? prev.payments : []),
            ...(Array.isArray(prev?.payment_history) ? prev.payment_history : []),
          ];

          const enrichedList = enrichInstallmentsWithPayments(
            rawInstList,
            { ...prev, ...detailsObj, payments: combinedPayments }
          );

          const paidCount = enrichedList.filter(isInstallmentPaidOrSubmitted).length;
          const totalClearedAmount = enrichedList
            .filter(isInstallmentPaidOrSubmitted)
            .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

          const totalPaid = Math.max(
            Number(detailsObj.total_paid !== undefined ? detailsObj.total_paid : prev.total_paid || 0),
            totalClearedAmount
          );

          const totalFee = detailsObj.total_fee !== undefined ? detailsObj.total_fee : prev.total_fee;
          const balance = Math.max(0, Number(totalFee || 0) - totalPaid);

          const totalCount =
            detailsObj.installment_count ||
            detailsObj.total_installments ||
            (Array.isArray(enrichedList) ? enrichedList.length : prev.installment_count);

          const calculatedNextUnpaid = enrichedList.find((i) => !isInstallmentPaidOrSubmitted(i));

          return {
            ...prev,
            ...detailsObj,
            installments: enrichedList,
            payments: combinedPayments,
            payment_history: combinedPayments,
            total_paid: totalPaid,
            balance_amount: balance,
            total_fee: totalFee,
            paid_installment_count: paidCount,
            installment_count: totalCount,
            next_unpaid_installment: calculatedNextUnpaid,
          };
        });
      }
    } catch (err) {
      console.warn('Could not fetch latest installment schedule:', err);
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  const handleRefreshInstallments = async () => {
    const enrollmentId = selectedPaymentEnrollment?.enrollment_id || selectedPaymentEnrollment?.id;
    if (!enrollmentId || !token) return;

    setIsLoadingInstallments(true);
    setInstallmentError('');
    try {
      const details = await getEnrollmentInstallmentsApi(enrollmentId, token);
      if (details) {
        setSelectedPaymentEnrollment((prev) => {
          if (!prev) return details;
          const detailsArray = Array.isArray(details) ? details : [];
          const detailsObj = Array.isArray(details) ? {} : (details || {});

          const rawInstList =
            detailsObj.installments ||
            detailsObj.schedule ||
            (detailsArray.length > 0 && detailsArray[0]?.due_date ? detailsArray : prev.installments) ||
            [];

          const combinedPayments = [
            ...detailsArray,
            ...(Array.isArray(detailsObj.payments) ? detailsObj.payments : []),
            ...(Array.isArray(detailsObj.payment_history) ? detailsObj.payment_history : []),
            ...(Array.isArray(detailsObj.installment_payments) ? detailsObj.installment_payments : []),
            ...(Array.isArray(detailsObj.recent_payments) ? detailsObj.recent_payments : []),
            ...(Array.isArray(detailsObj.transactions) ? detailsObj.transactions : []),
            ...(Array.isArray(detailsObj.records) ? detailsObj.records : []),
            ...(Array.isArray(prev?.payments) ? prev.payments : []),
            ...(Array.isArray(prev?.payment_history) ? prev.payment_history : []),
          ];

          const enrichedList = enrichInstallmentsWithPayments(
            rawInstList,
            { ...prev, ...detailsObj, payments: combinedPayments }
          );

          const paidCount = enrichedList.filter(isInstallmentPaidOrSubmitted).length;
          const totalClearedAmount = enrichedList
            .filter(isInstallmentPaidOrSubmitted)
            .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

          const totalPaid = Math.max(
            Number(detailsObj.total_paid !== undefined ? detailsObj.total_paid : prev.total_paid || 0),
            totalClearedAmount
          );

          const totalFee = detailsObj.total_fee !== undefined ? detailsObj.total_fee : prev.total_fee;
          const balance = Math.max(0, Number(totalFee || 0) - totalPaid);

          const totalCount =
            detailsObj.installment_count ||
            detailsObj.total_installments ||
            (Array.isArray(enrichedList) ? enrichedList.length : prev.installment_count);

          const calculatedNextUnpaid = enrichedList.find((i) => !isInstallmentPaidOrSubmitted(i));

          return {
            ...prev,
            ...detailsObj,
            installments: enrichedList,
            payments: combinedPayments,
            payment_history: combinedPayments,
            total_paid: totalPaid,
            balance_amount: balance,
            total_fee: totalFee,
            paid_installment_count: paidCount,
            installment_count: totalCount,
            next_unpaid_installment: calculatedNextUnpaid,
          };
        });
      }
    } catch (err) {
      setInstallmentError(err.message || 'Failed to refresh installment schedule.');
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  const handlePayInstallment = async (installment) => {
    const enrollmentId = selectedPaymentEnrollment?.enrollment_id || selectedPaymentEnrollment?.id;
    if (!enrollmentId) {
      setInstallmentError('Enrollment reference is missing. Please close and re-open the details.');
      return;
    }

    const targetNumber = installment?.installment_number || 1;

    try {
      setPaymentProcessing(true);
      setPayingInstallmentNumber(targetNumber);
      setInstallmentError('');
      setPaymentSuccessMessage('');

      // 1. Create payment order for the next unpaid installment
      // Sends enrollment_id and payment_type: "installment" to POST /payments/create-order
      const order = await createPaymentOrderApi(
        {
          enrollment_id: Number(enrollmentId),
          payment_type: 'installment',
          installment_number: Number(targetNumber),
        },
        token
      );

      // 2. Ensure Razorpay SDK is loaded
      await loadRazorpayScript();

      if (!order.order_id || !order.razorpay_key_id) {
        throw new Error('Payment order initialization was incomplete. Please try again.');
      }

      const orderAmountPaise =
        order.amount_paise ||
        order.amount ||
        (installment?.amount ? Math.round(Number(installment.amount) * 100) : undefined);

      const courseTitle =
        selectedPaymentEnrollment.course_title ||
        selectedPaymentEnrollment.course_details?.title ||
        'Course Tuition';

      // 3. Configure and trigger Razorpay Checkout
      const razorpay = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: orderAmountPaise,
        currency: order.currency || 'INR',
        name: 'Aurum FX Academy',
        description: `Installment #${targetNumber} — ${courseTitle}`,
        order_id: order.order_id,
        prefill: {
          name: order.student?.name || user?.name || user?.full_name || '',
          email: order.student?.email || user?.email || '',
          contact: order.student?.phone || user?.phone || user?.phone_number || '',
        },
        notes: {
          enrollment_id: String(order.enrollment_id || enrollmentId),
          payment_type: 'installment',
          installment_number: String(targetNumber),
        },
        theme: { color: '#9C6B2E' },
        handler: async (paymentResponse) => {
          try {
            setPaymentProcessing(true);
            // 4. Verify payment with backend via POST /payments/verify
            await verifyPaymentApi(
              {
                enrollment_id: order.enrollment_id || Number(enrollmentId),
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              token
            );

            setPaymentSuccessMessage(
              `Payment successful! Installment #${targetNumber} has been verified and cleared.`
            );

            // 5. Re-fetch fresh installment details via GET /enrollments/{enrollment_id}/installments
            try {
              const updatedDetails = await getEnrollmentInstallmentsApi(enrollmentId, token);
              if (updatedDetails) {
                const updatedList = updatedDetails.installments || updatedDetails.schedule || [];
                const combinedPayments = [
                  ...(Array.isArray(updatedDetails.payments) ? updatedDetails.payments : []),
                  ...(Array.isArray(updatedDetails.payment_history) ? updatedDetails.payment_history : []),
                  ...(Array.isArray(updatedDetails.installment_payments) ? updatedDetails.installment_payments : []),
                  ...(Array.isArray(updatedDetails.recent_payments) ? updatedDetails.recent_payments : []),
                  ...(Array.isArray(updatedDetails.transactions) ? updatedDetails.transactions : []),
                  ...(Array.isArray(updatedDetails.records) ? updatedDetails.records : []),
                  ...(Array.isArray(selectedPaymentEnrollment?.payments) ? selectedPaymentEnrollment.payments : []),
                  ...(Array.isArray(selectedPaymentEnrollment?.payment_history) ? selectedPaymentEnrollment.payment_history : []),
                  {
                    installment_number: Number(targetNumber),
                    payment_status: 'paid',
                    status: 'pending_review',
                    approval_status: 'pending',
                    credited_to_balance: false,
                    payment_reference: paymentResponse.razorpay_payment_id,
                    amount: installment?.amount,
                    paid_amount: installment?.amount,
                    payment_date: new Date().toISOString().split('T')[0],
                  },
                ];

                const enrichedList = enrichInstallmentsWithPayments(
                  updatedList.length > 0 ? updatedList : selectedPaymentEnrollment?.installments || [],
                  { ...selectedPaymentEnrollment, ...updatedDetails, payments: combinedPayments }
                );

                const paidCount = enrichedList.filter(isInstallmentPaidOrSubmitted).length;
                const totalClearedAmount = enrichedList
                  .filter(isInstallmentPaidOrSubmitted)
                  .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

                const totalPaid = Math.max(
                  Number(updatedDetails.total_paid !== undefined ? updatedDetails.total_paid : selectedPaymentEnrollment?.total_paid || 0),
                  totalClearedAmount
                );

                const totalFee = updatedDetails.total_fee !== undefined ? updatedDetails.total_fee : selectedPaymentEnrollment?.total_fee;
                const balance = Math.max(0, Number(totalFee || 0) - totalPaid);

                const totalCount =
                  updatedDetails.installment_count ||
                  updatedDetails.total_installments ||
                  (Array.isArray(enrichedList) ? enrichedList.length : selectedPaymentEnrollment?.installment_count);

                const calculatedNextUnpaid = enrichedList.find((i) => !isInstallmentPaidOrSubmitted(i));

                setSelectedPaymentEnrollment((prev) => ({
                  ...prev,
                  ...updatedDetails,
                  installments: enrichedList,
                  payments: combinedPayments,
                  payment_history: combinedPayments,
                  total_paid: totalPaid,
                  balance_amount: balance,
                  total_fee: totalFee,
                  paid_installment_count: paidCount,
                  installment_count: totalCount,
                  next_unpaid_installment: calculatedNextUnpaid,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id || prev?.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id || prev?.razorpay_order_id,
                }));
              }
            } catch (err) {
              console.warn('Error refreshing installment data after payment:', err);
            }

            // 6. Refresh full enrollments list on the student dashboard
            const refreshedEnrollments = await getMyEnrollmentsApi(token);
            if (Array.isArray(refreshedEnrollments)) {
              setEnrollments(refreshedEnrollments);
            }
          } catch (err) {
            setInstallmentError(
              err.message || 'Payment verification failed. If money was debited, please contact campus support.'
            );
          } finally {
            setPaymentProcessing(false);
            setPayingInstallmentNumber(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setPayingInstallmentNumber(null);
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        setInstallmentError(
          response.error?.description || 'Payment was declined or cancelled. Please try again.'
        );
        setPaymentProcessing(false);
        setPayingInstallmentNumber(null);
      });

      razorpay.open();
    } catch (err) {
      setInstallmentError(err.message || 'Unable to initiate payment with Razorpay. Please try again.');
      setPaymentProcessing(false);
      setPayingInstallmentNumber(null);
    }
  };

  useStudentModalBlur(Boolean(selectedPaymentEnrollment || selectedAnnouncement));

  // Close modals on Escape key and lock background scrolling
  useEffect(() => {
    if (selectedPaymentEnrollment || selectedAnnouncement || installmentError) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (installmentError) {
            setInstallmentError('');
          } else if (selectedAnnouncement) {
            setSelectedAnnouncement(null);
          } else {
            handleClosePaymentModal();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedPaymentEnrollment, selectedAnnouncement, installmentError]);

  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // ignore clipboard error
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError('');

        const [enrollmentRes, assignmentsRes, instAnnouncementsRes, courseAnnouncementsRes, unreadRes] = await Promise.allSettled([
          getMyEnrollmentsApi(token),
          getStudentAssignmentsApi(token),
          getUserAnnouncementsApi(token),
          getStudentAllCourseAnnouncementsApi(token),
          getStudentUnreadCountApi(token),
        ]);

        if (isMounted) {
          const enrollmentsList =
            enrollmentRes.status === 'fulfilled' && Array.isArray(enrollmentRes.value)
              ? enrollmentRes.value
              : [];
          setEnrollments(enrollmentsList);
          if (enrollmentRes.status === 'rejected') {
            setError(enrollmentRes.reason?.message || 'Unable to load enrollments.');
          }

          if (assignmentsRes.status === 'fulfilled') {
            const data = assignmentsRes.value;
            const list = Array.isArray(data?.assignments)
              ? data.assignments
              : Array.isArray(data)
              ? data
              : [];
            setAssignments(list);
          } else {
            setAssignments([]);
          }

          // Gather Course Announcements
          let courseList = [];
          if (courseAnnouncementsRes.status === 'fulfilled') {
            const data = courseAnnouncementsRes.value;
            courseList = Array.isArray(data)
              ? data
              : Array.isArray(data?.announcements)
              ? data.announcements
              : [];
          }

          // If global course announcements endpoint returned 0, aggregate from approved enrolled courses
          if (courseList.length === 0 && enrollmentsList.length > 0) {
            try {
              const perCourseResults = await Promise.allSettled(
                enrollmentsList.map((e) => {
                  const cId = e.course_id ?? e.course?.id ?? e.course?.course_id ?? e.id;
                  return cId ? getStudentCourseAnnouncementsApi(cId, token) : Promise.resolve([]);
                })
              );
              perCourseResults.forEach((r) => {
                if (r.status === 'fulfilled') {
                  const cl = Array.isArray(r.value)
                    ? r.value
                    : Array.isArray(r.value?.announcements)
                    ? r.value.announcements
                    : [];
                  courseList.push(...cl);
                }
              });
            } catch {
              // ignore per-course errors
            }
          }

          // Gather Campus / Institution Announcements
          let instList = [];
          if (instAnnouncementsRes.status === 'fulfilled') {
            const data = instAnnouncementsRes.value;
            instList = Array.isArray(data)
              ? data
              : Array.isArray(data?.announcements)
              ? data.announcements
              : [];
          }

          // Combine both course announcements and campus announcements
          const combined = [
            ...instList.map((item) => ({ ...item, type: 'institution' })),
            ...courseList.map((item) => ({
              ...item,
              type: 'course',
              title: item.title || item.announcement_title || (item.course_title ? `${item.course_title} Notice` : 'Course Announcement'),
            })),
          ];

          // Deduplicate by ID
          const seen = new Set();
          const uniqueAnnouncements = [];
          for (const item of combined) {
            const key = item.id || item._id || `${item.title}-${item.created_at || item.createdAt}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueAnnouncements.push(item);
            }
          }

          // Sort newest first
          uniqueAnnouncements.sort((a, b) => {
            const tA = new Date(a.created_at || a.createdAt || 0).getTime();
            const tB = new Date(b.created_at || b.createdAt || 0).getTime();
            return tB - tA;
          });

          setAnnouncements(uniqueAnnouncements);
          setAnnouncementCount(uniqueAnnouncements.length);

          if (unreadRes.status === 'fulfilled') {
            const uv = unreadRes.value;
            const count = typeof uv === 'number' ? uv : Number(uv?.unread_count ?? uv?.total_unread ?? uv?.count ?? 0);
            setUnreadMessagesCount(isNaN(count) ? 0 : count);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load your dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // Student profile resolution
  const student = enrollments[0]?.student_details || {};
  const displayName = user?.name || student?.name || enrollments[0]?.name || enrollments[0]?.full_name || 'Student';
  const studentFirstName = displayName.trim().split(' ')[0] || 'Student';
  const displayEmail = user?.email || student?.email || enrollments[0]?.email || 'Email not available';
  const displayPhone = user?.phone || student?.phone || enrollments[0]?.phone || 'Phone not available';
  const branchName = enrollments[0]?.branch_name || enrollments[0]?.branch?.name || student?.branch_name || user?.branch_name || '';
  const branchLocation = enrollments[0]?.branch_location || enrollments[0]?.branch?.location || student?.branch_location || user?.branch_location || '';

  // Summary Metrics
  const totalEnrolled = enrollments.length;
  const totalFee = enrollments.reduce((sum, item) => sum + (Number(item.total_fee) || 0), 0);
  const totalInvested = enrollments.reduce((sum, item) => sum + (Number(item.total_paid) || Number(item.total_fee) || 0), 0);
  const totalBalance = enrollments.reduce((sum, item) => sum + (Number(item.balance_amount) || 0), 0);
  const pendingReviewCount = enrollments.filter((item) => {
    const branchStatus = (item.branch_approval_status || '').toLowerCase();
    const superStatus = (item.super_admin_approval_status || '').toLowerCase();
    return branchStatus === 'pending' || superStatus === 'pending';
  }).length;

  const primaryEnrollment = enrollments[0];
  const primaryBranchApproval = (primaryEnrollment?.branch_approval_status || '').toLowerCase();
  const primarySuperApproval = (primaryEnrollment?.super_admin_approval_status || '').toLowerCase();

  const isCoursePending =
    pendingReviewCount > 0 ||
    primaryBranchApproval === 'pending' ||
    primarySuperApproval === 'pending' ||
    !primaryEnrollment;

  const isCourseRejected =
    primaryBranchApproval === 'rejected' || primarySuperApproval === 'rejected';

  const courseApprovalStatusText = isCourseRejected
    ? 'Approval Rejected'
    : isCoursePending
    ? 'Approval Pending'
    : 'Approved';

  const courseApprovalStatusSubtext = isCourseRejected
    ? 'Contact campus support'
    : isCoursePending
    ? 'Awaiting admin review'
    : 'All verifications cleared';

  const assignmentCount = assignments.length;

  const displayAnnouncements = useMemo(() => {
    return Array.isArray(announcements) ? announcements : [];
  }, [announcements]);

  const currentDateFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return 'Today';
    }
  }, []);

  // Filtered courses based on top search bar
  const filteredEnrollments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enrollments;
    return enrollments.filter((item) => {
      const title = (item.course_title || item.course_details?.title || '').toLowerCase();
      const cat = (item.course_details?.category || '').toLowerCase();
      const branch = (item.branch_details?.name || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || branch.includes(q);
    });
  }, [enrollments, searchQuery]);

  return (
    <div className="h-screen max-h-screen w-full bg-white flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased selection:bg-amber-200 selection:text-amber-900 overflow-hidden">
      <style>{`
        @keyframes modalPop {
          0% { opacity: 0; transform: scale(0.96) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-student-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 107, 46, 0.2);
          border-radius: 9999px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 107, 46, 0.4);
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 1. Warm Light Sidebar (Fitted fully, structure preserved) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 xl:w-64 shrink-0 flex-col bg-[#FAF8F4] border-r border-[#E3DDD0] p-5 text-[#17140F] shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:h-full lg:max-h-full lg:overflow-y-auto lg:shadow-none student-portal-sidebar student-portal-sidebar-aside ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
          {/* Top Logo / Graduation Icon Box */}
          <div className="flex items-center justify-between">
            <Link
              to="/student-dashboard"
              onClick={closeSidebar}
              className="group flex items-center gap-3 min-w-0"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17140F] text-[#F4B942] border border-[#E3DDD0] shadow-sm transition group-hover:scale-105">
                <GraduationCap className="h-6 w-6 text-[#F4B942] drop-shadow-xs" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#17140F] leading-tight truncate">
                  AurumFx
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E] truncate">
                  Student Portal
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-xl p-2 text-[#5B5346] hover:bg-[#F1EDE4] lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-2 flex-1">
            {/* Dashboard (Active) */}
            <Link
              to="/student-dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl bg-[#F1EDE4] px-4 py-3 text-xs font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80 transition"
            >
              <LayoutDashboard className="h-4 w-4 text-[#9C6B2E]" />
              <span>Dashboard</span>
            </Link>

            {/* Assignments */}
            <Link
              to="/student-dashboard/assignments"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <span className="flex items-center gap-3.5">
                <ClipboardList className="h-4 w-4 text-[#8A8175]" />
                <span>Assignments</span>
              </span>
              {assignmentCount > 0 && (
                <span className="rounded-full bg-[#EAE4D9] px-2 py-0.5 text-[10px] font-black text-[#5B5346]">
                  {assignmentCount}
                </span>
              )}
            </Link>

            {/* Study Materials */}
            <Link
              to="/student-dashboard/study-materials"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <FolderDown className="h-4 w-4 text-[#8A8175]" />
              <span>Study Materials</span>
            </Link>

            {/* Browse Courses */}
            <Link
              to="/student-dashboard/courses"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <BookOpen className="h-4 w-4 text-[#8A8175]" />
              <span>Browse courses</span>
            </Link>

            {/* Course Announcements */}
            <Link
              to="/student-dashboard/announcements"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <span className="flex items-center gap-3.5">
                <Megaphone className="h-4 w-4 text-[#8A8175]" />
                <span>Course Announcements</span>
              </span>
            </Link>

            {/* Institution Notices */}
            <Link
              to="/student-dashboard/institution-announcements"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <span className="flex items-center gap-3.5">
                <Building2 className="h-4 w-4 text-[#8A8175]" />
                <span>Institution Notices</span>
              </span>
              {announcementCount !== null && announcementCount > 0 && (
                <span className="rounded-full bg-[#EAE4D9] px-2 py-0.5 text-[10px] font-black text-[#5B5346]">
                  {announcementCount}
                </span>
              )}
            </Link>

            {/* Messages */}
            <Link
              to="/student-dashboard/messages"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <span className="flex items-center gap-3.5">
                <MessageSquare className="h-4 w-4 text-[#8A8175]" />
                <span>Messages</span>
              </span>
              {unreadMessagesCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-sm animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>

            {/* Enquiries */}
            <Link
              to="/student-dashboard/enquiries"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F] transition"
            >
              <MessageCircle className="h-4 w-4 text-[#8A8175]" />
              <span>Enquiries</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-2 border-t border-[#E3DDD0] pt-5">
            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#5B5346] transition hover:bg-[#F1EDE4] hover:text-[#17140F]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#5B5346] transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent"
            >
              <LogOut className="h-4 w-4 text-[#8A8175]" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* 2. Main Dashboard Content Column (Fitted fully, edge-to-edge) */}
        <div className="min-w-0 flex-1 flex flex-col h-full max-h-full min-h-0 bg-white p-4 sm:p-5 lg:p-6 overflow-hidden student-portal-content">
          {/* Top Header */}
          <header className="flex items-center justify-between gap-4 pb-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl bg-[#FAF8F4] border border-[#E3DDD0] p-2 text-[#17140F] hover:bg-[#F1EDE4] transition lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Student Portal
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard
                </h2>
              </div>
            </div>

            {/* Centered Search Bar */}
            <div className="relative flex-1 max-w-sm sm:max-w-md mx-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C6B2E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-full bg-[#FAF8F4] border border-[#E3DDD0] py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-[#8A8175] focus:bg-white focus:border-[#9C6B2E] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition"
              />
            </div>

            {/* Profile & Notification Widget */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/student-dashboard/messages"
                className="relative rounded-full bg-[#FAF8F4] border border-[#E3DDD0] p-2.5 text-slate-600 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition"
                aria-label="View staff messages"
                title="Staff Messages"
              >
                <MessageSquare className="h-4 w-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-900 ring-2 ring-white">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>

              <Link
                to="/student-dashboard/announcements"
                className="relative rounded-full bg-[#FAF8F4] border border-[#E3DDD0] p-2.5 text-slate-600 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition"
                aria-label="View announcements"
              >
                <Bell className="h-4 w-4" />
                {announcementCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140F] text-[#F4B942] font-extrabold text-sm shadow-sm ring-2 ring-[#E3DDD0]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Enrolled Student
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Dashboard Body */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 custom-student-scrollbar">
            {/* 3. Welcome Banner (Warm Light Theme) */}
            {/* 3. Welcome Header Banner (Warm Light Theme - Matching Staff Portal) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3DDD0] shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
              {/* Soft warm background gradient glow */}
              <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#FAF8F4] via-[#F1EDE4]/50 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-lg">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight">
                    Welcome back, {displayName}! 👋
                  </h1>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                    Student Portal
                  </span>
                </div>
                <p className="text-xs text-[#5B5346] font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{branchName ? `Student at ${branchName}` : 'Always stay updated in your student portal'}</span>
                  {branchLocation && <span>• {branchLocation}</span>}
                </p>
              </div>

              {/* 3D-styled Student Animated Emblem (Matching Staff Portal Style) */}
              <div className="hidden sm:flex items-center justify-center shrink-0 pr-2 sm:pr-4 relative z-10">
                <div className="relative flex items-center justify-center group cursor-default">
                  {/* Floating decorative elements in warm amber & gold theme */}
                  <div className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-gradient-to-tr from-[#9C6B2E] to-[#F4B942] shadow-md shadow-[#9C6B2E]/40 animate-bounce flex items-center justify-center text-white">
                    <Award className="h-3.5 w-3.5 text-white stroke-[2.2]" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#F4B942] shadow-md shadow-[#F4B942]/30 animate-pulse" />
                  <div className="absolute top-1/2 -right-4 h-5 w-5 rounded-full bg-[#9C6B2E] shadow-md shadow-[#9C6B2E]/30 flex items-center justify-center text-[10px] font-black text-white">
                    ★
                  </div>

                  {/* Center Floating Student Emblem */}
                  <div className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FAF8F4] via-[#F1EDE4] to-[#FAF8F4] backdrop-blur-md border border-[#E3DDD0] shadow-lg shadow-[#9C6B2E]/10 transform hover:rotate-3 hover:scale-105 transition-all duration-300">
                    <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-[#9C6B2E] drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
              </div>
            </div>

            {/* Continuous Moving Announcements Bar (Distinct Student Portal Design - Light Color Theme) */}
            <StudentMovingAnnouncements
              announcements={displayAnnouncements}
              onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)}
            />

            {/* 4. Top 4 Stat Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {/* Stat 1: Total Enrolled */}
              <div className="relative rounded-2xl border border-[#E5DFD3] bg-white p-5.5 sm:p-6.5 shadow-[0_2px_10px_rgba(23,20,15,0.03)] hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[178px] sm:min-h-[190px] group">
                {/* Subtle soft lavender glow in background */}
                <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-[#EEF2FF]/80 blur-xl pointer-events-none" />

                <div className="flex items-center gap-3 z-10">
                  <div className="h-11 w-11 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-[#6366F1]"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Top layer: Solid filled rounded pill */}
                      <rect x="3.5" y="4" width="17" height="4.5" rx="2.25" fill="currentColor" />

                      {/* Middle layer: Outlined with downward bookmark notch */}
                      <path
                        d="M3.5 11h6.5l2 2 2-2H20.5v3.8H3.5V11Z"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Bottom layer: Outlined rounded layer */}
                      <rect
                        x="3.5"
                        y="16.8"
                        width="17"
                        height="4.2"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175]">
                    TOTAL ENROLLED
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 z-10">
                  <p className="text-2xl sm:text-[1.85rem] font-black text-[#17140F] tracking-tight leading-none">
                    {totalEnrolled}
                  </p>
                  <p className="mt-2 text-xs text-[#8A8175] font-medium">
                    Active enrolled courses
                  </p>
                </div>

                {/* Floating 3D Illustration comfortably spaced from edges */}
                <div className="absolute bottom-3.5 right-4 sm:bottom-4 sm:right-6 pointer-events-none select-none z-10">
                  <Card1BooksWithCapWatermark />
                </div>
              </div>

              {/* Stat 2: Total Paid */}
              <div className="relative rounded-2xl border border-[#E5DFD3] bg-white p-5.5 sm:p-6.5 shadow-[0_2px_10px_rgba(23,20,15,0.03)] hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[178px] sm:min-h-[190px] group">
                {/* Subtle soft amber glow in background */}
                <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-[#FEF3C7]/80 blur-xl pointer-events-none" />

                <div className="flex items-center gap-3 z-10">
                  <div className="h-11 w-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175]">
                    Total Paid
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 z-10">
                  <p className="text-2xl sm:text-[1.85rem] font-black text-[#17140F] tracking-tight leading-none">
                    {formatCurrency(totalInvested)}
                  </p>
                  <p className="mt-2 text-xs text-[#8A8175] font-medium">
                    Total fees paid so far
                  </p>
                </div>

                {/* Floating 3D Illustration comfortably spaced from edges */}
                <div className="absolute bottom-3.5 right-4 sm:bottom-4 sm:right-6 pointer-events-none select-none z-10">
                  <Card2CoinsWatermark />
                </div>
              </div>

              {/* Stat 3: Balance Due */}
              <div className="relative rounded-2xl border border-[#E5DFD3] bg-white p-5.5 sm:p-6.5 shadow-[0_2px_10px_rgba(23,20,15,0.03)] hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[178px] sm:min-h-[190px] group">
                {/* Subtle soft mint glow in background */}
                <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-[#DCFCE7]/80 blur-xl pointer-events-none" />

                <div className="flex items-center gap-3 z-10">
                  <div className="h-11 w-11 rounded-2xl bg-[#DCFCE7] text-[#10B981] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M9 13h6" />
                      <path d="M9 17h3" />
                      <circle cx="17" cy="17" r="3" fill="#DCFCE7" stroke="#10B981" strokeWidth="1.8" />
                      <path d="M16 17l1 1 2-2" stroke="#10B981" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175]">
                    Balance Due
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 z-10">
                  <p className="text-2xl sm:text-[1.85rem] font-black text-[#17140F] tracking-tight leading-none">
                    {formatCurrency(totalBalance)}
                  </p>
                  <p className="mt-2 text-xs text-[#8A8175] font-medium">
                    {totalBalance === 0 ? 'All course dues cleared' : 'Outstanding tuition balance'}
                  </p>
                </div>

                {/* Floating 3D Illustration comfortably spaced from edges */}
                <div className="absolute bottom-3.5 right-4 sm:bottom-4 sm:right-6 pointer-events-none select-none z-10">
                  <Card3DocumentWatermark />
                </div>
              </div>

              {/* Stat 4: Course Status */}
              <div className="relative rounded-2xl border border-[#E5DFD3] bg-white p-5.5 sm:p-6.5 shadow-[0_2px_10px_rgba(23,20,15,0.03)] hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[178px] sm:min-h-[190px] group">
                {/* Subtle soft peach glow in background */}
                <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-[#FFEDD5]/80 blur-xl pointer-events-none" />

                <div className="flex items-center gap-3 z-10">
                  <div className="h-11 w-11 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175]">
                    Course Status
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 z-10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-2xl sm:text-[1.85rem] font-black text-[#17140F] tracking-tight leading-none">
                      {pendingReviewCount}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                      {courseApprovalStatusText}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#8A8175] font-medium">
                    {courseApprovalStatusSubtext}
                  </p>
                </div>

                {/* Floating 3D Illustration comfortably spaced from edges */}
                <div className="absolute bottom-3.5 right-4 sm:bottom-4 sm:right-6 pointer-events-none select-none z-10">
                  <Card4HourglassWatermark />
                </div>
              </div>
            </section>

          {/* 5. Main Section: Enrolled Courses & Assignments (Course Instructors and Daily Notice removed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* Enrolled Courses Column */}
            <div className={assignments.length > 0 ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>

              {/* SECTION: Enrolled Courses */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Enrolled Courses
                  </h3>
                  <Link
                    to="/student-dashboard/courses"
                    className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] transition flex items-center gap-1"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#E3DDD0] border-t-[#9C6B2E] mb-3" />
                    <p className="text-xs font-bold text-slate-600">
                      Loading your enrolled courses...
                    </p>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E3DDD0] bg-[#FAF8F4] p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-[#8A8175] mb-2.5" />
                    <p className="text-sm font-bold text-slate-800">No courses match your view</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Explore programs currently open for registration
                    </p>
                    <Link
                      to="/student-dashboard/courses"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#9C6B2E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#855923] transition"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredEnrollments.map((enrollment, index) => {
                      const courseTitle =
                        enrollment.course_title ||
                        enrollment.course_details?.title ||
                        'Enrolled Program';
                      const courseDuration =
                        enrollment.course_duration ||
                        enrollment.course_details?.duration ||
                        'Program Duration';
                      const branchApproval = (enrollment.branch_approval_status || '').toLowerCase();
                      const superApproval = (enrollment.super_admin_approval_status || '').toLowerCase();
                      const courseImg = getCourseImageUrl(
                        enrollment.course_image || enrollment.course_details?.image_url
                      );

                      return (
                        <div
                          key={enrollment.id || enrollment.enrollment_id || index}
                          className="flex flex-col justify-between rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0] hover:border-[#9C6B2E] hover:bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group h-full"
                        >
                          {/* Course Image on Top */}
                          <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                            {courseImg ? (
                              <img
                                src={courseImg}
                                alt={courseTitle}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#F1EDE4] to-[#FAF8F4]">
                                <BookOpen className="h-12 w-12 text-[#9C6B2E]/60" />
                              </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                            {/* Floating Duration Badge on Image */}
                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#9C6B2E] shadow-sm border border-white/60">
                                <Clock className="h-3 w-3 text-[#9C6B2E]" />
                                {courseDuration}
                              </span>
                            </div>
                          </div>

                          {/* Text Contents Below Image */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              {enrollment.course_details?.category && (
                                <p className="text-[11px] font-bold tracking-wider uppercase text-[#9C6B2E] mb-1">
                                  {enrollment.course_details.category}
                                </p>
                              )}
                              <h4 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#9C6B2E] transition-colors">
                                {courseTitle}
                              </h4>

                              {/* Approval Status Pills */}
                              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold capitalize ${
                                    branchApproval === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : branchApproval === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  {branchApproval === 'approved'
                                    ? 'Branch admin approved'
                                    : branchApproval === 'rejected'
                                    ? 'Branch admin rejected'
                                    : 'Branch admin approval pending'}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold capitalize ${
                                    superApproval === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : superApproval === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  {superApproval === 'approved'
                                    ? 'Super admin approved'
                                    : superApproval === 'rejected'
                                    ? 'Super admin rejected'
                                    : 'Super admin approval pending'}
                                </span>
                              </div>
                            </div>

                            {/* Action Button: View Details (Triggers Payment Modal) */}
                            <div className="mt-5 pt-3.5 border-t border-[#E3DDD0] flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3.5">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-[#8A8175] block leading-none mb-1">
                                    Paid Amount
                                  </span>
                                  <span className="text-sm font-extrabold text-emerald-700">
                                    {formatCurrency(enrollment.total_paid || 0)}
                                  </span>
                                </div>
                                {Number(enrollment.balance_amount) > 0 && enrollment.payment_plan === 'installment' && (
                                  <div className="border-l border-[#E3DDD0] pl-3.5">
                                    <span className="text-[10px] uppercase font-bold text-[#8A8175] block leading-none mb-1">
                                      Balance Due
                                    </span>
                                    <span className="text-sm font-extrabold text-[#9C6B2E]">
                                      {formatCurrency(enrollment.balance_amount)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(enrollment)}
                                className="rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                {Number(enrollment.balance_amount) > 0 && enrollment.payment_plan === 'installment'
                                  ? 'View & Pay'
                                  : 'View'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Assignments Column (if assignments exist) */}
            {assignments.length > 0 && (
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-[#E3DDD0] bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8F4] border border-[#E3DDD0] text-[#9C6B2E]">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                          Assignments
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {assignments.length} total tasks
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/student-dashboard/assignments"
                      className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] transition"
                    >
                      See all
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {assignments.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id || item.assignment_id || idx}
                        className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3 text-xs space-y-1 hover:border-[#9C6B2E] hover:bg-white transition"
                      >
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span className="truncate max-w-[140px]">
                            {item.course?.course_title || item.course_title || 'Course task'}
                          </span>
                          <span className="font-semibold text-[#9C6B2E]">
                            Due: {formatDate(item.due_date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>

      {/* 5. Centered Payment & Enrollment Details Modal (Rendered with createPortal) */}
      {selectedPaymentEnrollment &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 sa-fade">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleClosePaymentModal}
            />
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl overflow-hidden animate-[modalPop_0.22s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative shrink-0 border-b border-[#E3DDD0] bg-[#FAF8F4] px-6 py-5 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EDE4] border border-[#E3DDD0] px-3 py-1 text-[11px] font-bold text-[#9C6B2E] uppercase tracking-wider">
                        <Receipt className="h-3.5 w-3.5 text-[#9C6B2E]" /> Enrollment & Payment Details
                      </span>
                      {selectedPaymentEnrollment.payment_plan && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                          Plan: {selectedPaymentEnrollment.payment_plan}
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-2xl font-bold tracking-tight text-slate-900"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {selectedPaymentEnrollment.course_title || selectedPaymentEnrollment.course_details?.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {selectedPaymentEnrollment.course_duration && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1EDE4] px-2.5 py-1 text-xs font-semibold text-[#9C6B2E] border border-[#E3DDD0]">
                          <Clock className="h-3.5 w-3.5" /> {selectedPaymentEnrollment.course_duration}
                        </span>
                      )}
                      {selectedPaymentEnrollment.course_details?.category && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {selectedPaymentEnrollment.course_details.category}
                        </span>
                      )}
                      {selectedPaymentEnrollment.course_details?.level && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                          {selectedPaymentEnrollment.course_details.level.trim()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleRefreshInstallments}
                      disabled={isLoadingInstallments}
                      className="rounded-2xl p-2.5 text-slate-400 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition disabled:opacity-50 cursor-pointer"
                      title="Sync latest installment schedule"
                      aria-label="Refresh payment details"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingInstallments ? 'animate-spin text-[#9C6B2E]' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleClosePaymentModal}
                      className="rounded-2xl p-2.5 text-slate-400 hover:bg-[#F1EDE4] hover:text-[#17140F] transition cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
                {/* Dynamic Status / Feedback Banners */}
                {paymentSuccessMessage && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-2xs animate-in fade-in">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-emerald-950">Payment Verified Successfully</p>
                      <p className="text-emerald-800 mt-0.5">{paymentSuccessMessage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentSuccessMessage('')}
                      className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                      aria-label="Dismiss alert"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}


                {isLoadingInstallments && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3.5 py-2 text-xs text-amber-900 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#9C6B2E]" />
                    <span>Synchronizing real-time installment schedule & payment history...</span>
                  </div>
                )}

                {/* SECTION 1: Financial Overview */}
                {(() => {
                  const rawInst = Array.isArray(selectedPaymentEnrollment.installments)
                    ? selectedPaymentEnrollment.installments
                    : Array.isArray(selectedPaymentEnrollment.schedule)
                    ? selectedPaymentEnrollment.schedule
                    : [];

                  const enrichedInst = enrichInstallmentsWithPayments(
                    rawInst,
                    selectedPaymentEnrollment
                  );

                  const totalPaidSum = enrichedInst
                    .filter(isInstallmentPaidOrSubmitted)
                    .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

                  const effectiveTotalPaid = Math.max(
                    Number(selectedPaymentEnrollment.total_paid || 0),
                    totalPaidSum
                  );

                  const totalFeeNum = Number(selectedPaymentEnrollment.total_fee || 0);
                  const effectiveBalance = Math.max(0, totalFeeNum - effectiveTotalPaid);

                  const effectivePaidCount = Math.max(
                    Number(selectedPaymentEnrollment.paid_installment_count || 0),
                    enrichedInst.filter(isInstallmentPaidOrSubmitted).length
                  );
                  const effectiveTotalCount = Number(
                    selectedPaymentEnrollment.installment_count || enrichedInst.length || 1
                  );

                  return (
                    <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#9C6B2E]">
                          Financial Overview
                        </h4>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          {effectiveBalance <= 0 ? '100% Cleared' : 'In Progress'}
                        </span>
                      </div>

                      {/* 3 Metric Cards */}
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
                          <p className="text-xs font-medium text-slate-500">Total Course Fee</p>
                          <p className="mt-1.5 text-2xl font-black text-slate-900">
                            {formatCurrency(totalFeeNum)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">Fixed course fee</p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4.5 shadow-2xs">
                          <p className="text-xs font-semibold text-emerald-800">Total Paid</p>
                          <p className="mt-1.5 text-2xl font-black text-emerald-700">
                            {formatCurrency(effectiveTotalPaid)}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                            {Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)}% settled
                          </p>
                        </div>

                        <div
                          className={`rounded-2xl border p-4.5 shadow-2xs ${
                            effectiveBalance > 0
                              ? 'border-[#E3DDD0] bg-white'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold ${
                              effectiveBalance > 0 ? 'text-[#9C6B2E]' : 'text-slate-500'
                            }`}
                          >
                            Balance Due
                          </p>
                          <p
                            className={`mt-1.5 text-2xl font-black ${
                              effectiveBalance > 0 ? 'text-[#9C6B2E]' : 'text-slate-800'
                            }`}
                          >
                            {formatCurrency(effectiveBalance)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {effectiveBalance > 0
                              ? 'Due on upcoming installments'
                              : 'Zero balance remaining'}
                          </p>
                        </div>
                      </div>

                      {/* Installment Progress Bar */}
                      {effectiveTotalCount > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E3DDD0]">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Installment Progress
                            </span>
                            <span className="text-emerald-700 font-bold">
                              {effectivePaidCount} of {effectiveTotalCount} Paid (
                              {Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SECTION 2: 2-Column Info Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Card A: Transaction Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CreditCard className="h-4 w-4 text-[#9C6B2E]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Transaction Details
                      </h4>
                    </div>

                    <dl className="mt-3.5 divide-y divide-slate-100 text-xs">
                      <div className="flex items-center justify-between py-2.5">
                        <dt className="text-slate-500 font-medium">Payment Plan:</dt>
                        <dd className="font-bold text-slate-900 capitalize">
                          {selectedPaymentEnrollment.payment_plan || 'Full Payment'}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <dt className="text-slate-500 font-medium">Payment Status:</dt>
                        <dd>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            {selectedPaymentEnrollment.status || 'Paid'}
                          </span>
                        </dd>
                      </div>

                      {selectedPaymentEnrollment.razorpay_payment_id && (
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="text-slate-500 font-medium">Payment ID:</dt>
                          <dd className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                              {selectedPaymentEnrollment.razorpay_payment_id}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(selectedPaymentEnrollment.razorpay_payment_id, 'payment_id')
                              }
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                              title="Copy Payment ID"
                              aria-label="Copy Payment ID"
                            >
                              {copiedKey === 'payment_id' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </dd>
                        </div>
                      )}

                      {selectedPaymentEnrollment.razorpay_order_id && (
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="text-slate-500 font-medium">Order ID:</dt>
                          <dd className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                              {selectedPaymentEnrollment.razorpay_order_id}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(selectedPaymentEnrollment.razorpay_order_id, 'order_id')
                              }
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                              title="Copy Order ID"
                              aria-label="Copy Order ID"
                            >
                              {copiedKey === 'order_id' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Card B: Campus & Schedule */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <GraduationCap className="h-4 w-4 text-[#9C6B2E]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Campus & Schedule
                      </h4>
                    </div>

                    <dl className="mt-3.5 divide-y divide-slate-100 text-xs">
                      <div className="flex items-start justify-between py-2.5 gap-2">
                        <dt className="text-slate-500 font-medium shrink-0">Branch:</dt>
                        <dd className="font-bold text-slate-900 text-right">
                          {selectedPaymentEnrollment.branch_details?.name || 'Main Campus'}
                          {selectedPaymentEnrollment.branch_details?.location && (
                            <span className="block text-[11px] font-medium text-slate-500">
                              ({selectedPaymentEnrollment.branch_details.location})
                            </span>
                          )}
                        </dd>
                      </div>

                      {(selectedPaymentEnrollment.course_details?.start_date ||
                        selectedPaymentEnrollment.course_details?.end_date) && (
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="text-slate-500 font-medium">Batch Schedule:</dt>
                          <dd className="font-bold text-slate-900 text-right">
                            {formatDate(selectedPaymentEnrollment.course_details?.start_date)} —{' '}
                            {formatDate(selectedPaymentEnrollment.course_details?.end_date)}
                          </dd>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-2.5">
                        <dt className="text-slate-500 font-medium">Branch Admin Approval:</dt>
                        <dd>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              (selectedPaymentEnrollment.branch_approval_status || '').toLowerCase() ===
                              'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {selectedPaymentEnrollment.branch_approval_status || 'Pending'}
                          </span>
                        </dd>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <dt className="text-slate-500 font-medium">Super Admin Approval:</dt>
                        <dd>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              (selectedPaymentEnrollment.super_admin_approval_status || '').toLowerCase() ===
                              'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {selectedPaymentEnrollment.super_admin_approval_status || 'Pending'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* SECTION 3: Installment Breakdown */}
                {(() => {
                  const rawInstallments = Array.isArray(selectedPaymentEnrollment.installments)
                    ? selectedPaymentEnrollment.installments
                    : Array.isArray(selectedPaymentEnrollment.schedule)
                    ? selectedPaymentEnrollment.schedule
                    : [];

                  const enrichedInstallments = enrichInstallmentsWithPayments(
                    rawInstallments,
                    selectedPaymentEnrollment
                  );

                  const installmentsList = [...enrichedInstallments].sort(
                    (a, b) => (Number(a.installment_number) || 0) - (Number(b.installment_number) || 0)
                  );

                  const hasInstallments = installmentsList.length > 0;

                  if (!hasInstallments) {
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">One-Time Lump Sum Payment</p>
                        <p className="mt-1">
                          This enrollment was paid in full. No recurring installments are scheduled.
                        </p>
                      </div>
                    );
                  }

                  // Find any installment that has been paid by student and is awaiting Branch Admin review
                  const pendingReviewInstallment = installmentsList.find(
                    (inst) => getInstallmentPaymentDetails(inst).isPendingReview
                  );

                  // The next unpaid installment is the first one where isPaid is false
                  const firstUnpaidInstallment = installmentsList.find(
                    (inst) => !getInstallmentPaymentDetails(inst).isPaid
                  );

                  const nextUnpaidInstallment = firstUnpaidInstallment;

                  const paidCount = installmentsList.filter(
                    (inst) => getInstallmentPaymentDetails(inst).isPaid
                  ).length;

                  const totalClearedAmount = installmentsList
                    .filter((inst) => getInstallmentPaymentDetails(inst).isPaid)
                    .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

                  const displayCleared = Math.max(
                    Number(selectedPaymentEnrollment.total_paid || 0),
                    totalClearedAmount
                  );

                  return (
                    <div className="space-y-4">
                      {/* Top Banner 1: Verification In Progress (when an installment is paid and awaiting review) */}
                      {pendingReviewInstallment && (
                        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-[#FAF8F4] via-[#FDF6E9] to-[#FAF8F4] p-4.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                                  Verification In Progress
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  Installment #{pendingReviewInstallment.installment_number || 3}
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-slate-900">
                                Amount Paid: {formatCurrency(pendingReviewInstallment.amount)}
                                {pendingReviewInstallment.payment_date && (
                                  <span className="text-xs font-normal text-slate-600 ml-2">
                                    (Paid on {formatDate(pendingReviewInstallment.payment_date)})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-amber-900 font-medium">
                                Your payment is completed. Branch admin will verify soon.
                                {pendingReviewInstallment.payment_reference && (
                                  <span className="font-mono text-slate-600 ml-1.5 font-medium">
                                    (Ref: {pendingReviewInstallment.payment_reference})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-900 shrink-0">
                            <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                            Branch Admin Approval: Pending
                          </div>
                        </div>
                      )}

                      {/* Top Banner 2: Action Required for next unpaid installment (only if NO payment is currently under review) */}
                      {!pendingReviewInstallment && nextUnpaidInstallment && Number(selectedPaymentEnrollment.balance_amount || nextUnpaidInstallment.amount || 1) > 0 && (
                        <div className="rounded-2xl border border-[#9C6B2E]/40 bg-gradient-to-r from-[#FAF8F4] via-[#F6EFE3] to-[#FAF8F4] p-4.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9C6B2E] text-white shadow-xs">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#9C6B2E] text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                                  Action Required
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  Installment #{nextUnpaidInstallment.installment_number || 1}
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-slate-900">
                                Amount Due: {formatCurrency(nextUnpaidInstallment.amount)}
                                {nextUnpaidInstallment.due_date && (
                                  <span className="text-xs font-normal text-slate-600 ml-2">
                                    (Due: {formatDate(nextUnpaidInstallment.due_date)})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Pay securely online via Razorpay (UPI, Credit/Debit Cards, NetBanking).
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={paymentProcessing}
                            onClick={() => handlePayInstallment(nextUnpaidInstallment)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9C6B2E] px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#855923] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                          >
                            {paymentProcessing && payingInstallmentNumber === (nextUnpaidInstallment.installment_number || 1) ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing Payment...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4" />
                                <span>Pay {formatCurrency(nextUnpaidInstallment.amount)} Now</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Installment Grid Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#9C6B2E]" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Installment Breakdown ({paidCount}/{installmentsList.length} Paid)
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            {formatCurrency(displayCleared)} Cleared
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {installmentsList.map((inst, index) => {
                            const statusInfo = getInstallmentPaymentDetails(inst);
                            const isPaid = statusInfo.isPaid;
                            const isPendingReview = statusInfo.isPendingReview;
                            const isRejected = statusInfo.isRejected;
                            const isNextUnpaid =
                              !isPaid &&
                              !isPendingReview &&
                              !pendingReviewInstallment &&
                              nextUnpaidInstallment &&
                              (
                                (nextUnpaidInstallment.installment_id && inst.installment_id && nextUnpaidInstallment.installment_id === inst.installment_id) ||
                                (nextUnpaidInstallment.installment_number && inst.installment_number && Number(nextUnpaidInstallment.installment_number) === Number(inst.installment_number)) ||
                                inst === firstUnpaidInstallment
                              );

                            return (
                              <div
                                key={inst.installment_id || index}
                                className={`flex flex-col justify-between rounded-xl border p-3.5 text-xs transition ${
                                  isRejected
                                    ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400 ring-1 ring-rose-200/60 shadow-2xs'
                                    : isPendingReview
                                    ? 'border-amber-300 bg-amber-50/25 hover:border-amber-400 shadow-2xs'
                                    : isPaid
                                    ? 'border-emerald-100 bg-emerald-50/25 hover:border-emerald-300'
                                    : isNextUnpaid
                                    ? 'border-[#9C6B2E] ring-2 ring-[#9C6B2E]/20 bg-gradient-to-br from-[#FFFDF9] via-white to-[#FDF8EF] shadow-2xs'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-slate-900">
                                        Installment #{inst.installment_number || index + 1}
                                      </span>
                                      {/* Main status badge */}
                                      {isRejected ? (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                          <XCircle className="h-3 w-3 text-rose-600" />
                                          Payment Rejected
                                        </span>
                                      ) : isPaid ? (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                                          Paid
                                        </span>
                                      ) : isNextUnpaid ? (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300/80">
                                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                          Due Next
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700">
                                          <Clock className="h-3 w-3 text-slate-500" />
                                          {inst.status || 'Pending'}
                                        </span>
                                      )}

                                      {/* Branch Admin Approval: Pending badge */}
                                      {isPendingReview && (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                          <Clock className="h-2.5 w-2.5 text-amber-700" />
                                          Branch Admin Approval: Pending
                                        </span>
                                      )}
                                    </div>

                                    <div className="space-y-0.5 text-[11px] text-slate-500">
                                      <p>Due: {formatDate(inst.due_date)}</p>
                                      {(statusInfo.paymentDate || inst.paid_date || inst.payment_date) && (
                                        <p className={isRejected ? "text-rose-600 font-medium" : "text-emerald-700 font-semibold"}>
                                          • {isRejected ? "Attempted on: " : "Paid on: "}
                                          {formatDate(statusInfo.paymentDate || inst.paid_date || inst.payment_date)}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-slate-900">
                                      {formatCurrency(inst.amount)}
                                    </p>
                                    {isPaid && (
                                      <p className="text-[10px] font-semibold text-emerald-700">
                                        Paid: {formatCurrency(statusInfo.paidAmount || inst.amount)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Rejection Notice Box */}
                                {isRejected && (
                                  <div className="mt-2.5 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-900 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-rose-950">
                                      <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                      <span>Payment Rejected by Branch Admin</span>
                                    </div>
                                    <p className="text-rose-800 pl-5">
                                      <span className="font-semibold text-rose-950">Reason: </span>
                                      {statusInfo.rejectionReason || "Payment could not be verified in branch bank records"}
                                    </p>
                                  </div>
                                )}

                                {/* Small description for Branch Admin verification */}
                                {isPendingReview && (
                                  <div className="mt-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 p-2.5 text-[11px] text-amber-900 space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                                      <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                      <span>Your payment is completed. Branch admin will verify soon.</span>
                                    </div>
                                    {statusInfo.paymentReference && (
                                      <p className="text-[10px] text-amber-800/80 font-mono pl-5">
                                        Ref: {statusInfo.paymentReference}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Action button for next unpaid installment (if ready) */}
                                {isNextUnpaid && (
                                  <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between gap-2">
                                    <span className="text-[10px] text-amber-900 font-semibold flex items-center gap-1">
                                      <CreditCard className="h-3 w-3 text-[#9C6B2E]" />
                                      Ready to pay
                                    </span>
                                    <button
                                      type="button"
                                      disabled={paymentProcessing}
                                      onClick={() => handlePayInstallment(inst)}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9C6B2E] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#855923] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                    >
                                      {paymentProcessing && payingInstallmentNumber === (inst.installment_number || index + 1) ? (
                                        <>
                                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                          <span>Processing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CreditCard className="h-3 w-3" />
                                          <span>Pay {formatCurrency(inst.amount)}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {!isPaid && !isNextUnpaid && (
                                  <div className="mt-2 text-right">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {pendingReviewInstallment
                                        ? `Upcoming (Verification of #${pendingReviewInstallment.installment_number || 3} in progress)`
                                        : `Upcoming (Pay #${firstUnpaidInstallment?.installment_number || 1} first)`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-[#E3DDD0] bg-[#FAF8F4] px-6 py-4 sm:px-8 gap-3">
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Need assistance with your enrollment or invoice? Contact campus admin.
                </p>
                <div className="flex items-center gap-2.5 justify-end">
                  {(() => {
                    const rawInst = Array.isArray(selectedPaymentEnrollment.installments)
                      ? selectedPaymentEnrollment.installments
                      : Array.isArray(selectedPaymentEnrollment.schedule)
                      ? selectedPaymentEnrollment.schedule
                      : [];

                    const enrichedInst = enrichInstallmentsWithPayments(
                      rawInst,
                      selectedPaymentEnrollment
                    );

                    const pendingReview = enrichedInst.find(
                      (inst) => getInstallmentPaymentDetails(inst).isPendingReview
                    );
                    const nextUnpaid = enrichedInst.find(
                      (inst) => !getInstallmentPaymentDetails(inst).isPaid
                    );

                    if (pendingReview) {
                      return (
                        <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2 text-xs font-bold text-amber-900 shadow-2xs">
                          <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                          <span>Installment #{pendingReview.installment_number || 3} Verification Pending</span>
                        </div>
                      );
                    }

                    if (nextUnpaid && Number(selectedPaymentEnrollment.balance_amount || nextUnpaid.amount || 1) > 0) {
                      return (
                        <button
                          type="button"
                          disabled={paymentProcessing}
                          onClick={() => handlePayInstallment(nextUnpaid)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#9C6B2E] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] disabled:opacity-50 cursor-pointer"
                        >
                          {paymentProcessing ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay Next Installment ({formatCurrency(nextUnpaid.amount)})</span>
                            </>
                          )}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-2xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Announcement Detail Modal (Matching Staff Portal Experience) */}
      {selectedAnnouncement && (
        <StudentAnnouncementDetailModal
          announcement={selectedAnnouncement}
          isOpen={Boolean(selectedAnnouncement)}
          onClose={() => setSelectedAnnouncement(null)}
          onNavigateToAll={() => {
            setSelectedAnnouncement(null);
            navigate('/student-dashboard/announcements');
          }}
        />
      )}

      {/* 6. Payment Action Notice / Error Popup Modal */}
      {installmentError &&
        createPortal(
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sa-fade animate-in fade-in">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setInstallmentError('')}
            />
            <div
              className="relative w-full max-w-md rounded-3xl border border-[#E3DDD0] bg-white p-6 shadow-2xl animate-[modalPop_0.22s_ease-out] space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-xs">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 flex-1 pr-6">
                  <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Payment Action Notice
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {installmentError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInstallmentError('')}
                  className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                  aria-label="Close error notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInstallmentError('')}
                  className="w-full sm:w-auto rounded-xl bg-[#9C6B2E] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default StudentDashboard;