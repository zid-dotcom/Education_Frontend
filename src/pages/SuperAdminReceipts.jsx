import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Filter,
  IndianRupee,
  Loader2,
  Mail,
  Menu,
  Phone,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useAuth } from "../context/AuthContext";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getSuperAdminReceiptApi,
  getSuperAdminReceiptsApi,
} from "../services/superadminreceipts";
import { getBranchesApi } from "../services/adminbranches";
import OfficialReceiptVoucherCard from "../components/common/OfficialReceiptVoucherCard";

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("sa-receipts-fonts")) return;
    const link = document.createElement("link");
    link.id = "sa-receipts-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes sa-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sa-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sa-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.sa-rise  { opacity: 0; animation: sa-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
.sa-fade  { animation: sa-fade .35s ease both; }
.sa-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: sa-shimmer 1.4s linear infinite;
}
.sa-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.sa-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.2);
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .sa-rise, .sa-fade, .sa-skeleton { animation: none !important; opacity: 1 !important; }
  .sa-card { transition: none !important; }
  .sa-card:hover { transform: none; }
}
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatReceiptDate = (dateStr) => {
  if (!dateStr) return "Not provided";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
};

const formatReceiptDateTime = (dateStr) => {
  if (!dateStr) return "Not provided";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
};

const getKolkataTodayString = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }
};

const getReceiptKolkataDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      return dateStr.trim();
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
};

const getReceiptAmount = (receipt) => {
  if (!receipt) return 0;
  const candidates = [
    receipt.amount_paid,
    receipt.amount,
    receipt.paid_amount,
    receipt.total_amount,
    receipt.fee_amount,
    receipt.payment_amount,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== "") {
      const n = Number(c);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== "") {
      const n = Number(c);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
};

const isRejectedPayment = (receipt) => {
  const status = String(
    receipt?.payment_status || receipt?.status || receipt?.receipt_status || ""
  ).toLowerCase();
  return status.includes("fail") || status.includes("reject") || status.includes("cancel");
};

const formatPaymentType = (receipt) => {
  if (!receipt) return "Tuition Fee";

  const rawPaymentType = String(receipt.payment_type || "").trim();

  // If payment_type is exactly "Remaining course balance settlement", map to installment label if available
  if (rawPaymentType.toLowerCase() === "remaining course balance settlement") {
    let instNo = null;
    if (Array.isArray(receipt.installment_numbers) && receipt.installment_numbers.length > 0) {
      instNo = receipt.installment_numbers[0];
    } else if (receipt.installment_number !== undefined && receipt.installment_number !== null && receipt.installment_number !== "") {
      instNo = receipt.installment_number;
    } else if (receipt.term_number !== undefined && receipt.term_number !== null && receipt.term_number !== "") {
      instNo = receipt.term_number;
    }

    const instCount = receipt.installment_count ?? receipt.total_installments;

    if (
      instNo !== undefined &&
      instNo !== null &&
      String(instNo).trim() !== "" &&
      instCount !== undefined &&
      instCount !== null &&
      String(instCount).trim() !== "" &&
      !isNaN(Number(instNo)) &&
      !isNaN(Number(instCount)) &&
      Number(instCount) > 0
    ) {
      return `Installment ${instNo} of ${instCount}`;
    }

    return receipt.payment_type || "Remaining course balance settlement";
  }

  if (receipt.term_name) return receipt.term_name;
  if (receipt.payment_type_label) return receipt.payment_type_label;

  const instNo =
    receipt.installment_number ||
    receipt.term_number ||
    (Array.isArray(receipt.installment_numbers) && receipt.installment_numbers[0]);
  const totalInst = receipt.installment_count || receipt.total_installments;

  if (instNo && totalInst) return `Installment ${instNo} of ${totalInst}`;
  if (instNo) return `Installment #${instNo}`;

  const pt = String(receipt.payment_type || receipt.type || "").toLowerCase();
  if (pt.includes("full") || pt.includes("lump")) return "Full course payment";
  if (pt.includes("installment")) return "Installment Payment";
  if (pt.includes("admission") || pt.includes("registration")) return "Registration Fee";

  if (receipt.balance_amount !== undefined && Number(receipt.balance_amount) === 0 && !isRejectedPayment(receipt)) {
    return "Remaining course balance settlement";
  }

  return "Tuition Fee";
};

const getPaymentMethodBadge = (method, receipt = {}) => {
  const m = String(
    method ||
      receipt.payment_method ||
      receipt.payment_mode ||
      (receipt.cash_amount && receipt.upi_amount
        ? "split"
        : receipt.cash_amount
        ? "cash"
        : receipt.upi_amount
        ? "upi"
        : "online")
  ).toLowerCase();

  if (m.includes("cash") && m.includes("upi")) {
    return {
      label: "Cash + UPI",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
    };
  }
  if (m.includes("cash")) {
    return {
      label: "Cash",
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
    };
  }
  if (m.includes("upi")) {
    return {
      label: "UPI",
      bg: "#f3e8ff",
      text: "#6b21a8",
      border: "#e9d5ff",
    };
  }
  if (m.includes("razorpay") || m.includes("online") || m.includes("card")) {
    return {
      label: "Razorpay",
      bg: "#eff6ff",
      text: "#1e40af",
      border: "#bfdbfe",
    };
  }
  return {
    label: method || "Paid",
    bg: "#f1ede4",
    text: "#5b5346",
    border: "#e3ddd0",
  };
};

const getPaymentStatusBadge = (receipt) => {
  const rawStatus =
    receipt?.payment_status ||
    receipt?.status ||
    receipt?.receipt_status ||
    "Verified";
  const s = String(rawStatus).toLowerCase();

  if (s.includes("fail") || s.includes("reject") || s.includes("cancel")) {
    return {
      label: rawStatus,
      isRejected: true,
      bg: "#fef2f2",
      text: "#b91c1c",
      border: "#fecaca",
      icon: "✕",
    };
  }
  if (
    s.includes("verif") ||
    s.includes("receiv") ||
    s.includes("success") ||
    s.includes("paid")
  ) {
    return {
      label: rawStatus,
      isRejected: false,
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
      icon: "✓",
    };
  }
  if (s.includes("pend")) {
    return {
      label: rawStatus,
      isRejected: false,
      bg: "#fffbeb",
      text: "#92400e",
      border: "#fde68a",
      icon: "⧗",
    };
  }
  return {
    label: rawStatus,
    isRejected: false,
    bg: "#f1ede4",
    text: "#5b5346",
    border: "#e3ddd0",
    icon: "•",
  };
};

/**
 * Clean reference identifier for gateway references (no copy button)
 */
function ReferenceIdentifierItem({ label, value }) {
  if (!value || String(value).trim() === "") return null;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-2 px-3 rounded-xl"
      style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8175] shrink-0">
        {label}:
      </span>
      <code
        className="font-mono text-xs font-bold select-all break-all sm:text-right"
        style={{ color: "#0f172a" }}
      >
        {value}
      </code>
    </div>
  );
}

/**
 * Official Receipt Voucher Card View used in the modal and for single-page PDF generation
 */
function SuperAdminReceiptVoucherCard({ receipt, user }) {
  if (!receipt) return null;
  const statusBadge = getPaymentStatusBadge(receipt);
  const amountPaid = getReceiptAmount(receipt);
  const paymentTypeLabel = formatPaymentType(receipt);
  const methodBadge = getPaymentMethodBadge(receipt.payment_method, receipt);

  const studentName = receipt.student_name || receipt.student?.name || "Student";
  const studentEmail = receipt.student_email || receipt.student?.email || "—";
  const studentPhone = receipt.student_phone || receipt.student?.phone || "—";
  const branchName = receipt.branch_name || receipt.branch?.name || "AurumFX Branch";
  const courseTitle = receipt.course_name || receipt.course_title || receipt.course?.title || "Enrolled Course";

  const receiptNumber =
    receipt.receipt_number ||
    (receipt.receipt_id
      ? `REC-${String(receipt.receipt_id).padStart(5, "0")}`
      : receipt.id
      ? `REC-${String(receipt.id).padStart(5, "0")}`
      : `#${receipt.receipt_id || "1"}`);

  const date = receipt.payment_date || receipt.created_at || receipt.date;

  const hasCourseFee =
    receipt.course_fee !== undefined && receipt.course_fee !== null && receipt.course_fee !== "";
  const hasTotalPaid =
    receipt.total_paid !== undefined && receipt.total_paid !== null && receipt.total_paid !== "";
  const hasBalance =
    receipt.balance_amount !== undefined && receipt.balance_amount !== null && receipt.balance_amount !== "";

  const hasGateways = Boolean(
    receipt.transaction_reference ||
      receipt.razorpay_order_id ||
      receipt.razorpay_payment_id ||
      receipt.upi_transaction_id
  );

  const signatoryName = user?.name || receipt.authorized_by || "Chief Financial Officer";
  const signatoryTitle = "AurumFX Academy Central Administration";

  return (
    <div
      id="superadmin-receipt-voucher-card"
      className="p-6 sm:p-8 space-y-6"
      style={{ ...sans, background: "#ffffff", color: "#0f172a" }}
    >
      {/* 1. Header with Academy Brand & Official Status */}
      <div
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5"
        style={{ borderBottom: "1px solid #e3ddd0" }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl shrink-0 shadow-xs"
            style={{ background: "#17140f", color: "#f4b942" }}
          >
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9c6b2e]">
                Central Audit Voucher
              </span>
              <span className="text-[10px] text-[#8a8175]">•</span>
              <span className="text-xs font-semibold text-slate-700">{branchName}</span>
            </div>
            <h2
              className="text-2xl font-bold tracking-tight text-slate-900 leading-tight"
              style={serif}
            >
              Aurum FX Academy
            </h2>
            <p className="text-xs text-[#8a8175]">
              Official Tuition Fee Acknowledgment & Settlement Receipt
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border"
            style={{
              background: statusBadge.bg,
              color: statusBadge.text,
              borderColor: statusBadge.border,
            }}
          >
            <span>{statusBadge.icon}</span>
            <span>{statusBadge.label}</span>
          </span>
          <p className="text-xs font-bold font-mono text-slate-900">
            Receipt Number: {receiptNumber}
          </p>
          <p className="text-[11px] text-[#8a8175]">
            Date: {formatReceiptDateTime(date)}
          </p>
        </div>
      </div>

      {/* 2. Structured Student & Branch Details Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wider text-[#8a8175] border-b"
              style={{ borderColor: "#e8e2d5", background: "#fcfaf7" }}
            >
              <th className="px-3.5 py-2 text-left font-bold">Student Name</th>
              <th className="px-3.5 py-2 text-left font-bold">Phone Number</th>
              <th className="px-3.5 py-2 text-left font-bold">Email Address</th>
              <th className="px-3.5 py-2 text-left font-bold">Enrolled Course</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3.5 py-2.5 font-bold text-slate-900">
                {studentName}
              </td>
              <td className="px-3.5 py-2.5 font-mono text-slate-700">
                {studentPhone}
              </td>
              <td className="px-3.5 py-2.5 text-slate-700">
                {studentEmail}
              </td>
              <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                {courseTitle}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Fee Breakdown Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid #e3ddd0" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              className="font-bold border-b"
              style={{
                background: "#f1ede4",
                color: "#7a531f",
                borderColor: "#e3ddd0",
              }}
            >
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Payment Term</th>
              <th className="px-4 py-3 text-center">Payment Method</th>
              <th className="px-4 py-3 text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody style={{ background: "#ffffff" }}>
            <tr style={{ borderBottom: "1px solid #efe9dd" }}>
              <td className="px-4 py-3.5">
                <p className="font-bold text-slate-900">{courseTitle}</p>
                <p className="text-[11px] text-[#8a8175]">{branchName}</p>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    paymentTypeLabel.includes("Installment")
                      ? "bg-[#f1ede4] text-[#7a531f]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {paymentTypeLabel}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                  style={{
                    background: methodBadge.bg,
                    color: methodBadge.text,
                    borderColor: methodBadge.border,
                  }}
                >
                  {methodBadge.label}
                </span>
              </td>
              <td className="px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums text-sm">
                {formatCurrency(amountPaid)}
              </td>
            </tr>

            {/* Total Paid Row */}
            <tr
              className="font-extrabold text-sm"
              style={{ background: "#faf8f4", borderTop: "2px solid #e3ddd0" }}
            >
              <td className="px-4 py-3 text-slate-900" colSpan={2}>
                Total Paid (This Receipt)
              </td>
              <td className="px-4 py-3 text-center text-xs font-bold" style={{ color: "#047857" }}>
                {statusBadge.label}
              </td>
              <td
                className="px-4 py-3 text-right text-base tabular-nums"
                style={{ color: "#9c6b2e" }}
              >
                {formatCurrency(amountPaid)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Fee Clearance & Account Balance */}
      {(hasCourseFee || hasTotalPaid || hasBalance) && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
        >
          <div
            className="flex items-center justify-between pb-2"
            style={{ borderBottom: "1px solid #efe9dd" }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "#9c6b2e" }}
            >
              Fee Clearance & Account Balance
            </span>
            <span className="text-[10px]" style={{ color: "#8a8175" }}>
              Academic Ledger Snapshot
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-1">
            {hasCourseFee && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#8a8175" }}>
                  Total Course Fee
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                  {formatCurrency(receipt.course_fee)}
                </span>
              </div>
            )}
            {hasTotalPaid && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#8a8175" }}>
                  Total Paid To Date
                </span>
                <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "#047857" }}>
                  {formatCurrency(receipt.total_paid)}
                </span>
              </div>
            )}
            {hasBalance && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#8a8175" }}>
                  Remaining Balance
                </span>
                <span
                  className="text-xs sm:text-sm font-bold tabular-nums"
                  style={{
                    color: Number(receipt.balance_amount) === 0 ? "#047857" : "#b45309",
                  }}
                >
                  {Number(receipt.balance_amount) === 0 ? "₹0 (Fully Cleared)" : formatCurrency(receipt.balance_amount)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Transaction & Gateway Audit References */}
      {hasGateways && (
        <div
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
        >
          <div
            className="flex items-center justify-between pb-2"
            style={{ borderBottom: "1px solid #efe9dd" }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "#9c6b2e" }}
            >
              Transaction & Gateway References
            </span>
            <span className="text-[10px]" style={{ color: "#8a8175" }}>
              Verification Audit Identifiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <ReferenceIdentifierItem
              label="Transaction Reference"
              value={receipt.transaction_reference}
            />
            <ReferenceIdentifierItem
              label="Razorpay Order ID"
              value={receipt.razorpay_order_id}
            />
            <ReferenceIdentifierItem
              label="Razorpay Payment ID"
              value={receipt.razorpay_payment_id}
            />
            <ReferenceIdentifierItem
              label="UPI Transaction ID"
              value={receipt.upi_transaction_id}
            />
          </div>
        </div>
      )}

      {/* 6. Quote (if provided) */}
      {receipt.quote && (
        <div
          className="italic text-xs px-3.5 py-2 rounded-xl"
          style={{ background: "#fffbeb", borderLeft: "3px solid #9c6b2e", color: "#78531a" }}
        >
          <span>“{receipt.quote}”</span>
        </div>
      )}

      {/* 7. Receipt Footer & Authorized Signatory */}
      <div
        className="pt-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-5 text-xs"
        style={{ borderTop: "2px solid #e3ddd0" }}
      >
        <div className="space-y-1.5 max-w-sm text-[11px] text-[#8a8175]">
          <p className="font-bold text-slate-800">
            Official Central Accounts Acknowledgment
          </p>
          <p>This is a computer-generated receipt issued by AurumFX Academy Central Office.</p>
          <p>Valid without physical signature when verified online.</p>
        </div>

        <div className="sm:text-right space-y-1">
          <p className="font-bold text-sm text-slate-900">{signatoryName}</p>
          <p className="text-[11px] text-[#8a8175]">{signatoryTitle}</p>
          <div
            className="mt-2 inline-block pt-1 text-[10px] uppercase tracking-widest font-semibold"
            style={{ borderTop: "1px solid #94a3b8", color: "#64748b" }}
          >
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminReceipts() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("all");

  const [receipts, setReceipts] = useState([]);
  const [apiTotalReceipts, setApiTotalReceipts] = useState(null);
  const [todayStats, setTodayStats] = useState({ count: 0, amount: 0 });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [appliedDates, setAppliedDates] = useState({ from: "", to: "" });
  const [activePreset, setActivePreset] = useState("all");
  const [dateError, setDateError] = useState("");

  // Modal & Download
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [pdfExportReceipt, setPdfExportReceipt] = useState(null);

  // 1. Fetch branches for filter
  useEffect(() => {
    if (!token) return;
    getBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.branches)
          ? data.branches
          : [];
        setBranches(list);
      })
      .catch(() => {});
  }, [token]);

  // Branch ID to Branch Name map
  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      const id = b.id ?? b.branch_id;
      if (id !== undefined) map[String(id)] = b.name || b.branch_name;
    });
    return map;
  }, [branches]);

  // 2. Fetch today's stats specifically
  const fetchTodayStatsOnly = useCallback(async () => {
    if (!token) return;
    try {
      const todayStr = getKolkataTodayString();
      const params = {
        from_date: todayStr,
        to_date: todayStr,
      };
      if (selectedBranchId !== "all") params.branch_id = selectedBranchId;

      const res = await getSuperAdminReceiptsApi(token, params);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.receipts)
        ? res.receipts
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const validList = list.filter((r) => !isRejectedPayment(r));
      const todayAmt = validList.reduce((sum, r) => sum + getReceiptAmount(r), 0);
      const count = typeof res?.total_receipts === "number" ? res.total_receipts : list.length;
      setTodayStats({ count, amount: todayAmt });
    } catch {
      // Fallback
    }
  }, [token, selectedBranchId]);

  // 3. Main Receipts Fetch
  const fetchReceipts = useCallback(
    async (branchId = selectedBranchId, datesToApply = appliedDates, isManual = false) => {
      if (!token) return;
      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError("");

        const params = {};
        if (branchId !== "all") params.branch_id = branchId;
        if (datesToApply.from) params.from_date = datesToApply.from;
        if (datesToApply.to) params.to_date = datesToApply.to;

        const res = await getSuperAdminReceiptsApi(token, params);

        const totalCount = typeof res?.total_receipts === "number" ? res.total_receipts : null;
        setApiTotalReceipts(totalCount);

        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.receipts)
          ? res.receipts
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setReceipts(list);
      } catch (err) {
        setError(err?.message || "Failed to load super admin receipts.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchReceipts(selectedBranchId, appliedDates, false);
  }, [selectedBranchId, appliedDates]);

  // Quick Preset Handlers
  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    setDateError("");
    const todayStr = getKolkataTodayString();

    if (presetId === "all") {
      setFromDateInput("");
      setToDateInput("");
      setAppliedDates({ from: "", to: "" });
    } else if (presetId === "today") {
      setFromDateInput(todayStr);
      setToDateInput(todayStr);
      setAppliedDates({ from: todayStr, to: todayStr });
    } else if (presetId === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString().slice(0, 10);
      setFromDateInput(weekAgo);
      setToDateInput(todayStr);
      setAppliedDates({ from: weekAgo, to: todayStr });
    } else if (presetId === "month") {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      setFromDateInput(monthStart);
      setToDateInput(todayStr);
      setAppliedDates({ from: monthStart, to: todayStr });
    }
  };

  const handleApplyCustomDates = () => {
    if (!fromDateInput && !toDateInput) {
      setDateError("Please enter at least one date.");
      return;
    }
    if (fromDateInput && toDateInput && fromDateInput > toDateInput) {
      setDateError("From date cannot be after To date.");
      return;
    }
    setDateError("");
    setActivePreset("custom");
    setAppliedDates({ from: fromDateInput, to: toDateInput });
  };

  const handleClearDates = () => {
    setFromDateInput("");
    setToDateInput("");
    setAppliedDates({ from: "", to: "" });
    setActivePreset("all");
    setDateError("");
  };

  // View Receipt Handler
  const handleViewReceipt = async (receiptSummary) => {
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    setActiveReceipt(receiptSummary);
    try {
      const fullReceipt = await getSuperAdminReceiptApi(receiptId, token);
      if (fullReceipt) {
        setActiveReceipt({ ...receiptSummary, ...fullReceipt });
      }
    } catch {
      // Keep existing summary
    }
  };

  // PDF Generator using html2canvas-pro + jsPDF
  const generatePdfFromElement = async (element, receipt) => {
    const receiptId =
      receipt.receipt_number || receipt.receipt_id || receipt.id || "receipt";
    const studentName = (
      receipt.student_name ||
      receipt.student?.name ||
      "student"
    ).replace(/\s+/g, "_");
    const fileName = `receipt_${receiptId}_${studentName}.pdf`;

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    const fullHeight = Math.max(element.scrollHeight, element.offsetHeight, 900);
    const fullWidth = element.scrollWidth || element.offsetWidth || 760;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollY: 0,
      scrollX: 0,
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth + 100,
      windowHeight: fullHeight + 200,
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.overflow = "visible";
        clonedEl.style.maxHeight = "none";
        clonedEl.style.height = "auto";

        let parent = clonedEl.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.overflow = "visible";
          parent.style.maxHeight = "none";
          parent.style.height = "auto";
          parent = parent.parentElement;
        }

        const offscreenWrapper = clonedDoc.getElementById("superadmin-pdf-offscreen-wrapper");
        if (offscreenWrapper) {
          offscreenWrapper.style.height = "auto";
          offscreenWrapper.style.overflow = "visible";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const maxContentWidth = pageWidth - margin * 2;
    const maxContentHeight = pageHeight - margin * 2;

    const contentWidth = maxContentWidth;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let finalWidth = contentWidth;
    let finalHeight = contentHeight;
    let posX = margin;
    let posY = margin;

    if (contentHeight > maxContentHeight) {
      const ratio = maxContentHeight / contentHeight;
      finalHeight = maxContentHeight;
      finalWidth = contentWidth * ratio;
      posX = margin + (maxContentWidth - finalWidth) / 2;
    }

    pdf.addImage(imgData, "PNG", posX, posY, finalWidth, finalHeight);
    pdf.save(fileName);
  };

  const handleDownload = async (receiptSummary, e) => {
    if (e) e.stopPropagation();
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    try {
      setDownloadingId(receiptId);
      setError("");

      let targetReceipt = receiptSummary;
      if (token && (!receiptSummary.transaction_reference && !receiptSummary.course_fee)) {
        try {
          const full = await getSuperAdminReceiptApi(receiptId, token);
          if (full) targetReceipt = { ...receiptSummary, ...full };
        } catch {}
      }

      const modalVoucher =
        document.getElementById("superadmin-receipt-voucher-card") ||
        document.getElementById("receipt-voucher-card");
      if (
        modalVoucher &&
        activeReceipt &&
        (activeReceipt.receipt_id === receiptId ||
          activeReceipt.id === receiptId ||
          activeReceipt.receipt_number === receiptId)
      ) {
        await generatePdfFromElement(modalVoucher, targetReceipt);
      } else {
        setPdfExportReceipt(targetReceipt);
        await new Promise((resolve) => setTimeout(resolve, 150));
        const offscreenEl = document.getElementById("superadmin-pdf-offscreen-export");
        if (offscreenEl) {
          await generatePdfFromElement(offscreenEl, targetReceipt);
        }
        setPdfExportReceipt(null);
      }

      setSuccess(`Receipt #${receiptId} downloaded!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Super Admin PDF download error:", err);
      setError(err?.message || `Failed to download receipt #${receiptId}.`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const isDateFilterActive = Boolean(appliedDates.from || appliedDates.to);
  const isSingleDay = Boolean(
    appliedDates.from && appliedDates.to && appliedDates.from === appliedDates.to
  );

  // Filter receipts in memory
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // 1. Date Range Filter
      if (appliedDates.from || appliedDates.to) {
        const rDate = getReceiptKolkataDate(
          r.payment_date || r.created_at || r.date || r.timestamp
        );
        if (rDate) {
          if (appliedDates.from && rDate < appliedDates.from) return false;
          if (appliedDates.to && rDate > appliedDates.to) return false;
        }
      }

      // 2. Branch Filter (client side check)
      if (selectedBranchId !== "all") {
        const rBranchId = String(r.branch_id || "");
        if (rBranchId && rBranchId !== String(selectedBranchId)) {
          return false;
        }
      }

      // 3. Payment Method
      if (selectedMethod !== "all") {
        const m = String(r.payment_method || r.payment_mode || "").toLowerCase();
        if (selectedMethod === "razorpay" && !m.includes("razorpay") && !m.includes("online")) return false;
        if (selectedMethod === "cash" && !m.includes("cash")) return false;
        if (selectedMethod === "upi" && !m.includes("upi")) return false;
        if (selectedMethod === "split" && !(m.includes("split") || (r.cash_amount && r.upi_amount))) return false;
      }

      // 4. Client Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const studentName = String(r.student_name || r.student?.name || r.name || "").toLowerCase();
        const studentPhone = String(r.student_phone || r.phone || r.student?.phone || "").toLowerCase();
        const studentEmail = String(r.student_email || r.email || r.student?.email || "").toLowerCase();
        const receiptNo = String(r.receipt_number || r.receipt_id || r.id || "").toLowerCase();
        const course = String(r.course_name || r.course_title || r.course?.title || "").toLowerCase();
        const branch = String(r.branch_name || branchMap[r.branch_id] || "").toLowerCase();
        const ref = String(
          r.transaction_reference ||
            r.transaction_id ||
            r.razorpay_payment_id ||
            r.razorpay_order_id ||
            ""
        ).toLowerCase();

        return (
          studentName.includes(q) ||
          studentPhone.includes(q) ||
          studentEmail.includes(q) ||
          receiptNo.includes(q) ||
          course.includes(q) ||
          branch.includes(q) ||
          ref.includes(q)
        );
      }

      return true;
    });
  }, [receipts, appliedDates, selectedBranchId, selectedMethod, searchTerm, branchMap]);

  // Overall & Period Metrics dynamically calculated from filtered receipts
  const summaryMetrics = useMemo(() => {
    const count = filteredReceipts.length;
    const valid = filteredReceipts.filter((r) => !isRejectedPayment(r));
    const totalCollected = valid.reduce((sum, r) => sum + getReceiptAmount(r), 0);

    const todayStr = getKolkataTodayString();
    let periodCount = 0;
    let periodCollected = 0;

    if (isDateFilterActive) {
      // In a date-filtered view, period cards reflect the filtered receipts and amount
      periodCount = count;
      periodCollected = totalCollected;
    } else {
      // In default view (no date filter), period cards reflect receipts created today
      const todayList = filteredReceipts.filter((r) => {
        const rDate = getReceiptKolkataDate(
          r.payment_date || r.created_at || r.date || r.timestamp
        );
        return rDate === todayStr;
      });
      const validToday = todayList.filter((r) => !isRejectedPayment(r));
      periodCount = todayList.length;
      periodCollected = validToday.reduce((sum, r) => sum + getReceiptAmount(r), 0);
    }

    return {
      totalCount: count,
      totalCollected,
      todayCount: periodCount,
      todayCollected: periodCollected,
    };
  }, [filteredReceipts, isDateFilterActive]);

  return (
    <div
      className="min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#17140f" }}
    >
      <style>{PAGE_CSS}</style>

      {/* Sidebar */}
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="receipts"
      />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1">
        {/* Sticky Header */}
        <header
          className="sticky top-0 z-20 hidden md:flex h-[92px] items-center justify-between border-b px-6 backdrop-blur-md sm:px-10 shrink-0"
          style={{ borderColor: "#e3ddd0", background: "rgba(250, 248, 244, 0.95)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-xs transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#9c6b2e" }}
              >
                Financial Control
              </p>
              <h1 className="text-2xl font-bold" style={serif}>
                Student Receipts
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchReceipts(selectedBranchId, appliedDates, true)}
              disabled={refreshing}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-xs transition hover:bg-[#f1ede4] disabled:opacity-60 ${FOCUS_RING}`}
              title="Refresh Receipts"
            >
              <RefreshCw className={`h-4 w-4 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto">
          {/* Alerts */}
          {error && (
            <div
              role="alert"
              className="sa-rise flex items-start gap-3 rounded-2xl p-4 text-xs font-medium text-red-800"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error loading receipts</p>
                <p className="mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="sa-rise flex items-center gap-2 rounded-2xl p-4 text-xs font-semibold text-emerald-800"
              style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* =========================================================================
              1. SUMMARY KPI CARDS
             ========================================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Receipts */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">
                  {isDateFilterActive ? "Receipts in Range" : "Total Receipts"}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs"
                  style={{ background: "#f7efe0", color: "#9c6b2e" }}
                >
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900" style={serif}>
                {loading ? "..." : summaryMetrics.totalCount}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {isDateFilterActive
                  ? "Receipts matching filters"
                  : selectedBranchId === "all"
                  ? "All branches combined"
                  : "For selected branch"}
              </p>
            </article>

            {/* Total Collections */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "60ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">
                  {isDateFilterActive ? "Collections in Range" : "Total Collections"}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs"
                  style={{ background: "#ecfdf5", color: "#065f46" }}
                >
                  <IndianRupee className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900" style={serif}>
                {loading ? "..." : formatCurrency(summaryMetrics.totalCollected)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {isDateFilterActive ? "Verified collections in range" : "Acknowledged fee settlements"}
              </p>
            </article>

            {/* Today's Receipts */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "120ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">
                  {isSingleDay
                    ? `${formatReceiptDate(appliedDates.from)} Receipts`
                    : isDateFilterActive
                    ? "Filtered Receipts"
                    : "Today's Receipts"}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs"
                  style={{ background: "#eff6ff", color: "#1e40af" }}
                >
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900" style={serif}>
                {loading ? "..." : summaryMetrics.todayCount}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {isSingleDay
                  ? `Issued on ${formatReceiptDate(appliedDates.from)}`
                  : isDateFilterActive
                  ? "In selected date range"
                  : "Issued today"}
              </p>
            </article>

            {/* Today's Amount */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "180ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">
                  {isSingleDay
                    ? `${formatReceiptDate(appliedDates.from)} Collections`
                    : isDateFilterActive
                    ? "Filtered Collections"
                    : "Today's Collections"}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900" style={serif}>
                {loading ? "..." : formatCurrency(summaryMetrics.todayCollected)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {isSingleDay
                  ? `Collected on ${formatReceiptDate(appliedDates.from)}`
                  : isDateFilterActive
                  ? "In selected date range"
                  : "Collected today"}
              </p>
            </article>
          </section>

          {/* =========================================================================
              2. FILTERS (BRANCH, DATES, SEARCH, METHOD)
             ========================================================================= */}
          <section
            className="sa-rise rounded-2xl p-5 sm:p-6 space-y-4"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "200ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Branch Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8a8175]">
                    Branch:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="appearance-none rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-3.5 pr-9 text-xs font-semibold text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                    >
                      <option value="all">All Branches (Global)</option>
                      {branches.map((b) => {
                        const id = b.id ?? b.branch_id;
                        return (
                          <option key={id} value={String(id)}>
                            {b.name || b.branch_name || `Branch #${id}`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a39a8c]" />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#e3ddd0]">
                  {[
                    { id: "all", label: "All Dates" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "7 Days" },
                    { id: "month", label: "This Month" },
                  ].map((preset) => {
                    const isActive = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "bg-[#17140f] text-[#f4b942] shadow-xs"
                            : "border border-[#e3ddd0] bg-[#faf8f4] text-[#5b5346] hover:bg-[#f1ede4]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8a8175]">
                  Method:
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="razorpay">Razorpay / Online</option>
                  <option value="cash">Branch Cash</option>
                  <option value="upi">Branch UPI</option>
                  <option value="split">Branch Split (Cash + UPI)</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#f1ede4]">
              <span className="text-xs font-semibold text-[#8a8175] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9c6b2e]" />
                Date Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#8a8175]">From:</label>
                <input
                  type="date"
                  value={fromDateInput}
                  onChange={(e) => setFromDateInput(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#8a8175]">To:</label>
                <input
                  type="date"
                  value={toDateInput}
                  onChange={(e) => setToDateInput(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomDates}
                className="rounded-xl bg-[#17140f] px-3.5 py-1.5 text-xs font-bold text-[#f4b942] hover:bg-slate-800 transition"
              >
                Apply Range
              </button>
              {isDateFilterActive && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[#f1ede4] transition"
                >
                  Clear Dates
                </button>
              )}
            </div>

            {dateError && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{dateError}</span>
              </p>
            )}

            {/* Real-time search */}
            <div className="pt-2">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student, phone, email, receipt #, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-10 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================================
              3. RECEIPTS TABLE
             ========================================================================= */}
          <section
            className="sa-rise rounded-2xl overflow-hidden shadow-xs"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0", animationDelay: "250ms" }}
          >
            <div className="flex items-center justify-between border-b border-[#e3ddd0] px-6 py-4 bg-[#fdfcfb]">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#9c6b2e]" />
                <h2 className="text-base font-bold text-slate-900" style={serif}>
                  Consolidated Receipts
                </h2>
                <span className="ml-2 rounded-full bg-[#f1ede4] px-2.5 py-0.5 text-[11px] font-bold text-[#8a8175]">
                  {filteredReceipts.length} records
                </span>
              </div>
              {isDateFilterActive && (
                <span className="text-xs font-semibold text-[#9c6b2e]">
                  Filtered by date
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="sa-skeleton h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="py-16 text-center px-6">
                <Receipt className="mx-auto h-12 w-12 text-[#b0803a]/40" />
                <h3 className="mt-4 text-base font-bold text-slate-800" style={serif}>
                  No Receipts Found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#8a8175]">
                  {receipts.length === 0
                    ? "No fee receipts have been issued yet for the selected criteria."
                    : "No receipts match your search query or filters. Try adjusting your search."}
                </p>
                {isDateFilterActive && (
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#f1ede4]"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#9c6b2e]" />
                    <span>Show All Receipts</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className="border-b text-[11px] font-bold uppercase tracking-wider text-[#8a8175]"
                      style={{ borderColor: "#e3ddd0", background: "#faf8f4" }}
                    >
                      <th className="px-5 py-4 whitespace-nowrap">Receipt Number</th>
                      <th className="px-5 py-4 whitespace-nowrap">Branch</th>
                      <th className="px-5 py-4 whitespace-nowrap">Student Name</th>
                      <th className="px-5 py-4 whitespace-nowrap">Phone Number</th>
                      <th className="px-5 py-4 min-w-[200px]">Course</th>
                      <th className="px-5 py-4 whitespace-nowrap text-center">Payment Term</th>
                      <th className="px-5 py-4 whitespace-nowrap text-center">Payment Method</th>
                      <th className="px-5 py-4 whitespace-nowrap text-right">Amount Paid</th>
                      <th className="px-5 py-4 whitespace-nowrap">Date</th>
                      <th className="px-5 py-4 whitespace-nowrap text-center w-36">Payment Status</th>
                      <th className="px-5 py-4 whitespace-nowrap text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe9dd]">
                    {filteredReceipts.map((r, index) => {
                      const receiptId = r.receipt_id || r.id || r.receipt_number || index + 1;
                      const receiptNumber =
                        r.receipt_number ||
                        (r.receipt_id
                          ? `REC-${String(r.receipt_id).padStart(5, "0")}`
                          : r.id
                          ? `REC-${String(r.id).padStart(5, "0")}`
                          : `#${receiptId}`);
                      const studentName =
                        r.student_name || r.student?.name || r.name || "Student";
                      const studentPhone =
                        r.student_phone || r.phone || r.student?.phone || "—";
                      const courseTitle =
                        r.course_name || r.course_title || r.course?.title || "Enrolled Course";
                      const branchDisplay =
                        r.branch_name || branchMap[r.branch_id] || (r.branch_id ? `Branch #${r.branch_id}` : "Global");
                      const amount = getReceiptAmount(r);
                      const date = r.payment_date || r.created_at || r.date;
                      const paymentTypeLabel = formatPaymentType(r);
                      const methodBadge = getPaymentMethodBadge(r.payment_method, r);
                      const statusBadge = getPaymentStatusBadge(r);
                      const isDownloading = downloadingId === receiptId;

                      return (
                        <tr
                          key={receiptId}
                          onClick={() => handleViewReceipt(r)}
                          className="cursor-pointer transition-colors hover:bg-[#faf8f4]/80 group"
                        >
                          <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                            <span className="flex items-center gap-1.5 text-[#9c6b2e]">
                              <Receipt className="h-3.5 w-3.5 shrink-0" />
                              {receiptNumber}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#faf8f4] border border-[#e3ddd0] px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                              <Building2 className="h-3 w-3 text-[#9c6b2e]" />
                              {branchDisplay}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{studentName}</span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                            {studentPhone}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-900">
                              {courseTitle}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-center text-slate-600">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                paymentTypeLabel.includes("Installment")
                                  ? "bg-[#f1ede4] text-[#7a531f]"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {paymentTypeLabel}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-center">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                              style={{
                                background: methodBadge.bg,
                                color: methodBadge.text,
                                borderColor: methodBadge.border,
                              }}
                            >
                              {methodBadge.label}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right font-extrabold text-slate-900 tabular-nums">
                            {formatCurrency(amount)}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                            {formatReceiptDate(date)}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-center w-36">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                              style={{
                                background: statusBadge.bg,
                                color: statusBadge.text,
                                borderColor: statusBadge.border,
                              }}
                            >
                              <span>{statusBadge.icon}</span>
                              <span>{statusBadge.label}</span>
                            </span>
                          </td>

                          <td
                            className="px-5 py-4 whitespace-nowrap text-center w-28"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewReceipt(r)}
                                className={`rounded-lg border border-[#e3ddd0] bg-white p-1.5 text-slate-700 transition hover:bg-[#f1ede4] hover:text-[#9c6b2e] ${FOCUS_RING}`}
                                title="View Receipt Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={(e) => handleDownload(r, e)}
                                className={`rounded-lg border border-[#e3ddd0] bg-white p-1.5 text-slate-700 transition hover:bg-[#f1ede4] hover:text-[#9c6b2e] disabled:opacity-50 ${FOCUS_RING}`}
                                title="Download Receipt as PDF"
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9c6b2e]" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =========================================================================
          4. RECEIPT DETAILS MODAL
         ========================================================================= */}
      {activeReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm overflow-y-auto"
          style={{ background: "rgba(23,20,15,.65)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveReceipt(null)}
        >
          <div
            className="relative my-6 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e3ddd0] flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between border-b border-[#e3ddd0] px-5 sm:px-6 py-4 shrink-0"
              style={{ background: "#faf8f4" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shadow-2xs"
                  style={{ background: "#17140f", color: "#f4b942" }}
                >
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900" style={serif}>
                    Official Fee Payment Receipt
                  </h3>
                  <p className="text-[10px] text-[#8a8175]">
                    Super Admin Central Audit Record
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    downloadingId ===
                    (activeReceipt.receipt_id || activeReceipt.id || activeReceipt.receipt_number)
                  }
                  onClick={(e) => handleDownload(activeReceipt, e)}
                  className={`flex items-center gap-1.5 rounded-lg bg-[#9c6b2e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#805420] disabled:opacity-50 ${FOCUS_RING}`}
                  title="Download single-page PDF voucher"
                >
                  {downloadingId ===
                  (activeReceipt.receipt_id || activeReceipt.id || activeReceipt.receipt_number) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className={`rounded-lg p-1.5 text-slate-400 hover:bg-[#f1ede4] hover:text-slate-700 ${FOCUS_RING}`}
                  aria-label="Close receipt modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-[#faf8f4]">
              <OfficialReceiptVoucherCard
                receipt={activeReceipt}
                user={user}
              />
            </div>

            {/* Modal Bottom Footer */}
            <div
              className="flex items-center justify-between border-t border-[#e3ddd0] px-5 sm:px-6 py-3.5 bg-[#faf8f4] shrink-0"
            >
              <div className="text-[11px] text-[#8a8175]">
                {activeReceipt.receipt_number && (
                  <span>
                    Receipt Number:{" "}
                    <strong className="font-mono text-slate-800">
                      {activeReceipt.receipt_number}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className={`rounded-xl border border-[#e3ddd0] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#f1ede4] ${FOCUS_RING}`}
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={
                    downloadingId ===
                    (activeReceipt.receipt_id || activeReceipt.id || activeReceipt.receipt_number)
                  }
                  onClick={(e) => handleDownload(activeReceipt, e)}
                  className={`flex items-center gap-1.5 rounded-xl bg-[#9c6b2e] px-4.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#805420] transition disabled:opacity-50 ${FOCUS_RING}`}
                >
                  {downloadingId ===
                  (activeReceipt.receipt_id || activeReceipt.id || activeReceipt.receipt_number) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden offscreen container for direct PDF export from table rows */}
      <div
        id="superadmin-pdf-offscreen-wrapper"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "760px",
          height: "1px",
          overflow: "hidden",
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        {pdfExportReceipt && (
          <div id="superadmin-pdf-offscreen-export" style={{ background: "#ffffff", width: "760px", padding: "16px" }}>
            <OfficialReceiptVoucherCard
              receipt={pdfExportReceipt}
              user={user}
            />
          </div>
        )}
      </div>
    </div>
  );
}
