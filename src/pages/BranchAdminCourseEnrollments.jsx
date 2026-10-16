import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Circle,
  Eye,
  ImageOff,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
  Pencil,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  getBranchAdminCourseEnrollmentsApi,
  getBranchAdminCourseSummaryApi,
  updateBranchAdminCourseEnrollmentApi,
} from "../services/branchadmincourseenrollment";

/* Same display-font pairing used on the staff, purchases and profit pages
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
@keyframes ba-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ba-pop { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ba-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes ba-toast { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
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
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 10px 30px -18px rgba(23,20,15,.28); transform: translateY(-2px); }
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

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "Date unavailable";

const formatCurrency = (value) =>
  value == null || value === ""
    ? null
    : `₹${Number(value).toLocaleString("en-IN")}`;

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

function DetailsModal({ enrollment, onClose }) {
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
      aria-labelledby="course-student-details"
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
                id="course-student-details"
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
              <DetailItem label="Address" value={enrollment.address} />
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
                  <StatusPill status={enrollment.course_status || "pending"} />
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
                  {formatCurrency(enrollment.total_fee) || "₹0"}
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
                  {formatCurrency(enrollment.total_paid) || "₹0"}
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
                  {formatCurrency(enrollment.balance_amount) || "₹0"}
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
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                          value={formatCurrency(inst.amount) || "₹0"}
                        />
                        <DetailItem
                          label="Paid Amount"
                          value={formatCurrency(inst.paid_amount) || "₹0"}
                        />
                        <DetailItem
                          label="Remaining"
                          value={formatCurrency(inst.remaining_amount) || "₹0"}
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
                            let cash = Number(inst.cash_amount || 0);
                            let upi = Number(inst.upi_amount || 0);
                            
                            if (cash === 0 && upi === 0) {
                              const payments = Array.isArray(enrollment.payments) ? enrollment.payments : [];
                              const instPayments = payments.filter(
                                (p) => Number(p.installment_number) === Number(inst.installment_number ?? idx + 1)
                              );
                              instPayments.forEach((p) => {
                                cash += Number(p.cash_amount || 0);
                                upi += Number(p.upi_amount || 0);
                              });
                              
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
                              
                              if (cash === 0 && upi === 0 && inst.payment_method) {
                                if (inst.payment_method.toLowerCase() === "cash") cash = Number(inst.paid_amount || 0);
                                else if (inst.payment_method.toLowerCase() === "upi") upi = Number(inst.paid_amount || 0);
                                else return `${inst.payment_method.charAt(0).toUpperCase() + inst.payment_method.slice(1)}: ${formatCurrency(inst.paid_amount)}`;
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

        {/* ── Sticky footer ── */}
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
}

function EditEnrollmentModal({ enrollment, courseId, onClose, onUpdate, token }) {
  const [formData, setFormData] = useState({
    name: enrollment?.name || "",
    email: enrollment?.email || "",
    phone: enrollment?.phone || "",
    parent_name: enrollment?.parent_name || "",
    parent_phone: enrollment?.parent_phone || "",
    highest_qualification: enrollment?.highest_qualification || "",
    address: enrollment?.address || "",
    installments: Array.isArray(enrollment?.installments) && enrollment.installments.length > 0
      ? enrollment.installments.map((inst, idx) => ({
          installment_number: inst.installment_number ?? idx + 1,
          amount: inst.amount ?? 0,
          due_date: inst.due_date ? String(inst.due_date).split("T")[0] : "",
          paid_amount: inst.paid_amount ?? 0,
          status: inst.status ?? "pending",
        }))
      : [
          {
            installment_number: 1,
            amount: enrollment?.balance_amount || enrollment?.total_fee || 0,
            due_date: enrollment?.created_at ? String(enrollment.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
            paid_amount: enrollment?.total_paid || 0,
            status: "pending",
          }
        ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInstallmentChange = (index, field, value) => {
    setFormData((prev) => {
      const newInstallments = [...prev.installments];
      newInstallments[index] = { ...newInstallments[index], [field]: value };
      return { ...prev, installments: newInstallments };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const expectedFee = Number(enrollment?.total_fee || 0);
    const totalInstallmentsAmount = formData.installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

    if (expectedFee > 0 && totalInstallmentsAmount !== expectedFee) {
      setError(`The sum of all installments (₹${totalInstallmentsAmount}) must exactly equal the total course fee (₹${expectedFee}).`);
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      parent_name: formData.parent_name,
      parent_phone: formData.parent_phone,
      highest_qualification: formData.highest_qualification,
      address: formData.address,
      installments: formData.installments.map(inst => ({
        installment_number: inst.installment_number,
        amount: Number(inst.amount),
        due_date: inst.due_date,
      })),
    };

    try {
      await updateBranchAdminCourseEnrollmentApi(courseId, enrollment.enrollment_id, payload, token);
      onUpdate(); // close and refresh
    } catch (err) {
      setError(err.message || "Failed to update enrollment.");
      setLoading(false);
    }
  };

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.55)" }}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="ba-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex flex-col overflow-hidden rounded-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid #e3ddd0",
          boxShadow: "0 30px 80px -30px rgba(23,20,15,.5)",
        }}
      >
        <div
          className="shrink-0 flex items-center justify-between gap-4 px-6 py-5 sm:px-8"
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
                Edit Student Details
              </p>
              <h2
                className="mt-1 break-words text-2xl leading-tight"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                {enrollment.name || "Unnamed student"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#f1ede4] ${FOCUS_RING}`}
            style={{ color: "#a39a8c" }}
            aria-label="Close edit details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}

          <section>
            <SectionTitle icon={UserRound}>Student Information</SectionTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Name</span>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Email</span>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Phone</span>
                <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Highest Qualification</span>
                <input type="text" name="highest_qualification" value={formData.highest_qualification} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Parent / Guardian Name</span>
                <input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Parent / Guardian Phone</span>
                <input type="text" name="parent_phone" value={formData.parent_phone} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Address</span>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]" style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }} />
              </label>
            </div>
          </section>

          <section>
            <SectionTitle icon={IndianRupee}>Installment Details</SectionTitle>
            <div className="mt-4 space-y-4">
              {formData.installments.map((inst, index) => {
                const isLocked = Number(inst.paid_amount) > 0 || String(inst.status).toLowerCase() === "paid" || String(inst.status).toLowerCase() === "partially paid";
                return (
                <div key={index} className="rounded-xl p-4" style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#9c6b2e" }}>
                      Term {inst.installment_number}
                    </p>
                    <StatusPill status={inst.status} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Amount</span>
                      <input type="number" step="0.01" required value={inst.amount} onChange={(e) => handleInstallmentChange(index, "amount", e.target.value)} disabled={isLocked} className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e] ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`} style={{ border: "1px solid #e3ddd0", background: isLocked ? "#f7f7f7" : "#ffffff", color: "#1c1a17" }} />
                    </label>
                    <label className="block">
                      <span className="text-xs mb-1 block" style={{ color: "#a39a8c" }}>Due Date</span>
                      <input type="date" required value={inst.due_date} onChange={(e) => handleInstallmentChange(index, "due_date", e.target.value)} disabled={isLocked} className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e] ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`} style={{ border: "1px solid #e3ddd0", background: isLocked ? "#f7f7f7" : "#ffffff", color: "#1c1a17" }} />
                    </label>
                    <div className="block sm:col-span-2">
                      <p className="text-xs mt-1" style={{ color: "#a39a8c" }}>Read-only: Paid Amount is {formatCurrency(inst.paid_amount) || "₹0"}</p>
                    </div>
                  </div>
                </div>
              )})}
              {formData.installments.length === 0 && (
                <p className="text-sm" style={{ color: "#8a8175" }}>No installment data available.</p>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    installments: [...prev.installments, {
                      installment_number: prev.installments.length + 1,
                      amount: 0,
                      due_date: new Date().toISOString().split("T")[0],
                      paid_amount: 0,
                      status: "pending"
                    }]
                  }))}
                  className={`ba-press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#e3ddd0] ${FOCUS_RING}`}
                  style={{ color: "#7a531f", background: "#f1ede4" }}
                >
                  + Add Installment
                </button>
              </div>
            </div>
          </section>
        </div>

        <div
          className="shrink-0 flex justify-end gap-3 px-6 py-4 sm:px-8"
          style={{ background: "#ffffff", borderTop: "1px solid #e3ddd0" }}
        >
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className={`ba-press rounded-lg px-5 py-2.5 text-sm font-medium ${FOCUS_RING}`}
            style={{ color: "#17140f", background: "#f1ede4" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`ba-press flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white ${FOCUS_RING}`}
            style={{ background: "#17140f", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "Updating..." : "Update Enrollment"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StudentList({ enrollments, onDetails, onEdit }) {
  const [nameFilter, setNameFilter] = useState("");
  const filtered = enrollments.filter((enrollment) =>
    enrollment.name?.toLowerCase().includes(nameFilter.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <label
        className="flex max-w-md items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm transition-colors focus-within:border-[#9c6b2e]"
        style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#5b5346" }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "#9c6b2e" }} />
        <span className="sr-only">Filter by student name</span>
        <input
          type="search"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter by student name"
          className="w-full bg-transparent outline-none"
          style={{ color: "#1c1a17" }}
        />
      </label>

      {filtered.length === 0 ? (
        <div
          className="ba-fade rounded-2xl px-6 py-14 text-center"
          style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
        >
          <Search className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
          <p className="mt-3 text-sm" style={{ color: "#8a8175" }}>
            No students match "{nameFilter}".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((enrollment, index) => (
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
                className="flex items-start justify-between gap-4 p-5 sm:p-6"
                style={{ borderBottom: "1px solid #efe9dd" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                    style={{ background: "#f1ede4", color: "#7a531f" }}
                  >
                    {(enrollment.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: "#a39a8c" }}>
                      Enrollment #{enrollment.enrollment_id}
                    </p>
                    <h3
                      className="mt-0.5 truncate text-lg"
                      style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                    >
                      {enrollment.name || "Unnamed student"}
                    </h3>
                  </div>
                </div>
                <StatusPill status={enrollment.status} />
              </div>

              <dl className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
                <div className="min-w-0">
                  <dt className="text-xs" style={{ color: "#a39a8c" }}>Email</dt>
                  <dd className="mt-1 flex items-start gap-2 break-all text-sm font-medium" style={{ color: "#17140f" }}>
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                    {enrollment.email || "Email unavailable"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs" style={{ color: "#a39a8c" }}>Phone</dt>
                  <dd className="mt-1 flex items-start gap-2 text-sm font-medium" style={{ color: "#17140f" }}>
                    <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                    {enrollment.phone || "Phone unavailable"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs" style={{ color: "#a39a8c" }}>Enrolled on</dt>
                  <dd className="mt-1 flex items-start gap-2 text-sm font-medium" style={{ color: "#17140f" }}>
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                    {formatDate(enrollment.created_at)}
                  </dd>
                </div>
              </dl>

              <div
                className="px-5 py-3 sm:px-6 flex items-center gap-2"
                style={{ borderTop: "1px solid #efe9dd", background: "#faf8f4" }}
              >
                <button
                  type="button"
                  onClick={() => onDetails(enrollment)}
                  className={`ba-press flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
                  style={{ color: "#9c6b2e" }}
                >
                  <Eye className="h-3.5 w-3.5" /> View full details
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(enrollment)}
                  className={`ba-press flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
                  style={{ color: "#9c6b2e" }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit details
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const SkeletonGrid = () => (
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading courses">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl"
        style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
      >
        <div className="ba-skeleton h-44" />
        <div className="p-5">
          <div className="ba-skeleton h-5 w-2/3 rounded" />
          <div className="ba-skeleton mt-3 h-3 w-24 rounded" />
          <div className="ba-skeleton mt-5 h-8 w-32 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export default function BranchAdminCourseEnrollments() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    getBranchAdminCourseSummaryApi(token)
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Failed to load course summary."))
      .finally(() => setLoading(false));
  }, [token]);

  const openCourse = async (course) => {
    setSelectedCourse(course);
    setDetailLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await getBranchAdminCourseEnrollmentsApi(course.course_id, token);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load course enrollments.");
      setEnrollments([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeCourse = () => {
    setSelectedCourse(null);
    setEnrollments([]);
    setError("");
    setSuccess("");
  };

  const refreshEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      const data = await getBranchAdminCourseEnrollmentsApi(selectedCourse.course_id, token);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to refresh course enrollments.");
    }
  };

  const handleUpdateEnrollmentSuccess = () => {
    setEditingEnrollment(null);
    setSuccess("Enrollment updated successfully!");
    refreshEnrollments();
    setTimeout(() => setSuccess(""), 4000);
  };

  const totalStudents = courses.reduce(
    (sum, course) => sum + Number(course.purchase_count || 0),
    0,
  );

  return (
    <div
      className="branch-course-enrollments-page min-h-screen md:flex"
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
        activePage="course-enrollments"
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
              Course enrollments
            </h1>
            <p className="mt-2 max-w-md text-[0.95rem]" style={{ color: "#8a8175" }}>
              Review enrollment counts and students by course.
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
          {success && (
            <div
              role="alert"
              className="ba-toast rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #c9d8c5" }}
            >
              {success}
            </div>
          )}

          {selectedCourse ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={closeCourse}
                className={`ba-press flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium ${FOCUS_RING}`}
                style={{ color: "#9c6b2e" }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to courses
              </button>

              <section
                className="ba-rise flex items-center justify-between gap-4 rounded-2xl p-6"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: "#a39a8c" }}>Selected course</p>
                  <h2
                    className="mt-1 break-words text-2xl leading-tight"
                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                  >
                    {selectedCourse.course_title}
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "#8a8175" }}>
                    <span className="tabular-nums" style={{ color: "#17140f", fontWeight: 500 }}>
                      {detailLoading ? "–" : enrollments.length}
                    </span>{" "}
                    enrolled student{enrollments.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "#f7efe0", color: "#b0803a" }}
                >
                  <Users className="h-5 w-5" />
                </span>
              </section>

              {detailLoading ? (
                <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "#8a8175" }}>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
                </div>
              ) : enrollments.length ? (
                <StudentList enrollments={enrollments} onDetails={setSelectedEnrollment} onEdit={setEditingEnrollment} />
              ) : (
                <div
                  className="ba-fade rounded-2xl px-6 py-16 text-center"
                  style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
                >
                  <Users className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
                  <h3 className="mt-3 text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    No students enrolled
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Students will appear here once they enroll in this course.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* ---- Summary strip ---- */}
              <section
                className="ba-rise overflow-hidden rounded-2xl"
                style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
              >
                <div className="grid grid-cols-2 divide-x">
                  {[
                    { label: "Courses", value: courses.length, color: "#17140f" },
                    { label: "Total students", value: totalStudents, color: "#b0803a" },
                  ].map((stat) => (
                    <div key={stat.label} className="px-4 py-5 sm:px-6" style={{ borderColor: "#e3ddd0" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>{stat.label}</p>
                      <p
                        className="mt-1 text-2xl tabular-nums"
                        style={{ ...serif, fontWeight: 500, color: stat.color }}
                      >
                        {loading ? "–" : stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <div>
                <h2 className="text-xl" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                  Your courses
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                  Choose a course to see who has enrolled.
                </p>
              </div>

              {loading ? (
                <SkeletonGrid />
              ) : courses.length === 0 ? (
                <div
                  className="ba-fade rounded-2xl px-6 py-16 text-center"
                  style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
                >
                  <Users className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
                  <h3 className="mt-3 text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    No courses yet
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Course enrollment counts will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course, index) => (
                    <article
                      key={course.course_id}
                      className="ba-card ba-rise flex flex-col overflow-hidden rounded-2xl"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e3ddd0",
                        animationDelay: `${Math.min(index, 8) * 60}ms`,
                      }}
                    >
                      <div className="h-44" style={{ background: "#f1ede4", borderBottom: "1px solid #efe9dd" }}>
                        {course.course_image ? (
                          <img
                            src={course.course_image}
                            alt={course.course_title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center" style={{ color: "#d9b77b" }}>
                            <ImageOff className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3
                          className="text-lg leading-snug"
                          style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                        >
                          {course.course_title || "Course unavailable"}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#8a8175" }}>
                          <Users className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                          <span className="tabular-nums" style={{ color: "#17140f", fontWeight: 500 }}>
                            {course.purchase_count || 0}
                          </span>{" "}
                          students
                        </p>
                        <button
                          type="button"
                          onClick={() => openCourse(course)}
                          className={`ba-press mt-5 flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-white ${FOCUS_RING}`}
                          style={{ background: "#17140f" }}
                        >
                          <Eye className="h-3.5 w-3.5" style={{ color: "#f4b942" }} />
                          View students
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <DetailsModal
        enrollment={selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
      />
      {editingEnrollment && (
        <EditEnrollmentModal
          enrollment={editingEnrollment}
          courseId={selectedCourse?.course_id}
          onClose={() => setEditingEnrollment(null)}
          onUpdate={handleUpdateEnrollmentSuccess}
          token={token}
        />
      )}
    </div>
  );
}