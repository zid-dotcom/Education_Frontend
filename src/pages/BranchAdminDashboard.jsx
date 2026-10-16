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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import PremiumWave from "../components/layout/PremiumWave";
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
.ba-wave  { transform-origin: 70% 80%; animation: ba-wave 2s ease-in-out 1.2s 2; }
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

/* 10 overview statistic cards mapped to overview.* fields */
const OVERVIEW_METRICS = [
  { key: "total_courses",        label: "Total Courses",        helper: "Programs managed",          icon: BookOpen,      color: "#b0803a", bg: "#f7efe0" },
  { key: "total_students",       label: "Total Students",       helper: "Learners in your branch",   icon: Users,         color: "#17140f", bg: "#f1ede4" },
  { key: "total_enrollments",    label: "Total Enrollments",    helper: "All enrollments",           icon: ClipboardList, color: "#6366f1", bg: "#eef0ff" },
  { key: "total_staff",          label: "Total Staff",          helper: "Active branch team",        icon: UserRoundCog,  color: "#a24a3a", bg: "#f8eae5" },
  { key: "today_enrollments",    label: "Today's Enrollments",  helper: "Enrolled today",            icon: CalendarPlus,  color: "#0d9488", bg: "#e6f7f5" },
  { key: "today_new_students",   label: "Today's New Students", helper: "Registered today",          icon: UserPlus,      color: "#7c3aed", bg: "#f0ebff" },
  { key: "fully_paid_students",  label: "Fully Paid Students",  helper: "Completed payments",        icon: UserCheck,     color: "#5c7a5a", bg: "#eef2ea" },
  { key: "students_with_balance",label: "Students With Balance",helper: "Partial payments",          icon: Wallet,        color: "#d97706", bg: "#fef3c7" },
  { key: "due_students",         label: "Due Students",         helper: "Awaiting payment",          icon: Clock,         color: "#dc2626", bg: "#fef2f2" },
  { key: "due_installments",     label: "Due Installments",     helper: "Pending installments",      icon: IndianRupee,   color: "#be185d", bg: "#fce7f3" },
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
        {/* ---- Header ---- */}
        <header
          className="ba-fade flex flex-col gap-5 px-6 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10"
          style={{ borderBottom: "1px solid #e3ddd0" }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                Dashboard overview
              </h1>
              {branchName && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "#f1ede4", color: "#825a25", border: "1px solid #e3ddd0" }}
                >
                  <Building2 className="h-3 w-3" />
                  {branchName}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-md text-[0.95rem]" style={{ color: "#8a8175" }}>
              A clear view of {branchName} activity and performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium" style={{ color: "#17140f" }}>{displayName}</p>
              <p className="text-xs font-semibold" style={{ color: "#9c6b2e" }}>{branchName}</p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8 sm:px-10">
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
              {/* ---- Welcome ---- */}
              <section className="ba-rise">
                <div
                  className="mb-2.5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider"
                  style={{ background: "#f3ede2", color: "#9c6b2e", border: "1px solid #e2d7c5" }}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{branchName}</span>
                </div>
                <h2
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl leading-tight sm:text-4xl"
                  style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                >
                  Welcome back, {displayName}
                  <PremiumWave />
                </h2>
                <div className="ba-grow mt-3 h-0.5 w-24 rounded-full" style={{ background: "#9c6b2e" }} />
                <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "#5b5346" }}>
                  Here is what is happening at{" "}
                  <span style={{ color: "#17140f", fontWeight: 600 }}>{branchName}</span>. Keep your
                  courses, students and team moving from one place.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium" style={{ color: "#5b5346" }}>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-semibold shadow-2xs"
                    style={{ border: "1px solid #d9ceb8", background: "#fbf9f4", color: "#17140f" }}
                  >
                    <Building2 className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                    {branchName}
                  </span>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2"
                    style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                    {dashboard.branch_location || "Location unavailable"}
                  </span>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2"
                    style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
                  >
                    <Phone className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                    {dashboard.branch_phone || "Phone unavailable"}
                  </span>
                  {dashboard.branch_email && (
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2"
                      style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
                    >
                      <Mail className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                      {dashboard.branch_email}
                    </span>
                  )}
                </div>
              </section>

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
              <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {OVERVIEW_METRICS.map(({ key, label, helper, icon: Icon, color, bg }, index) => (
                  <article
                    key={key}
                    className="ba-card ba-rise rounded-2xl p-5"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e3ddd0",
                      animationDelay: `${100 + index * 60}ms`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs" style={{ color: "#a39a8c" }}>{label}</p>
                        <p
                          className="mt-2 text-3xl leading-none tabular-nums"
                          style={{ ...serif, fontWeight: 500, color }}
                        >
                          <CountUp value={overview[key]} />
                        </p>
                      </div>
                      <span
                        className="ba-icon flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                        style={{ background: bg, color }}
                      >
                        <Icon className="h-[1.125rem] w-[1.125rem]" />
                      </span>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: "#8a8175" }}>{helper}</p>
                  </article>
                ))}
              </section>

              {/* ---- Total Due Amount (highlighted monetary card) ---- */}
              <section
                className="ba-card ba-rise rounded-2xl p-6 sm:p-7"
                style={{
                  background: "linear-gradient(135deg, #17140f 0%, #2d2519 100%)",
                  border: "1px solid #3d3529",
                  color: "#faf8f4",
                  animationDelay: "700ms",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span
                      className="ba-icon flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
                      style={{ background: "rgba(244,185,66,.15)", color: "#f4b942" }}
                    >
                      <IndianRupee className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="text-xs font-medium tracking-wide uppercase" style={{ color: "#d9b77b" }}>
                        Total Due Amount
                      </p>
                      <p
                        className="mt-1 text-3xl sm:text-4xl leading-none tabular-nums"
                        style={{ ...serif, fontWeight: 500, color: "#f4b942" }}
                      >
                        <CountUp value={overview.total_due_amount} currency />
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-5 max-w-xs" style={{ color: "#a39a8c" }}>
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