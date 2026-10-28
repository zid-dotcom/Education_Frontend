import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  Loader2,
  Receipt,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { getStudentReceiptApi } from "../../services/payments";
import { getBranchAdminReceiptApi } from "../../services/branchadminreceipts";
import OfficialReceiptVoucherCard from "./OfficialReceiptVoucherCard";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif" };

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

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

/* Scoped celebration popup styling matching user reference code */
const POPUP_STYLES = `
:root {
  --ink: #0f172a;
  --muted: #64748b;
  --g1: #10b981;
  --g2: #06b6d4;
  --glow: rgba(16, 185, 129, 0.35);
}

.ps-card-enter {
  animation: psCardRise 0.5s cubic-bezier(0.2, 1.1, 0.3, 1) forwards;
}

@keyframes psCardRise {
  0% {
    transform: translateY(40px) scale(0.9);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}

.ps-card-ambient::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -110px;
  width: 400px;
  height: 270px;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(16, 185, 129, 0.35), transparent);
  pointer-events: none;
}

/* Badge animations */
.ps-badge-box {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 0 auto 20px;
  z-index: 1;
}

.ps-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  opacity: 0;
  animation: psPulse 1.8s ease-out 0.7s infinite;
}

.ps-pulse.p2 {
  animation-delay: 1.3s;
}

.ps-disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  box-shadow: 0 18px 40px -8px rgba(16, 185, 129, 0.35), 0 0 0 9px rgba(16, 185, 129, 0.12);
  transform: scale(0);
  animation: psPop 0.6s cubic-bezier(0.2, 1.4, 0.4, 1) 0.25s forwards;
}

.ps-tick-path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 6.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 52;
  stroke-dashoffset: 52;
  animation: psDraw 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.75s forwards;
}

@keyframes psPop {
  to {
    transform: scale(1);
  }
}

@keyframes psDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes psPulse {
  0% {
    transform: scale(1);
    opacity: 0.35;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}

/* Staggered entrance for texts and buttons */
.ps-stagger {
  opacity: 0;
  transform: translateY(12px);
  animation: psRise 0.55s ease forwards;
}

.ps-stagger-0 {
  animation-delay: 0.75s;
}

.ps-stagger-1 {
  animation-delay: 0.85s;
}

.ps-stagger-2 {
  animation-delay: 0.95s;
}

.ps-stagger-3 {
  animation-delay: 1.05s;
}

@keyframes psRise {
  to {
    opacity: 1;
    transform: none;
  }
}
`;

/**
 * Single-Burst Canvas Confetti
 * Fires once at initial popup open and clears automatically when particles fade out.
 */
function SingleBurstConfetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = null;
    let particles = [];
    const colors = ["#10b981", "#06b6d4", "#6366f1", "#f59e0b", "#f43f5e", "#ffffff"];

    function sizeCanvas() {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }

    function burst() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      sizeCanvas();
      const cx = canvas.clientWidth / 2;
      const cy = 100;
      particles = Array.from({ length: 80 }, () => {
        const a = Math.random() * Math.PI * 2;
        const s = 4 + Math.random() * 7;
        return {
          x: cx,
          y: cy,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 3,
          w: 5 + Math.random() * 6,
          h: 3 + Math.random() * 4,
          r: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          c: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
        };
      });

      cancelAnimationFrame(raf);
      function tick() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        particles.forEach((p) => {
          p.vy += 0.22;
          p.vx *= 0.985;
          p.x += p.vx;
          p.y += p.vy;
          p.r += p.vr;
          p.life -= 0.011;
          if (p.life <= 0) return;
          ctx.save();
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });
        particles = particles.filter((p) => p.life > 0);
        if (particles.length > 0) {
          raf = requestAnimationFrame(tick);
        } else {
          ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        }
      }
      tick();
    }

    const timer = setTimeout(burst, 750);

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      style={{ pointerEvents: "none" }}
    />
  );
}

/**
 * PaymentSuccessReceiptModal
 * 
 * Stage 1: Animated Pop-up exactly matching user's reference code:
 *          - Concentric pulsing glow with disc pop & drawn SVG checkmark
 *          - Initial single-burst canvas confetti shower (only shows once on entry, never loops)
 *          - Differentiated messaging:
 *              • Student: "Congratulations, {Name}!" + "Thank you for your payment"
 *              • Branch Admin: "Payment Recorded Successfully!" + "Thanks! {Name}'s payment completed successfully"
 *          - Two action options: "View Receipt" (opens official receipt modal) and "Download Receipt" (PDF)
 * Stage 2: Authentic Official Receipt Voucher View with complete ledger details,
 *          inspection, print, and PDF generation.
 */
export default function PaymentSuccessReceiptModal({
  isOpen,
  onClose,
  receipt,
  receiptUrl = null,
  downloadUrl = null,
  token = null,
  isBranchAdmin = false,
  title = "Congratulations! Your course payment has been received",
  subtitle = "Your installment payment has been cleared and verified. Below is your official receipt.",
  onViewReceipt = null,
  onViewAll = null,
}) {
  const [currentStep, setCurrentStep] = useState("celebration"); // "celebration" | "receipt"
  const [activeReceipt, setActiveReceipt] = useState(receipt || null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const offscreenPrintRef = useRef(null);

  // When modal opens, always start at celebration step
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("celebration");
      setDownloadSuccess(false);
    }
  }, [isOpen]);

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
  const amountPaid = getReceiptAmount(currentReceipt);
  const courseTitle =
    currentReceipt.course_title ||
    currentReceipt.course?.title ||
    currentReceipt.course_name ||
    currentReceipt.description ||
    "Enrolled Course";

  // Check user role from localStorage if available
  const isAdminRole = isBranchAdmin || (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.role === "branch_admin" || u?.role === "admin" || u?.role === "super_admin";
    } catch {
      return false;
    }
  })();

  // Extract student name
  const rawStudentName =
    currentReceipt.student_name ||
    currentReceipt.student?.name ||
    currentReceipt.student?.full_name ||
    currentReceipt.student_full_name ||
    currentReceipt.full_name ||
    currentReceipt.name ||
    "";

  let resolvedStudentName = rawStudentName;
  if (!resolvedStudentName && !isAdminRole) {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.name) {
          resolvedStudentName = u.name;
        }
      }
    } catch {}
  }

  const getFirstName = (fullName) => {
    if (!fullName) return "";
    const cleaned = String(fullName).trim();
    if (!cleaned) return "";
    const parts = cleaned.split(/\s+/);
    const first = parts[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  const getPossessiveName = (fullName) => {
    if (!fullName) return "student";
    const cleaned = String(fullName).trim();
    const parts = cleaned.split(/\s+/);
    const first = parts[0];
    const cap = first.charAt(0).toUpperCase() + first.slice(1);
    return cap.endsWith("s") ? `${cap}'` : `${cap}'s`;
  };

  const studentFirstName = getFirstName(resolvedStudentName);
  const studentPossessive = getPossessiveName(resolvedStudentName);

  // Differentiate messaging for Branch Admin vs Student
  let popupTitle = "Congratulations!";
  let popupThanks = "Thank you for your payment";
  let popupMessage =
    "Your payment was successful. We truly appreciate your trust. Your receipt is ready — click below to view or download your official receipt.";

  if (isAdminRole) {
    // When branch admin records fee
    popupTitle = "Payment Recorded Successfully!";
    popupThanks = studentFirstName
      ? `Thanks! ${studentPossessive} payment completed successfully`
      : "Thanks! Payment completed successfully";
    popupMessage = studentFirstName
      ? `The installment payment for ${studentFirstName} has been recorded into the branch ledger. Below is the official receipt.`
      : "The fee payment has been recorded into the branch ledger. Below is the official receipt.";
  } else {
    // When student pays
    popupTitle = studentFirstName
      ? `Congratulations, ${studentFirstName}!`
      : "Congratulations!";
    popupThanks = "Thank you for your payment";
    popupMessage =
      "Your payment was successful. We truly appreciate your trust. Your receipt is ready — click below to view or download your official receipt.";
  }

  const receiptNo =
    currentReceipt.receipt_number ||
    currentReceipt.receipt_id ||
    (currentReceipt.id ? `REC-${currentReceipt.id}` : "AUR-REC-CONFIRMED");

  const dateStr = formatDateTime(
    currentReceipt.payment_date ||
      currentReceipt.created_at ||
      currentReceipt.date ||
      new Date().toISOString()
  );

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
      const cleanStudent = (resolvedStudentName || "Student").replace(/[\s\W]+/g, "_");
      const fileName = `AURUM_RECEIPT_${receiptId}_${cleanStudent}.pdf`;

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
        posX = (pageWidth - finalWidth) / 2;
      }

      pdf.addImage(imgData, "PNG", posX, posY, finalWidth, finalHeight);
      pdf.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
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
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <style>{POPUP_STYLES}</style>

      {/* Fullscreen Backdrop */}
      <div
        className="fixed inset-0 bg-[#080f21]/60 backdrop-blur-[10px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* ─────────────────────────────────────────────────────────────
          STAGE 1: ANIMATED POP-UP (EXACT MATCH TO REFERENCE CODE)
         ───────────────────────────────────────────────────────────── */}
      {currentStep === "celebration" && (
        <div
          className="ps-card-enter ps-card-ambient relative w-full max-w-[400px] my-auto rounded-[28px] bg-white shadow-[0_40px_80px_-20px_rgba(2,8,23,0.55)] overflow-hidden z-10 text-center px-7 py-9 sm:px-8 sm:py-10"
          style={sans}
        >
          {/* Initial Single-Burst Confetti Canvas (Shower occurs once on open, then disappears) */}
          <SingleBurstConfetti />

          {/* Close Button matching reference code */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200 flex items-center justify-center cursor-pointer hover:rotate-90"
            title="Close popup"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Badge matching reference code */}
          <div className="ps-badge-box">
            <span className="ps-pulse"></span>
            <span className="ps-pulse p2"></span>
            <div className="ps-disc"></div>
            <svg viewBox="0 0 112 112" className="absolute inset-0 w-full h-full">
              <path className="ps-tick-path" d="M34 58l16 16 30-33" />
            </svg>
          </div>

          {/* Title with staggered entrance */}
          <h2 className="ps-stagger ps-stagger-0 text-2xl sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-snug">
            {popupTitle}
          </h2>

          {/* Subheading with gradient text matching reference code */}
          <p
            className="ps-stagger ps-stagger-1 text-base sm:text-[17px] font-bold mt-2"
            style={{
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {popupThanks}
          </p>

          {/* Description text */}
          <p className="ps-stagger ps-stagger-2 text-xs sm:text-[13.5px] text-[#64748b] leading-relaxed mt-2.5 max-w-[300px] mx-auto">
            {popupMessage}
          </p>

          {/* Amount Summary Tag */}
          {amountPaid > 0 && (
            <div className="ps-stagger ps-stagger-2 mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{formatCurrency(amountPaid)} Paid</span>
              {courseTitle && (
                <>
                  <span className="text-emerald-300">•</span>
                  <span className="text-emerald-700 font-medium truncate max-w-[130px]">
                    {courseTitle}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="ps-stagger ps-stagger-3 mt-6 space-y-2.5">
            {/* Primary Action: View Receipt (opens receipt modal) */}
            <button
              type="button"
              onClick={() => setCurrentStep("receipt")}
              className="w-full py-3.5 px-6 rounded-[14px] text-sm sm:text-base font-bold text-white shadow-[0_12px_24px_-8px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_30px_-8px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
              }}
            >
              <Eye className="w-4 h-4" />
              <span>View Receipt</span>
            </button>

            {/* Secondary Action: Download Receipt */}
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="w-full py-3 px-5 rounded-[14px] border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              ) : downloadSuccess ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-teal-600" />
              )}
              <span>
                {downloading
                  ? "Generating PDF…"
                  : downloadSuccess
                  ? "Saved to Downloads!"
                  : "Download Receipt"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 2: AUTHENTIC OFFICIAL RECEIPT VOUCHER VIEW
         ───────────────────────────────────────────────────────────── */}
      {currentStep === "receipt" && (
        <div
          className="relative w-full max-w-3xl max-h-[92vh] my-auto flex flex-col overflow-hidden rounded-3xl bg-[#faf8f4] shadow-2xl border border-[#e3ddd0] animate-in zoom-in-95 duration-200 z-10"
          style={sans}
        >
          {/* Authentic Document Viewer Header */}
          <div
            className="px-5 py-4 sm:px-7 sm:py-4.5 border-b border-[#e3ddd0] bg-white flex items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setCurrentStep("celebration")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e3ddd0] bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-slate-600 transition cursor-pointer shrink-0"
                title="Back to confirmation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-[#9c6b2e]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate"
                    style={serif}
                  >
                    Official Fee Receipt
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Ref #{receiptNo} • Issued on {dateStr}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close receipt popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Clean Receipt Body - Official Voucher */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <OfficialReceiptVoucherCard receipt={currentReceipt} />
          </div>

          {/* Document Viewer Footer Actions */}
          <div
            className="px-5 py-3.5 sm:px-7 sm:py-4 border-t border-[#e3ddd0] bg-white flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0"
          >
            <button
              type="button"
              onClick={() => setCurrentStep("celebration")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#e3ddd0] bg-stone-50 text-xs font-bold text-slate-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Confirmation</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl border border-transparent bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Done & Close
              </button>

              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
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
          </div>
        </div>
      )}

      {/* Hidden offscreen element for high-res PDF generation */}
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
    </div>,
    document.body
  );
}
