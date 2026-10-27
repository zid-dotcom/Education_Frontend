import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
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
  User,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  getBranchAdminReceiptApi,
  getBranchAdminReceiptsApi,
} from "../services/branchadminreceipts";
import OfficialReceiptVoucherCard from "../components/common/OfficialReceiptVoucherCard";

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-receipt-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-receipt-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

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
.ba-rise  { opacity: 0; animation: ba-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .35s ease both; }
.ba-pop   { animation: ba-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}
.ba-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.ba-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.2);
  transform: translateY(-2px);
}

/* =========================================================================
   STRICT 1-PAGE PRINT STYLES
   ========================================================================= */
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .screen-layout {
    display: none !important;
  }
  .no-print {
    display: none !important;
  }
  #printable-receipt-backdrop {
    position: static !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    backdrop-filter: none !important;
    overflow: visible !important;
    z-index: auto !important;
  }
  #printable-receipt-modal {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: #ffffff !important;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  #printable-voucher-content {
    padding: 0 !important;
    margin: 0 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

/**
 * Format currency in Indian Rupees (INR)
 */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

/**
 * Convert INR currency amount to standard English words for formal receipt voucher
 */
const amountInWords = (num) => {
  const n = Math.floor(Number(num) || 0);
  if (n <= 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const convertGroup = (val) => {
    let str = "";
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + " Hundred ";
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + " ";
      val %= 10;
    }
    if (val > 0) {
      str += ones[val] + " ";
    }
    return str.trim();
  };

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  let res = "";
  if (crore > 0) res += convertGroup(crore) + " Crore ";
  if (lakh > 0) res += convertGroup(lakh) + " Lakh ";
  if (thousand > 0) res += convertGroup(thousand) + " Thousand ";
  if (rem > 0) res += convertGroup(rem) + " ";
  return (res.trim() + " Rupees Only");
};

/**
 * Get current date string in Asia/Kolkata timezone: YYYY-MM-DD
 */
const getKolkataTodayString = () => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/**
 * Extract YYYY-MM-DD from receipt date in Asia/Kolkata timezone
 */
const getReceiptKolkataDate = (dateVal) => {
  if (!dateVal) return null;
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      return null;
    }
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
};

/**
 * Format date in Asia/Kolkata (e.g. "26 Oct 2026")
 */
const formatReceiptDate = (dateVal) => {
  if (!dateVal) return "Not provided";
  const str = String(dateVal).trim();
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(dateObj);
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return str;
  }
};

/**
 * Format date & time without fabricating time when only date is available
 */
const formatReceiptDateTimeOrDate = (dateVal) => {
  if (!dateVal) return "Not provided";
  const str = String(dateVal).trim();
  const hasTime = str.includes("T") || (str.includes(":") && str.length > 10);
  if (!hasTime) {
    return formatReceiptDate(str);
  }
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return str;
  }
};

/**
 * Extract authoritative payment amount: prioritizes amount_paid, avoids missing amount
 */
const getReceiptAmount = (r) => {
  if (!r) return 0;
  if (r.amount_paid !== undefined && r.amount_paid !== null && r.amount_paid !== "") {
    const val = Number(r.amount_paid);
    if (!isNaN(val)) return val;
  }
  if (r.paid_amount !== undefined && r.paid_amount !== null && r.paid_amount !== "") {
    const val = Number(r.paid_amount);
    if (!isNaN(val)) return val;
  }
  if (r.amount !== undefined && r.amount !== null && r.amount !== "") {
    const val = Number(r.amount);
    if (!isNaN(val)) return val;
  }
  if (r.total_amount !== undefined && r.total_amount !== null && r.total_amount !== "") {
    const val = Number(r.total_amount);
    if (!isNaN(val)) return val;
  }
  return 0;
};

/**
 * Check if payment is rejected or failed (e.g. "Verified - Rejected by branch")
 */
const isRejectedPayment = (r) => {
  if (!r) return false;
  const status = String(r.payment_status || r.status || "").toLowerCase();
  return (
    status.includes("reject") ||
    status.includes("fail") ||
    status.includes("declined") ||
    status.includes("cancelled")
  );
};

/**
 * Format installment / payment type: e.g. "Installment 2 of 4"
 */
const formatPaymentType = (r) => {
  if (!r) return "Full / Lump sum";

  const rawType = String(r.payment_type || "").trim();

  // If payment_type is exactly "Remaining course balance settlement", map to installment label if available
  if (rawType.toLowerCase() === "remaining course balance settlement") {
    let instNo = null;
    if (Array.isArray(r.installment_numbers) && r.installment_numbers.length > 0) {
      instNo = r.installment_numbers[0];
    } else if (r.installment_number !== undefined && r.installment_number !== null && r.installment_number !== "") {
      instNo = r.installment_number;
    } else if (r.term_number !== undefined && r.term_number !== null && r.term_number !== "") {
      instNo = r.term_number;
    }

    const instCount = r.installment_count ?? r.total_installments;

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

    return r.payment_type || "Remaining course balance settlement";
  }

  if (rawType) {
    return rawType;
  }

  const instNos = r.installment_numbers;
  let instNo = null;
  if (Array.isArray(instNos) && instNos.length > 0) {
    instNo = instNos.join(", ");
  } else if (instNos !== undefined && instNos !== null && instNos !== "") {
    instNo = instNos;
  } else if (r.installment_number || r.term_number) {
    instNo = r.installment_number || r.term_number;
  }

  const instCount = r.installment_count || r.total_installments;

  if (instNo && instCount) {
    return `Installment ${instNo} of ${instCount}`;
  }

  if (instNo) {
    return `Installment #${instNo}`;
  }

  return "Full / Lump sum";
};

/**
 * Classify payment method category: 'online' | 'cash' | 'upi' | 'split' | 'other'
 */
const getPaymentMethodCategory = (r) => {
  if (!r) return "other";
  const m = String(r.payment_method || r.payment_mode || "").toLowerCase();
  const cash = Number(r.cash_amount || 0);
  const upi = Number(r.upi_amount || 0);

  if ((cash > 0 && upi > 0) || m.includes("split") || (m.includes("cash") && m.includes("upi"))) {
    return "split";
  }
  if (m.includes("cash") || cash > 0) {
    return "cash";
  }
  if (m.includes("upi") || upi > 0) {
    return "upi";
  }
  if (
    m.includes("razorpay") ||
    m.includes("online") ||
    m.includes("card") ||
    m.includes("netbanking")
  ) {
    return "online";
  }
  return "other";
};

/**
 * Get readable payment method badge
 */
const getPaymentMethodBadge = (method, receipt = {}) => {
  const category = getPaymentMethodCategory({ payment_method: method, ...receipt });
  const rawMethod = String(method || receipt.payment_method || receipt.payment_mode || "").trim();

  if (category === "split") {
    return {
      label: rawMethod && rawMethod.toLowerCase().includes("split") ? rawMethod : "Cash + UPI",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
      category: "split",
    };
  }
  if (category === "cash") {
    return {
      label: "Cash",
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
      category: "cash",
    };
  }
  if (category === "upi") {
    return {
      label: "UPI",
      bg: "#f3e8ff",
      text: "#6b21a8",
      border: "#e9d5ff",
      category: "upi",
    };
  }
  if (category === "online") {
    return {
      label: rawMethod && rawMethod.toLowerCase().includes("razorpay") ? "Razorpay" : "Online / Razorpay",
      bg: "#eff6ff",
      text: "#1e40af",
      border: "#bfdbfe",
      category: "online",
    };
  }
  return {
    label: rawMethod || "Completed",
    bg: "#f1ede4",
    text: "#5b5346",
    border: "#e3ddd0",
    category: "other",
  };
};

/**
 * Get payment status badge styling & labels
 */
const getPaymentStatusBadge = (r) => {
  const rawStatus = r?.payment_status || r?.status || "Received";
  const s = String(rawStatus).toLowerCase();

  if (
    s.includes("reject") ||
    s.includes("fail") ||
    s.includes("declined") ||
    s.includes("cancelled")
  ) {
    return {
      label: rawStatus,
      isRejected: true,
      bg: "#fef2f2",
      text: "#991b1b",
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
 * Pure Voucher View Component used both in the Modal and for single-page PDF generation.
 * All colors are explicitly declared in standard HEX codes to guarantee zero 'oklch' errors.
 */
function ReceiptVoucherCard({ receipt, user, copiedKey, onCopy }) {
  if (!receipt) return null;
  const statusBadge = getPaymentStatusBadge(receipt);
  const amountPaid = getReceiptAmount(receipt);
  const paymentTypeLabel = formatPaymentType(receipt);
  const methodBadge = getPaymentMethodBadge(receipt.payment_method, receipt);
  const isSplit =
    getPaymentMethodCategory(receipt) === "split" ||
    (Number(receipt.cash_amount || 0) > 0 && Number(receipt.upi_amount || 0) > 0);

  // Installment Numbers formatting
  const instNos = receipt.installment_numbers;
  let formattedInstNos = null;
  if (Array.isArray(instNos) && instNos.length > 0) {
    formattedInstNos = instNos.join(", ");
  } else if (instNos !== undefined && instNos !== null && instNos !== "") {
    formattedInstNos = String(instNos);
  }

  // Course fee summary values
  const hasCourseFee =
    receipt.course_fee !== undefined && receipt.course_fee !== null && receipt.course_fee !== "";
  const hasTotalPaid =
    receipt.total_paid !== undefined && receipt.total_paid !== null && receipt.total_paid !== "";
  const hasBalance =
    receipt.balance_amount !== undefined && receipt.balance_amount !== null && receipt.balance_amount !== "";

  // Payment footer status
  const isRejected = isRejectedPayment(receipt);
  const isFullSettled = hasBalance && Number(receipt.balance_amount) === 0 && !isRejected;

  // Signatory details
  const signatoryName = user?.name || receipt.authorized_by;
  const signatoryBranch =
    user?.branch_name || receipt.branch_name || "Branch Administrator";

  return (
    <div
      id="receipt-voucher-card"
      className="p-6 sm:p-7 space-y-5"
      style={{ ...sans, background: "#ffffff", color: "#0f172a" }}
    >
      {/* =====================================================================
          1. OFFICIAL RECEIPT HEADER
         ===================================================================== */}
      <div
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4.5"
        style={{ borderBottom: "2px solid #e3ddd0" }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl font-black shadow-xs text-base shrink-0"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              A
            </div>
            <div>
              <h2
                className="text-xl font-bold tracking-tight leading-tight"
                style={{ ...serif, color: "#0f172a" }}
              >
                {receipt.academy_name || user?.academy_name || "AurumFX Academy"}
              </h2>
              <p
                className="text-xs font-semibold tracking-wide"
                style={{ color: "#9c6b2e" }}
              >
                {receipt.branch_name || user?.branch_name || "Bright Future Institute of Technology"}
              </p>
            </div>
          </div>
          <div
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: "#faf8f4", border: "1px solid #e3ddd0", color: "#7a531f" }}
          >
            <Receipt className="h-3 w-3 text-[#9c6b2e]" />
            <span>Official Fee Payment Receipt Voucher</span>
          </div>
        </div>

        {/* Status Badge & Meta */}
        <div className="text-left sm:text-right space-y-1">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: statusBadge.bg,
                color: statusBadge.text,
                border: `1px solid ${statusBadge.border}`,
              }}
            >
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.label}</span>
            </span>
          </div>
          <div className="pt-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8a8175] block">
              Receipt Number
            </span>
            <span
              className="text-sm font-bold font-mono"
              style={{ color: "#0f172a" }}
            >
              {receipt.receipt_number || receipt.receipt_id || "—"}
            </span>
          </div>
          <p className="text-xs text-[#8a8175]">
            Payment Date:{" "}
            <strong style={{ color: "#0f172a" }}>
              {formatReceiptDateTimeOrDate(
                receipt.payment_date || receipt.created_at || receipt.date
              )}
            </strong>
          </p>
        </div>
      </div>

      {/* =====================================================================
          2. STUDENT & COURSE INFORMATION (STRUCTURED TABLE FORMAT)
         ===================================================================== */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
      >
        <div
          className="px-5 py-2.5 border-b flex items-center justify-between"
          style={{ background: "#fbf9f5", borderColor: "#e3ddd0" }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "#7a531f" }}
          >
            <User className="h-3.5 w-3.5 text-[#9c6b2e]" />
            <span>Student & Course Details</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              <tr style={{ borderBottom: "1px solid #efe9dd" }}>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider w-[22%]"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Student Name
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-sm text-slate-900 w-[28%]"
                  style={{ borderRight: "1px solid #efe9dd" }}
                >
                  {receipt.student_name || "—"}
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider w-[22%]"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Enrolled Course
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-sm text-slate-900 w-[28%]"
                >
                  {receipt.course_name || receipt.course_title || "—"}
                </td>
              </tr>

              <tr style={{ borderBottom: receipt.address ? "1px solid #efe9dd" : "none" }}>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Email Address
                </td>
                <td
                  className="px-4 py-2.5 text-slate-800 truncate"
                  style={{ borderRight: "1px solid #efe9dd" }}
                  title={receipt.student_email || "—"}
                >
                  {receipt.student_email || "—"}
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Payment Plan
                </td>
                <td
                  className="px-4 py-2.5 font-semibold text-slate-800"
                >
                  {paymentTypeLabel}
                </td>
              </tr>

              <tr>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Contact Number
                </td>
                <td
                  className="px-4 py-2.5 font-medium text-slate-800"
                  style={{ borderRight: "1px solid #efe9dd" }}
                >
                  {receipt.student_phone || "—"}
                </td>
                <td
                  className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider"
                  style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                >
                  Installment Status
                </td>
                <td
                  className="px-4 py-2.5 font-medium text-slate-800"
                >
                  {formattedInstNos
                    ? `Installment ${formattedInstNos}${receipt.installment_count ? ` of ${receipt.installment_count}` : ""}`
                    : receipt.installment_count
                    ? `Total: ${receipt.installment_count} Terms`
                    : "Standard Term"}
                </td>
              </tr>

              {receipt.address && (
                <tr style={{ borderTop: "1px solid #efe9dd" }}>
                  <td
                    className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider"
                    style={{ background: "#faf8f4", color: "#7a531f", borderRight: "1px solid #efe9dd" }}
                  >
                    Address
                  </td>
                  <td
                    className="px-4 py-2.5 text-slate-800"
                    colSpan={3}
                  >
                    {receipt.address}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          3. PAYMENT BREAKDOWN (ITEMIZED RECEIPT TABLE)
         ===================================================================== */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid #e3ddd0", background: "#ffffff" }}
      >
        <div
          className="px-5 py-2.5 border-b flex items-center justify-between"
          style={{ background: "#fbf9f5", borderColor: "#e3ddd0" }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "#7a531f" }}
          >
            Payment Breakdown
          </span>
          <span className="text-[11px] text-[#8a8175]">
            Currency: <strong style={{ color: "#0f172a" }}>{receipt.currency || "INR (₹)"}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "#f4efe6",
                  color: "#7a531f",
                  borderBottom: "1px solid #e3ddd0",
                  fontWeight: 700,
                }}
              >
                <th className="px-5 py-2.5 text-left">Particulars / Description</th>
                <th className="px-4 py-2.5 text-center">Payment Term</th>
                <th className="px-4 py-2.5 text-center">Payment Method</th>
                <th className="px-5 py-2.5 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ede4]">
              <tr>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>
                    {receipt.course_name || receipt.course_title || "Tuition Course Payment"}
                  </p>
                  <p className="text-[11px] pt-0.5 text-[#8a8175]">
                    Tuition Fee Payment • {statusBadge.label}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold"
                    style={{ background: "#f5f0e6", color: "#7a531f" }}
                  >
                    {paymentTypeLabel}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold border"
                    style={{
                      background: methodBadge.bg,
                      color: methodBadge.text,
                      borderColor: methodBadge.border,
                    }}
                  >
                    {methodBadge.label}
                  </span>
                </td>
                <td
                  className="px-5 py-3.5 text-right font-extrabold text-base tabular-nums"
                  style={{ color: "#0f172a" }}
                >
                  {formatCurrency(amountPaid)}
                </td>
              </tr>

              {/* Split breakdown if applicable */}
              {isSplit && (
                <>
                  <tr style={{ background: "#faf8f4", color: "#5b5346", fontSize: "11px" }}>
                    <td className="px-5 py-2 pl-9" colSpan={2}>
                      ↳ Cash Component:
                    </td>
                    <td className="px-4 py-2 text-center font-medium">Cash in Hand</td>
                    <td className="px-5 py-2 text-right font-bold tabular-nums">
                      {formatCurrency(receipt.cash_amount || 0)}
                    </td>
                  </tr>
                  <tr style={{ background: "#faf8f4", color: "#5b5346", fontSize: "11px" }}>
                    <td className="px-5 py-2 pl-9" colSpan={2}>
                      ↳ UPI Component:
                    </td>
                    <td className="px-4 py-2 text-center font-medium">Digital UPI</td>
                    <td className="px-5 py-2 text-right font-bold tabular-nums">
                      {formatCurrency(receipt.upi_amount || 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Receipt Summary & Total Block */}
        <div
          className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: "#fbf9f5", borderTop: "2px solid #e3ddd0" }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8175] block">
              Amount in Words:
            </span>
            <p className="text-xs font-bold italic" style={{ color: "#7a531f" }}>
              {amountInWords(amountPaid)}
            </p>
            <p className="text-[11px] text-[#8a8175]">
              Payment Status:{" "}
              <strong
                className="font-bold"
                style={{ color: isRejected ? "#be123c" : "#047857" }}
              >
                {isRejected
                  ? "Rejected / Not Verified"
                  : isFullSettled
                  ? "Paid in Full"
                  : "Payment Received & Acknowledged"}
              </strong>
            </p>
          </div>

          <div
            className="rounded-xl px-5 py-2.5 text-right shrink-0"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8175] block">
              Total Amount Paid
            </span>
            <span
              className="text-2xl font-black tabular-nums block mt-0.5"
              style={{ ...serif, color: "#9c6b2e" }}
            >
              {formatCurrency(amountPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. COURSE FEE & LEDGER STATEMENT
         ===================================================================== */}
      <div
        className="rounded-2xl p-4.5 space-y-3"
        style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
      >
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "#ece5d8" }}>
          <span
            className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "#9c6b2e" }}
          >
            <IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]" />
            <span>Course Fee & Ledger Summary</span>
          </span>
          <span className="text-[10px] text-[#8a8175]">
            Cumulative Account Position
          </span>
        </div>

        {/* 3-Column Structured Financial Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8175] block">
              Total Course Fee
            </span>
            <p className="mt-1 text-base font-extrabold tabular-nums" style={{ color: "#0f172a" }}>
              {hasCourseFee ? formatCurrency(receipt.course_fee) : "—"}
            </p>
            <span className="text-[10px] text-[#8a8175] block">Enrolled Tuition</span>
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8175] block">
              Total Paid So Far
            </span>
            <p className="mt-1 text-base font-extrabold tabular-nums" style={{ color: "#047857" }}>
              {hasTotalPaid ? formatCurrency(receipt.total_paid) : "—"}
            </p>
            <span className="text-[10px] text-[#047857] font-semibold block">
              {hasTotalPaid && hasCourseFee && Number(receipt.course_fee) > 0
                ? `${Math.round((Number(receipt.total_paid) / Number(receipt.course_fee)) * 100)}% Cleared`
                : "All payments to date"}
            </span>
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8175] block">
              Remaining Balance
            </span>
            <p
              className="mt-1 text-base font-extrabold tabular-nums"
              style={{
                color:
                  hasBalance && Number(receipt.balance_amount) === 0
                    ? "#047857"
                    : "#b45309",
              }}
            >
              {hasBalance ? formatCurrency(receipt.balance_amount) : "—"}
            </p>
            <span
              className="text-[10px] font-semibold block"
              style={{
                color:
                  hasBalance && Number(receipt.balance_amount) === 0
                    ? "#047857"
                    : "#b45309",
              }}
            >
              {hasBalance && Number(receipt.balance_amount) === 0
                ? "Course Fully Settled"
                : "Outstanding Due"}
            </span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          5. PAYMENT GATEWAY & AUDIT IDENTIFIERS
         ===================================================================== */}
      {(receipt.transaction_reference ||
        receipt.razorpay_order_id ||
        receipt.razorpay_payment_id ||
        receipt.upi_transaction_id) && (
        <div
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "#efe9dd" }}>
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "#9c6b2e" }}
            >
              Transaction & Gateway References
            </span>
            <span className="text-[10px] text-[#8a8175]">
              Verification Audit Identifiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

      {/* =====================================================================
          6. RECEIPT FOOTER, MOTTO & AUTHORIZED SIGNATORY
         ===================================================================== */}
      <div
        className="pt-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-5 text-xs"
        style={{ borderTop: "2px solid #e3ddd0" }}
      >
        <div className="space-y-2 max-w-sm">
          {receipt.quote && (
            <div
              className="italic text-xs px-3.5 py-1.5 rounded-xl"
              style={{ background: "#fffbeb", borderLeft: "3px solid #9c6b2e", color: "#78531a" }}
            >
              <span>“{receipt.quote}”</span>
            </div>
          )}
          <div className="space-y-0.5 text-[11px] text-[#8a8175]">
            <p className="font-bold text-slate-800">
              Official Fee Acknowledgment
            </p>
            <p>This is a computer-generated receipt issued by AurumFX Academy.</p>
            <p>Valid without physical signature when verified online.</p>
          </div>
        </div>

        {signatoryName && (
          <div className="sm:text-right space-y-1">
            <p className="font-bold text-sm" style={{ color: "#0f172a" }}>
              {signatoryName}
            </p>
            <p className="text-[11px]" style={{ color: "#8a8175" }}>
              {signatoryBranch}
            </p>
            <div
              className="mt-2 inline-block pt-1 text-[10px] uppercase tracking-widest font-semibold"
              style={{ borderTop: "1px solid #94a3b8", color: "#64748b" }}
            >
              Authorized Signatory
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BranchAdminReceipts() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Receipt data & API authoritative totals
  const [receipts, setReceipts] = useState([]);
  const [apiTotalReceipts, setApiTotalReceipts] = useState(null);
  const [todayStats, setTodayStats] = useState({ count: 0, amount: 0 });

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Client search & method filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");

  // Server date range filter states (YYYY-MM-DD)
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [appliedDates, setAppliedDates] = useState({ from: "", to: "" });
  const [activePreset, setActivePreset] = useState("all");
  const [dateError, setDateError] = useState("");

  // Receipt Modal & Actions
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState(null);

  // Offscreen receipt container for direct row PDF export
  const [pdfExportReceipt, setPdfExportReceipt] = useState(null);

  /**
   * Copy identifier to clipboard with instant visual feedback
   */
  const handleCopyText = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  /**
   * Generate an authentic, single-page PDF document using html2canvas-pro + jsPDF
   * Ensures 100% complete height capture without clipping from modal scroll containers
   */
  const generatePdfFromElement = async (element, receipt) => {
    const receiptId =
      receipt.receipt_number || receipt.receipt_id || receipt.id || "receipt";
    const studentName = (
      receipt.student_name ||
      receipt.student?.name ||
      "student"
    ).replace(/\s+/g, "_");
    const fileName = `receipt_${receiptId}_${studentName}.pdf`;

    // 1. Ensure all custom fonts (Fraunces & Inter) are fully loaded
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    // 2. Reset scroll position on any scrollable parent so capture origin is at 0,0
    const scrollParent = element.closest ? element.closest("#printable-voucher-content") : null;
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }

    // 3. Measure full unconstrained dimensions
    const fullHeight = Math.max(element.scrollHeight, element.offsetHeight, 1100);
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
        // Remove all height, max-height, and overflow clipping on cloned element and all ancestors
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

        const offscreenWrapper = clonedDoc.getElementById("pdf-offscreen-wrapper");
        if (offscreenWrapper) {
          offscreenWrapper.style.height = "auto";
          offscreenWrapper.style.overflow = "visible";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const margin = 8; // 8mm margins
    const maxContentWidth = pageWidth - margin * 2; // 194mm
    const maxContentHeight = pageHeight - margin * 2; // 281mm

    const contentWidth = maxContentWidth;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let finalWidth = contentWidth;
    let finalHeight = contentHeight;
    let posX = margin;
    let posY = margin;

    // Proportional single-page scaling if receipt height exceeds printable area
    if (contentHeight > maxContentHeight) {
      const ratio = maxContentHeight / contentHeight;
      finalHeight = maxContentHeight;
      finalWidth = contentWidth * ratio;
      posX = margin + (maxContentWidth - finalWidth) / 2;
    }

    pdf.addImage(imgData, "PNG", posX, posY, finalWidth, finalHeight);
    pdf.save(fileName);
  };

  /**
   * Fetch receipts for the given date range (or all receipts if no dates)
   */
  const fetchReceipts = useCallback(
    async (datesToApply = { from: "", to: "" }, isManualRefresh = false) => {
      if (!token) return;
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        const params = {};
        if (datesToApply?.from) params.from_date = datesToApply.from;
        if (datesToApply?.to) params.to_date = datesToApply.to;

        const res = await getBranchAdminReceiptsApi(token, params);

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
        setError(err?.message || "Failed to load receipts.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchReceipts({ from: "", to: "" });
  }, [token, fetchReceipts]);

  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    setDateError("");
    const todayStr = getKolkataTodayString();

    if (presetId === "all") {
      setFromDateInput("");
      setToDateInput("");
      const emptyRange = { from: "", to: "" };
      setAppliedDates(emptyRange);
      fetchReceipts(emptyRange);
    } else if (presetId === "today") {
      setFromDateInput(todayStr);
      setToDateInput(todayStr);
      const newRange = { from: todayStr, to: todayStr };
      setAppliedDates(newRange);
      fetchReceipts(newRange);
    } else if (presetId === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString().slice(0, 10);
      setFromDateInput(weekAgo);
      setToDateInput(todayStr);
      const newRange = { from: weekAgo, to: todayStr };
      setAppliedDates(newRange);
      fetchReceipts(newRange);
    } else if (presetId === "month") {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      setFromDateInput(monthStart);
      setToDateInput(todayStr);
      const newRange = { from: monthStart, to: todayStr };
      setAppliedDates(newRange);
      fetchReceipts(newRange);
    }
  };

  const handleDateChange = (field, value) => {
    setActivePreset("custom");
    if (field === "from") {
      setFromDateInput(value);
      if (value && toDateInput && value > toDateInput) {
        setDateError("From Date cannot be later than To Date.");
      } else {
        setDateError("");
      }
    } else {
      setToDateInput(value);
      if (fromDateInput && value && fromDateInput > value) {
        setDateError("From Date cannot be later than To Date.");
      } else {
        setDateError("");
      }
    }
  };

  const handleApplyDateFilter = () => {
    if (!fromDateInput && !toDateInput) {
      setDateError("Please enter at least one date.");
      return;
    }
    if (fromDateInput && toDateInput && fromDateInput > toDateInput) {
      setDateError("From Date cannot be later than To Date.");
      return;
    }
    setDateError("");
    setActivePreset("custom");
    const newRange = { from: fromDateInput, to: toDateInput };
    setAppliedDates(newRange);
    fetchReceipts(newRange);
  };

  const handleClearDates = () => {
    setFromDateInput("");
    setToDateInput("");
    setDateError("");
    setActivePreset("all");
    const emptyRange = { from: "", to: "" };
    setAppliedDates(emptyRange);
    fetchReceipts(emptyRange);
  };

  const handleViewReceipt = async (receiptSummary) => {
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    setActiveReceipt(receiptSummary);
    setModalLoading(true);
    try {
      const fullReceipt = await getBranchAdminReceiptApi(receiptId, token);
      if (fullReceipt) {
        setActiveReceipt((prev) => ({
          ...prev,
          ...fullReceipt,
          amount_paid: fullReceipt.amount_paid ?? receiptSummary.amount_paid,
        }));
      }
    } catch {
      // Fallback to receiptSummary in state
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * Handle downloading a receipt as a genuine single-page PDF
   */
  const handleDownload = async (receiptSummary, e) => {
    if (e) e.stopPropagation();
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    try {
      setDownloadingId(receiptId);
      setError("");

      // 1. If currently open in modal, ensure complete details and capture unclipped card
      if (activeReceipt && (activeReceipt.receipt_id || activeReceipt.id) === receiptId) {
        let receiptData = activeReceipt;

        // If modal was still fetching extra details, await full data first
        if (
          modalLoading ||
          (!receiptData.course_fee && !receiptData.quote && !receiptData.transaction_reference)
        ) {
          if (token) {
            try {
              const fetched = await getBranchAdminReceiptApi(receiptId, token);
              if (fetched) {
                receiptData = { ...activeReceipt, ...fetched };
                setActiveReceipt(receiptData);
              }
            } catch {}
          }
        }

        // Wait two animation frames for React to commit state & styles
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await new Promise((resolve) => setTimeout(resolve, 100));

        const cardEl =
          document.getElementById("receipt-voucher-card") ||
          document.getElementById("printable-voucher-content");
        if (cardEl) {
          await generatePdfFromElement(cardEl, receiptData);
          setSuccess(`Receipt #${receiptId} downloaded as PDF!`);
          setTimeout(() => setSuccess(""), 4000);
          return;
        }
      }

      // 2. Fetch full details if needed to ensure complete data (direct table download)
      let fullReceipt = receiptSummary;
      if (token) {
        try {
          const fetched = await getBranchAdminReceiptApi(receiptId, token);
          if (fetched) {
            fullReceipt = { ...receiptSummary, ...fetched };
          }
        } catch {
          // Use summary data
        }
      }

      // Render offscreen container
      setPdfExportReceipt(fullReceipt);

      // Wait two animation frames + 200ms for React layout pass
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 200));

      const offscreenEl = document.getElementById("pdf-offscreen-export");
      if (!offscreenEl) {
        throw new Error("Unable to initialize PDF export canvas.");
      }

      await generatePdfFromElement(offscreenEl, fullReceipt);
      setSuccess(`Receipt #${receiptId} downloaded as PDF!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || `Failed to download receipt #${receiptId}.`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDownloadingId(null);
      setPdfExportReceipt(null);
    }
  };

  const isDateFilterActive = Boolean(appliedDates.from || appliedDates.to);
  const isSingleDay = Boolean(
    appliedDates.from && appliedDates.to && appliedDates.from === appliedDates.to
  );

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

      // 2. Client Search
      const s = searchTerm.toLowerCase().trim();
      if (s) {
        const studentName = (r.student_name || r.student?.name || r.name || "").toLowerCase();
        const studentEmail = (r.student_email || r.student?.email || r.email || "").toLowerCase();
        const studentPhone = (r.student_phone || r.student?.phone || r.phone || "").toLowerCase();
        const courseTitle = (r.course_name || r.course_title || r.course?.title || "").toLowerCase();
        const receiptNo = String(r.receipt_number || r.receipt_id || r.id || "").toLowerCase();
        const refNo = String(
          r.transaction_reference ||
            r.transaction_id ||
            r.payment_id ||
            r.razorpay_payment_id ||
            r.upi_transaction_id ||
            ""
        ).toLowerCase();

        const matchesSearch =
          studentName.includes(s) ||
          studentEmail.includes(s) ||
          studentPhone.includes(s) ||
          courseTitle.includes(s) ||
          receiptNo.includes(s) ||
          refNo.includes(s);

        if (!matchesSearch) return false;
      }

      // 3. Payment Method Filter
      const category = getPaymentMethodCategory(r);
      const matchesMethod = selectedMethod === "all" || category === selectedMethod;
      if (!matchesMethod) return false;

      return true;
    });
  }, [receipts, appliedDates, searchTerm, selectedMethod]);

  const summaryMetrics = useMemo(() => {
    const count = filteredReceipts.length;
    const validReceipts = filteredReceipts.filter((r) => !isRejectedPayment(r));
    const totalCollected = validReceipts.reduce((sum, r) => sum + getReceiptAmount(r), 0);

    const todayStr = getKolkataTodayString();
    let periodCount = 0;
    let periodCollected = 0;

    if (isDateFilterActive) {
      // When date filter is active, period cards reflect the filtered receipts and amount
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
      className="min-h-screen"
      style={{ ...sans, background: "#faf8f4", color: "#17140f" }}
    >
      <style>{PAGE_CSS}</style>

      {/* Screen layout wrapper (hidden entirely on print) */}
      <div className="screen-layout min-h-screen md:flex">
        {/* Sidebar */}
        <BranchAdminSidebar
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
                  Branch Finance
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Payment Receipts
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  fetchReceipts(appliedDates, true);
                  fetchTodayStatsOnly();
                }}
                disabled={refreshing}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-[#f0ebe1] disabled:opacity-50"
                title="Refresh receipts"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/branch-admin/profit")}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-[#f0ebe1]"
              >
                <IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]" />
                <span>Student Fees</span>
              </button>

              <div className="hidden text-right sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {user?.name || "Branch Admin"}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {user?.branch_name || "Branch Administrator"}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
                style={{ background: "#17140f", color: "#f4b942" }}
                aria-hidden="true"
              >
                {user?.name?.charAt(0).toUpperCase() || "B"}
              </div>
            </div>
          </header>

          {/* Page Body */}
          <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8 sm:px-10">
            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            {success && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Total Receipts */}
              <div
                className="ba-card rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8a8175]">Total Receipts</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7efe0] text-[#9c6b2e]">
                    <Receipt className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900" style={serif}>
                  {loading ? "..." : summaryMetrics.totalCount}
                </p>
                <p className="mt-1 text-[11px] text-[#8a8175]">
                  {isDateFilterActive ? "Receipts in date range" : "All issued payment vouchers"}
                </p>
              </div>

              {/* 2. Total Collections */}
              <div
                className="ba-card rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8a8175]">Total Collections</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums" style={serif}>
                  {loading ? "..." : formatCurrency(summaryMetrics.totalCollected)}
                </p>
                <p className="mt-1 text-[11px] text-[#8a8175]">
                  {isDateFilterActive ? "Valid collections in range" : "Net verified collections"}
                </p>
              </div>

              {/* 3. Today's / Filtered Receipts */}
              <div
                className="ba-card rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8a8175]">
                    {isSingleDay
                      ? `${formatReceiptDate(appliedDates.from)} Receipts`
                      : isDateFilterActive
                      ? "Filtered Receipts"
                      : "Today's Receipts"}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1ede4] text-[#17140f]">
                    <Calendar className="h-4 w-4 text-[#9c6b2e]" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900" style={serif}>
                  {loading ? "..." : summaryMetrics.todayCount}
                </p>
                <p className="mt-1 text-[11px] text-[#8a8175]">
                  {isSingleDay
                    ? `Recorded on ${formatReceiptDate(appliedDates.from)}`
                    : isDateFilterActive
                    ? "In selected date range"
                    : "Recorded today (IST)"}
                </p>
              </div>

              {/* 4. Today's / Filtered Amount */}
              <div
                className="ba-card rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8a8175]">
                    {isSingleDay
                      ? `${formatReceiptDate(appliedDates.from)} Amount`
                      : isDateFilterActive
                      ? "Filtered Amount"
                      : "Today's Amount"}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                    <IndianRupee className="h-4 w-4 text-amber-700" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums" style={serif}>
                  {loading ? "..." : formatCurrency(summaryMetrics.todayCollected)}
                </p>
                <p className="mt-1 text-[11px] text-[#8a8175]">
                  {isSingleDay
                    ? `Net verified on ${formatReceiptDate(appliedDates.from)}`
                    : isDateFilterActive
                    ? "Net verified in range"
                    : "Net verified collections today"}
                </p>
              </div>
            </div>

            {/* Search & Date Filters Toolbar */}
            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              {/* Row 1: Search & Payment Method */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8175]" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, phone, receipt number or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-10 pr-9 text-xs font-medium outline-none transition focus:border-[#9c6b2e] focus:bg-white ${FOCUS_RING}`}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs">
                    <Filter className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="all">All Payment Methods</option>
                      <option value="online">Online / Razorpay</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="split">Split (Cash + UPI)</option>
                    </select>
                  </div>

                  {(searchTerm || selectedMethod !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedMethod("all");
                      }}
                      className="rounded-xl border border-[#e3ddd0] px-3 py-2 text-xs font-semibold text-[#8a8175] hover:bg-[#f1ede4]"
                    >
                      Reset Search
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Date Range Controls */}
              <div className="flex flex-col gap-3 pt-3 border-t border-[#efe9dd] lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#9c6b2e]" />
                    <span>Date Range:</span>
                  </span>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0]">
                    {[
                      { id: "all", label: "All" },
                      { id: "today", label: "Today" },
                      { id: "week", label: "This Week" },
                      { id: "month", label: "This Month" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          activePreset === p.id
                            ? "bg-[#9c6b2e] text-white shadow-2xs"
                            : "text-[#5b5346] hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* From Date */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-[#8a8175]">From</span>
                    <input
                      type="date"
                      value={fromDateInput}
                      onChange={(e) => handleDateChange("from", e.target.value)}
                      className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
                      aria-label="From Date"
                    />
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-[#8a8175]">To</span>
                    <input
                      type="date"
                      value={toDateInput}
                      onChange={(e) => handleDateChange("to", e.target.value)}
                      className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
                      aria-label="To Date"
                    />
                  </div>

                  {/* Apply Filter Button */}
                  <button
                    type="button"
                    disabled={Boolean(dateError) || (!fromDateInput && !toDateInput)}
                    onClick={handleApplyDateFilter}
                    className={`flex items-center gap-1.5 rounded-xl bg-[#9c6b2e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#805420] disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
                  >
                    <Filter className="h-3 w-3" />
                    <span>Apply Filter</span>
                  </button>

                  {/* Clear Dates Button */}
                  {(fromDateInput || toDateInput || isDateFilterActive) && (
                    <button
                      type="button"
                      onClick={handleClearDates}
                      className="flex items-center gap-1 rounded-xl border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f1ede4] transition"
                    >
                      <RotateCcw className="h-3 w-3 text-slate-400" />
                      <span>Clear Dates</span>
                    </button>
                  )}
                </div>

                {/* Active Filter Indication */}
                {isDateFilterActive && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7ee] border border-[#fbd38d] px-3 py-1 text-[11px] font-bold text-[#9c6b2e]">
                      <span>Filtered:</span>
                      <span>
                        {appliedDates.from ? formatReceiptDate(appliedDates.from) : "Start"} →{" "}
                        {appliedDates.to ? formatReceiptDate(appliedDates.to) : "End"}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="ml-1 text-slate-400 hover:text-slate-700 font-bold"
                        title="Clear date range"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Error Banner */}
              {dateError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{dateError}</span>
                </div>
              )}
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="space-y-4" aria-busy="true" aria-label="Loading receipts">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5"
                    style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="ba-skeleton h-4 w-32 rounded" />
                      <div className="ba-skeleton h-6 w-20 rounded-full" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((j) => (
                        <div key={j}>
                          <div className="ba-skeleton h-3 w-16 rounded" />
                          <div className="ba-skeleton mt-2 h-4 w-28 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div
                className="ba-fade rounded-2xl p-12 text-center"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7efe0] text-[#9c6b2e]">
                  <Receipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900" style={serif}>
                  No Receipts Found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#8a8175]">
                  {receipts.length === 0
                    ? isDateFilterActive
                      ? "No receipts were recorded for the selected date range. Try broadening your filter or clearing dates."
                      : "No payment receipts have been issued for this branch yet. When students register or pay installments, receipts will appear here."
                    : "No receipts matched your current search or payment method filter. Try adjusting your query."}
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
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-semibold text-[#8a8175]">
                  <span>
                    Showing <strong className="text-slate-900">{filteredReceipts.length}</strong> of{" "}
                    <strong className="text-slate-900">{receipts.length}</strong> receipts
                    {searchTerm || selectedMethod !== "all" ? " (filtered)" : ""}
                  </span>
                  {isDateFilterActive && (
                    <span className="text-[11px] text-[#9c6b2e] font-bold">
                      Filtered by date range
                    </span>
                  )}
                </div>

                <div
                  className="overflow-hidden rounded-2xl shadow-xs"
                  style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr
                          className="border-b text-[11px] font-bold uppercase tracking-wider text-[#8a8175]"
                          style={{ borderColor: "#e3ddd0", background: "#faf8f4" }}
                        >
                          <th className="px-5 py-4 whitespace-nowrap">Receipt Number</th>
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
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================================================
          RECEIPT DETAILS MODAL (RESPONSIVE, SCROLLABLE & COMPLETE DATA MAPPING)
         ========================================================================= */}
      {activeReceipt && (
        <div
          id="printable-receipt-backdrop"
          className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm overflow-y-auto"
          style={{ background: "rgba(23,20,15,.65)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveReceipt(null)}
        >
          <div
            id="printable-receipt-modal"
            className="ba-pop relative my-4 sm:my-6 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e3ddd0]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar (Fixed at modal top, hidden on print) */}
            <div
              className="no-print flex items-center justify-between border-b border-[#e3ddd0] px-5 sm:px-6 py-3.5 bg-[#faf8f4] shrink-0"
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#9c6b2e]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Receipt Voucher
                </span>
                {modalLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-[#9c6b2e] font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading details...</span>
                  </span>
                )}
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

            {/* Modal Body: Scrollable, clean typography and spacing */}
            <div id="printable-voucher-content" className="overflow-y-auto flex-1 p-4 sm:p-6 bg-[#faf8f4]">
              <OfficialReceiptVoucherCard
                receipt={activeReceipt}
                user={user}
              />
            </div>

            {/* Modal Bottom Footer (Fixed at modal bottom, hidden on print) */}
            <div
              className="no-print flex items-center justify-between border-t border-[#e3ddd0] px-5 sm:px-6 py-3.5 bg-[#faf8f4] shrink-0"
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
        id="pdf-offscreen-wrapper"
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
          <div id="pdf-offscreen-export" style={{ background: "#ffffff", width: "760px", padding: "16px" }}>
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
