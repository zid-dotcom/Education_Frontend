import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useAuth } from "../context/AuthContext";
import {
  getStudentReceiptApi,
  getStudentReceiptsApi,
} from "../services/payments";
import OfficialReceiptVoucherCard from "../components/common/OfficialReceiptVoucherCard";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" };

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("student-receipt-fonts")) return;
    const link = document.createElement("link");
    link.id = "student-receipt-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (dateStr) => {
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

const formatDateTime = (dateStr) => {
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

/**
 * Robust extraction of the authoritative amount paid
 * Prioritizes API field amount_paid, followed by legacy aliases
 */
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

    const totalInst = receipt.installment_count ?? receipt.total_installments;

    if (
      instNo !== undefined &&
      instNo !== null &&
      String(instNo).trim() !== "" &&
      totalInst !== undefined &&
      totalInst !== null &&
      String(totalInst).trim() !== "" &&
      !isNaN(Number(instNo)) &&
      !isNaN(Number(totalInst)) &&
      Number(totalInst) > 0
    ) {
      return `Installment ${instNo} of ${totalInst}`;
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
  if (pt.includes("full") || pt.includes("lump")) return "Full Lump Sum Tuition";
  if (pt.includes("installment")) return "Installment Payment";
  if (pt.includes("admission") || pt.includes("registration")) return "Registration Fee";

  if (receipt.balance_amount !== undefined && Number(receipt.balance_amount) === 0) {
    return "Full Lump Sum Tuition";
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
      label: "Branch Split (Cash + UPI)",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
    };
  }
  if (m.includes("cash")) {
    return {
      label: "Branch Cash Payment",
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
    };
  }
  if (m.includes("upi")) {
    return {
      label: "Branch UPI Payment",
      bg: "#f3e8ff",
      text: "#6b21a8",
      border: "#e9d5ff",
    };
  }
  if (m.includes("razorpay") || m.includes("online") || m.includes("card")) {
    return {
      label: "Online (Razorpay)",
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
    "Fee Acknowledged";
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
    s.includes("paid") ||
    s.includes("acknowledged")
  ) {
    return {
      label: rawStatus === "Verified" ? "Verified" : rawStatus,
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
    bg: "#ecfdf5",
    text: "#065f46",
    border: "#a7f3d0",
    icon: "✓",
  };
};

/**
 * Voucher card view used in the modal and for single-page PDF generation
 * Uses standard HEX colors for 100% canvas/pdf compatibility
 */
function StudentReceiptVoucherCard({ receipt, user }) {
  if (!receipt) return null;
  const amountPaid = getReceiptAmount(receipt);
  const statusBadge = getPaymentStatusBadge(receipt);
  const paymentTypeLabel = formatPaymentType(receipt);
  const methodBadge = getPaymentMethodBadge(receipt.payment_method, receipt);

  const studentName = receipt.student_name || user?.name || "Student";
  const studentEmail = receipt.student_email || user?.email || "";
  const studentPhone = receipt.student_phone || user?.phone || "";

  const courseTitle =
    receipt.course_title || receipt.course_name || receipt.course?.title || "Enrolled Course Tuition";

  const receiptNo =
    receipt.receipt_number ||
    (receipt.receipt_id
      ? `AFX-${String(receipt.receipt_id).padStart(6, "0")}`
      : receipt.id
      ? `REC-${String(receipt.id).padStart(5, "0")}`
      : `#${receipt.receipt_id || receipt.id || "1"}`);

  const dateStr = receipt.payment_date || receipt.created_at || receipt.date;

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

  const cashAmount =
    receipt.cash_amount !== undefined && receipt.cash_amount !== null
      ? Number(receipt.cash_amount)
      : null;

  const upiAmount =
    receipt.upi_amount !== undefined && receipt.upi_amount !== null
      ? Number(receipt.upi_amount)
      : null;

  const rawMethod = String(
    receipt.payment_method || receipt.payment_mode || receipt.method || ""
  ).toLowerCase().trim();

  const isSplit =
    rawMethod === "split" ||
    rawMethod === "cash_upi" ||
    rawMethod.includes("cash+upi") ||
    rawMethod.includes("cash + upi") ||
    (cashAmount !== null && upiAmount !== null && cashAmount > 0 && upiAmount > 0);

  const isCash =
    !isSplit &&
    (rawMethod === "cash" || (cashAmount !== null && cashAmount > 0 && (!upiAmount || upiAmount === 0)));

  const isUpi =
    !isSplit &&
    !isCash &&
    (rawMethod === "upi" || (upiAmount !== null && upiAmount > 0 && (!cashAmount || cashAmount === 0)));

  return (
    <div
      id="student-receipt-voucher-card"
      className="p-6 sm:p-8 space-y-6"
      style={{ ...sans, background: "#ffffff", color: "#0f172a" }}
    >
      {/* 1. Header with Academy Logo & Official Status */}
      <div
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5"
        style={{ borderBottom: "1px solid #e3ddd0" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl font-black text-lg shrink-0 shadow-2xs"
            style={{ background: "#17140f", color: "#f4b942" }}
          >
            A
          </div>
          <div>
            <h2
              className="text-xl font-bold tracking-tight text-slate-900 leading-tight"
              style={serif}
            >
              Aurum FX Academy
            </h2>
            <p className="text-[11px] font-semibold tracking-wide" style={{ color: "#9c6b2e" }}>
              Official Student Tuition & Fee Receipt
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
            Receipt: {receiptNo}
          </p>
          <p className="text-[11px]" style={{ color: "#8a8175" }}>
            Date: {formatDateTime(dateStr)}
          </p>
        </div>
      </div>

      {/* 2. Student & Course Information */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl p-4.5"
        style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
      >
        <div>
          <h4
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#9c6b2e" }}
          >
            Student Details
          </h4>
          <p className="mt-1 text-sm font-bold text-slate-900">{studentName}</p>
          {studentEmail && (
            <p className="text-xs" style={{ color: "#5b5346" }}>
              {studentEmail}
            </p>
          )}
          {studentPhone && (
            <p className="text-xs font-mono" style={{ color: "#5b5346" }}>
              {studentPhone}
            </p>
          )}
        </div>

        <div>
          <h4
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#9c6b2e" }}
          >
            Course & Payment Term
          </h4>
          <p className="mt-1 text-sm font-bold text-slate-900">{courseTitle}</p>
          <p className="text-xs" style={{ color: "#5b5346" }}>
            {paymentTypeLabel}
          </p>
        </div>
      </div>

      {/* 3. Payment Item Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid #e3ddd0" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              className="font-bold"
              style={{
                background: "#f1ede4",
                color: "#7a531f",
                borderBottom: "1px solid #e3ddd0",
              }}
            >
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Payment Method</th>
              <th className="px-4 py-3 text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody style={{ background: "#ffffff" }}>
            <tr style={{ borderBottom: "1px solid #efe9dd" }}>
              <td className="px-4 py-3.5">
                <p className="font-bold text-slate-900">{courseTitle}</p>
                <p className="text-[11px]" style={{ color: "#8a8175" }}>
                  {paymentTypeLabel}
                </p>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                  style={{
                    background: methodBadge.bg,
                    color: methodBadge.text,
                    borderColor: methodBadge.border,
                  }}
                >
                  {methodBadge.label}
                </span>
                {isSplit && (
                  <div className="mt-1 text-[11px] font-semibold text-slate-700">
                    <span>Cash: <strong className="font-extrabold text-slate-900">{formatCurrency(cashAmount ?? 0)}</strong></span>
                    <span className="mx-1 text-slate-400">|</span>
                    <span>UPI: <strong className="font-extrabold text-slate-900">{formatCurrency(upiAmount ?? 0)}</strong></span>
                  </div>
                )}
                {isCash && cashAmount !== null && (
                  <div className="mt-1 text-[11px] font-semibold text-slate-700">
                    <span>Cash: <strong className="font-extrabold text-slate-900">{formatCurrency(cashAmount)}</strong></span>
                  </div>
                )}
                {isUpi && upiAmount !== null && (
                  <div className="mt-1 text-[11px] font-semibold text-slate-700">
                    <span>UPI: <strong className="font-extrabold text-slate-900">{formatCurrency(upiAmount)}</strong></span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums text-sm">
                {formatCurrency(amountPaid)}
              </td>
            </tr>

            {/* Total Paid Summary Row */}
            <tr
              className="font-extrabold text-sm"
              style={{ background: "#faf8f4", borderTop: "2px solid #e3ddd0" }}
            >
              <td className="px-4 py-3 text-slate-900">Total Paid (This Receipt)</td>
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

      {/* 4. Course Fee Clearance Breakdown (when course_fee / total_paid / balance available) */}
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

          <div className="grid grid-cols-2 gap-3 text-center pt-1">
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
            {receipt.transaction_reference && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Transaction Ref:
                </span>
                <code className="font-mono text-xs font-bold select-all break-all text-slate-900">
                  {receipt.transaction_reference}
                </code>
              </div>
            )}
            {receipt.razorpay_order_id && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Razorpay Order ID:
                </span>
                <code className="font-mono text-xs font-bold select-all break-all text-slate-900">
                  {receipt.razorpay_order_id}
                </code>
              </div>
            )}
            {receipt.razorpay_payment_id && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Razorpay Payment ID:
                </span>
                <code className="font-mono text-xs font-bold select-all break-all text-slate-900">
                  {receipt.razorpay_payment_id}
                </code>
              </div>
            )}
            {receipt.upi_transaction_id && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  UPI Ref ID:
                </span>
                <code className="font-mono text-xs font-bold select-all break-all text-slate-900">
                  {receipt.upi_transaction_id}
                </code>
              </div>
            )}
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

      {/* 7. Footer Note */}
      <div
        className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
        style={{ borderTop: "1px solid #e3ddd0", color: "#8a8175" }}
      >
        <p>Thank you for studying with Aurum FX Academy.</p>
        <p className="font-medium text-slate-700">Official Fee Acknowledgment • Valid without physical signature</p>
      </div>
    </div>
  );
}

export default function StudentReceipts() {
  useDisplayFonts();
  const { user, token } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [activeReceipt, setActiveReceipt] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [pdfExportReceipt, setPdfExportReceipt] = useState(null);

  const fetchReceipts = async (isManual = false) => {
    if (!token) return;
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError("");

      const res = await getStudentReceiptsApi(token);
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
  };

  useEffect(() => {
    fetchReceipts();
  }, [token]);

  const handleViewReceipt = async (receiptSummary) => {
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    setActiveReceipt(receiptSummary);
    try {
      const fullReceipt = await getStudentReceiptApi(receiptId, token);
      if (fullReceipt) {
        setActiveReceipt({ ...receiptSummary, ...fullReceipt });
      }
    } catch {
      // Keep existing summary
    }
  };

  /**
   * Generates a crisp, single-page PDF voucher using html2canvas-pro + jsPDF
   */
  const generatePdfFromElement = async (element, receipt) => {
    const receiptId =
      receipt.receipt_number || receipt.receipt_id || receipt.id || "receipt";
    const studentName = (
      receipt.student_name ||
      user?.name ||
      "student"
    ).replace(/\s+/g, "_");
    const fileName = `receipt_${receiptId}_${studentName}.pdf`;

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    const fullHeight = Math.max(element.scrollHeight, element.offsetHeight, 850);
    const fullWidth = element.scrollWidth || element.offsetWidth || 700;

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

        const offscreenWrapper = clonedDoc.getElementById("student-pdf-offscreen-wrapper");
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

    const margin = 8;
    const maxContentWidth = pageWidth - margin * 2; // 194mm
    const maxContentHeight = pageHeight - margin * 2; // 281mm

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

  /**
   * Triggers client-side PDF generation for either active modal or table row
   */
  const handleDownload = async (receiptSummary, e) => {
    if (e) e.stopPropagation();
    const receiptId =
      receiptSummary.receipt_id || receiptSummary.id || receiptSummary.receipt_number;
    if (!receiptId) return;

    try {
      setDownloadingId(receiptId);
      setError("");

      // Fetch full details if needed to ensure all references and breakdown are captured
      let targetReceipt = receiptSummary;
      if (token && (!receiptSummary.transaction_reference && !receiptSummary.course_fee)) {
        try {
          const full = await getStudentReceiptApi(receiptId, token);
          if (full) {
            targetReceipt = { ...receiptSummary, ...full };
          }
        } catch {}
      }

      // Check if modal voucher is visible
      const modalVoucher =
        document.getElementById("student-receipt-voucher-card") ||
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
        // Render via dedicated offscreen container
        setPdfExportReceipt(targetReceipt);
        await new Promise((resolve) => setTimeout(resolve, 150));
        const offscreenEl = document.getElementById("student-pdf-offscreen-export");
        if (offscreenEl) {
          await generatePdfFromElement(offscreenEl, targetReceipt);
        }
        setPdfExportReceipt(null);
      }

      setSuccess(`Receipt #${receiptId} downloaded!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("PDF download error:", err);
      setError(err?.message || `Failed to download receipt #${receiptId}.`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const courseTitle = (r.course_title || r.course_name || r.course?.title || "").toLowerCase();
      const receiptNo = String(r.receipt_number || r.receipt_id || r.id || "").toLowerCase();
      const ref = String(
        r.transaction_reference ||
          r.transaction_id ||
          r.payment_id ||
          r.razorpay_payment_id ||
          ""
      ).toLowerCase();

      return !q || courseTitle.includes(q) || receiptNo.includes(q) || ref.includes(q);
    });
  }, [receipts, searchTerm]);

  const stats = useMemo(() => {
    const totalPaid = receipts.reduce((sum, r) => sum + getReceiptAmount(r), 0);
    return {
      count: receipts.length,
      totalPaid,
    };
  }, [receipts]);

  return (
    <div className="space-y-6" style={sans}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3ddd0] pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9c6b2e]">
            Student Financial Records
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight" style={serif}>
            Payment Receipts
          </h1>
          <p className="mt-1 text-xs text-[#8a8175]">
            View and download official fee receipts for all online and branch-recorded payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReceipts(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-[#faf8f4] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/student-dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-[#17140f] px-3.5 py-2 text-xs font-bold text-[#f4b942] shadow-2xs transition hover:bg-slate-800"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-xs font-medium"
          style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium"
          style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#e3ddd0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a8175]">Total Receipts</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7efe0] text-[#9c6b2e]">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900" style={serif}>
            {loading ? "..." : stats.count}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8a8175]">
            Issued by campus accounts & Razorpay
          </p>
        </div>

        <div className="rounded-2xl border border-[#e3ddd0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a8175]">Total Cleared Tuition</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums" style={serif}>
            {loading ? "..." : formatCurrency(stats.totalPaid)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8a8175]">
            Total amount acknowledged in receipts
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8175]" />
        <input
          type="text"
          placeholder="Filter receipts by course title, receipt number or transaction reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-[#e3ddd0] bg-white py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-[#9c6b2e] focus:ring-2 focus:ring-[#9c6b2e]/20"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Receipts List */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#e3ddd0] bg-white p-5 animate-pulse"
            >
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="mt-3 h-3 w-64 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="rounded-2xl border border-[#e3ddd0] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7efe0] text-[#9c6b2e]">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900" style={serif}>
            No Receipts Available
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[#8a8175]">
            {receipts.length === 0
              ? "You do not have any issued payment receipts yet. As your installments are paid or recorded by the branch, they will appear here."
              : "No receipts match your search term. Try a different query."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((r, index) => {
            const receiptId = r.receipt_id || r.id || r.receipt_number || index + 1;
            const receiptNumber =
              r.receipt_number || (r.id ? `REC-${String(r.id).padStart(5, "0")}` : `#${receiptId}`);
            const courseTitle =
              r.course_title || r.course_name || r.course?.title || "Enrolled Course";
            const amount = getReceiptAmount(r);
            const date = r.payment_date || r.created_at || r.date;
            const installmentNo =
              r.installment_number || r.term_number || r.installment;
            const methodBadge = getPaymentMethodBadge(r.payment_method, r);
            const isDownloading = downloadingId === receiptId;

            return (
              <div
                key={receiptId}
                onClick={() => handleViewReceipt(r)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#e3ddd0] bg-white p-5 shadow-xs transition hover:border-[#9c6b2e]/60 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#faf8f4] border border-[#e3ddd0] text-[#9c6b2e] group-hover:scale-105 transition-transform">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#9c6b2e]">
                        {receiptNumber}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold border"
                        style={{
                          background: methodBadge.bg,
                          color: methodBadge.text,
                          borderColor: methodBadge.border,
                        }}
                      >
                        {methodBadge.label}
                      </span>
                      {installmentNo && (
                        <span className="rounded-md bg-[#f1ede4] px-2 py-0.5 text-[10px] font-bold text-[#7a531f]">
                          Installment #{installmentNo}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-[#9c6b2e] transition-colors">
                      {courseTitle}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#8a8175]">
                      Paid on: {formatDate(date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#efe9dd]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8175]">
                      Amount Paid
                    </span>
                    <p className="text-base font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleViewReceipt(r)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#f1ede4] transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={(e) => handleDownload(r, e)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#9c6b2e] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#805420] transition disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          STUDENT RECEIPT MODAL
         ========================================================================= */}
      {activeReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          style={{ background: "rgba(23,20,15,.6)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveReceipt(null)}
        >
          <div
            id="student-receipt-modal"
            className="relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e3ddd0]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar (No Print button, only Download PDF & Close) */}
            <div
              className="flex items-center justify-between border-b border-[#e3ddd0] px-6 py-4"
              style={{ background: "#faf8f4" }}
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#9c6b2e]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Receipt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    downloadingId ===
                    (activeReceipt.receipt_id || activeReceipt.id || activeReceipt.receipt_number)
                  }
                  onClick={(e) => handleDownload(activeReceipt, e)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#9c6b2e] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#805420] disabled:opacity-50"
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
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-[#f1ede4] hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Official Receipt Content rendered via pure voucher component */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 sm:p-6 bg-[#faf8f4]">
              <OfficialReceiptVoucherCard
                receipt={activeReceipt}
                user={user}
              />
            </div>

            {/* Modal Bottom Footer */}
            <div
              className="flex items-center justify-end gap-3 border-t border-[#e3ddd0] px-6 py-4"
              style={{ background: "#faf8f4" }}
            >
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="rounded-xl border border-[#e3ddd0] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#f1ede4]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden offscreen container for direct PDF export from table rows */}
      <div
        id="student-pdf-offscreen-wrapper"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "700px",
          height: "1px",
          overflow: "hidden",
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        {pdfExportReceipt && (
          <div id="student-pdf-offscreen-export" style={{ background: "#ffffff", width: "700px", padding: "16px" }}>
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
