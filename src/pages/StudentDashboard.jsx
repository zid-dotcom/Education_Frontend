import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  Copy,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Receipt,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCourseImageUrl } from '../services/courses';
import { getMyEnrollmentsApi } from '../services/enrollments';
import { getUserAnnouncementsApi } from '../services/userannouncements';
import { getStudentAssignmentsApi } from '../services/studentassignments';

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

const StudentDashboard = () => {
  useDashboardFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementCount, setAnnouncementCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPaymentEnrollment, setSelectedPaymentEnrollment] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close modal on Escape key and lock background scrolling
  useEffect(() => {
    if (selectedPaymentEnrollment) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedPaymentEnrollment(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedPaymentEnrollment]);

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

        const [enrollmentRes, assignmentsRes, announcementsRes] = await Promise.allSettled([
          getMyEnrollmentsApi(token),
          getStudentAssignmentsApi(token),
          getUserAnnouncementsApi(token),
        ]);

        if (isMounted) {
          if (enrollmentRes.status === 'fulfilled') {
            setEnrollments(Array.isArray(enrollmentRes.value) ? enrollmentRes.value : []);
          } else {
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

          if (announcementsRes.status === 'fulfilled') {
            const data = announcementsRes.value;
            const list = Array.isArray(data) ? data : [];
            setAnnouncements(list);
            setAnnouncementCount(list.length);
          } else {
            setAnnouncements([]);
            setAnnouncementCount(null);
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
  const assignmentCount = assignments.length;

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
    <div
      className="h-screen max-h-screen w-full bg-[#EDE7F6] p-2 sm:p-2.5 lg:p-3 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900 overflow-hidden"
    >
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
          background: rgba(124, 58, 237, 0.2);
          border-radius: 9999px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.4);
        }
      `}</style>

      {/* Main White Rounded Dashboard Shell (Fills Viewport with Consistent 8-12px Lavender Border) */}
      <div className="w-full flex-1 bg-white rounded-[1.75rem] sm:rounded-[2.25rem] lg:rounded-[2.5rem] shadow-[0_15px_45px_-10px_rgba(110,80,200,0.12)] p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 lg:gap-5 border border-purple-100/70 relative h-full max-h-full min-h-0 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* 1. Purple Gradient Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-60 xl:w-64 shrink-0 flex-col rounded-[2rem] bg-gradient-to-b from-[#8E53F0] via-[#7B3FE4] to-[#6525C5] p-5 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:h-full lg:max-h-full lg:overflow-y-auto lg:shadow-xl lg:shadow-purple-600/15 ${
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-inner transition group-hover:scale-105 group-hover:bg-white/25">
                <GraduationCap className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight truncate">
                  AurumFx
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 truncate">
                  Student Portal
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"
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
              className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10 transition"
            >
              <LayoutDashboard className="h-4 w-4 text-[#7B3FE4]" />
              <span>Dashboard</span>
            </Link>

            {/* Assignments */}
            <Link
              to="/student-dashboard/assignments"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="flex items-center gap-3.5">
                <ClipboardList className="h-4 w-4 text-white/80" />
                <span>Assignments</span>
              </span>
              {assignmentCount > 0 && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black text-white">
                  {assignmentCount}
                </span>
              )}
            </Link>

            {/* Browse Courses */}
            <Link
              to="/student-dashboard/courses"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <BookOpen className="h-4 w-4 text-white/80" />
              <span>Browse courses</span>
            </Link>

            {/* Announcements */}
            <Link
              to="/student-dashboard/announcements"
              onClick={closeSidebar}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="flex items-center gap-3.5">
                <Bell className="h-4 w-4 text-white/80" />
                <span>Announcements</span>
              </span>
              {announcementCount !== null && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black text-white">
                  {announcementCount}
                </span>
              )}
            </Link>

            {/* Enquiries */}
            <Link
              to="/student-dashboard/enquiries"
              onClick={closeSidebar}
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <MessageCircle className="h-4 w-4 text-white/80" />
              <span>Enquiries</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-2 border-t border-white/15 pt-5">
            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-white/80" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* 2. Main Dashboard Content Column */}
        <div className="min-w-0 flex-1 flex flex-col h-full max-h-full min-h-0 overflow-hidden">
          {/* Top Header */}
          <header className="flex items-center justify-between gap-4 pb-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl bg-purple-50 p-2 text-purple-700 hover:bg-purple-100 transition lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Student Portal
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard
                </h2>
              </div>
            </div>

            {/* Centered Search Bar */}
            <div className="relative flex-1 max-w-sm sm:max-w-md mx-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-full bg-[#F5F2FC] border border-purple-100/90 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-purple-300 focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
              />
            </div>

            {/* Profile & Notification Widget */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/student-dashboard/announcements"
                className="relative rounded-full bg-[#F5F2FC] p-2.5 text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition"
                aria-label="View announcements"
              >
                <Bell className="h-4 w-4" />
                {announcementCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white font-extrabold text-sm shadow-md ring-2 ring-purple-100">
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
            {/* 3. Welcome Banner (Purple Gradient with 3D Illustration) */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#8651E8] via-[#7B3FE4] to-[#9962F7] p-6 sm:p-8 text-white shadow-lg shadow-purple-500/15 mb-7">
            {/* Background Decorative Glow Accents */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute right-40 bottom-0 h-40 w-40 rounded-full bg-purple-400/20 blur-xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-lg space-y-1.5">
                <p className="text-xs font-semibold text-purple-200 tracking-wide uppercase">
                  {currentDateFormatted}
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black tracking-tight text-white leading-tight">
                  Welcome back, {studentFirstName}!
                </h1>
                <p className="text-xs sm:text-sm text-purple-100/90 font-normal">
                  Always stay updated in your student portal
                </p>

                {/* Quick Status Pill */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/25">
                    <BookOpen className="h-3 w-3 text-purple-200" />
                    {totalEnrolled} Active {totalEnrolled === 1 ? 'Course' : 'Courses'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/25">
                    <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                    {totalBalance === 0 ? 'Fees 100% Cleared' : `Balance: ${formatCurrency(totalBalance)}`}
                  </span>
                </div>
              </div>

              {/* 3D-styled Study Composition Graphic (Matching Reference) */}
              <div className="hidden sm:flex items-center justify-center shrink-0 pr-2">
                <div className="relative flex items-center justify-center">
                  {/* Floating decorative elements */}
                  <div className="absolute -top-3 -left-3 h-5 w-5 rounded-full bg-amber-400 shadow-md animate-bounce" />
                  <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-teal-300 shadow-md" />
                  <div className="absolute top-1/2 -right-6 h-6 w-6 rounded-full bg-rose-400/90 shadow-md" />

                  {/* Center Floating Cap & Book Emblem */}
                  <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-lg border border-white/30 shadow-2xl shadow-purple-900/30 transform hover:rotate-2 transition duration-300">
                    <GraduationCap className="h-16 w-16 sm:h-20 sm:w-20 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Top 4 Stat Cards (Current Purple/Lavender Design) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-7">
            {/* Stat 1: Total Enrolled */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:shadow-md">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Total Enrolled
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalEnrolled}</p>
                <p className="mt-1 text-xs text-slate-400 font-medium">Active enrolled courses</p>
              </div>
            </div>

            {/* Stat 2: Total Paid (Featured with Purple Border) */}
            <div className="rounded-2xl border-2 border-[#7C3AED] bg-white p-5 shadow-[0_12px_30px_rgba(124,58,237,0.12)] flex flex-col justify-between transition hover:scale-[1.01]">
              <div className="flex items-center justify-between text-[#7C3AED]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Total Paid
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED]">
                  <CreditCard className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-[#7C3AED]">
                  {formatCurrency(totalInvested)}
                </p>
                <p className="mt-1 text-xs text-purple-600 font-medium">Total fees paid so far</p>
              </div>
            </div>

            {/* Stat 3: Balance Due */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:shadow-md">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Balance Due
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatCurrency(totalBalance)}
                </p>
                <p className="mt-1 text-xs text-slate-400 font-medium">
                  {totalBalance === 0 ? 'All course dues cleared' : 'Outstanding tuition balance'}
                </p>
              </div>
            </div>

            {/* Stat 4: Pending Approvals */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:shadow-md">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Pending Approvals
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{pendingReviewCount}</p>
                <p className="mt-1 text-xs text-slate-400 font-medium">Awaiting admin review</p>
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
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 transition flex items-center gap-1"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-600 mb-3" />
                    <p className="text-xs font-bold text-slate-600">
                      Loading your enrolled courses...
                    </p>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-[#FAF8FE] p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-purple-300 mb-2.5" />
                    <p className="text-sm font-bold text-slate-800">No courses match your view</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Explore programs currently open for registration
                    </p>
                    <Link
                      to="/student-dashboard/courses"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6D28D9] transition"
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
                          className="flex flex-col justify-between rounded-2xl bg-[#F4EEFD] border border-purple-200/80 p-5 hover:border-purple-400 hover:shadow-md transition group"
                        >
                          <div>
                            {/* Card Top: Details + Image */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <span className="inline-block rounded-md bg-purple-200/60 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                  {courseDuration}
                                </span>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                                  {courseTitle}
                                </h4>
                                {enrollment.course_details?.category && (
                                  <p className="text-[11px] font-medium text-purple-600">
                                    {enrollment.course_details.category}
                                  </p>
                                )}
                              </div>

                              {/* Course Thumbnail or Icon */}
                              <div className="shrink-0 h-16 w-20 rounded-xl bg-white/80 border border-purple-200/70 overflow-hidden shadow-xs flex items-center justify-center">
                                {courseImg ? (
                                  <img
                                    src={courseImg}
                                    alt={courseTitle}
                                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <BookOpen className="h-7 w-7 text-purple-400" />
                                )}
                              </div>
                            </div>

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
                          <div className="mt-5 pt-3 border-t border-purple-200/50 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-700">
                              {formatCurrency(enrollment.total_paid || enrollment.total_fee)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentEnrollment(enrollment)}
                              className="rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#6D28D9] flex items-center gap-1.5"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              View
                            </button>
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
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
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
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 transition"
                    >
                      See all
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {assignments.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id || item.assignment_id || idx}
                        className="rounded-xl border border-purple-100/70 bg-[#F9F7FD] p-3 text-xs space-y-1 hover:border-purple-300 transition"
                      >
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span className="truncate max-w-[140px]">
                            {item.course?.course_title || item.course_title || 'Course task'}
                          </span>
                          <span className="font-semibold text-purple-600">
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
    </div>

      {/* 5. Centered Payment & Enrollment Details Modal (Rendered with createPortal) */}
      {selectedPaymentEnrollment &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/65 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPaymentEnrollment(null);
            }}
          >
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-purple-200 bg-white shadow-2xl overflow-hidden animate-[modalPop_0.22s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative shrink-0 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 px-6 py-5 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                        <Receipt className="h-3.5 w-3.5 text-purple-700" /> Enrollment & Payment Details
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
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-200/70">
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

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentEnrollment(null)}
                    className="shrink-0 rounded-2xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
                {/* SECTION 1: Financial Overview */}
                <div className="rounded-2xl border border-purple-100 bg-[#FBF9FE] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                      Financial Overview
                    </h4>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      {Number(selectedPaymentEnrollment.balance_amount) <= 0 ? '100% Cleared' : 'In Progress'}
                    </span>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
                      <p className="text-xs font-medium text-slate-500">Total Course Fee</p>
                      <p className="mt-1.5 text-2xl font-black text-slate-900">
                        {formatCurrency(selectedPaymentEnrollment.total_fee)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Fixed course fee</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4.5 shadow-2xs">
                      <p className="text-xs font-semibold text-emerald-800">Total Paid</p>
                      <p className="mt-1.5 text-2xl font-black text-emerald-700">
                        {formatCurrency(selectedPaymentEnrollment.total_paid)}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                        {Math.round(
                          ((Number(selectedPaymentEnrollment.total_paid) || 0) /
                            (Number(selectedPaymentEnrollment.total_fee) || 1)) *
                            100
                        )}% settled
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border p-4.5 shadow-2xs ${
                        Number(selectedPaymentEnrollment.balance_amount) > 0
                          ? 'border-purple-200 bg-purple-50/70'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          Number(selectedPaymentEnrollment.balance_amount) > 0
                            ? 'text-purple-900'
                            : 'text-slate-500'
                        }`}
                      >
                        Balance Due
                      </p>
                      <p
                        className={`mt-1.5 text-2xl font-black ${
                          Number(selectedPaymentEnrollment.balance_amount) > 0
                            ? 'text-purple-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {formatCurrency(selectedPaymentEnrollment.balance_amount)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {Number(selectedPaymentEnrollment.balance_amount) > 0
                          ? 'Due on upcoming installments'
                          : 'Zero balance remaining'}
                      </p>
                    </div>
                  </div>

                  {/* Installment Progress Bar */}
                  {Number(selectedPaymentEnrollment.installment_count) > 0 && (
                    <div className="space-y-2 pt-2 border-t border-purple-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Installment Progress
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {selectedPaymentEnrollment.paid_installment_count || 0} of{' '}
                          {selectedPaymentEnrollment.installment_count} Paid (
                          {Math.round(
                            ((Number(selectedPaymentEnrollment.total_paid) || 0) /
                              (Number(selectedPaymentEnrollment.total_fee) || 1)) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((Number(selectedPaymentEnrollment.total_paid) || 0) /
                                  (Number(selectedPaymentEnrollment.total_fee) || 1)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: 2-Column Info Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Card A: Transaction Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CreditCard className="h-4 w-4 text-purple-700" />
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
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
                      <GraduationCap className="h-4 w-4 text-purple-700" />
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
                {Array.isArray(selectedPaymentEnrollment.installments) &&
                selectedPaymentEnrollment.installments.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-purple-700" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Installment Breakdown ({selectedPaymentEnrollment.paid_installment_count || 0}/
                          {selectedPaymentEnrollment.installment_count ||
                            selectedPaymentEnrollment.installments.length}{' '}
                          Paid)
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatCurrency(selectedPaymentEnrollment.total_paid)} Cleared
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedPaymentEnrollment.installments.map((inst, index) => {
                        const isPaid = (inst.status || '').toLowerCase() === 'paid';
                        return (
                          <div
                            key={inst.installment_id || index}
                            className={`flex items-center justify-between rounded-xl border p-3.5 text-xs transition ${
                              isPaid
                                ? 'border-emerald-100 bg-emerald-50/25 hover:border-emerald-300'
                                : 'border-slate-200 bg-white hover:border-purple-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  Installment #{inst.installment_number || index + 1}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {isPaid ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-amber-700" />
                                  )}
                                  {inst.status || (isPaid ? 'Paid' : 'Pending')}
                                </span>
                              </div>
                              <div className="space-y-0.5 text-[11px] text-slate-500">
                                <p>Due: {formatDate(inst.due_date)}</p>
                                {inst.paid_date && (
                                  <p className="text-emerald-700 font-semibold">
                                    • Paid on: {formatDate(inst.paid_date)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">{formatCurrency(inst.amount)}</p>
                              {inst.paid_amount && Number(inst.paid_amount) > 0 && (
                                <p className="text-[10px] font-medium text-slate-400">
                                  Paid: {formatCurrency(inst.paid_amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">One-Time Lump Sum Payment</p>
                    <p className="mt-1">
                      This enrollment was paid in full. No recurring installments are scheduled.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Need assistance with your enrollment or invoice? Contact campus admin.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentEnrollment(null)}
                  className="w-full sm:w-auto rounded-xl bg-[#7C3AED] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#6D28D9] shadow-sm"
                >
                  Close
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