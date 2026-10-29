import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Download,
  Eye,
  IndianRupee,
  Loader2,
  Mail,
  Menu,
  Phone,
  Receipt,
  Search,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  getBranchAdminEnrollmentsApi,
  getBranchAdminInstallmentStudentsApi,
  getBranchAdminFullyPaidStudentsApi,
  recordBranchAdminInstallmentPaymentApi,
  getBranchAdminPendingInstallmentPaymentsApi,
  getBranchAdminTodayInstallmentPaymentsApi,
  approveBranchAdminInstallmentPaymentApi,
  rejectBranchAdminInstallmentPaymentApi,
  getBranchAdminInstallmentPaymentHistoryApi,
  updateBranchAdminStudentStatusApi,
} from "../services/branchadminenrollments";
import { downloadBranchAdminReceiptApi } from "../services/branchadminreceipts";
import PaymentSuccessReceiptModal from "../components/common/PaymentSuccessReceiptModal";

/* Typography and fonts */
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

/* Page animations and styles */
const PAGE_CSS = `
@keyframes ba-rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ba-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ba-pop {
  from { opacity: 0; transform: translateY(14px) scale(.98); }
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
.ba-rise  { opacity: 0; animation: ba-rise .45s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .35s ease both; }
.ba-pop   { animation: ba-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-toast { animation: ba-toast .25s cubic-bezier(.2,.7,.2,1) both; }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}
.ba-card { transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease; }
.ba-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 26px -16px rgba(23,20,15,.22);
  transform: translateY(-2px);
}
.ba-row { transition: background-color .15s ease, box-shadow .15s ease; }
.ba-row:hover { background: #faf8f4; box-shadow: inset 3px 0 0 #9c6b2e; }
.ba-press { transition: transform .12s ease, opacity .15s ease, background-color .15s ease; }
.ba-press:hover:not(:disabled) { transform: translateY(-1px); }
.ba-press:active:not(:disabled) { transform: translateY(0) scale(.98); }
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
  received: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  paid: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  active: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  completed: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  pending: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  awaiting_review: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  partial: { dot: "#c27803", text: "#8f5403", bg: "#fef3c7" },
  partially_paid: { dot: "#c27803", text: "#8f5403", bg: "#fef3c7" },
  rejected: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  failed: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  cancelled: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  inactive: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Circle className="h-1.5 w-1.5" fill={meta.dot} stroke="none" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

export const isStudentActive = (enrollment) => {
  if (!enrollment) return false;
  if (
    enrollment.account_status !== undefined &&
    enrollment.account_status !== null &&
    enrollment.account_status !== ""
  ) {
    return String(enrollment.account_status).toLowerCase().trim() === "active";
  }
  if (typeof enrollment.is_active === "boolean") {
    return enrollment.is_active;
  }
  if (enrollment.student_status) {
    return String(enrollment.student_status).toLowerCase().trim() === "active";
  }
  if (enrollment.status) {
    const s = String(enrollment.status).toLowerCase().trim();
    if (s === "active") return true;
    if (s === "inactive") return false;
  }
  return true;
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const formatDateTime = (date) => {
  if (!date) return "Date unavailable";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Avatar = ({ name, size = "h-10 w-10" }) => (
  <div
    className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold`}
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
    className="flex items-center gap-2 pb-3 text-sm font-semibold"
    style={{ color: "#17140f", borderBottom: "1px solid #e3ddd0" }}
  >
    {Icon && <Icon className="h-4 w-4" style={{ color: "#9c6b2e" }} />}
    {children}
  </h3>
);

/* ─────────────────────────────────────────────────────────
   RECORD IN-PERSON PAYMENT MODAL
   POST /enrollments/branch-admin/{enrollment_id}/installment-payments
   Supports Cash, UPI, or Split Cash + UPI
   ───────────────────────────────────────────────────────── */
const RecordPaymentModal = ({
  isOpen,
  onClose,
  enrollment,
  onSubmit,
  isSubmitting,
  token,
}) => {
  const [paymentMode, setPaymentMode] = useState("cash"); // 'cash' | 'upi' | 'split'
  const [paymentScope, setPaymentScope] = useState("installment"); // 'installment' | 'full_balance'
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [singleAmount, setSingleAmount] = useState("");
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState("");
  const [validationError, setValidationError] = useState("");

  const installments = useMemo(() => {
    if (Array.isArray(enrollment?.installments)) return enrollment.installments;
    if (Array.isArray(enrollment?.installment_schedule)) return enrollment.installment_schedule;
    if (Array.isArray(enrollment?.schedule)) return enrollment.schedule;
    return [];
  }, [enrollment]);

  const balance = useMemo(() => {
    if (enrollment?.balance_amount !== undefined && enrollment.balance_amount !== null) {
      return Number(enrollment.balance_amount);
    }
    if (enrollment?.remaining_amount !== undefined && enrollment.remaining_amount !== null) {
      return Number(enrollment.remaining_amount);
    }
    if (enrollment?.remaining_balance !== undefined && enrollment.remaining_balance !== null) {
      return Number(enrollment.remaining_balance);
    }
    return Number(enrollment?.balance_amount ?? enrollment?.remaining_amount ?? 0);
  }, [enrollment]);

  // Find next unpaid installment to suggest
  const nextUnpaidInstallment = useMemo(() => {
    return installments.find((inst) => {
      const isPaid = String(inst.status || "").toLowerCase() === "paid";
      if (isPaid) return false;
      const rem =
        inst.remaining_amount !== undefined && inst.remaining_amount !== null
          ? Number(inst.remaining_amount)
          : Math.max(0, Number(inst.amount || 0) - Number(inst.paid_amount || 0));
      return rem > 0;
    });
  }, [installments]);

  useEffect(() => {
    if (!isOpen || !enrollment) return;
    setValidationError("");
    setPaymentMode("cash");
    setPaymentScope("installment");
    setUpiTransactionId("");

    // Prefill suggested amount from next unpaid installment or remaining balance
    const suggested = nextUnpaidInstallment
      ? nextUnpaidInstallment.remaining_amount !== undefined && nextUnpaidInstallment.remaining_amount !== null
        ? Number(nextUnpaidInstallment.remaining_amount)
        : Math.max(0, Number(nextUnpaidInstallment.amount || 0) - Number(nextUnpaidInstallment.paid_amount || 0))
      : balance;

    const initialAmountStr = suggested > 0 ? String(suggested) : "";
    setSingleAmount(initialAmountStr);
    setCashAmount(initialAmountStr);
    setUpiAmount("");

    if (nextUnpaidInstallment?.installment_number) {
      setSelectedInstallmentNumber(String(nextUnpaidInstallment.installment_number));
    } else {
      setSelectedInstallmentNumber("");
    }
  }, [isOpen, enrollment, nextUnpaidInstallment, balance]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !enrollment) return null;

  const computedTotal =
    paymentMode === "split"
      ? (Number(cashAmount) || 0) + (Number(upiAmount) || 0)
      : Number(singleAmount) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    const effectiveCashAmount =
      paymentMode === "cash"
        ? Number(singleAmount) || 0
        : paymentMode === "split"
        ? Number(cashAmount) || 0
        : 0;

    const effectiveUpiAmount =
      paymentMode === "upi"
        ? Number(singleAmount) || 0
        : paymentMode === "split"
        ? Number(upiAmount) || 0
        : 0;

    if (paymentMode === "split") {
      if (!effectiveCashAmount || effectiveCashAmount <= 0) {
        setValidationError("Please enter a valid cash amount.");
        return;
      }
      if (!effectiveUpiAmount || effectiveUpiAmount <= 0) {
        setValidationError("Please enter a valid UPI amount.");
        return;
      }
      if (!upiTransactionId.trim()) {
        setValidationError("UPI Transaction ID / Ref is required for the UPI portion.");
        return;
      }
    } else if (paymentMode === "upi") {
      if (!effectiveUpiAmount || effectiveUpiAmount <= 0) {
        setValidationError("Please enter a valid payment amount.");
        return;
      }
      if (!upiTransactionId.trim()) {
        setValidationError("UPI Transaction ID / Reference (UTR) is required.");
        return;
      }
    } else {
      if (!effectiveCashAmount || effectiveCashAmount <= 0) {
        setValidationError("Please enter a valid cash amount.");
        return;
      }
    }

    const isFullBalance = paymentScope === "full_balance" || (balance > 0 && computedTotal >= balance);

    const payload = {
      payment_method: paymentMode,
      amount: computedTotal,
      cash_amount: effectiveCashAmount,
      upi_amount: effectiveUpiAmount,
      ...(effectiveUpiAmount > 0 && upiTransactionId.trim()
        ? { upi_transaction_id: upiTransactionId.trim() }
        : {}),
      ...(isFullBalance ? { pay_full_balance: true } : {}),
      ...(selectedInstallmentNumber && !isFullBalance
        ? { installment_number: Number(selectedInstallmentNumber) }
        : {}),
    };

    onSubmit(enrollment.enrollment_id ?? enrollment.id, payload);
  };

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.6)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="ba-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid #e3ddd0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-5"
          style={{ background: "#ffffff", borderColor: "#e3ddd0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "#faf4ea", color: "#9c6b2e" }}
            >
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9c6b2e]">
                  In-Person Fee Collection
                </p>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Record Installment Payment
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Student & Course recap */}
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
          >
            <div>
              <p className="text-sm font-bold text-slate-900">
                {enrollment.name || "Student"}
              </p>
              <p className="text-xs text-stone-500">
                {enrollment.course_title || "Course"} • #{enrollment.enrollment_id}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-lg font-extrabold text-rose-600">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          {validationError && (
            <div
              className="rounded-xl p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Payment Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash", label: "Cash", icon: Wallet },
                { id: "upi", label: "UPI", icon: CreditCard },
                { id: "split", label: "Split (Cash + UPI)", icon: Receipt },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "border-[#9c6b2e] bg-[#faf4ea] text-[#9c6b2e] shadow-xs"
                        : "border-[#e3ddd0] bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Scope Selector (Next Installment vs Full Course Balance) */}
          {balance > 0 && nextUnpaidInstallment && (
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-2">
                Payment Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentScope("installment");
                    const amt =
                      nextUnpaidInstallment.remaining_amount !== undefined && nextUnpaidInstallment.remaining_amount !== null
                        ? Number(nextUnpaidInstallment.remaining_amount)
                        : Math.max(0, Number(nextUnpaidInstallment.amount || 0) - Number(nextUnpaidInstallment.paid_amount || 0));
                    const s = amt > 0 ? String(amt) : "";
                    setSingleAmount(s);
                    setCashAmount(s);
                    setUpiAmount("");
                    if (nextUnpaidInstallment.installment_number) {
                      setSelectedInstallmentNumber(String(nextUnpaidInstallment.installment_number));
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    paymentScope === "installment"
                      ? "border-[#9c6b2e] bg-[#faf4ea] text-[#9c6b2e] shadow-xs"
                      : "border-[#e3ddd0] bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Next Installment (#{nextUnpaidInstallment.installment_number ?? 1})
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Single scheduled installment</p>
                  </div>
                  <span className="text-xs font-bold text-[#9c6b2e]">
                    {formatCurrency(
                      nextUnpaidInstallment.remaining_amount !== undefined && nextUnpaidInstallment.remaining_amount !== null
                        ? nextUnpaidInstallment.remaining_amount
                        : Math.max(0, Number(nextUnpaidInstallment.amount || 0) - Number(nextUnpaidInstallment.paid_amount || 0))
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentScope("full_balance");
                    const s = balance > 0 ? String(balance) : "";
                    setSingleAmount(s);
                    setCashAmount(s);
                    setUpiAmount("");
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    paymentScope === "full_balance"
                      ? "border-[#9c6b2e] bg-[#faf4ea] text-[#9c6b2e] shadow-xs"
                      : "border-[#e3ddd0] bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">Full Course Balance</p>
                      <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold">
                        All Remaining
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">Settles all outstanding balance</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600">
                    {formatCurrency(balance)}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Target Installment Banner */}
          {paymentScope === "full_balance" ? (
            <div className="rounded-xl border border-[#9c6b2e]/40 bg-[#faf4ea]/60 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9c6b2e] text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    Full Balance Settlement
                  </span>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Allocates payment across all remaining installments and marks course as fully paid.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
                  Total Settlement
                </span>
                <span className="text-sm font-extrabold text-[#9c6b2e]">
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          ) : nextUnpaidInstallment ? (
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Applying Payment Towards
              </label>
              <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "#faf4ea", color: "#9c6b2e" }}
                  >
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Installment #{nextUnpaidInstallment.installment_number ?? 1}
                      </span>
                      <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                        {String(nextUnpaidInstallment.status || "").toLowerCase() === "rejected"
                          ? "Due (Rejected)"
                          : "Due Next"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {nextUnpaidInstallment.due_date
                        ? `Due Date: ${formatDate(nextUnpaidInstallment.due_date)}`
                        : "Next scheduled installment"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    Amount Due
                  </span>
                  <span className="text-sm font-bold text-[#9c6b2e]">
                    {formatCurrency(
                      nextUnpaidInstallment.remaining_amount !== undefined && nextUnpaidInstallment.remaining_amount !== null
                        ? nextUnpaidInstallment.remaining_amount
                        : Math.max(0, Number(nextUnpaidInstallment.amount || 0) - Number(nextUnpaidInstallment.paid_amount || 0))
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3 flex items-center gap-2.5 text-xs text-stone-700">
              <Receipt className="h-4 w-4 text-[#9c6b2e] shrink-0" />
              <span>Applying payment directly towards student's outstanding balance.</span>
            </div>
          )}

          {/* Single Cash or Single UPI Fields */}
          {paymentMode !== "split" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  {paymentMode === "cash" ? "Cash Amount (₹)" : "UPI Amount (₹)"}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={balance > 0 ? balance : undefined}
                    value={singleAmount}
                    onChange={(e) => setSingleAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 placeholder:text-stone-400 ${FOCUS_RING}`}
                  />
                </div>
              </div>

              {/* UPI Transaction ID / UTR when payment mode is UPI */}
              {paymentMode === "upi" && (
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    UPI Transaction ID / Ref (UTR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upiTransactionId}
                    onChange={(e) => setUpiTransactionId(e.target.value)}
                    placeholder="e.g. 12-digit UTR or Bank Ref ID"
                    required
                    className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-900 placeholder:text-stone-400 ${FOCUS_RING}`}
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Enter the 12-digit transaction reference or UPI UTR number from your payment app.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Split Cash + UPI Fields */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Cash Portion (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0"
                      required
                      className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 ${FOCUS_RING}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    UPI Portion (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="0"
                      required
                      className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 ${FOCUS_RING}`}
                    />
                  </div>
                </div>
              </div>

              {/* UPI Transaction ID / UTR for split payment */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  UPI Transaction ID / Ref (UTR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  placeholder="e.g. 12-digit UTR or Bank Ref ID"
                  required
                  className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-900 placeholder:text-stone-400 ${FOCUS_RING}`}
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Enter the transaction reference or UPI UTR number for the UPI portion.
                </p>
              </div>

              <div
                className="flex items-center justify-between rounded-xl p-3"
                style={{ background: "#f8f5ee", border: "1px solid #e3ddd0" }}
              >
                <span className="text-xs font-semibold text-stone-600">
                  Total Payment Sum
                </span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(computedTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Notice */}
          <p className="text-[11px] text-stone-500 italic">
            This in-person payment will immediately update the student's installment schedule and reduce their outstanding balance.
          </p>

          {/* Footer Buttons */}
          <div
            className="pt-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: "#e3ddd0" }}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#e3ddd0] text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || computedTotal <= 0}
              className={`ba-press flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition ${
                isSubmitting || computedTotal <= 0
                  ? "opacity-60 cursor-not-allowed bg-stone-400"
                  : "bg-[#9c6b2e] hover:bg-[#855923] cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording Payment...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Record {formatCurrency(computedTotal)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   REJECT PAYMENT MODAL
   PUT /enrollments/branch-admin/installment-payments/{payment_id}/reject
   ───────────────────────────────────────────────────────── */
const RejectPaymentModal = ({
  isOpen,
  onClose,
  payment,
  onConfirm,
  isSubmitting,
}) => {
  const [reason, setReason] = useState("Payment could not be verified in branch bank records.");

  useEffect(() => {
    if (isOpen) {
      setReason("Payment could not be verified in branch bank records.");
    }
  }, [isOpen]);

  if (!isOpen || !payment) return null;

  const paymentId = payment.payment_id ?? payment.id;
  const studentName =
    payment.student_name || payment.name || payment.student?.name || "Student";
  const amount = payment.amount ?? payment.payment_amount ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(paymentId, reason.trim() || "Payment rejected by Branch Admin");
  };

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.6)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="ba-pop relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid #e3ddd0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#e3ddd0] flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Reject Online Payment
            </h3>
            <p className="text-xs text-stone-500">
              {studentName} • {formatCurrency(amount)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State why this payment is being rejected..."
              required
              className={`w-full rounded-xl border border-[#e3ddd0] bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-stone-400 ${FOCUS_RING}`}
            />
          </div>

          <p className="text-xs text-rose-600 font-medium">
            Rejecting this payment will notify the student and mark the installment as unpaid.
          </p>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e3ddd0] text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ba-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   ENROLLMENT DETAILS MODAL (FULL VIEW)
   ───────────────────────────────────────────────────────── */
const EnrollmentDetailsModal = ({
  enrollment,
  onClose,
  onToggleStatus,
  statusUpdatingId,
  onOpenRecordPayment,
  paymentHistory = [],
  pendingPayments = [],
  todayPayments = [],
  token,
}) => {
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

  const allEnrollmentPayments = useMemo(() => {
    if (!enrollment) return [];

    const currentEnrollmentId = String(enrollment.enrollment_id || enrollment.id || "");

    const histPayments = Array.isArray(paymentHistory)
      ? paymentHistory.filter((p) => String(p.enrollment_id || "") === currentEnrollmentId)
      : [];

    const pendingList = Array.isArray(pendingPayments)
      ? pendingPayments.filter((p) => String(p.enrollment_id || "") === currentEnrollmentId)
      : [];

    const todayList = Array.isArray(todayPayments)
      ? todayPayments.filter((p) => String(p.enrollment_id || "") === currentEnrollmentId)
      : [];

    const enrollmentPayments = [
      ...(Array.isArray(enrollment.installment_payments) ? enrollment.installment_payments : []),
      ...(Array.isArray(enrollment.payments) ? enrollment.payments : []),
      ...(Array.isArray(enrollment.payment_history) ? enrollment.payment_history : []),
      ...(Array.isArray(enrollment.recent_payments) ? enrollment.recent_payments : []),
      ...(Array.isArray(enrollment.history) ? enrollment.history : []),
      ...(Array.isArray(enrollment.transactions) ? enrollment.transactions : []),
      ...(Array.isArray(enrollment.records) ? enrollment.records : []),
      ...(Array.isArray(enrollment.all_payments) ? enrollment.all_payments : []),
    ];

    const seen = new Set();
    const combined = [
      ...enrollmentPayments,
      ...histPayments,
      ...pendingList,
      ...todayList,
    ];

    return combined.filter((p) => {
      const idKey = p.payment_id ?? p.id ?? (p.receipt_number ? `rcpt-${p.receipt_number}` : null);
      if (!idKey) return true;
      if (seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [enrollment, paymentHistory, pendingPayments, todayPayments]);

  const enrichedInstallments = useMemo(() => {
    if (!enrollment) return [];

    const rawBase = Array.isArray(enrollment.installments)
      ? enrollment.installments
      : Array.isArray(enrollment.installment_schedule)
      ? enrollment.installment_schedule
      : Array.isArray(enrollment.schedule)
      ? enrollment.schedule
      : [];

    const allPayments = allEnrollmentPayments;

    return rawBase.map((inst, idx) => {
      const instNum = Number(inst.installment_number ?? (idx + 1));
      const instId = inst.installment_id ?? inst.id;
      const totalInstAmount = Number(inst.amount ?? 0);
      const backendStatus = String(inst.status || "").toLowerCase().trim();
      const isInstBackendPaid = backendStatus === "paid";
      const isInstBackendPartial = backendStatus === "partial";

      // Find matching payment attempts
      const matchingPayments = allPayments.filter((p) => {
        if (!p) return false;
        if (Array.isArray(p.installment_numbers) && p.installment_numbers.map(Number).includes(instNum)) {
          return true;
        }
        if (p.installment_number !== undefined && p.installment_number !== null) {
          return Number(p.installment_number) === instNum;
        }
        if (instId && p.installment_id !== undefined && p.installment_id !== null) {
          return String(p.installment_id) === String(instId);
        }
        // Match payment for Installment 1 if it's Razorpay online payment
        if (
          instNum === 1 &&
          (
            (enrollment.razorpay_payment_id && (p.payment_reference === enrollment.razorpay_payment_id || p.razorpay_payment_id === enrollment.razorpay_payment_id)) ||
            (String(p.payment_method).toLowerCase() === 'razorpay' && (p.installment_number === undefined || p.installment_number === null))
          )
        ) {
          return true;
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

      const match = matchingPayments[0];

      // Extraction of payment attributes from match, inst, or enrollment
      const rawMethod = String(
        match?.payment_method ||
        inst.payment_method ||
        (isInstBackendPaid && instNum === 1 && (enrollment.razorpay_payment_id || enrollment.razorpay_order_id) ? 'razorpay' : '') ||
        ''
      ).toLowerCase().trim();

      const rawCashAmount = match?.cash_amount !== undefined && match?.cash_amount !== null
        ? Number(match.cash_amount)
        : inst.cash_amount !== undefined && inst.cash_amount !== null
        ? Number(inst.cash_amount)
        : null;

      const rawUpiAmount = match?.upi_amount !== undefined && match?.upi_amount !== null
        ? Number(match.upi_amount)
        : inst.upi_amount !== undefined && inst.upi_amount !== null
        ? Number(inst.upi_amount)
        : null;

      const isSplit =
        rawMethod === 'cash_upi' ||
        rawMethod === 'split' ||
        (rawCashAmount !== null && rawUpiAmount !== null && rawCashAmount > 0 && rawUpiAmount > 0);

      const isUpi = !isSplit && (rawMethod === 'upi' || (rawUpiAmount !== null && rawUpiAmount > 0 && (!rawCashAmount || rawCashAmount === 0)));
      const isCash = !isSplit && !isUpi && (rawMethod === 'cash' || (rawCashAmount !== null && rawCashAmount > 0 && (!rawUpiAmount || rawUpiAmount === 0)));
      const isRazorpay =
        rawMethod === 'razorpay' ||
        rawMethod === 'online' ||
        Boolean(match?.razorpay_payment_id || inst.razorpay_payment_id || (instNum === 1 && (enrollment.razorpay_payment_id || enrollment.razorpay_order_id)));

      let paymentMethodDisplay = 'Pending';
      if (isSplit) {
        paymentMethodDisplay = 'Cash + UPI';
      } else if (isUpi) {
        paymentMethodDisplay = 'UPI';
      } else if (isCash) {
        paymentMethodDisplay = 'Cash';
      } else if (isRazorpay) {
        paymentMethodDisplay = 'Razorpay';
      } else if (rawMethod) {
        if (rawMethod === 'cash_upi') paymentMethodDisplay = 'Cash + UPI';
        else paymentMethodDisplay = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);
      } else if (isInstBackendPaid || (match && (match.status === 'received' || match.status === 'paid'))) {
        paymentMethodDisplay = 'Verified';
      }

      const upiTxnId =
        match?.upi_transaction_id ||
        inst.upi_transaction_id ||
        match?.transaction_id ||
        inst.transaction_id ||
        '';

      const paymentRef =
        match?.payment_reference ||
        inst.payment_reference ||
        match?.reference ||
        inst.reference ||
        '';

      const rzpPaymentId =
        match?.razorpay_payment_id ||
        inst.razorpay_payment_id ||
        (isRazorpay ? (paymentRef || (instNum === 1 ? enrollment.razorpay_payment_id : '')) : '');

      const rzpOrderId =
        match?.razorpay_order_id ||
        inst.razorpay_order_id ||
        (isRazorpay && instNum === 1 ? enrollment.razorpay_order_id : '');

      if (!match) {
        const isInstRejected =
          backendStatus === "rejected" ||
          String(inst.approval_status || "").toLowerCase() === "rejected";
        const isInstPaid =
          backendStatus === "paid" ||
          String(inst.approval_status || "").toLowerCase() === "approved";

        const computedPaid = isInstRejected
          ? 0
          : inst.paid_amount !== undefined && inst.paid_amount !== null
          ? Number(inst.paid_amount)
          : isInstPaid
          ? totalInstAmount
          : 0;

        const computedRemaining = isInstRejected
          ? totalInstAmount
          : isInstPaid
          ? 0
          : inst.remaining_amount !== undefined && inst.remaining_amount !== null
          ? Number(inst.remaining_amount)
          : Math.max(0, totalInstAmount - computedPaid);

        const isActuallyPaid = isInstPaid || (computedRemaining <= 0 && computedPaid >= totalInstAmount && totalInstAmount > 0);
        const isActuallyPartial = !isActuallyPaid && (isInstBackendPartial || (computedPaid > 0 && computedRemaining > 0));

        return {
          ...inst,
          installment_number: instNum,
          amount: totalInstAmount,
          paid_amount: computedPaid,
          remaining_amount: computedRemaining,
          status: isInstRejected
            ? "rejected"
            : isActuallyPaid
            ? "paid"
            : isActuallyPartial
            ? "partial"
            : inst.status || "pending",
          is_rejected: isInstRejected,
          is_paid: isActuallyPaid,
          is_partial: isActuallyPartial,
          rejection_reason: inst.rejection_reason || inst.reason || "",
          payment_method: rawMethod || inst.payment_method,
          payment_method_display: paymentMethodDisplay,
          cash_amount: rawCashAmount ?? (isCash ? computedPaid : null),
          upi_amount: rawUpiAmount ?? (isUpi ? computedPaid : null),
          upi_transaction_id: upiTxnId,
          payment_reference: paymentRef,
          razorpay_payment_id: rzpPaymentId,
          razorpay_order_id: rzpOrderId,
          is_split: isSplit,
          is_upi: isUpi,
          is_cash: isCash,
          is_razorpay: isRazorpay,
        };
      }

      const matchStatus = String(match.status || "").toLowerCase().trim();
      const matchApprovalStatus = String(match.approval_status || "").toLowerCase().trim();
      const matchMethodStatus = String(match.payment_status || "").toLowerCase().trim();

      const isRejected = matchStatus === "rejected" || matchApprovalStatus === "rejected";

      const isPendingReview =
        !isRejected &&
        (matchStatus === "pending_review" ||
          matchApprovalStatus === "pending" ||
          (match.credited_to_balance === false && matchMethodStatus === "paid"));

      const rejectionReason =
        match.rejection_reason ||
        match.reason ||
        inst.rejection_reason ||
        (isRejected ? "Payment could not be verified in branch bank records" : "");

      const isGroupedFullBalance = Array.isArray(match.installment_numbers) && match.installment_numbers.length > 1;

      // Prioritize backend installment aggregated amounts; fallback to match amount if backend has none
      const computedPaidAmount = isRejected
        ? 0
        : inst.paid_amount !== undefined && inst.paid_amount !== null
        ? Number(inst.paid_amount)
        : isGroupedFullBalance
        ? totalInstAmount
        : Number(match.paid_amount ?? match.amount ?? 0);

      const computedRemainingAmount = isRejected
        ? totalInstAmount
        : isInstBackendPaid || (isGroupedFullBalance && !isRejected && !isPendingReview)
        ? 0
        : inst.remaining_amount !== undefined && inst.remaining_amount !== null
        ? Number(inst.remaining_amount)
        : Math.max(0, totalInstAmount - computedPaidAmount);

      const isPaid =
        !isRejected &&
        !isPendingReview &&
        (isInstBackendPaid ||
          (computedRemainingAmount <= 0 && computedPaidAmount >= totalInstAmount && totalInstAmount > 0));

      const isPartial =
        !isRejected &&
        !isPendingReview &&
        !isPaid &&
        (isInstBackendPartial || (computedPaidAmount > 0 && computedRemainingAmount > 0));

      const finalStatus = isRejected
        ? "rejected"
        : isPendingReview
        ? "awaiting_review"
        : isPaid
        ? "paid"
        : isPartial
        ? "partial"
        : inst.status || "pending";

      return {
        ...inst,
        installment_number: instNum,
        amount: totalInstAmount, // ALWAYS preserve installment amount (do not overwrite with payment amount)
        paid_amount: computedPaidAmount,
        remaining_amount: computedRemainingAmount,
        status: finalStatus,
        approval_status: isRejected
          ? "rejected"
          : isPendingReview
          ? "pending"
          : isPaid
          ? "approved"
          : isPartial
          ? "partial"
          : inst.approval_status || "pending",
        is_rejected: isRejected,
        is_pending_review: isPendingReview,
        is_paid: isPaid,
        is_partial: isPartial,
        rejection_reason: rejectionReason,
        reviewed_at: match.reviewed_at || inst.reviewed_at,
        payment_date: match.payment_date || match.paid_date || inst.payment_date || inst.paid_date,
        paid_date: isPaid
          ? (inst.paid_date || match.paid_date || match.payment_date)
          : inst.paid_date,
        payment_method: match.payment_method || inst.payment_method || rawMethod,
        payment_method_display: paymentMethodDisplay,
        cash_amount: rawCashAmount ?? (isCash ? computedPaidAmount : null),
        upi_amount: rawUpiAmount ?? (isUpi ? computedPaidAmount : null),
        upi_transaction_id: upiTxnId,
        payment_reference: paymentRef,
        razorpay_payment_id: rzpPaymentId,
        razorpay_order_id: rzpOrderId,
        is_split: isSplit,
        is_upi: isUpi,
        is_cash: isCash,
        is_razorpay: isRazorpay,
      };
    });
  }, [enrollment, allEnrollmentPayments]);

  if (!enrollment) return null;

  const installments = enrichedInstallments.length > 0
    ? enrichedInstallments
    : Array.isArray(enrollment.installments)
    ? enrollment.installments
    : [];

  const balanceNum = Number(enrollment.balance_amount ?? enrollment.remaining_amount ?? 0);

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
        {/* Sticky header */}
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
                Enrollment Details #{enrollment.enrollment_id}
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
          {/* 1. Student Information */}
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

            {/* Account Status Control */}
            {(() => {
              const isAct = isStudentActive(enrollment);
              const studentId =
                enrollment.student_id ??
                enrollment.user_id ??
                enrollment.id ??
                enrollment.enrollment_id;
              const isUpdating = statusUpdatingId === studentId;
              return (
                <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-[#e3ddd0] flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#17140f]">Account Access</p>
                    <p className="text-xs text-[#8a8175]">
                      Student portal login and features access
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        isAct
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAct ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {isAct ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        onToggleStatus(enrollment, isAct ? "Inactive" : "Active")
                      }
                      className={`ba-press rounded-lg px-3.5 py-1.5 text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        isAct
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isAct ? "Deactivate Account" : "Activate Account"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* 2. Course Information */}
          <section>
            <SectionTitle icon={CalendarDays}>Course Information</SectionTitle>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Course Title" value={enrollment.course_title} />
              <DetailItem label="Course Duration" value={enrollment.course_duration} />
              <DetailItem
                label="Course Status"
                value={<StatusPill status={enrollment.course_status || "pending"} />}
              />
              <DetailItem label="Enrollment ID" value={`#${enrollment.enrollment_id}`} />
              <DetailItem label="Enrollment Date" value={formatDate(enrollment.created_at)} />
            </dl>
          </section>

          {/* 3. Payment Summary & Actions */}
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
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{ ...serif, color: "#17140f" }}
                >
                  {formatCurrency(enrollment.total_fee)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Total Paid
                </p>
                <p
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{ ...serif, color: "#5c7a5a" }}
                >
                  {formatCurrency(enrollment.total_paid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Balance Due
                </p>
                <p
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{
                    ...serif,
                    color: balanceNum > 0 ? "#a24a3a" : "#5c7a5a",
                  }}
                >
                  {formatCurrency(balanceNum)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Payment Status:</span>
                <StatusPill status={enrollment.status} />
              </div>

              {balanceNum > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenRecordPayment({
                      ...enrollment,
                      installments:
                        enrichedInstallments?.length > 0
                          ? enrichedInstallments
                          : enrollment.installments,
                      balance_amount:
                        enrollment.balance_amount ??
                        enrollment.remaining_amount,
                      remaining_amount:
                        enrollment.remaining_amount ??
                        enrollment.balance_amount,
                    })
                  }
                  className="ba-press inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                  style={{ background: "#9c6b2e" }}
                >
                  <IndianRupee className="h-3.5 w-3.5" />
                  Record In-Person Payment
                </button>
              )}
            </div>
          </section>

          {/* 4. Installment Details */}
          <section>
            <div className="flex items-center justify-between pb-3 border-b border-[#e3ddd0]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#17140f]">
                <Clock className="h-4 w-4 text-[#9c6b2e]" />
                Installments Breakdown
              </h3>
            </div>

            {installments.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">
                No installment schedule records found for this enrollment.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {installments.map((inst, idx) => {
                  const instStatus = String(inst.status || "pending").toLowerCase();
                  const isDue = inst.is_due === true;
                  const isRejected = Boolean(inst.is_rejected || instStatus === "rejected");
                  const isPendingReview = Boolean(inst.is_pending_review || instStatus === "awaiting_review");

                  return (
                    <div
                      key={inst.installment_id || idx}
                      className={`rounded-xl p-4 transition-all ${
                        isRejected
                          ? "bg-rose-50/40 border border-rose-300 ring-1 ring-rose-200/60 shadow-2xs"
                          : isDue
                          ? "bg-[#fef8f0] border border-[#f0d9b5]"
                          : "bg-white border border-[#e3ddd0]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xs font-semibold tracking-wide uppercase"
                            style={{ color: isRejected ? "#b91c1c" : "#9c6b2e" }}
                          >
                            Installment {inst.installment_number ?? idx + 1}
                          </p>
                          {isRejected && (
                            <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              Payment Rejected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isDue && !isRejected && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Due
                            </span>
                          )}
                          <StatusPill status={isRejected ? "rejected" : isPendingReview ? "pending" : instStatus} />
                        </div>
                      </div>

                      {/* Rejection Alert Box */}
                      {isRejected && (
                        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1 min-w-0">
                              <p className="font-bold text-rose-950 text-xs">
                                Online Payment Rejected by Branch Admin
                              </p>
                              <p className="text-rose-800">
                                <span className="font-semibold text-rose-950">Reason: </span>
                                {inst.rejection_reason || "Payment could not be verified in branch bank records"}
                              </p>
                              {inst.reviewed_at && (
                                <p className="text-[11px] text-rose-600">
                                  Reviewed on: {formatDateTime(inst.reviewed_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <dl className="grid gap-3 sm:grid-cols-3">
                        <DetailItem label="Total Amount" value={formatCurrency(inst.amount)} />
                        <DetailItem
                          label="Paid Amount"
                          value={formatCurrency(
                            inst.paid_amount !== undefined && inst.paid_amount !== null
                              ? inst.paid_amount
                              : inst.is_paid || String(inst.status || "").toLowerCase() === "paid"
                              ? inst.amount
                              : 0
                          )}
                        />
                        <DetailItem
                          label="Remaining"
                          value={formatCurrency(
                            inst.remaining_amount !== undefined && inst.remaining_amount !== null
                              ? inst.remaining_amount
                              : inst.is_paid || String(inst.status || "").toLowerCase() === "paid"
                              ? 0
                              : Math.max(0, Number(inst.amount || 0) - Number(inst.paid_amount || 0))
                          )}
                        />
                        <DetailItem label="Due Date" value={formatDate(inst.due_date)} />
                        <DetailItem
                          label={isRejected ? "Attempted Date" : "Paid Date"}
                          value={
                            inst.payment_date || inst.paid_date
                              ? `${formatDate(inst.payment_date || inst.paid_date)}${isRejected ? " (Rejected)" : ""}`
                              : "Not yet paid"
                          }
                        />
                        <DetailItem
                          label="Payment Method"
                          value={
                            isRejected
                              ? (inst.payment_method ? `${String(inst.payment_method).toUpperCase()} Online (Rejected)` : "Razorpay Online (Rejected)")
                              : inst.payment_method_display || (inst.status === "paid" ? "Online / Verified" : "Pending")
                          }
                        />

                        {/* Split (Cash + UPI): Show Cash Amount & UPI Amount as separate fields */}
                        {inst.is_split && (
                          <>
                            <DetailItem
                              label="Cash Amount"
                              value={formatCurrency(inst.cash_amount ?? 0)}
                            />
                            <DetailItem
                              label="UPI Amount"
                              value={formatCurrency(inst.upi_amount ?? 0)}
                            />
                          </>
                        )}

                        {/* UPI Transaction ID for Split or UPI */}
                        {(inst.is_split || inst.is_upi || Boolean(inst.upi_transaction_id)) && inst.upi_transaction_id ? (
                          <DetailItem
                            label="UPI Transaction ID"
                            value={inst.upi_transaction_id}
                          />
                        ) : null}

                        {/* Cash Amount for cash-only */}
                        {inst.is_cash && !inst.is_split && inst.cash_amount !== null && inst.cash_amount > 0 && (
                          <DetailItem
                            label="Cash Amount"
                            value={formatCurrency(inst.cash_amount)}
                          />
                        )}

                        {/* UPI Amount for upi-only */}
                        {inst.is_upi && !inst.is_split && inst.upi_amount !== null && inst.upi_amount > 0 && (
                          <DetailItem
                            label="UPI Amount"
                            value={formatCurrency(inst.upi_amount)}
                          />
                        )}

                        {/* Razorpay Gateway Details directly inside Razorpay installment */}
                        {inst.is_razorpay && inst.razorpay_payment_id && (
                          <DetailItem
                            label="Razorpay Payment ID"
                            value={inst.razorpay_payment_id}
                          />
                        )}
                        {inst.is_razorpay && inst.razorpay_order_id && (
                          <DetailItem
                            label="Razorpay Order ID"
                            value={inst.razorpay_order_id}
                          />
                        )}
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Gateway Details (Shown ONLY if there is no installment schedule breakdown) */}
          {installments.length === 0 && (enrollment.razorpay_order_id || enrollment.razorpay_payment_id) && (
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

        {/* Footer */}
        <div
          className="sticky bottom-0 flex justify-end px-6 py-4 sm:px-8 border-t"
          style={{ background: "#ffffff", borderColor: "#e3ddd0" }}
        >
          <button
            type="button"
            onClick={onClose}
            className={`ba-press rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${FOCUS_RING}`}
            style={{ background: "#17140f" }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

const SkeletonList = () => (
  <div
    className="overflow-hidden rounded-2xl bg-white border border-[#e3ddd0]"
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

const EmptyState = ({ icon: Icon, title, text, actionText, onAction }) => (
  <div
    className="ba-fade rounded-2xl px-6 py-16 text-center border border-dashed border-[#dfc9a9] bg-white"
  >
    <Icon className="mx-auto h-8 w-8 text-[#d9b77b]" />
    <h3 className="mt-3 text-lg font-bold text-slate-900" style={{ ...serif }}>
      {title}
    </h3>
    <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
      {text}
    </p>
    {actionText && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="ba-press mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#9c6b2e]"
      >
        {actionText}
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT: BranchAdminEnrollments
   ───────────────────────────────────────────────────────── */
const BranchAdminEnrollments = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'all' | 'installment' | 'fully_paid' | 'approvals' | 'history'
  const [activeTab, setActiveTab] = useState("all");
  const [approvalsSubTab, setApprovalsSubTab] = useState("pending"); // 'pending' | 'today'
  const [historyStatusFilter, setHistoryStatusFilter] = useState(""); // '' | 'received' | 'rejected'

  // Data sets
  const [enrollments, setEnrollments] = useState([]);
  const [installmentStudents, setInstallmentStudents] = useState([]);
  const [fullyPaidStudents, setFullyPaidStudents] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [todayPayments, setTodayPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Loaders & feedback
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Layout & modals
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [recordingEnrollment, setRecordingEnrollment] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [installmentReceipt, setInstallmentReceipt] = useState(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [nameFilter, setNameFilter] = useState("");

  // Helper to extract list cleanly from API response
  const normalizeArray = (res, keys = ["students", "enrollments", "payments", "items", "data"]) => {
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object") {
      for (const k of keys) {
        if (Array.isArray(res[k])) return res[k];
      }
    }
    return [];
  };

  // Main fetcher
  const loadAllData = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      setError("");

      const [
        enrollmentsRes,
        installmentRes,
        fullyPaidRes,
        pendingRes,
        todayRes,
        historyRes,
      ] = await Promise.allSettled([
        getBranchAdminEnrollmentsApi(token),
        getBranchAdminInstallmentStudentsApi(token),
        getBranchAdminFullyPaidStudentsApi(token),
        getBranchAdminPendingInstallmentPaymentsApi(token),
        getBranchAdminTodayInstallmentPaymentsApi(token),
        getBranchAdminInstallmentPaymentHistoryApi(historyStatusFilter, token),
      ]);

      // 1. All enrollments
      if (enrollmentsRes.status === "fulfilled") {
        const raw = normalizeArray(enrollmentsRes.value);
        setEnrollments(raw);
      } else {
        console.warn("Failed to load enrollments", enrollmentsRes.reason);
      }

      // 2. Installment students (with balance)
      if (installmentRes.status === "fulfilled") {
        const raw = normalizeArray(installmentRes.value);
        setInstallmentStudents(raw);
      } else {
        // Fallback: derive from all enrollments if dedicated endpoint is pending
        console.warn("Using fallback for installment students", installmentRes.reason);
      }

      // 3. Fully paid students
      if (fullyPaidRes.status === "fulfilled") {
        const raw = normalizeArray(fullyPaidRes.value);
        setFullyPaidStudents(raw);
      } else {
        console.warn("Using fallback for fully paid students", fullyPaidRes.reason);
      }

      // 4. Pending online Razorpay payments
      if (pendingRes.status === "fulfilled") {
        const raw = normalizeArray(pendingRes.value);
        setPendingPayments(raw);
      }

      // 5. Today's payments
      if (todayRes.status === "fulfilled") {
        const raw = normalizeArray(todayRes.value);
        setTodayPayments(raw);
      }

      // 6. Payment history
      if (historyRes.status === "fulfilled") {
        const raw = normalizeArray(historyRes.value);
        setPaymentHistory(raw);
      }
    } catch (err) {
      setError(err?.message || "Failed to load branch student records.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Dedicated history reload when status filter changes
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const data = await getBranchAdminInstallmentPaymentHistoryApi(
          historyStatusFilter,
          token
        );
        if (isMounted) {
          setPaymentHistory(normalizeArray(data));
        }
      } catch (err) {
        console.warn("Failed to reload history filter", err);
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [historyStatusFilter, token]);

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Fallback derivations if dedicated arrays are empty but enrollments exist
  const effectiveInstallmentStudents = useMemo(() => {
    if (installmentStudents.length > 0) return installmentStudents;
    return enrollments.filter(
      (e) => Number(e.balance_amount ?? e.remaining_amount ?? 0) > 0
    );
  }, [installmentStudents, enrollments]);

  const effectiveFullyPaidStudents = useMemo(() => {
    if (fullyPaidStudents.length > 0) return fullyPaidStudents;
    return enrollments.filter(
      (e) =>
        Number(e.balance_amount ?? e.remaining_amount ?? 0) === 0 &&
        Number(e.total_paid ?? 0) > 0
    );
  }, [fullyPaidStudents, enrollments]);

  // Account activation / deactivation handler
  const handleToggleStatus = async (enrollment, targetStatus) => {
    const studentId =
      enrollment.student_id ??
      enrollment.user_id ??
      enrollment.id ??
      enrollment.enrollment_id;
    if (!studentId || !token) return;
    const normalizedStatus =
      String(targetStatus).toLowerCase() === "active" ? "Active" : "Inactive";
    const isNowActive = normalizedStatus === "Active";
    try {
      setStatusUpdatingId(studentId);
      setError("");
      setSuccess("");
      await updateBranchAdminStudentStatusApi(studentId, normalizedStatus, token);

      const updateItem = (item) => {
        const id = item.student_id ?? item.user_id ?? item.id ?? item.enrollment_id;
        if (String(id) === String(studentId)) {
          return {
            ...item,
            account_status: normalizedStatus,
            is_active: isNowActive,
            student_status: normalizedStatus,
          };
        }
        return item;
      };

      setEnrollments((prev) => prev.map(updateItem));
      setInstallmentStudents((prev) => prev.map(updateItem));
      setFullyPaidStudents((prev) => prev.map(updateItem));

      setSelectedEnrollment((prev) => {
        if (!prev) return null;
        const prevId = prev.student_id ?? prev.user_id ?? prev.id ?? prev.enrollment_id;
        if (String(prevId) === String(studentId)) {
          return {
            ...prev,
            account_status: normalizedStatus,
            is_active: isNowActive,
            student_status: normalizedStatus,
          };
        }
        return prev;
      });

      const studentName = enrollment.name || "Student";
      setSuccess(`${studentName}'s account status set to ${normalizedStatus}.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || "Failed to update student account status.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Record offline / in-person payment
  const handleRecordPaymentSubmit = async (enrollmentId, payload) => {
    if (!token) return;
    try {
      setIsSubmittingRecord(true);
      setError("");
      setSuccess("");

      const paymentRes = await recordBranchAdminInstallmentPaymentApi(enrollmentId, payload, token);

      let receiptObj = null;
      const hasReceipt =
        paymentRes?.receipt ||
        paymentRes?.receipt_url ||
        paymentRes?.receipt_id ||
        paymentRes?.receipt_number ||
        Boolean(payload.amount);

      if (hasReceipt) {
        receiptObj = paymentRes?.receipt || {
          ...paymentRes,
          receipt_url: paymentRes?.receipt_url,
          download_url: paymentRes?.download_url,
          receipt_id: paymentRes?.receipt_id || (paymentRes?.receipt_url ? String(paymentRes.receipt_url).split('/').pop() : null),
          receipt_number: paymentRes?.receipt_number || paymentRes?.receipt_id || `REC-${Date.now().toString().slice(-4)}`,
          student_name:
            recordingEnrollment?.student_name ||
            recordingEnrollment?.name ||
            paymentRes?.student_name ||
            "Student",
          student_phone: recordingEnrollment?.phone || recordingEnrollment?.student_phone || "",
          student_email: recordingEnrollment?.email || recordingEnrollment?.student_email || "",
          course_title:
            recordingEnrollment?.course_title ||
            recordingEnrollment?.course_name ||
            paymentRes?.course_title ||
            "Course",
          course_fee: recordingEnrollment?.course_fee || recordingEnrollment?.fee,
          amount_paid: payload.amount || paymentRes?.amount || paymentRes?.paid_amount,
          amount: payload.amount || paymentRes?.amount || paymentRes?.paid_amount,
          payment_method: payload.payment_method || (payload.cash_amount && payload.upi_amount ? "split" : payload.cash_amount ? "cash" : "upi"),
          payment_type: "installment",
          installment_number: payload.installment_number || payload.term_number,
          payment_date: payload.payment_date || new Date().toISOString(),
          upi_transaction_id: payload.upi_transaction_id || paymentRes?.upi_transaction_id || null,
        };

        setInstallmentReceipt(receiptObj);
      }

      setSuccess(
        `Payment of ${formatCurrency(payload.amount)} recorded successfully! ${
          receiptObj ? "Receipt generated." : "Balance updated."
        }`
      );
      setTimeout(() => setSuccess(""), 5000);

      // Close the record modal immediately so it does not linger behind the receipt
      setRecordingEnrollment(null);

      // Optimistically update all state lists immediately for instantaneous UI updates
      const paidAmt = Number(payload.amount || 0);
      const updateStudentOptimistically = (item) => {
        const id = item.enrollment_id ?? item.id;
        if (String(id) === String(enrollmentId)) {
          const currentPaid = Number(item.total_paid ?? item.paid_amount ?? 0);
          const currentBal = Number(item.balance_amount ?? item.remaining_amount ?? 0);
          const newPaid = currentPaid + paidAmt;
          const newBal = Math.max(0, currentBal - paidAmt);

          let updatedInstallments = item.installments;
          if (Array.isArray(item.installments)) {
            updatedInstallments = item.installments.map((inst) => {
              const instNum = Number(inst.installment_number);
              if (payload.installment_number && instNum === Number(payload.installment_number)) {
                return {
                  ...inst,
                  status: "paid",
                  paid_amount: Number(inst.amount || paidAmt),
                  remaining_amount: 0,
                  is_paid: true,
                };
              }
              return inst;
            });
          }

          return {
            ...item,
            total_paid: newPaid,
            paid_amount: newPaid,
            balance_amount: newBal,
            remaining_amount: newBal,
            installments: updatedInstallments,
          };
        }
        return item;
      };

      setEnrollments((prev) => prev.map(updateStudentOptimistically));
      setInstallmentStudents((prev) => prev.map(updateStudentOptimistically));
      setFullyPaidStudents((prev) => prev.map(updateStudentOptimistically));
      setSelectedEnrollment((prev) => {
        if (!prev) return null;
        const id = prev.enrollment_id ?? prev.id;
        if (String(id) === String(enrollmentId)) {
          return updateStudentOptimistically(prev);
        }
        return prev;
      });

      // Reload data cleanly in background to sync with backend
      await loadAllData(true);
    } catch (err) {
      console.error("Error recording installment payment:", err);
      setError(err?.message || "Failed to record installment payment.");
      setTimeout(() => setError(""), 6000);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // Approve online Razorpay payment
  const handleApprovePayment = async (payment) => {
    const paymentId = payment.payment_id ?? payment.id;
    if (!paymentId || !token) return;
    try {
      setProcessingPaymentId(paymentId);
      setError("");
      setSuccess("");

      await approveBranchAdminInstallmentPaymentApi(paymentId, token);

      const amountStr = formatCurrency(payment.amount ?? payment.payment_amount ?? 0);
      const studentName =
        payment.student_name || payment.name || payment.student?.name || "Student";
      setSuccess(`Payment of ${amountStr} for ${studentName} approved successfully.`);
      setTimeout(() => setSuccess(""), 5000);

      // Re-fetch approvals and students data silently
      loadAllData(true);
    } catch (err) {
      setError(err?.message || "Failed to approve payment.");
      setTimeout(() => setError(""), 6000);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Reject online Razorpay payment
  const handleRejectPayment = async (paymentId, reason) => {
    if (!paymentId || !token) return;
    try {
      setProcessingPaymentId(paymentId);
      setError("");
      setSuccess("");

      await rejectBranchAdminInstallmentPaymentApi(paymentId, reason, token);

      setSuccess("Payment has been rejected.");
      setTimeout(() => setSuccess(""), 5000);
      setRejectingPayment(null);

      loadAllData(true);
    } catch (err) {
      setError(err?.message || "Failed to reject payment.");
      setTimeout(() => setError(""), 6000);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Filtered dataset according to active tab + search query
  const filteredData = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();

    let list = [];
    if (activeTab === "all") list = enrollments;
    else if (activeTab === "installment") list = effectiveInstallmentStudents;
    else if (activeTab === "fully_paid") list = effectiveFullyPaidStudents;
    else if (activeTab === "approvals") {
      list = approvalsSubTab === "pending" ? pendingPayments : todayPayments;
    } else if (activeTab === "history") {
      list = paymentHistory;
    }

    if (!q) return list;

    return list.filter((item) => {
      const name = (
        item.name ||
        item.student_name ||
        item.student?.name ||
        ""
      ).toLowerCase();
      const email = (
        item.email ||
        item.student_email ||
        item.student?.email ||
        ""
      ).toLowerCase();
      const course = (
        item.course_title ||
        item.course_name ||
        item.course?.title ||
        ""
      ).toLowerCase();
      return name.includes(q) || email.includes(q) || course.includes(q);
    });
  }, [
    activeTab,
    approvalsSubTab,
    enrollments,
    effectiveInstallmentStudents,
    effectiveFullyPaidStudents,
    pendingPayments,
    todayPayments,
    paymentHistory,
    nameFilter,
  ]);

  const totalOutstanding = useMemo(() => {
    return effectiveInstallmentStudents.reduce((sum, s) => {
      return sum + Number(s.balance_amount ?? s.remaining_amount ?? 0);
    }, 0);
  }, [effectiveInstallmentStudents]);

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

      <main className="min-w-0 flex-1 pb-16">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
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
                Students & Payments
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                Branch Administrator
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-7 px-6 py-8 sm:px-10">
          {/* Notifications */}
          {error && (
            <div
              role="alert"
              className="ba-toast rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
              style={{
                background: "#f8eae5",
                color: "#7c3324",
                border: "1px solid #eccec4",
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="ba-toast rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
              style={{
                background: "#eef2ea",
                color: "#39533a",
                border: "1px solid #cce0c6",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Total Enrolled */}
            <div
              className={`ba-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer transition ${
                activeTab === "all"
                  ? "border-[#9c6b2e] ring-2 ring-[#9c6b2e]/30 shadow-sm"
                  : "border-[#e3ddd0] hover:border-[#9c6b2e]/50"
              }`}
              onClick={() => setActiveTab("all")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Total Students
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-slate-900"
                style={{ ...serif }}
              >
                {loading ? "…" : enrollments.length}
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                Registered in your branch
              </p>
            </div>

            {/* Installments Due */}
            <div
              className={`ba-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer transition ${
                activeTab === "installment"
                  ? "border-amber-400 ring-2 ring-amber-300/40 shadow-sm"
                  : "border-[#e3ddd0] hover:border-amber-400/50"
              }`}
              onClick={() => setActiveTab("installment")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Installments Due
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-[#9c6b2e]">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-amber-900"
                style={{ ...serif }}
              >
                {loading ? "…" : effectiveInstallmentStudents.length}
              </p>
              <p className="mt-1 text-[11px] font-medium text-amber-700 truncate">
                {totalOutstanding > 0
                  ? `${formatCurrency(totalOutstanding)} pending`
                  : "Students with balance"}
              </p>
            </div>

            {/* Fully Paid */}
            <div
              className={`ba-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer transition ${
                activeTab === "fully_paid"
                  ? "border-emerald-500 ring-2 ring-emerald-300/40 shadow-sm"
                  : "border-[#e3ddd0] hover:border-emerald-400/50"
              }`}
              onClick={() => setActiveTab("fully_paid")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Fully Paid
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-emerald-900"
                style={{ ...serif }}
              >
                {loading ? "…" : effectiveFullyPaidStudents.length}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                100% fees completed
              </p>
            </div>

            {/* Online Approvals Pending */}
            <div
              className={`ba-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer transition ${
                activeTab === "approvals"
                  ? "border-rose-400 ring-2 ring-rose-200/80 shadow-sm"
                  : pendingPayments.length > 0
                  ? "border-rose-300 ring-1 ring-rose-200/70 hover:border-rose-400"
                  : "border-[#e3ddd0] hover:border-rose-300"
              }`}
              onClick={() => setActiveTab("approvals")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Online Approvals Pending
                </p>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    pendingPayments.length > 0
                      ? "bg-rose-600 text-white animate-pulse shadow-xs"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p
                  className="text-2xl font-bold text-rose-950"
                  style={{ ...serif }}
                >
                  {loading ? "…" : pendingPayments.length}
                </p>
                {pendingPayments.length > 0 && (
                  <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    Action needed
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-stone-400">
                Razorpay reviews awaiting
              </p>
            </div>
          </div>

          {/* Section Navigation Tabs & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#e3ddd0] pb-3.5">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "all"
                    ? "bg-[#17140f] text-white shadow-xs"
                    : "bg-white text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                }`}
              >
                All Students ({enrollments.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("installment")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "installment"
                    ? "bg-[#17140f] text-white shadow-xs"
                    : "bg-white text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                }`}
              >
                Installments Due ({effectiveInstallmentStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fully_paid")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "fully_paid"
                    ? "bg-[#17140f] text-white shadow-xs"
                    : "bg-white text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                }`}
              >
                Fully Paid ({effectiveFullyPaidStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("approvals")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "approvals"
                    ? "bg-[#17140f] text-white shadow-xs"
                    : "bg-white text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                }`}
              >
                Online Approvals ({pendingPayments.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="search"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search students, course..."
                className={`w-full rounded-xl border border-[#e3ddd0] bg-white py-2 pl-9 pr-7 text-xs font-medium text-slate-900 placeholder:text-stone-400 ${FOCUS_RING}`}
              />
              {nameFilter && (
                <button
                  type="button"
                  onClick={() => setNameFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-filters for Online Approvals tab */}
          {activeTab === "approvals" && (
            <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#e3ddd0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalsSubTab("pending")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    approvalsSubTab === "pending"
                      ? "bg-[#9c6b2e] text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Pending Approvals ({pendingPayments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalsSubTab("today")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    approvalsSubTab === "today"
                      ? "bg-[#9c6b2e] text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Today's Payments ({todayPayments.length})
                </button>
              </div>

              <p className="text-[11px] text-stone-500 hidden sm:block">
                Online Razorpay payments verified by gateway awaiting branch confirmation
              </p>
            </div>
          )}

          {/* Sub-filters for Payment History tab */}
          {activeTab === "history" && (
            <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#e3ddd0]">
              <div className="flex items-center gap-2">
                {[
                  { id: "", label: "All History" },
                  { id: "received", label: "Received / Approved" },
                  { id: "rejected", label: "Rejected" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setHistoryStatusFilter(s.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      historyStatusFilter === s.id
                        ? "bg-[#9c6b2e] text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {historyLoading && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
             MAIN CONTENT VIEWS
             ════════════════════════════════════════════════════════════════ */}

          {loading ? (
            <SkeletonList />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={Search}
              title={nameFilter ? "No matching records" : "No records found"}
              text={
                nameFilter
                  ? "Try searching for a different student name or course."
                  : activeTab === "approvals"
                  ? "All verified online payments have been reviewed."
                  : "No students or transactions currently in this section."
              }
              actionText={nameFilter ? "Clear Search" : null}
              onAction={() => setNameFilter("")}
            />
          ) : (
            <>
              {/* ───────────────────────────────────────────────────
                 VIEW 1: ONLINE APPROVALS TAB
                 ─────────────────────────────────────────────────── */}
              {activeTab === "approvals" && (
                <div className="space-y-4">
                  {filteredData.map((item, index) => {
                    const paymentId = item.payment_id ?? item.id;
                    const studentName =
                      item.student_name ||
                      item.name ||
                      item.student?.name ||
                      "Student";
                    const email = item.student_email || item.email || item.student?.email;
                    const phone = item.student_phone || item.phone || item.student?.phone;
                    const courseTitle =
                      item.course_title ||
                      item.course_name ||
                      item.course?.title ||
                      "Course";
                    const amount = item.amount ?? item.payment_amount ?? 0;
                    const instNum =
                      item.installment_number ??
                      item.installment?.installment_number;
                    const rzpPaymentId =
                      item.razorpay_payment_id || item.payment_reference;
                    const rzpOrderId =
                      item.razorpay_order_id || item.order_reference;
                    const isProcessing = processingPaymentId === paymentId;
                    const isPending =
                      String(item.status || "pending").toLowerCase() === "pending" ||
                      approvalsSubTab === "pending";

                    return (
                      <div
                        key={paymentId || index}
                        className="ba-card ba-rise rounded-2xl bg-white border border-[#e3ddd0] p-5 sm:p-6"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Student & Course */}
                          <div className="flex items-start gap-3.5 min-w-0">
                            <Avatar name={studentName} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">
                                  {studentName}
                                </h3>
                                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                                  Razorpay Verified
                                </span>
                                {instNum && (
                                  <span className="rounded-full bg-[#faf4ea] text-[#9c6b2e] border border-[#e3ddd0] px-2.5 py-0.5 text-[10px] font-bold">
                                    Installment #{instNum}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {courseTitle} • Enrollment #{item.enrollment_id}
                              </p>
                              {(email || phone) && (
                                <p className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-3">
                                  {email && <span>{email}</span>}
                                  {phone && <span>• {phone}</span>}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Payment amount & Gateway Info */}
                          <div className="flex flex-wrap items-center gap-6 lg:text-right">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                                Payment Amount
                              </span>
                              <span
                                className="text-xl font-bold text-slate-900"
                                style={{ ...serif }}
                              >
                                {formatCurrency(amount)}
                              </span>
                            </div>

                            <div className="text-xs text-stone-500">
                              {rzpPaymentId && (
                                <p className="font-mono text-[11px] text-stone-600">
                                  ID: {rzpPaymentId}
                                </p>
                              )}
                              <p className="text-[11px] text-stone-400">
                                {formatDateTime(item.created_at || item.payment_date)}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            {isPending && approvalsSubTab === "pending" ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleApprovePayment(item)}
                                  className="ba-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition cursor-pointer shadow-xs disabled:opacity-60"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => setRejectingPayment(item)}
                                  className="ba-press flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-60"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <StatusPill status={item.status || "completed"} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 2: PAYMENT HISTORY TAB
                 ─────────────────────────────────────────────────── */}
              {activeTab === "history" && (
                <div className="overflow-hidden rounded-2xl bg-white border border-[#e3ddd0] shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                          {["Date", "Student", "Course", "Amount", "Method", "Status", "Notes"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-500"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#efe9dd]">
                        {filteredData.map((hist, idx) => {
                          const studentName =
                            hist.student_name || hist.name || hist.student?.name || "Student";
                          const courseTitle =
                            hist.course_title || hist.course_name || "Course";
                          const status = String(hist.status || "received").toLowerCase();
                          return (
                            <tr key={hist.id || hist.payment_id || idx} className="ba-row">
                              <td className="px-6 py-4 text-xs text-stone-500 font-medium">
                                {formatDateTime(hist.created_at || hist.payment_date || hist.updated_at)}
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 text-sm">{studentName}</p>
                                <p className="text-xs text-stone-400">
                                  #{hist.enrollment_id}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-stone-700">
                                {courseTitle}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {formatCurrency(hist.amount ?? hist.payment_amount)}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-stone-600">
                                {(() => {
                                  const rawM = String(hist.payment_method || "").toLowerCase();
                                  if (rawM === "cash_upi" || rawM === "split") {
                                    return (
                                      <div>
                                        <span className="font-bold text-slate-800">Cash + UPI</span>
                                        {(hist.cash_amount > 0 || hist.upi_amount > 0) && (
                                          <p className="text-[11px] text-stone-500 font-normal mt-0.5">
                                            Cash: {formatCurrency(hist.cash_amount || 0)} • UPI: {formatCurrency(hist.upi_amount || 0)}
                                          </p>
                                        )}
                                        {hist.upi_transaction_id && (
                                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                            UPI Ref: {hist.upi_transaction_id}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  if (rawM === "upi") {
                                    return (
                                      <div>
                                        <span className="font-bold text-slate-800">UPI</span>
                                        {hist.upi_transaction_id && (
                                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                            UPI Ref: {hist.upi_transaction_id}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  if (rawM === "cash") {
                                    return <span className="font-bold text-slate-800">Cash</span>;
                                  }
                                  if (rawM === "razorpay" || rawM === "online" || hist.razorpay_payment_id) {
                                    return (
                                      <div>
                                        <span className="font-bold text-slate-800">Razorpay</span>
                                        {(hist.razorpay_payment_id || hist.payment_reference) && (
                                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate max-w-[140px]">
                                            {hist.razorpay_payment_id || hist.payment_reference}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return hist.payment_method || "In-Person";
                                })()}
                              </td>
                              <td className="px-6 py-4">
                                <StatusPill status={status} />
                              </td>
                              <td className="px-6 py-4 text-xs text-stone-500 max-w-xs truncate">
                                {hist.rejection_reason || hist.reason || hist.notes || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 3: INSTALLMENT DUE TAB
                 ─────────────────────────────────────────────────── */}
              {activeTab === "installment" && (
                <div className="space-y-4">
                  {filteredData.map((student, index) => {
                    const balance = Number(
                      student.balance_amount ?? student.remaining_amount ?? 0
                    );
                    const totalFee = Number(student.total_fee ?? student.amount ?? 0);
                    const totalPaid = Number(student.total_paid ?? student.paid_amount ?? 0);
                    const isDue = student.due_installment_count > 0;

                    return (
                      <div
                        key={student.enrollment_id || index}
                        className="ba-card ba-rise rounded-2xl bg-white border border-[#e3ddd0] p-5 sm:p-6"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          {/* Student & Course */}
                          <div className="flex items-start gap-4 min-w-0">
                            <Avatar name={student.name} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">
                                  {student.name || "Student"}
                                </h3>
                                {isDue && (
                                  <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold">
                                    Overdue Installment
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5 font-medium">
                                {student.course_title || "Course"} • #{student.enrollment_id}
                              </p>
                              <p className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-3">
                                {student.email && <span>{student.email}</span>}
                                {student.phone && <span>• {student.phone}</span>}
                              </p>
                            </div>
                          </div>

                          {/* Fee progress */}
                          <div className="flex flex-wrap items-center gap-5 sm:gap-8">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                                Total Fee
                              </span>
                              <span className="text-sm font-bold text-slate-800">
                                {formatCurrency(totalFee)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                                Paid
                              </span>
                              <span className="text-sm font-bold text-emerald-700">
                                {formatCurrency(totalPaid)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-rose-500 block tracking-wider">
                                Balance Due
                              </span>
                              <span
                                className="text-lg font-extrabold text-rose-600"
                                style={{ ...serif }}
                              >
                                {formatCurrency(balance)}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setRecordingEnrollment(student)}
                                className="ba-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#9c6b2e] hover:bg-[#855923] transition cursor-pointer shadow-xs"
                              >
                                <IndianRupee className="h-3.5 w-3.5" />
                                Record Payment
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEnrollment(student)}
                                className="ba-press flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 4: FULLY PAID TAB
                 ─────────────────────────────────────────────────── */}
              {activeTab === "fully_paid" && (
                <div className="space-y-4">
                  {filteredData.map((student, index) => {
                    const totalFee = Number(student.total_fee ?? student.amount ?? 0);
                    const isActive = isStudentActive(student);
                    const studentId =
                      student.student_id ??
                      student.user_id ??
                      student.id ??
                      student.enrollment_id;
                    const isUpdating = statusUpdatingId === studentId;

                    return (
                      <div
                        key={student.enrollment_id || index}
                        className="ba-card ba-rise rounded-2xl bg-white border border-[#e3ddd0] p-5 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <Avatar name={student.name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">
                                  {student.name || "Student"}
                                </h3>
                                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                                  ✓ Cleared All Dues
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5 font-medium">
                                {student.course_title || "Course"} • #{student.enrollment_id}
                              </p>
                              <p className="text-xs text-stone-400 mt-1">
                                {student.email} • {student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                                Total Paid
                              </span>
                              <span
                                className="text-base font-bold text-emerald-800"
                                style={{ ...serif }}
                              >
                                {formatCurrency(totalFee)}
                              </span>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleToggleStatus(
                                    student,
                                    isActive ? "Inactive" : "Active"
                                  )
                                }
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isActive ? "bg-emerald-600" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isActive ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-xs font-semibold capitalize ${
                                  isActive ? "text-emerald-700" : "text-stone-500"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedEnrollment(student)}
                              className="ba-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 5: ALL ENROLLED STUDENTS TABLE
                 ─────────────────────────────────────────────────── */}
              {activeTab === "all" && (
                <>
                  {/* Desktop table */}
                  <div className="ba-rise hidden overflow-hidden rounded-2xl bg-white border border-[#e3ddd0] md:block shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {["Student", "Course", "Contact", "Account Access", "Fee Balance", "Details"].map(
                              (h, i) => (
                                <th
                                  key={i}
                                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-500 ${
                                    h === "Details" ? "text-right" : ""
                                  }`}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#efe9dd]">
                          {filteredData.map((enrollment) => {
                            const studentId =
                              enrollment.student_id ??
                              enrollment.user_id ??
                              enrollment.id ??
                              enrollment.enrollment_id;
                            const isActive = isStudentActive(enrollment);
                            const isUpdating = statusUpdatingId === studentId;
                            const balance = Number(
                              enrollment.balance_amount ?? enrollment.remaining_amount ?? 0
                            );

                            return (
                              <tr key={enrollment.enrollment_id} className="ba-row align-top">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={enrollment.name} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900">
                                        {enrollment.name || "Unnamed student"}
                                      </p>
                                      <p className="text-xs text-stone-400">
                                        #{enrollment.enrollment_id}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <p className="font-semibold text-slate-900 text-xs">
                                    {enrollment.course_title || "Course unavailable"}
                                  </p>
                                  <p className="text-[11px] text-stone-400 mt-0.5">
                                    {enrollment.course_duration || "Standard"}
                                  </p>
                                </td>

                                <td className="px-6 py-4 text-xs text-stone-600">
                                  <p className="truncate max-w-[180px]">{enrollment.email || "—"}</p>
                                  <p className="text-stone-400 mt-0.5">{enrollment.phone || "—"}</p>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleToggleStatus(
                                          enrollment,
                                          isActive ? "Inactive" : "Active"
                                        )
                                      }
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isActive ? "bg-emerald-600" : "bg-stone-300"
                                      } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                          isActive ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      >
                                        {isUpdating && (
                                          <Loader2 className="h-3 w-3 animate-spin text-stone-500" />
                                        )}
                                      </span>
                                    </button>
                                    <span
                                      className={`text-xs font-semibold capitalize ${
                                        isActive ? "text-emerald-700" : "text-stone-500"
                                      }`}
                                    >
                                      {isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  {balance > 0 ? (
                                    <div>
                                      <span className="font-bold text-rose-600 text-sm">
                                        {formatCurrency(balance)}
                                      </span>
                                      <span className="text-[11px] text-stone-400 block">
                                        of {formatCurrency(enrollment.total_fee)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      ✓ Paid
                                    </span>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEnrollment(enrollment)}
                                      className="ba-press inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                                    >
                                      <Eye className="h-3 w-3" /> View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-4 md:hidden">
                    {filteredData.map((enrollment) => {
                      const studentId =
                        enrollment.student_id ??
                        enrollment.user_id ??
                        enrollment.id ??
                        enrollment.enrollment_id;
                      const isActive = isStudentActive(enrollment);
                      const isUpdating = statusUpdatingId === studentId;
                      const balance = Number(
                        enrollment.balance_amount ?? enrollment.remaining_amount ?? 0
                      );

                      return (
                        <div
                          key={enrollment.enrollment_id}
                          className="ba-card rounded-2xl bg-white border border-[#e3ddd0] p-5 space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={enrollment.name} />
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                  {enrollment.name}
                                </h3>
                                <p className="text-xs text-stone-400">
                                  {enrollment.course_title}
                                </p>
                              </div>
                            </div>
                            <StatusPill status={enrollment.status} />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#efe9dd]">
                            <div>
                              <span className="text-stone-400 block">Balance Due:</span>
                              <span
                                className={`font-bold ${
                                  balance > 0 ? "text-rose-600" : "text-emerald-700"
                                }`}
                              >
                                {balance > 0 ? formatCurrency(balance) : "Fully Paid"}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Account Status:</span>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleToggleStatus(
                                    enrollment,
                                    isActive ? "Inactive" : "Active"
                                  )
                                }
                                className={`text-xs font-bold underline ${
                                  isActive ? "text-emerald-700" : "text-stone-500"
                                }`}
                              >
                                {isActive ? "Active (Disable)" : "Inactive (Enable)"}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-2 border-t border-[#efe9dd]">
                            <button
                              type="button"
                              onClick={() => setSelectedEnrollment(enrollment)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Record In-Person Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(recordingEnrollment)}
        onClose={() => setRecordingEnrollment(null)}
        enrollment={
          recordingEnrollment
            ? (enrollments.find(
                (e) =>
                  String(e.enrollment_id ?? e.id) ===
                  String(recordingEnrollment.enrollment_id ?? recordingEnrollment.id)
              ) ||
              installmentStudents.find(
                (e) =>
                  String(e.enrollment_id ?? e.id) ===
                  String(recordingEnrollment.enrollment_id ?? recordingEnrollment.id)
              ) ||
              recordingEnrollment)
            : null
        }
        onSubmit={handleRecordPaymentSubmit}
        isSubmitting={isSubmittingRecord}
        token={token}
      />

      {/* Reject Online Payment Modal */}
      <RejectPaymentModal
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        payment={rejectingPayment}
        onConfirm={handleRejectPayment}
        isSubmitting={processingPaymentId === (rejectingPayment?.payment_id ?? rejectingPayment?.id)}
      />

      {/* Enrollment Full Details Modal */}
      <EnrollmentDetailsModal
        enrollment={
          selectedEnrollment
            ? (enrollments.find(
                (e) =>
                  String(e.enrollment_id ?? e.id) ===
                  String(selectedEnrollment.enrollment_id ?? selectedEnrollment.id)
              ) ||
              installmentStudents.find(
                (e) =>
                  String(e.enrollment_id ?? e.id) ===
                  String(selectedEnrollment.enrollment_id ?? selectedEnrollment.id)
              ) ||
              selectedEnrollment)
            : null
        }
        token={token}
        paymentHistory={paymentHistory}
        pendingPayments={pendingPayments}
        todayPayments={todayPayments}
        onClose={() => setSelectedEnrollment(null)}
        onToggleStatus={handleToggleStatus}
        statusUpdatingId={statusUpdatingId}
        onOpenRecordPayment={(enrollment) => {
          setSelectedEnrollment(null);
          setRecordingEnrollment(enrollment);
        }}
      />

      {/* Payment Success & Receipt Modal */}
      <PaymentSuccessReceiptModal
        isOpen={Boolean(installmentReceipt)}
        onClose={() => setInstallmentReceipt(null)}
        receipt={installmentReceipt}
        receiptUrl={installmentReceipt?.receipt_url}
        downloadUrl={installmentReceipt?.download_url}
        token={token}
        isBranchAdmin={true}
        title="Congratulations! Installment payment recorded successfully"
        subtitle="The fee payment has been recorded into the branch ledger. Below is the official receipt."
        onViewReceipt={(rcpt, url) => {
          if (url) window.open(url, "_blank");
          else navigate("/branch-admin/receipts");
        }}
      />
    </div>
  );
};

export default BranchAdminEnrollments;