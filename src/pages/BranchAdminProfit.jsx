import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Circle,
  IndianRupee,
  Loader2,
  Mail,
  Menu,
  Phone,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getBranchAdminProfitApi } from "../services/branchadminprofit";

/* Same display-font pairing used on the staff, attendance and purchases
   pages (Fraunces headings, Inter body). No-op if already injected. */
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
@keyframes ba-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ba-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ba-pop {
  from { opacity: 0; transform: translateY(16px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ba-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes ba-toast {
  from { opacity: 0; transform: translateY(-6px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ba-rise  { opacity: 0; animation: ba-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-pop   { animation: ba-pop .35s cubic-bezier(.2,.7,.2,1) both; }
.ba-toast { animation: ba-toast .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}
.ba-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.ba-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.28);
  transform: translateY(-2px);
}
.ba-press { transition: transform .15s ease, opacity .2s ease, background-color .2s ease; }
.ba-press:hover:not(:disabled) { transform: translateY(-1px); }
.ba-press:active:not(:disabled) { transform: translateY(0) scale(.97); }
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-pop, .ba-toast, .ba-skeleton { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-press { transition: none !important; }
  .ba-card:hover { transform: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`))
    : "Selected date";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatOptionalCurrency = (value) =>
  value == null || value === "" ? "Not provided" : formatCurrency(value);

const valueFor = (enrollment, keys) => {
  const key = keys.find(
    (candidate) => enrollment?.[candidate] != null && enrollment[candidate] !== "",
  );
  return key ? enrollment[key] : "Not provided";
};

const STATUS_META = {
  paid: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  approved: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  success: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  captured: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  pending: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  failed: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  rejected: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
};
const statusMeta = (status) =>
  STATUS_META[String(status || "").toLowerCase()] || {
    dot: "#a39a8c",
    text: "#8a8175",
    bg: "#f1ede4",
  };

const StatusPill = ({ status }) => {
  const meta = statusMeta(status);
  const label = String(status || "Unknown");
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Circle className="h-2 w-2" fill={meta.dot} stroke="none" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs" style={{ color: "#a39a8c" }}>
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm font-medium" style={{ color: "#17140f" }}>
      {value || "Not provided"}
    </dd>
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <h3
    className="flex items-center gap-2 pb-3 text-sm font-medium"
    style={{ color: "#17140f", borderBottom: "1px solid #e3ddd0" }}
  >
    {Icon && <Icon className="h-4 w-4" style={{ color: "#9c6b2e" }} />}
    {children}
  </h3>
);

const EnrollmentDetailsModal = ({ enrollment, onClose }) => {
  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!enrollment) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [enrollment, onClose]);

  if (!enrollment) return null;
  const name = valueFor(enrollment, ["name", "student_name", "full_name"]);

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profit-enrollment-details-title"
      onClick={onClose}
    >
      <div
        className="ba-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8"
        style={{
          background: "#ffffff",
          border: "1px solid #e3ddd0",
          boxShadow: "0 30px 80px -30px rgba(23,20,15,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-[#f1ede4] ${FOCUS_RING}`}
          style={{ color: "#a39a8c" }}
          aria-label="Close enrollment details"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 pr-10">
          <span
            aria-hidden="true"
            className="mt-1 h-12 w-1 shrink-0 rounded-full"
            style={{ background: "#9c6b2e" }}
          />
          <div className="min-w-0">
            <p className="text-xs" style={{ color: "#a39a8c" }}>
              Enrollment details
            </p>
            <h2
              id="profit-enrollment-details-title"
              className="mt-1 break-words text-2xl leading-tight"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              {name}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
              {valueFor(enrollment, ["course_title", "course_name"])}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-7 sm:grid-cols-2">
          <section>
            <SectionTitle icon={UserRound}>Student</SectionTitle>
            <dl className="mt-4 grid gap-4">
              <DetailItem label="Full name" value={name} />
              <DetailItem label="Qualification" value={enrollment.highest_qualification} />
              <DetailItem label="Parent / guardian" value={enrollment.parent_name} />
              <DetailItem label="Parent phone" value={enrollment.parent_phone} />
            </dl>
          </section>
          <section>
            <SectionTitle icon={Phone}>Contact</SectionTitle>
            <dl className="mt-4 grid gap-4">
              <DetailItem label="Email" value={valueFor(enrollment, ["email", "student_email"])} />
              <DetailItem label="Phone" value={valueFor(enrollment, ["phone", "student_phone"])} />
              <DetailItem label="Address" value={enrollment.address} />
            </dl>
          </section>
        </div>

        <section className="mt-7">
          <SectionTitle icon={IndianRupee}>Course and payment</SectionTitle>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Course" value={valueFor(enrollment, ["course_title", "course_name"])} />
            <DetailItem label="Duration" value={enrollment.course_duration} />
            <DetailItem
              label="Amount / fees"
              value={formatOptionalCurrency(enrollment.amount ?? enrollment.profit ?? enrollment.total_fee)}
            />
            <DetailItem label="Status" value={valueFor(enrollment, ["status", "payment_status"])} />
            <DetailItem label="Enrollment ID" value={enrollment.enrollment_id} />
            <DetailItem label="Payment ID" value={enrollment.razorpay_payment_id} />
          </dl>
        </section>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`ba-press rounded-lg px-5 py-2.5 text-sm font-medium text-white ${FOCUS_RING}`}
            style={{ background: "#17140f" }}
          >
            Close details
          </button>
        </div>
      </div>
    </div>
  );
};

const EnrollmentCard = ({ enrollment, index, onViewDetails }) => {
  const name = valueFor(enrollment, ["name", "student_name", "full_name"]);
  return (
    <article
      className="ba-card ba-rise overflow-hidden rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e3ddd0",
        animationDelay: `${Math.min(index, 8) * 60}ms`,
      }}
    >
      <div
        className="flex items-start justify-between gap-4 p-5 sm:p-6"
        style={{ borderBottom: "1px solid #efe9dd" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
            style={{ background: "#f1ede4", color: "#7a531f" }}
          >
            {String(name).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: "#a39a8c" }}>
              Enrollment {enrollment.enrollment_id ? `#${enrollment.enrollment_id}` : `#${index + 1}`}
            </p>
            <h3
              className="mt-0.5 truncate text-lg"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              {name}
            </h3>
          </div>
        </div>
        <StatusPill status={valueFor(enrollment, ["status", "payment_status"])} />
      </div>

      <dl className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <DetailItem label="Course" value={valueFor(enrollment, ["course_title", "course_name"])} />
        <div className="min-w-0">
          <dt className="text-xs" style={{ color: "#a39a8c" }}>Amount</dt>
          <dd
            className="mt-1 text-sm font-medium tabular-nums"
            style={{ color: "#17140f" }}
          >
            {formatOptionalCurrency(enrollment.amount ?? enrollment.profit ?? enrollment.total_fee)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs" style={{ color: "#a39a8c" }}>Email</dt>
          <dd className="mt-1 flex items-start gap-2 break-all text-sm font-medium" style={{ color: "#17140f" }}>
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
            {valueFor(enrollment, ["email", "student_email"])}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs" style={{ color: "#a39a8c" }}>Phone</dt>
          <dd className="mt-1 flex items-start gap-2 text-sm font-medium" style={{ color: "#17140f" }}>
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
            {valueFor(enrollment, ["phone", "student_phone"])}
          </dd>
        </div>
      </dl>

      <div
        className="px-5 py-3 sm:px-6"
        style={{ borderTop: "1px solid #efe9dd", background: "#faf8f4" }}
      >
        <button
          type="button"
          onClick={() => onViewDetails(enrollment)}
          className={`ba-press rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
          style={{ color: "#9c6b2e" }}
        >
          View full details
        </button>
      </div>
    </article>
  );
};

const SkeletonView = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading student fees">
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-6"
          style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
        >
          <div className="ba-skeleton h-3 w-24 rounded" />
          <div className="ba-skeleton mt-4 h-9 w-40 rounded" />
        </div>
      ))}
    </div>
    {[0, 1].map((i) => (
      <div
        key={i}
        className="rounded-2xl p-6"
        style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
      >
        <div className="ba-skeleton h-3 w-24 rounded" />
        <div className="ba-skeleton mt-3 h-6 w-1/2 rounded" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((j) => (
            <div key={j}>
              <div className="ba-skeleton h-3 w-16 rounded" />
              <div className="ba-skeleton mt-2 h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function BranchAdminProfit() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfit = async () => {
      if (!token || !selectedDate) return;
      setLoading(true);
      setError("");
      try {
        const data = await getBranchAdminProfitApi(token, selectedDate);
        if (isMounted) setProfit(data);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load branch profit.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfit();
    return () => {
      isMounted = false;
    };
  }, [token, selectedDate]);

  const enrollments = Array.isArray(profit?.enrollments) ? profit.enrollments : [];
  const totalProfit = profit?.total_profit ?? profit?.today_profit;
  const totalEnrollments = profit?.total_enrollments ?? enrollments.length;

  return (
    <div
      className="branch-profit-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={() => navigate("/branch-admin/courses")}
        activePage="fees"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Student Fees
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              role="alert"
              className="ba-toast rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}

          {/* ---- Date bar (stays visible while loading / on error) ---- */}
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h2
                className="text-xl"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                Daily report
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                Showing{" "}
                <span style={{ color: "#17140f", fontWeight: 500 }}>
                  {formatDate(profit?.date || selectedDate)}
                </span>
                .
              </p>
            </div>
            <label
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors focus-within:border-[#9c6b2e] ${FOCUS_RING}`}
              style={{ border: "1px solid #e3ddd0", color: "#5b5346", background: "#ffffff" }}
              title="Choose a previous date to view student fee collections"
            >
              <CalendarDays className="h-4 w-4" style={{ color: "#9c6b2e" }} />
              <span className="sr-only">Choose student fees date</span>
              <input
                type="date"
                value={selectedDate}
                max={getToday()}
                onChange={(event) => event.target.value && setSelectedDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
          </div>

          {loading && <SkeletonView />}

          {!loading && !error && profit && (
            <>
              {/* ---- Metrics ---- */}
              <section className="grid gap-4 sm:grid-cols-2">
                <article
                  className="ba-rise flex items-center justify-between rounded-2xl p-6"
                  style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
                >
                  <div>
                    <p className="text-xs" style={{ color: "#a39a8c" }}>Total fees collected</p>
                    <p
                      className="mt-2 text-4xl leading-none tabular-nums"
                      style={{ ...serif, fontWeight: 500, color: "#5c7a5a" }}
                    >
                      {formatCurrency(totalProfit)}
                    </p>
                  </div>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "#eef2ea", color: "#5c7a5a" }}
                  >
                    <IndianRupee className="h-5 w-5" />
                  </span>
                </article>
                <article
                  className="ba-rise flex items-center justify-between rounded-2xl p-6"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e3ddd0",
                    animationDelay: "80ms",
                  }}
                >
                  <div>
                    <p className="text-xs" style={{ color: "#a39a8c" }}>Total enrollments</p>
                    <p
                      className="mt-2 text-4xl leading-none tabular-nums"
                      style={{ ...serif, fontWeight: 500, color: "#b0803a" }}
                    >
                      {totalEnrollments}
                    </p>
                  </div>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "#f7efe0", color: "#b0803a" }}
                  >
                    <Users className="h-5 w-5" />
                  </span>
                </article>
              </section>

              {/* ---- Enrollment list ---- */}
              <section className="space-y-5">
                <div
                  className="flex items-center gap-2 pb-4"
                  style={{ borderBottom: "1px solid #e3ddd0" }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  <h2
                    className="text-xl"
                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                  >
                    Enrollment details
                  </h2>
                  <span className="ml-auto text-sm" style={{ color: "#a39a8c" }}>
                    {enrollments.length} record{enrollments.length === 1 ? "" : "s"}
                  </span>
                </div>

                {enrollments.length === 0 ? (
                  <div
                    className="ba-fade rounded-2xl px-6 py-16 text-center"
                    style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
                  >
                    <TrendingUp className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
                    <h3
                      className="mt-3 text-lg"
                      style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                    >
                      No enrollments for this date
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                      Fee collection details will appear here when enrollments are recorded.
                    </p>
                  </div>
                ) : (
                  <div key={selectedDate} className="space-y-4">
                    {enrollments.map((enrollment, index) => (
                      <EnrollmentCard
                        key={enrollment.enrollment_id || index}
                        enrollment={enrollment}
                        index={index}
                        onViewDetails={setSelectedEnrollment}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <EnrollmentDetailsModal
        enrollment={selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
      />
    </div>
  );
}