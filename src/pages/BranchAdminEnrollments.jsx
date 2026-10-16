import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Circle,
  Eye,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getBranchAdminEnrollmentsApi } from "../services/branchadminenrollments";

/* Same display-font pairing used on the other branch admin pages
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
.ba-rise  { opacity: 0; animation: ba-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
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
.ba-row { transition: background-color .2s ease, box-shadow .2s ease; }
.ba-row:hover { background: #faf8f4; box-shadow: inset 3px 0 0 #9c6b2e; }
.ba-press { transition: transform .15s ease, opacity .2s ease, background-color .2s ease; }
.ba-press:hover:not(:disabled) { transform: translateY(-1px); }
.ba-press:active:not(:disabled) { transform: translateY(0) scale(.97); }
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-pop, .ba-toast, .ba-skeleton { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-row, .ba-press { transition: none !important; }
  .ba-card:hover { transform: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const STATUS_META = {
  approved: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  paid: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  active: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  completed: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  pending: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  rejected: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  failed: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  cancelled: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
};
const statusMeta = (status) =>
  STATUS_META[String(status || "pending").toLowerCase()] || {
    dot: "#a39a8c",
    text: "#8a8175",
    bg: "#f1ede4",
  };

const StatusPill = ({ status }) => {
  const meta = statusMeta(status);
  const label = String(status || "Pending");
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

const formatDate = (date) => {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const Avatar = ({ name, size = "h-10 w-10" }) => (
  <div
    className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-medium`}
    style={{ background: "#f1ede4", color: "#7a531f" }}
  >
    {(name || "S").charAt(0).toUpperCase()}
  </div>
);

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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

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

  const installments = Array.isArray(enrollment.installments)
    ? enrollment.installments
    : [];

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-details-title"
      onClick={onClose}
    >
      <div
        className="ba-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid #e3ddd0",
          boxShadow: "0 30px 80px -30px rgba(23,20,15,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-5 sm:px-8"
          style={{ background: "#ffffff", borderBottom: "1px solid #e3ddd0" }}
        >
          <div className="flex items-start gap-4 min-w-0">
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
                id="enrollment-details-title"
                className="mt-1 break-words text-2xl leading-tight"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                {enrollment.name || "Unnamed student"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                {enrollment.course_title || "Course unavailable"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#f1ede4] ${FOCUS_RING}`}
            style={{ color: "#a39a8c" }}
            aria-label="Close student details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {/* ═══ 1. Student Information ═══ */}
          <section>
            <SectionTitle icon={UserRound}>Student Information</SectionTitle>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Full Name" value={enrollment.name} />
              <DetailItem label="Email" value={enrollment.email} />
              <DetailItem label="Phone" value={enrollment.phone} />
              <DetailItem
                label="Highest Qualification"
                value={enrollment.highest_qualification}
              />
              <DetailItem
                label="Parent / Guardian Name"
                value={enrollment.parent_name}
              />
              <DetailItem
                label="Parent / Guardian Phone"
                value={enrollment.parent_phone}
              />
              <DetailItem
                label="Address"
                value={enrollment.address}
              />
            </dl>
          </section>

          {/* ═══ 2. Course Information ═══ */}
          <section>
            <SectionTitle icon={CalendarDays}>Course Information</SectionTitle>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Course Title" value={enrollment.course_title} />
              <DetailItem label="Course Duration" value={enrollment.course_duration} />
              <DetailItem
                label="Course Status"
                value={
                  <StatusPill
                    status={enrollment.course_status || "pending"}
                  />
                }
              />
              <DetailItem
                label="Enrollment ID"
                value={`#${enrollment.enrollment_id}`}
              />
              <DetailItem
                label="Enrollment Date"
                value={formatDate(enrollment.created_at)}
              />
            </dl>
          </section>

          {/* ═══ 3. Payment Summary ═══ */}
          <section>
            <SectionTitle icon={IndianRupee}>Payment Summary</SectionTitle>
            <div
              className="mt-4 grid gap-4 rounded-xl p-4 sm:grid-cols-3"
              style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
            >
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Total Fee
                </p>
                <p
                  className="mt-1 text-xl tabular-nums"
                  style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                >
                  {formatCurrency(enrollment.total_fee)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Total Paid
                </p>
                <p
                  className="mt-1 text-xl tabular-nums"
                  style={{ ...serif, fontWeight: 500, color: "#5c7a5a" }}
                >
                  {formatCurrency(enrollment.total_paid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Balance
                </p>
                <p
                  className="mt-1 text-xl tabular-nums"
                  style={{
                    ...serif,
                    fontWeight: 500,
                    color:
                      Number(enrollment.balance_amount || 0) > 0
                        ? "#a24a3a"
                        : "#5c7a5a",
                  }}
                >
                  {formatCurrency(enrollment.balance_amount)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs" style={{ color: "#a39a8c" }}>
                Payment Status
              </span>
              <StatusPill status={enrollment.status} />
            </div>
          </section>

          {/* ═══ 4. Installment Summary ═══ */}
          <section>
            <SectionTitle icon={Eye}>Installment Summary</SectionTitle>
            <div
              className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                {
                  label: "Total Installments",
                  value: enrollment.installment_count ?? 0,
                  color: "#17140f",
                },
                {
                  label: "Paid",
                  value: enrollment.paid_installment_count ?? 0,
                  color: "#5c7a5a",
                },
                {
                  label: "Remaining",
                  value: enrollment.remaining_installment_count ?? 0,
                  color: "#b0803a",
                },
                {
                  label: "Due",
                  value: enrollment.due_installment_count ?? 0,
                  color:
                    Number(enrollment.due_installment_count || 0) > 0
                      ? "#a24a3a"
                      : "#5c7a5a",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
                >
                  <p className="text-xs" style={{ color: "#a39a8c" }}>
                    {item.label}
                  </p>
                  <p
                    className="mt-1 text-2xl tabular-nums"
                    style={{ ...serif, fontWeight: 500, color: item.color }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ 5. Installment Details ═══ */}
          <section>
            <SectionTitle icon={IndianRupee}>Installment Details</SectionTitle>
            {installments.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "#8a8175" }}>
                No installment data available for this enrollment.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {installments.map((inst, idx) => {
                  const instStatus = String(
                    inst.status || "pending"
                  ).toLowerCase();
                  const isDue = inst.is_due === true;
                  return (
                    <div
                      key={inst.installment_id || idx}
                      className="rounded-xl p-4"
                      style={{
                        background: isDue ? "#fef8f0" : "#ffffff",
                        border: `1px solid ${isDue ? "#f0d9b5" : "#e3ddd0"}`,
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <p
                          className="text-xs font-semibold tracking-wide uppercase"
                          style={{ color: "#9c6b2e" }}
                        >
                          Installment {inst.installment_number ?? idx + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          {isDue && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{
                                background: "#f8eae5",
                                color: "#7c3324",
                              }}
                            >
                              Due
                            </span>
                          )}
                          <StatusPill status={instStatus} />
                        </div>
                      </div>
                      <dl className="grid gap-3 sm:grid-cols-3">
                        <DetailItem
                          label="Amount"
                          value={formatCurrency(inst.amount)}
                        />
                        <DetailItem
                          label="Paid Amount"
                          value={formatCurrency(inst.paid_amount)}
                        />
                        <DetailItem
                          label="Remaining"
                          value={formatCurrency(inst.remaining_amount)}
                        />
                        <DetailItem
                          label="Due Date"
                          value={formatDate(inst.due_date)}
                        />
                        <DetailItem
                          label="Paid Date"
                          value={
                            inst.paid_date
                              ? formatDate(inst.paid_date)
                              : "Not yet paid"
                          }
                        />
                        <DetailItem
                          label="Payment Method"
                          value={(() => {
                            // First check installment-level cash/upi amounts
                            let cash = Number(inst.cash_amount || 0);
                            let upi = Number(inst.upi_amount || 0);
                            // If not available on installment, check payments array
                            if (cash === 0 && upi === 0) {
                              const payments = Array.isArray(enrollment.payments) ? enrollment.payments : [];
                              const instPayments = payments.filter(
                                (p) => Number(p.installment_number) === Number(inst.installment_number ?? idx + 1)
                              );
                              instPayments.forEach((p) => {
                                cash += Number(p.cash_amount || 0);
                                upi += Number(p.upi_amount || 0);
                              });
                              // Also check payment_method field as fallback
                              if (cash === 0 && upi === 0 && instPayments.length > 0) {
                                const methods = instPayments.map(p => p.payment_method).filter(Boolean);
                                const totalAmount = instPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                                if (methods.length > 0) {
                                  const method = methods[0];
                                  if (method === "cash") cash = totalAmount;
                                  else if (method === "upi") upi = totalAmount;
                                  else return `${method.charAt(0).toUpperCase() + method.slice(1)}: ${formatCurrency(totalAmount)}`;
                                }
                              }
                            }
                            if (cash > 0 && upi > 0) {
                              return (
                                <span className="flex flex-col gap-0.5">
                                  <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#5c7a5a" }} />
                                    Cash: {formatCurrency(cash)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#4a6fa5" }} />
                                    UPI: {formatCurrency(upi)}
                                  </span>
                                </span>
                              );
                            }
                            if (cash > 0) {
                              return (
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#5c7a5a" }} />
                                  Cash: {formatCurrency(cash)}
                                </span>
                              );
                            }
                            if (upi > 0) {
                              return (
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#4a6fa5" }} />
                                  UPI: {formatCurrency(upi)}
                                </span>
                              );
                            }
                            return "No payment recorded";
                          })()}
                        />
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ═══ 6. Payment Gateway Details ═══ */}
          {(enrollment.razorpay_order_id || enrollment.razorpay_payment_id) && (
            <section>
              <SectionTitle icon={Mail}>Payment Gateway Details</SectionTitle>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Razorpay Order ID"
                  value={enrollment.razorpay_order_id || "Not available"}
                />
                <DetailItem
                  label="Razorpay Payment ID"
                  value={enrollment.razorpay_payment_id || "Not available"}
                />
              </dl>
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="sticky bottom-0 flex justify-end px-6 py-4 sm:px-8"
          style={{ background: "#ffffff", borderTop: "1px solid #e3ddd0" }}
        >
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

const ViewButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`ba-press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
    style={{ color: "#9c6b2e" }}
  >
    <Eye className="h-3.5 w-3.5" /> View full details
  </button>
);

const SkeletonList = () => (
  <div
    className="overflow-hidden rounded-2xl"
    style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
    aria-busy="true"
    aria-label="Loading students"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-5"
        style={{ borderTop: i === 0 ? "none" : "1px solid #efe9dd" }}
      >
        <div className="ba-skeleton h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="ba-skeleton h-4 w-40 rounded" />
          <div className="ba-skeleton h-3 w-56 rounded" />
        </div>
        <div className="ba-skeleton hidden h-6 w-20 rounded-full sm:block" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div
    className="ba-fade rounded-2xl px-6 py-16 text-center"
    style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
  >
    <Icon className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
    <h3 className="mt-3 text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
      {title}
    </h3>
    <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
      {text}
    </p>
  </div>
);

const BranchAdminEnrollments = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [nameFilter, setNameFilter] = useState("");

  const filteredEnrollments = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    return enrollments.filter((enrollment) => enrollment.name?.toLowerCase().includes(q));
  }, [enrollments, nameFilter]);

  useEffect(() => {
    let isMounted = true;

    const loadEnrollments = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError("");
        const data = await getBranchAdminEnrollmentsApi(token);
        if (isMounted) setEnrollments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load branch enrollments.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEnrollments();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const filtering = nameFilter.trim() !== "";

  return (
    <div
      className="branch-enrollments-page min-h-screen md:flex"
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
        activePage="enrollments"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header
          className="ba-fade flex flex-col gap-5 px-6 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10"
          style={{ borderBottom: "1px solid #e3ddd0" }}
        >
          <div>
            <h1
              className="text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              View students
            </h1>
            <p className="mt-2 max-w-md text-[0.95rem]" style={{ color: "#8a8175" }}>
              Review students enrolled in courses at your branch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium" style={{ color: "#17140f" }}>
                {user?.name || "Branch admin"}
              </p>
              <p className="text-xs" style={{ color: "#a39a8c" }}>
                Branch administrator
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
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

          {/* ---- Directory heading + search ---- */}
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                Students
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                {loading
                  ? "Loading…"
                  : filtering
                    ? `${filteredEnrollments.length} of ${enrollments.length} enrolled`
                    : `${enrollments.length} enrolled`}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "#9c6b2e" }}
              />
              <span className="sr-only">Filter by student name</span>
              <input
                type="search"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Filter by student name"
                className={`w-full rounded-lg py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-[#9c6b2e] ${FOCUS_RING}`}
                style={{ border: "1px solid #e3ddd0", color: "#1c1a17", background: "#ffffff" }}
              />
            </label>
          </div>

          {loading && <SkeletonList />}

          {!loading && !error && enrollments.length === 0 && (
            <EmptyState
              icon={Users}
              title="No enrollments yet"
              text="New student enrollments for your branch will appear here."
            />
          )}

          {!loading && !error && enrollments.length > 0 && filteredEnrollments.length === 0 && (
            <EmptyState
              icon={Search}
              title="No matching students"
              text="Try a different student name."
            />
          )}

          {!loading && !error && filteredEnrollments.length > 0 && (
            <>
              {/* ---- Desktop table ---- */}
              <div
                className="ba-rise hidden overflow-hidden rounded-2xl md:block"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] bg-white text-left text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4" }}>
                        {["Student", "Course", "Contact", "Status", "Enrolled", ""].map((h, i) => (
                          <th
                            key={i}
                            className="px-6 py-3 text-xs font-medium"
                            style={{ color: "#8a8175" }}
                          >
                            {h || <span className="sr-only">Details</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((enrollment, index) => (
                        <tr
                          key={enrollment.enrollment_id}
                          className="ba-row align-top"
                          style={{ borderTop: index === 0 ? "none" : "1px solid #efe9dd" }}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={enrollment.name} />
                              <div className="min-w-0">
                                <p className="font-medium" style={{ color: "#17140f" }}>
                                  {enrollment.name || "Unnamed student"}
                                </p>
                                <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                                  {enrollment.highest_qualification || "Qualification unavailable"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-medium" style={{ color: "#17140f" }}>
                              {enrollment.course_title || "Course unavailable"}
                            </p>
                            <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                              {enrollment.course_duration || "Duration unavailable"}
                            </p>
                          </td>
                          <td className="px-6 py-5 text-xs" style={{ color: "#5b5346" }}>
                            <p className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              <span className="break-all">{enrollment.email || "Email unavailable"}</span>
                            </p>
                            <p className="mt-1.5 flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              {enrollment.phone || "Phone unavailable"}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <StatusPill status={enrollment.status} />
                          </td>
                          <td className="px-6 py-5 text-xs" style={{ color: "#8a8175" }}>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                              {formatDate(enrollment.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <ViewButton onClick={() => setSelectedEnrollment(enrollment)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ---- Mobile cards ---- */}
              <div className="space-y-4 md:hidden">
                {filteredEnrollments.map((enrollment, index) => (
                  <article
                    key={enrollment.enrollment_id}
                    className="ba-card ba-rise overflow-hidden rounded-2xl"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e3ddd0",
                      animationDelay: `${Math.min(index, 8) * 60}ms`,
                    }}
                  >
                    <div
                      className="flex items-start justify-between gap-3 p-5"
                      style={{ borderBottom: "1px solid #efe9dd" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={enrollment.name} />
                        <div className="min-w-0">
                          <h3
                            className="truncate text-base"
                            style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                          >
                            {enrollment.name || "Unnamed student"}
                          </h3>
                          <p className="truncate text-xs" style={{ color: "#8a8175" }}>
                            {enrollment.email || "Email unavailable"}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={enrollment.status} />
                    </div>
                    <dl className="grid gap-4 p-5 text-sm">
                      <DetailItem label="Course" value={enrollment.course_title || "Course unavailable"} />
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Phone" value={enrollment.phone || "Phone unavailable"} />
                        <DetailItem label="Enrolled" value={formatDate(enrollment.created_at)} />
                      </div>
                    </dl>
                    <div
                      className="px-5 py-3"
                      style={{ borderTop: "1px solid #efe9dd", background: "#faf8f4" }}
                    >
                      <ViewButton onClick={() => setSelectedEnrollment(enrollment)} />
                    </div>
                  </article>
                ))}
              </div>
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
};

export default BranchAdminEnrollments;