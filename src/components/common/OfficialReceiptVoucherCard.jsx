import React from "react";
import { CheckCircle2 } from "lucide-react";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

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

    const totalInst =
      receipt.installment_count ??
      receipt.total_installments ??
      receipt.total_terms;

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

  const totalInst =
    receipt.total_installments ||
    receipt.installment_count ||
    receipt.total_terms;

  if (instNo) {
    return totalInst
      ? `Installment ${instNo} of ${totalInst}`
      : `Installment #${instNo}`;
  }

  const pType = String(
    receipt.payment_type || receipt.payment_plan || receipt.plan || ""
  ).toLowerCase();
  if (pType.includes("installment")) return "Installment Fee Payment";
  if (pType.includes("full")) return "Full Course Fee Payment";

  return "Course Tuition Fee";
};

const getPaymentMethodBadge = (method, receipt = {}) => {
  const m = String(method || receipt.payment_mode || "").toLowerCase();
  if (m === "cash") {
    return {
      label: "Cash Payment",
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
    };
  }
  if (m === "upi") {
    return {
      label: "UPI Payment",
      bg: "#ecfdf5",
      text: "#065f46",
      border: "#a7f3d0",
    };
  }
  if (m === "split" || (receipt.cash_amount > 0 && receipt.upi_amount > 0)) {
    return {
      label: "Split (Cash + UPI)",
      bg: "#f5f3ff",
      text: "#5b21b6",
      border: "#ddd6fe",
    };
  }
  if (m.includes("razorpay") || m.includes("online")) {
    return {
      label: "Online / Razorpay",
      bg: "#eff6ff",
      text: "#1e40af",
      border: "#bfdbfe",
    };
  }
  return {
    label: m ? m.toUpperCase() : "Online / Razorpay",
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#bfdbfe",
  };
};

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
  return res.trim() + " Rupees Only";
};

/**
 * Unified Official Receipt Voucher Card Component
 * Used across:
 * 1. Student Portal (Payment Confirmation Modal & Receipts Page)
 * 2. Branch Admin Portal (Record Payment Modal, Student Registration Modal & Receipts Page)
 * 3. Super Admin Portal (Receipts Page)
 */
export default function OfficialReceiptVoucherCard({ receipt, user }) {
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

  const branchName =
    receipt.branch_name ||
    receipt.branch?.name ||
    receipt.branch ||
    user?.branch_name ||
    "";

  const signatoryName = receipt.authorized_by || user?.name || "";

  const courseFee =
    receipt.course_fee !== undefined && receipt.course_fee !== null
      ? Number(receipt.course_fee)
      : receipt.total_fee !== undefined && receipt.total_fee !== null
      ? Number(receipt.total_fee)
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
      id="receipt-voucher-card"
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
              {branchName ? ` • ${branchName}` : ""}
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
        {amountPaid > 0 && (
          <div
            className="px-4 py-2 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
            style={{ color: "#7a531f", background: "#fdfbf7", borderTop: "1px dashed #e3ddd0" }}
          >
            <span className="font-bold text-[#8a8175] text-[10px] uppercase tracking-wider">
              Amount in Words:
            </span>
            <span className="font-semibold italic text-slate-800">{amountInWords(amountPaid)}</span>
          </div>
        )}
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
        receipt.payment_reference ||
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
            {(receipt.transaction_reference || receipt.payment_reference) && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e8e2d5" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8a8175" }}>
                  Transaction Ref:
                </span>
                <code className="font-mono text-xs font-bold select-all break-all text-slate-900">
                  {receipt.transaction_reference || receipt.payment_reference}
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
        className="pt-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-[11px]"
        style={{ borderTop: "1px solid #e3ddd0", color: "#8a8175" }}
      >
        <div className="space-y-0.5">
          <p>Thank you for choosing Aurum FX Academy.</p>
          <p className="font-medium text-slate-700">Official Fee Acknowledgment • Valid without physical signature when verified online</p>
        </div>
        {signatoryName && (
          <div className="sm:text-right space-y-0.5">
            <p className="font-bold text-slate-900 text-xs">{signatoryName}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#9c6b2e] font-semibold">Authorized Signatory</p>
          </div>
        )}
      </div>
    </div>
  );
}
