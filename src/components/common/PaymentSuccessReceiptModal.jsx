import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  PartyPopper,
  Phone,
  Receipt,
  Sparkles,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { getStudentReceiptApi } from "../../services/payments";
import { getBranchAdminReceiptApi } from "../../services/branchadminreceipts";
import OfficialReceiptVoucherCard from "./OfficialReceiptVoucherCard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

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
  if (!receipt) return "Course Tuition Fee";

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
  if (pt.includes("admission") || pt.includes("registration")) return "Registration & Admission Fee";

  if (receipt.balance_amount !== undefined && Number(receipt.balance_amount) === 0) {
    return "Full Course Tuition";
  }

  return "Course Tuition Fee";
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
      label: "Split (Cash + UPI)",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
    };
  }
  if (m.includes("cash")) {
    return {
      label: "Cash Payment",
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
    };
  }
  if (m.includes("upi")) {
    return {
      label: "UPI Direct",
      bg: "#f0fdf4",
      text: "#15803d",
      border: "#bbf7d0",
    };
  }
  return {
    label: "Online / Razorpay",
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#bfdbfe",
  };
};

/**
 * Reusable Voucher Component with safe HEX styling for html2canvas-pro
 */
function SuccessVoucherCard({ receipt }) {
  if (!receipt) return null;

  const amountPaid = getReceiptAmount(receipt);
  const paymentTypeLabel = formatPaymentType(receipt);
  const methodBadge = getPaymentMethodBadge(receipt.payment_method, receipt);

  const receiptNo =
    receipt.receipt_number ||
    receipt.receipt_id ||
    (receipt.id ? `REC-${receipt.id}` : "AUR-REC-CONFIRMED");

  const dateStr =
    receipt.payment_date ||
    receipt.created_at ||
    receipt.date ||
    receipt.timestamp ||
    new Date().toISOString();

  const studentName =
    receipt.student_name ||
    receipt.student?.name ||
    receipt.name ||
    "Student";

  const studentPhone =
    receipt.student_phone ||
    receipt.student?.phone ||
    receipt.phone ||
    "";

  const studentEmail =
    receipt.student_email ||
    receipt.student?.email ||
    receipt.email ||
    "";

  const courseTitle =
    receipt.course_title ||
    receipt.course?.title ||
    receipt.course_name ||
    "Selected Course";

  const courseFee =
    receipt.course_fee !== undefined && receipt.course_fee !== null
      ? Number(receipt.course_fee)
      : null;

  const totalCoursePaid =
    receipt.total_paid !== undefined && receipt.total_paid !== null
      ? Number(receipt.total_paid)
      : null;

  const balanceAmount =
    receipt.balance_amount !== undefined && receipt.balance_amount !== null
      ? Number(receipt.balance_amount)
      : receipt.balance !== undefined && receipt.balance !== null
      ? Number(receipt.balance)
      : null;

  const hasCourseFee = courseFee !== null && !isNaN(courseFee) && courseFee > 0;
  const hasTotalPaid = totalCoursePaid !== null && !isNaN(totalCoursePaid);
  const hasBalance = balanceAmount !== null && !isNaN(balanceAmount);

  return (
    <div
      className="p-5 sm:p-7 space-y-5 rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e3ddd0",
        color: "#1c1a17",
      }}
    >
      {/* 1. Brand Header & Receipt Meta */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5"
        style={{ borderBottom: "1px solid #e3ddd0" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold shadow-xs select-none"
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
              background: "#ecfdf5",
              color: "#065f46",
              borderColor: "#a7f3d0",
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payment Verified</span>
          </span>
          <p className="text-xs font-bold font-mono text-slate-900">
            Receipt Number: {receiptNo}
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
          <p className="text-xs font-medium" style={{ color: "#5b5346" }}>
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
              </td>
              <td className="px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums text-sm">
                {formatCurrency(amountPaid)}
              </td>
            </tr>

            {/* Total Cleared Row */}
            <tr
              className="font-extrabold text-sm"
              style={{ background: "#faf8f4", borderTop: "2px solid #e3ddd0" }}
            >
              <td className="px-4 py-3 text-slate-900">Total Cleared (This Receipt)</td>
              <td className="px-4 py-3 text-center text-xs font-bold" style={{ color: "#047857" }}>
                Verified & Received
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

      {/* 4. Course Fee Clearance Breakdown (if fee/balance data available) */}
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
              Course Tuition Fee Ledger
            </span>
            <span className="text-[10px]" style={{ color: "#8a8175" }}>
              Overall Enrollment Balance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            {hasCourseFee && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Total Course Fee
                </p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5 tabular-nums">
                  {formatCurrency(courseFee)}
                </p>
              </div>
            )}
            {hasTotalPaid && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Cumulative Paid
                </p>
                <p className="text-sm font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                  {formatCurrency(totalCoursePaid)}
                </p>
              </div>
            )}
            {hasBalance && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Remaining Due
                </p>
                <p
                  className={`text-sm font-extrabold mt-0.5 tabular-nums ${
                    balanceAmount <= 0 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {balanceAmount <= 0 ? "Fully Paid (Nil)" : formatCurrency(balanceAmount)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Transaction & Gateway Audit Identifiers */}
      {(receipt.razorpay_order_id ||
        receipt.razorpay_payment_id ||
        receipt.transaction_reference ||
        receipt.upi_transaction_id) && (
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

      {/* 6. Footer Note */}
      <div
        className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
        style={{ borderTop: "1px solid #e3ddd0", color: "#8a8175" }}
      >
        <p>Thank you for choosing Aurum FX Academy.</p>
        <p className="font-medium text-slate-700">Official Fee Acknowledgment • Valid without physical signature</p>
      </div>
    </div>
  );
}

/**
 * PaymentSuccessReceiptModal
 * 
 * Pops up immediately after a student purchases a course (full/installment)
 * or when branch admin registers a student or records an installment.
 * 
 * 1. Shows Congratulations message & status banner
 * 2. Displays the full receipt voucher
 * 3. Provides Download Receipt PDF button & Dismiss/View all buttons
 */
export default function PaymentSuccessReceiptModal({
  isOpen,
  onClose,
  receipt,
  receiptUrl = null,
  downloadUrl = null,
  token = null,
  isBranchAdmin = false,
  title = "Congratulations! Your course has been purchased",
  subtitle = "Your enrollment has been confirmed. Below is your official fee payment receipt.",
  onViewReceipt = null,
  onViewAll = null,
}) {
  const [activeReceipt, setActiveReceipt] = useState(receipt || null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const offscreenPrintRef = useRef(null);

  // Sync initial receipt prop
  useEffect(() => {
    if (receipt) {
      setActiveReceipt(receipt);
    }
  }, [receipt]);

  // If receipt is incomplete or receiptUrl is provided, attempt to fetch the full receipt
  useEffect(() => {
    if (!isOpen) return;

    const targetUrl = receiptUrl || receipt?.receipt_url;
    const targetId = receipt?.receipt_id || receipt?.id || receipt?.receipt_number;

    if ((targetUrl || targetId) && token) {
      const fetchFullDetails = async () => {
        try {
          const fetcher = isBranchAdmin ? getBranchAdminReceiptApi : getStudentReceiptApi;
          const fullData = await fetcher(targetUrl || targetId, token);
          if (fullData) {
            setActiveReceipt((prev) => ({
              ...(prev || {}),
              ...fullData,
            }));
          }
        } catch {
          // If fetch fails, keep current receipt object
        }
      };
      fetchFullDetails();
    }
  }, [isOpen, receiptUrl, receipt, token, isBranchAdmin]);

  // Manage full app and sidebar blur whenever modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("payment-receipt-modal-open", "student-modal-open");
    } else {
      document.body.classList.remove("payment-receipt-modal-open", "student-modal-open");
    }
    return () => {
      document.body.classList.remove("payment-receipt-modal-open", "student-modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentReceipt = activeReceipt || receipt || {};

  /**
   * Generates a clean, single-page PDF voucher using html2canvas-pro + jsPDF
   */
  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      const element = offscreenPrintRef.current;
      if (!element) throw new Error("Voucher view element not found.");

      const receiptId =
        currentReceipt.receipt_number ||
        currentReceipt.receipt_id ||
        currentReceipt.id ||
        "REC";
      const studentName = (
        currentReceipt.student_name ||
        currentReceipt.name ||
        "Student"
      ).replace(/[\s\W]+/g, "_");
      const fileName = `AURUM_RECEIPT_${receiptId}_${studentName}.pdf`;

      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }

      const fullHeight = Math.max(element.scrollHeight, element.offsetHeight, 800);
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

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback: If downloadUrl is present, open it
      const targetDl = downloadUrl || currentReceipt.download_url;
      if (targetDl) {
        window.open(targetDl, "_blank");
      } else {
        alert("Unable to generate PDF document. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Fullscreen Backdrop spanning entire viewport over sidebar and all UI */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-3xl max-h-[90vh] my-auto flex flex-col overflow-hidden rounded-3xl bg-[#faf8f4] shadow-2xl border border-[#e3ddd0] animate-in zoom-in-95 duration-200 z-10"
        style={sans}
      >
        {/* Modal Top Header with Celebration */}
        <div
          className="relative px-6 pt-6 pb-7 sm:px-8 sm:pt-7 sm:pb-8 border-b border-[#e3ddd0] overflow-hidden shrink-0"
          style={{
            background: "linear-gradient(135deg, #1f1b13 0%, #2e2619 100%)",
            color: "#ffffff",
          }}
        >
          {/* Subtle gold glow & decorative sparkles */}
          <div
            className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full opacity-20 blur-2xl pointer-events-none"
            style={{ background: "#f4b942" }}
          />
          <div
            className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full opacity-15 blur-xl pointer-events-none"
            style={{ background: "#10b981" }}
          />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
              <div
                className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg ring-4 ring-[#f4b942]/20 mt-1"
                style={{
                  background: "linear-gradient(135deg, #f4b942 0%, #c48b28 100%)",
                  color: "#17140f",
                }}
              >
                <PartyPopper className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#f4b942]/20 text-[#fbd278] border border-[#f4b942]/40 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#f4b942]" />
                  <span>Success & Confirmation</span>
                </div>
                <h2
                  className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug break-words"
                  style={serif}
                >
                  {title}
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed mt-2 max-w-2xl">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-amber-200/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 mt-0.5"
              title="Close receipt popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body showing Full Receipt Voucher */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <OfficialReceiptVoucherCard receipt={currentReceipt} />
        </div>

        {/* Modal Bottom Footer Actions */}
        <div
          className="px-6 py-4 sm:px-8 sm:py-5 border-t border-[#e3ddd0] bg-white flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0"
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-transparent bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Done & Close
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            style={{
              background: downloadSuccess ? "#059669" : "#9c6b2e",
            }}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {downloading
                ? "Generating PDF…"
                : downloadSuccess
                ? "Downloaded Successfully!"
                : "Download Receipt PDF"}
            </span>
          </button>
        </div>

        {/* Offscreen element for high-res PDF generation */}
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "720px",
            background: "#ffffff",
          }}
        >
          <div ref={offscreenPrintRef} style={{ width: "720px", background: "#ffffff", padding: "20px" }}>
            <OfficialReceiptVoucherCard receipt={currentReceipt} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
