import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Clock3,
  CreditCard,
  History,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  User,
  X,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  MapPin,
  IndianRupee,
  Wallet,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Menu,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  approveBranchAdminPurchaseApi,
  getBranchAdminApprovedPurchasesApi,
  getBranchAdminPendingPurchasesApi,
  getBranchAdminPurchasesApi,
  getBranchAdminRejectedPurchasesApi,
  rejectBranchAdminPurchaseApi,
} from "../services/branchadminpurchases";
import { getEnrollmentInstallmentsApi } from "../services/enrollments";

/* Same display-font pairing used on the staff + attendance pages
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
.ba-tab-line { transform: scaleX(0); transform-origin: left; transition: transform .35s cubic-bezier(.2,.7,.2,1); }
.ba-tab-line[data-active="true"] { transform: scaleX(1); }
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-toast, .ba-skeleton { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-press, .ba-tab-line { transition: none !important; }
  .ba-card:hover { transform: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const STATUS_META = {
  approved: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea", label: "Approved" },
  "partially approved": { dot: "#4b6b8a", text: "#334c66", bg: "#e6f0f9", label: "Partially Approved" },
  "super admin approved": { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea", label: "Super Admin Approved" },
  "branch admin approved": { dot: "#4b6b8a", text: "#334c66", bg: "#e6f0f9", label: "Branch Admin Approved" },
  "branch admin rejected": { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5", label: "Branch Admin Rejected" },
  "super admin rejected": { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5", label: "Super Admin Rejected" },
  pending: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0", label: "Pending" },
  rejected: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5", label: "Rejected" },
};
const statusMeta = (status) => {
  const key = String(status || "").toLowerCase();
  if (STATUS_META[key]) return STATUS_META[key];
  return {
    dot: "#a39a8c",
    text: "#8a8175",
    bg: "#f1ede4",
    label: status ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown",
  };
};

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "Date unavailable";

const formatAmount = (amount) =>
  amount == null
    ? "Amount unavailable"
    : `₹${Number(amount).toLocaleString("en-IN")}`;

const StatusPill = ({ status }) => {
  const meta = statusMeta(status);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Circle className="h-2 w-2" fill={meta.dot} stroke="none" />
      {meta.label}
    </span>
  );
};

const Detail = ({ label, value, mono }) => (
  <div className="min-w-0">
    <dt className="text-xs" style={{ color: "#a39a8c" }}>
      {label}
    </dt>
    <dd
      className={`mt-1 break-words text-sm font-medium ${mono ? "tabular-nums" : ""}`}
      style={{ color: "#17140f" }}
    >
      {value || "Not provided"}
    </dd>
  </div>
);

const DetailItem = Detail;
const formatCurrency = formatAmount;

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

const PurchaseCard = ({ purchase, pending, approvingId, onApprove, onReject, index, onSelectPurchase }) => {
  const isApproving = approvingId === purchase.enrollment_id;
  const initial = purchase.name?.charAt(0).toUpperCase() || "S";
  const rejectionReason = purchase.branch_rejection_reason || purchase.super_admin_rejection_reason || purchase.rejection_reason || purchase.reason;
  const isBranchRejected = purchase.rejection_stage === "branch_admin" || purchase.branch_approval_status === "rejected" || Boolean(purchase.branch_rejection_reason);
  const isSuperAdminRejected = purchase.rejection_stage === "super_admin" || purchase.super_admin_approval_status === "rejected" || Boolean(purchase.super_admin_rejection_reason);

  return (
    <article
      className="ba-card ba-rise overflow-hidden rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e3ddd0",
        animationDelay: `${Math.min(index, 8) * 60}ms`,
      }}
    >
      {/* Top: course + action */}
      <div
        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"
        style={{ borderBottom: "1px solid #efe9dd" }}
      >
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="mt-1 hidden h-12 w-1 shrink-0 rounded-full sm:block"
            style={{ background: "#9c6b2e" }}
          />
          <div className="min-w-0">
            <p className="text-xs" style={{ color: "#a39a8c" }}>
              Enrollment #{purchase.enrollment_id}
            </p>
            <h3
              className="mt-1 break-words text-lg leading-snug sm:text-xl"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              {purchase.course_title || "Course unavailable"}
            </h3>
            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
              {purchase.course_duration || "Duration unavailable"}
            </p>
          </div>
        </div>

        {pending ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onReject?.(purchase)}
              disabled={isApproving}
              className={`ba-press flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-60 ${FOCUS_RING}`}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(purchase.enrollment_id)}
              disabled={isApproving}
              className={`ba-press flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-60 ${FOCUS_RING}`}
              style={{ background: "#17140f" }}
            >
              {isApproving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#f4b942" }} />
              )}
              {isApproving ? "Approving…" : "Approve purchase"}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill 
              status={
                isBranchRejected
                  ? "branch admin rejected"
                  : isSuperAdminRejected
                  ? "super admin rejected"
                  : String(purchase.super_admin_approval_status).toLowerCase() === "approved" 
                  ? "super admin approved" 
                  : (String(purchase.course_status).toLowerCase() === "approved" || String(purchase.course_status).toLowerCase() === "partially approved" 
                    ? "branch admin approved" 
                    : purchase.course_status)
              } 
            />
          </div>
        )}
      </div>

      {rejectionReason && (
        <div className="px-5 py-2.5 sm:px-6 bg-rose-50/70 border-b border-rose-100 flex items-start gap-2 text-xs text-rose-800">
          <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {isBranchRejected ? "Branch Admin Rejection Reason:" : "Rejection Reason:"}
            </span>{" "}
            <span>{rejectionReason}</span>
          </div>
        </div>
      )}

      <div className="px-5 py-3 sm:px-6 bg-white border-b border-[#efe9dd] flex justify-end">
        <button
          onClick={() => onSelectPurchase(purchase)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-sm"
        >
          View Details
        </button>
      </div>

      {/* Student strip */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-6"
        style={{ background: "#faf8f4", borderBottom: "1px solid #efe9dd" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium"
            style={{ background: "#f1ede4", color: "#7a531f" }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: "#17140f" }}>
              {purchase.name || "Student"}
            </p>
            <p className="text-xs" style={{ color: "#a39a8c" }}>
              Student
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#5b5346" }}>
          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
          <span className="break-all">{purchase.email || "Not provided"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#5b5346" }}>
          <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
          <span>{purchase.phone || "Not provided"}</span>
        </div>
      </div>

      {/* Payment details */}
      <dl className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <Detail label="Amount" value={formatAmount(purchase.amount)} mono />
        <Detail label="Payment status" value={purchase.payment_status} />
        <Detail label="Purchased on" value={formatDate(purchase.created_at)} />
        <Detail label="Payment ID" value={purchase.razorpay_payment_id} mono />
      </dl>
    </article>
  );
};

const EmptyState = ({ tab }) => (
  <div
    className="ba-fade rounded-2xl px-6 py-16 text-center"
    style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
  >
    <CreditCard className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
    <h3
      className="mt-3 text-lg"
      style={{ ...serif, fontWeight: 500, color: "#17140f" }}
    >
      No {tab.toLowerCase()} purchases
    </h3>
    <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
      Purchases in this view will appear here.
    </p>
  </div>
);

const SkeletonList = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading purchases">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl p-6"
        style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
      >
        <div className="ba-skeleton h-3 w-24 rounded" />
        <div className="ba-skeleton mt-3 h-6 w-2/3 rounded" />
        <div className="ba-skeleton mt-2 h-3 w-32 rounded" />
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

export default function BranchAdminPurchases() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const normalizeArray = (res, keys = ["purchases", "enrollments", "pending", "approved", "rejected", "items", "data"]) => {
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object") {
      for (const k of keys) {
        if (Array.isArray(res[k])) return res[k];
      }
    }
    return [];
  };

  const loadPurchases = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [pendingRes, approvedRes, rejectedRes, historyRes] = await Promise.allSettled([
        getBranchAdminPendingPurchasesApi(token),
        getBranchAdminApprovedPurchasesApi(token),
        getBranchAdminRejectedPurchasesApi(token),
        getBranchAdminPurchasesApi(token),
      ]);

      const historyData = historyRes.status === "fulfilled" ? normalizeArray(historyRes.value) : [];
      let pendingData = pendingRes.status === "fulfilled" ? normalizeArray(pendingRes.value) : [];
      let approvedData = approvedRes.status === "fulfilled" ? normalizeArray(approvedRes.value) : [];
      let rejectedData = rejectedRes.status === "fulfilled" ? normalizeArray(rejectedRes.value) : [];

      // Fallback derivation from history if dedicated endpoints return empty or are unfulfilled
      if (historyData.length > 0) {
        if (pendingData.length === 0) {
          pendingData = historyData.filter((p) => {
            const cs = String(p.course_status || "").toLowerCase();
            const sa = String(p.super_admin_approval_status || "").toLowerCase();
            const ba = String(p.branch_approval_status || "").toLowerCase();
            return cs === "pending" || cs === "applied" || ba === "pending" || (!cs && sa === "pending");
          });
        }
        if (approvedData.length === 0) {
          approvedData = historyData.filter((p) => {
            const cs = String(p.course_status || "").toLowerCase();
            const sa = String(p.super_admin_approval_status || "").toLowerCase();
            const ba = String(p.branch_approval_status || "").toLowerCase();
            return cs === "approved" || cs === "partially approved" || ba === "approved" || sa === "approved";
          });
        }
        if (rejectedData.length === 0) {
          rejectedData = historyData.filter((p) => {
            const cs = String(p.course_status || "").toLowerCase();
            const sa = String(p.super_admin_approval_status || "").toLowerCase();
            const ba = String(p.branch_approval_status || "").toLowerCase();
            return cs === "rejected" || ba === "rejected" || sa === "rejected";
          });
        }
      }

      setHistory(historyData);
      setPending(pendingData);
      setApproved(approvedData);
      setRejected(rejectedData);

      // Only flag error if all 4 failed
      const allFailed = [pendingRes, approvedRes, rejectedRes, historyRes].every(
        (r) => r.status === "rejected"
      );
      if (allFailed) {
        const firstErr = historyRes.reason || pendingRes.reason;
        const msg = firstErr?.message || "Failed to load purchases.";
        setError(
          msg.includes("Failed to fetch") || msg.includes("NetworkError")
            ? "Server is currently waking up or reconnecting. Please click Retry."
            : msg
        );
      }
    } catch (err) {
      console.error("Error loading purchases:", err);
      setError(
        err.message?.includes("Failed to fetch")
          ? "Server is currently waking up or reconnecting. Please click Retry."
          : err.message || "Failed to load purchases."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Auto-retry once after 3 seconds if initial load failed due to cold start
  const hasAutoRetriedRef = React.useRef(false);
  useEffect(() => {
    if (error && !hasAutoRetriedRef.current && (error.includes("waking up") || error.includes("Failed to fetch"))) {
      hasAutoRetriedRef.current = true;
      const timer = setTimeout(() => {
        loadPurchases();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, loadPurchases]);

  // Auto-dismiss the success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!selectedPurchase) return;
    const enrId = selectedPurchase.enrollment_id ?? selectedPurchase.id;
    if (!enrId || !token) return;
    if (!selectedPurchase.installments || selectedPurchase.installments.length === 0) {
      getEnrollmentInstallmentsApi(enrId, token)
        .then((data) => {
          if (!data) return;
          const fetchedInstallments = Array.isArray(data)
            ? data
            : data.installments || data.schedule || [];
          setSelectedPurchase((prev) =>
            prev && String(prev.enrollment_id ?? prev.id) === String(enrId)
              ? {
                  ...prev,
                  ...(typeof data === "object" && !Array.isArray(data) ? data : {}),
                  installments: fetchedInstallments.length > 0 ? fetchedInstallments : prev.installments,
                  payments: data.payments || prev.payments || [],
                  installment_payments: data.installment_payments || prev.installment_payments || [],
                  payment_history: data.payment_history || prev.payment_history || [],
                  razorpay_order_id: data.razorpay_order_id || prev.razorpay_order_id || "",
                  razorpay_payment_id: data.razorpay_payment_id || prev.razorpay_payment_id || "",
                }
              : prev
          );
        })
        .catch((err) => {
          console.warn("Could not load detailed installments for purchase:", err);
        });
    }
  }, [selectedPurchase?.enrollment_id, selectedPurchase?.id, token]);

  const allPurchasePayments = useMemo(() => {
    if (!selectedPurchase) return [];
    const list = [
      ...(Array.isArray(selectedPurchase.installment_payments) ? selectedPurchase.installment_payments : []),
      ...(Array.isArray(selectedPurchase.payments) ? selectedPurchase.payments : []),
      ...(Array.isArray(selectedPurchase.payment_history) ? selectedPurchase.payment_history : []),
      ...(Array.isArray(selectedPurchase.recent_payments) ? selectedPurchase.recent_payments : []),
      ...(Array.isArray(selectedPurchase.history) ? selectedPurchase.history : []),
      ...(Array.isArray(selectedPurchase.transactions) ? selectedPurchase.transactions : []),
      ...(Array.isArray(selectedPurchase.records) ? selectedPurchase.records : []),
      ...(Array.isArray(selectedPurchase.all_payments) ? selectedPurchase.all_payments : []),
    ];
    const seen = new Set();
    return list.filter((p) => {
      const idKey = p.payment_id ?? p.id ?? (p.receipt_number ? `rcpt-${p.receipt_number}` : null);
      if (!idKey) return true;
      if (seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [selectedPurchase]);

  const enrichedInstallments = useMemo(() => {
    if (!selectedPurchase) return [];

    const rawBase = Array.isArray(selectedPurchase.installments)
      ? selectedPurchase.installments
      : Array.isArray(selectedPurchase.due_installments)
      ? selectedPurchase.due_installments
      : Array.isArray(selectedPurchase.installment_schedule)
      ? selectedPurchase.installment_schedule
      : Array.isArray(selectedPurchase.schedule)
      ? selectedPurchase.schedule
      : [];

    const allPayments = allPurchasePayments;

    return rawBase.map((inst, idx) => {
      const instNum = Number(inst.installment_number ?? (idx + 1));
      const instId = inst.installment_id ?? inst.id;
      const totalInstAmount = Number(inst.amount ?? 0);
      const backendStatus = String(inst.status || "").toLowerCase().trim();
      const isInstBackendPaid = backendStatus === "paid";
      const isInstBackendPartial = backendStatus === "partial";

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
        if (
          instNum === 1 &&
          (
            (selectedPurchase.razorpay_payment_id && (p.payment_reference === selectedPurchase.razorpay_payment_id || p.razorpay_payment_id === selectedPurchase.razorpay_payment_id)) ||
            (String(p.payment_method).toLowerCase() === "razorpay" && (p.installment_number === undefined || p.installment_number === null))
          )
        ) {
          return true;
        }
        return false;
      });

      matchingPayments.sort((a, b) => {
        const timeA = new Date(a.reviewed_at || a.payment_date || a.created_at || 0).getTime();
        const timeB = new Date(b.reviewed_at || b.payment_date || b.created_at || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.payment_id || b.id || 0) - Number(a.payment_id || a.id || 0);
      });

      const match = matchingPayments[0];

      const rawMethod = String(
        match?.payment_method ||
        inst.payment_method ||
        (isInstBackendPaid && instNum === 1 && (selectedPurchase.razorpay_payment_id || selectedPurchase.razorpay_order_id) ? "razorpay" : "") ||
        ""
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
        rawMethod === "cash_upi" ||
        rawMethod === "split" ||
        (rawCashAmount !== null && rawUpiAmount !== null && rawCashAmount > 0 && rawUpiAmount > 0);

      const isUpi = !isSplit && (rawMethod === "upi" || (rawUpiAmount !== null && rawUpiAmount > 0 && (!rawCashAmount || rawCashAmount === 0)));
      const isCash = !isSplit && !isUpi && (rawMethod === "cash" || (rawCashAmount !== null && rawCashAmount > 0 && (!rawUpiAmount || rawUpiAmount === 0)));
      const isRazorpay =
        rawMethod === "razorpay" ||
        rawMethod === "online" ||
        Boolean(
          match?.razorpay_payment_id ||
          inst.razorpay_payment_id ||
          (instNum === 1 && (selectedPurchase.razorpay_payment_id || selectedPurchase.razorpay_order_id)) ||
          (match?.payment_reference && String(match.payment_reference).startsWith("pay_"))
        );

      let paymentMethodDisplay = "Pending";
      if (isSplit) {
        paymentMethodDisplay = "Cash + UPI";
      } else if (isUpi) {
        paymentMethodDisplay = "UPI";
      } else if (isCash) {
        paymentMethodDisplay = "Cash";
      } else if (isRazorpay) {
        paymentMethodDisplay = "Razorpay";
      } else if (rawMethod) {
        if (rawMethod === "cash_upi") paymentMethodDisplay = "Cash + UPI";
        else paymentMethodDisplay = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);
      } else if (isInstBackendPaid || (match && (match.status === "received" || match.status === "paid"))) {
        paymentMethodDisplay = "Verified";
      }

      const upiTxnId =
        match?.upi_transaction_id ||
        inst.upi_transaction_id ||
        match?.transaction_id ||
        inst.transaction_id ||
        "";

      const paymentRef =
        match?.payment_reference ||
        inst.payment_reference ||
        match?.reference ||
        inst.reference ||
        "";

      const rzpPaymentId =
        match?.razorpay_payment_id ||
        inst.razorpay_payment_id ||
        (isRazorpay ? (paymentRef || (instNum === 1 ? selectedPurchase.razorpay_payment_id : "")) : "");

      const rzpOrderId =
        match?.razorpay_order_id ||
        inst.razorpay_order_id ||
        (isRazorpay && instNum === 1 ? selectedPurchase.razorpay_order_id : "");

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
        amount: totalInstAmount,
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
  }, [selectedPurchase, allPurchasePayments]);

  const branchRejected = useMemo(() => {
    return rejected.filter((p) => {
      const stage = String(p.rejection_stage || "").toLowerCase();
      const baStatus = String(p.branch_approval_status || "").toLowerCase();
      const saStatus = String(p.super_admin_approval_status || "").toLowerCase();
      return (
        stage === "branch_admin" ||
        stage === "branch" ||
        baStatus === "rejected" ||
        Boolean(p.branch_rejection_reason) ||
        (!stage && saStatus !== "rejected" && !p.super_admin_rejection_reason)
      );
    });
  }, [rejected]);

  const superAdminRejected = useMemo(() => {
    return rejected.filter((p) => {
      const stage = String(p.rejection_stage || "").toLowerCase();
      const saStatus = String(p.super_admin_approval_status || "").toLowerCase();
      return (
        stage === "super_admin" ||
        stage === "superadmin" ||
        saStatus === "rejected" ||
        Boolean(p.super_admin_rejection_reason)
      );
    });
  }, [rejected]);

  const approvePurchase = async (enrollmentId) => {
    setApprovingId(enrollmentId);
    setError("");
    setSuccess("");
    try {
      await approveBranchAdminPurchaseApi(enrollmentId, token);
      await loadPurchases();
      setSuccess(`Enrollment #${enrollmentId} approved.`);
    } catch (err) {
      setError(err.message || "Failed to approve purchase.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (enrollmentId, reason) => {
    if (!reason || !reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setIsRejecting(true);
    setError("");
    setSuccess("");
    try {
      await rejectBranchAdminPurchaseApi(enrollmentId, reason.trim(), token);
      setSuccess(`Enrollment #${enrollmentId} rejected.`);
      setRejectingPurchaseId(null);
      setRejectReason("");
      setSelectedPurchase(null);
      await loadPurchases();
    } catch (err) {
      setError(err.message || "Failed to reject purchase.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleStartReject = (purchase) => {
    setSelectedPurchase(purchase);
    setRejectingPurchaseId(purchase.enrollment_id ?? purchase.id);
    setRejectReason("");
  };

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock3, items: pending },
    { id: "approved", label: "Approved", icon: CheckCircle2, items: approved },
    { id: "branch_rejected", label: "Branch admin rejected", icon: XCircle, items: branchRejected },
    { id: "super_admin_rejected", label: "Super admin rejected", icon: X, items: superAdminRejected },
    { id: "history", label: "Purchase history", icon: History, items: history },
  ];
  const currentTab =
    tabs.find((tab) => tab.id === activeTab) ||
    (activeTab === "rejected" ? tabs.find((t) => t.id === "branch_rejected") : null) ||
    tabs[0];

  const branchAdminApprovedCount = Math.max(
    approved.length,
    history.filter((p) => {
      const cs = String(p.course_status || "").toLowerCase();
      const ba = String(p.branch_approval_status || "").toLowerCase();
      const sa = String(p.super_admin_approval_status || "").toLowerCase();
      return (
        ba === "approved" ||
        ba === "partially approved" ||
        cs === "approved" ||
        cs === "partially approved" ||
        cs === "super admin approved" ||
        sa === "approved"
      );
    }).length
  );
  const superAdminApprovedCount = history.filter((p) => {
    const sa = String(p.super_admin_approval_status || "").toLowerCase();
    const cs = String(p.course_status || "").toLowerCase();
    return sa === "approved" || cs === "super admin approved";
  }).length;

  const summary = [
    { label: "Awaiting approval", value: pending.length, color: "#b0803a" },
    { label: "Branch admin approvals", value: branchAdminApprovedCount, color: "#4b6b8a" },
    { label: "Super admin approvals", value: superAdminApprovedCount, color: "#5c7a5a" },
    { label: "All purchases", value: history.length, color: "#17140f" },
  ];

  return (
    <div
      className="branch-purchases-page min-h-screen md:flex"
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
        activePage="purchases"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header
          className="sticky top-0 z-20 flex min-h-[68px] sm:h-[92px] items-center justify-between gap-2 border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-3.5 sm:px-6 lg:px-10 backdrop-blur-md sm:px-10 shrink-0"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
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
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                Course Approvals
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadPurchases}
              disabled={loading}
              className={`ba-press flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${FOCUS_RING}`}
              style={{ border: "1px solid #e3ddd0", color: "#5b5346", background: "#ffffff" }}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                style={{ color: "#9c6b2e" }}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-2.5">
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
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-10">
          <p className="mb-6 max-w-2xl text-[0.8rem] rounded-xl px-3.5 py-2.5" style={{ background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030" }}>
            <strong style={{ color: "#9b2c2c" }}>Note:</strong> Branch Admin Approved means the purchase has been approved by the Branch Admin. For the main access, Super Admin approvals are also needed.
          </p>
          {error && (
            <div
              role="alert"
              className="ba-toast mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#a24a3a]" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadPurchases}
                disabled={loading}
                className="ba-press shrink-0 rounded-lg bg-[#7c3324] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5f251a] disabled:opacity-50"
              >
                {loading ? "Reconnecting..." : "Retry Connection"}
              </button>
            </div>
          )}
          {!error && success && (
            <div
              role="status"
              className="ba-toast mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* ---- Summary strip ---- */}
          <section
            className="ba-rise mb-8 overflow-hidden rounded-2xl"
            style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
          >
            <div className="grid grid-cols-2 divide-x sm:grid-cols-4" style={{ background: "#faf8f4" }}>
              {summary.map((stat) => (
                <div key={stat.label} className="px-4 py-5 sm:px-6" style={{ borderColor: "#e3ddd0" }}>
                  <p className="text-xs" style={{ color: "#a39a8c" }}>
                    {stat.label}
                  </p>
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

          {/* ---- Tabs ---- */}
          <nav
            className="mb-8 flex gap-7 overflow-x-auto"
            style={{ borderBottom: "1px solid #e3ddd0" }}
            aria-label="Purchase views"
          >
            {tabs.map(({ id, label, icon: Icon, items }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm font-medium transition-colors ${FOCUS_RING}`}
                  style={{ color: isActive ? "#17140f" : "#8a8175" }}
                >
                  <Icon className="h-4 w-4" style={{ color: isActive ? "#9c6b2e" : undefined }} />
                  {label}
                  <span
                    className="rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors"
                    style={{
                      background: isActive ? "#f7efe0" : "#f1ede4",
                      color: isActive ? "#7a531f" : "#8a8175",
                    }}
                  >
                    {items.length}
                  </span>
                  <span
                    data-active={isActive}
                    className="ba-tab-line absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                    style={{ background: "#9c6b2e" }}
                  />
                </button>
              );
            })}
          </nav>

          {/* ---- Content (keyed so the list re-animates on tab change) ---- */}
          {loading ? (
            <SkeletonList />
          ) : currentTab.items.length === 0 ? (
            <EmptyState key={activeTab} tab={currentTab.label} />
          ) : (
            <div key={activeTab} className="space-y-4">
              {currentTab.items.map((purchase, index) => (
                <PurchaseCard
                  key={purchase.enrollment_id}
                  index={index}
                  purchase={purchase}
                  pending={activeTab === "pending"}
                  approvingId={approvingId}
                  onApprove={approvePurchase}
                  onReject={handleStartReject}
                  onSelectPurchase={setSelectedPurchase}
                />
              ))}
            </div>
          )}
        </div>

      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="ba-rise relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
             {/* Header */}
             <div className="shrink-0 flex flex-wrap gap-4 items-center justify-between p-5 sm:px-6 border-b border-[#e3ddd0] bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedPurchase.name || selectedPurchase.student_name} 
                    <span className="text-slate-400 font-normal ml-2">#{selectedPurchase.enrollment_id ?? selectedPurchase.id}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-stone-500" /> {selectedPurchase.course_title || selectedPurchase.course_name}</span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedPurchase.branch_name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end mr-4">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Branch:</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : (selectedPurchase.branch_approval_status === 'rejected' || selectedPurchase.rejection_stage === 'branch_admin' || selectedPurchase.branch_rejection_reason) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{selectedPurchase.rejection_stage === 'branch_admin' || selectedPurchase.branch_rejection_reason ? 'rejected' : (selectedPurchase.branch_approval_status || '—')}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-700">Super Admin:</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : (selectedPurchase.super_admin_approval_status === 'rejected' || selectedPurchase.rejection_stage === 'super_admin' || selectedPurchase.super_admin_rejection_reason) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{selectedPurchase.rejection_stage === 'super_admin' || selectedPurchase.super_admin_rejection_reason ? 'rejected' : (selectedPurchase.super_admin_approval_status || '—')}</span>
                     </div>
                   </div>
                   <button onClick={() => setSelectedPurchase(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200">
                     <X className="h-5 w-5" />
                   </button>
                </div>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Left Column */}
                   <div className="space-y-6">
                     
                     {/* Student Information */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <User className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Student Information</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Name</p>
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedPurchase.name || selectedPurchase.student_name}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User ID</p>
                             <p className="text-sm font-mono text-slate-800 mt-1">#{selectedPurchase.user_id}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.email || '—'}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.phone || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Highest Qualification</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.highest_qualification || '—'}</p>
                           </div>
                           <div className="col-span-2">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0 mt-0.5"/> {selectedPurchase.address || '—'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Parent / Guardian */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <Users className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parent / Guardian</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Name</p>
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedPurchase.parent_name || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.parent_phone || '—'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Course & Branch */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Course & Branch</h3>
                        </div>
                        <div className="p-5 flex gap-5">
                          {selectedPurchase.course_image && (
                            <img src={selectedPurchase.course_image} alt="Course" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                          )}
                          <div className="grid grid-cols-2 gap-5 flex-1">
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Name</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1">{selectedPurchase.course_title || selectedPurchase.course_name}</p>
                             </div>
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Name</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.branch_name}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Duration</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.course_duration || '—'}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Course Fee</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1 flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]"/> {formatAmount(selectedPurchase.total_fee || selectedPurchase.course_fee).replace('₹','')}</p>
                             </div>
                          </div>
                        </div>
                     </div>

                   </div>

                   {/* Right Column */}
                   <div className="space-y-6">

                     {/* Payment Summary */}
                     <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden bg-gradient-to-br from-white to-stone-50/50">
                        <div className="px-5 py-3.5 border-b border-stone-100 bg-white/60 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Summary</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Fee</p>
                             <p className="text-xl font-bold text-slate-800 mt-1">{formatAmount(selectedPurchase.total_fee || selectedPurchase.course_fee)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Paid</p>
                             <p className="text-xl font-bold text-emerald-600 mt-1">{formatAmount(selectedPurchase.total_paid || selectedPurchase.amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance</p>
                             <p className={`text-xl font-bold mt-1 ${Number(selectedPurchase.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatAmount(selectedPurchase.balance_amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase border shadow-2xs ${selectedPurchase.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                                {selectedPurchase.payment_status || '—'}
                             </span>
                           </div>
                           <div className="col-span-2 pt-4 border-t border-stone-100">
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Installments Paid</p>
                             <p className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-stone-100">
                                {Number(selectedPurchase.installment_count) > 0 
                                  ? `${selectedPurchase.paid_installment_count ?? 0} of ${selectedPurchase.installment_count} Paid`
                                  : 'No Installments'
                                }
                             </p>
                           </div>
                        </div>
                     </div>

                     {/* Approval & Enrollment Status */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Approval & Enrollment Status</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Branch Approval</p>
                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : (selectedPurchase.branch_approval_status === 'rejected' || selectedPurchase.rejection_stage === 'branch_admin' || selectedPurchase.branch_rejection_reason) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {selectedPurchase.rejection_stage === 'branch_admin' || selectedPurchase.branch_rejection_reason ? 'rejected' : (selectedPurchase.branch_approval_status || '—')}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Super Admin Approval</p>
                             <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : (selectedPurchase.super_admin_approval_status === 'rejected' || selectedPurchase.rejection_stage === 'super_admin' || selectedPurchase.super_admin_rejection_reason) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {selectedPurchase.rejection_stage === 'super_admin' || selectedPurchase.super_admin_rejection_reason ? 'rejected' : (selectedPurchase.super_admin_approval_status || '—')}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase border ${selectedPurchase.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {selectedPurchase.payment_status || '—'}
                             </span>
                           </div>
                           {(selectedPurchase.branch_rejection_reason || (selectedPurchase.rejection_stage === 'branch_admin' && (selectedPurchase.rejection_reason || selectedPurchase.reason))) && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Branch Admin Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                 {selectedPurchase.branch_rejection_reason || selectedPurchase.rejection_reason || selectedPurchase.reason}
                               </p>
                             </div>
                           )}
                           {(selectedPurchase.super_admin_rejection_reason || (selectedPurchase.rejection_stage === 'super_admin' && (selectedPurchase.rejection_reason || selectedPurchase.reason))) && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Super Admin Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                 {selectedPurchase.super_admin_rejection_reason || selectedPurchase.rejection_reason || selectedPurchase.reason}
                               </p>
                             </div>
                           )}
                           {!selectedPurchase.branch_rejection_reason && !selectedPurchase.super_admin_rejection_reason && (selectedPurchase.rejection_reason || selectedPurchase.reason) && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                 {selectedPurchase.rejection_reason || selectedPurchase.reason}
                               </p>
                             </div>
                           )}
                        </div>
                     </div>

                   </div>
                </div>

                {/* Installments Breakdown (Matching Branch Admin Enrollments View) */}
                <section className="mt-6">
                   <div className="flex items-center justify-between pb-3 border-b border-[#e3ddd0]">
                     <h3 className="flex items-center gap-2 text-sm font-semibold text-[#17140f]">
                       <Clock className="h-4 w-4 text-[#9c6b2e]" />
                       Installments Breakdown
                     </h3>
                   </div>

                   {enrichedInstallments.length === 0 ? (
                     <p className="mt-4 text-sm text-stone-500">
                       No installment schedule records found for this enrollment.
                     </p>
                   ) : (
                     <div className="mt-4 space-y-3">
                       {enrichedInstallments.map((inst, idx) => {
                         const instStatus = String(inst.status || "pending").toLowerCase();
                         const isDue = instStatus !== "paid" && (
                           inst.due_date
                             ? new Date(inst.due_date) <= new Date(new Date().setHours(23, 59, 59, 999))
                             : inst.is_due === true
                         );
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
             </div>

             {/* Footer Actions */}
             <div className="shrink-0 p-5 sm:px-6 border-t border-[#e3ddd0] bg-white flex flex-col gap-3 rounded-b-2xl">
                {rejectingPurchaseId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                  <div className="flex flex-col gap-3 w-full animate-in slide-in-from-bottom-2">
                    <label className="text-sm font-bold text-slate-700">Rejection Reason</label>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please specify why this purchase is being rejected by branch admin..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-3 items-center mt-2">
                      <button
                         onClick={() => {
                           setRejectingPurchaseId(null);
                           setRejectReason('');
                         }}
                         className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                      >
                         Cancel
                      </button>
                      <button
                        onClick={() => handleReject(selectedPurchase.enrollment_id ?? selectedPurchase.id, rejectReason)}
                        disabled={isRejecting}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md disabled:opacity-60"
                      >
                         {isRejecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                            <X className="h-4 w-4" />
                         )}
                         Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3 items-center w-full">
                    <button
                       onClick={() => {
                         setSelectedPurchase(null);
                         setRejectingPurchaseId(null);
                         setRejectReason('');
                       }}
                       className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                    >
                       Close
                    </button>
                    {(activeTab === 'pending' || selectedPurchase.branch_approval_status === 'pending') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectingPurchaseId(selectedPurchase.enrollment_id ?? selectedPurchase.id)}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-sm"
                        >
                           <X className="h-4 w-4" />
                           Reject
                        </button>
                        <button
                          onClick={() => {
                             approvePurchase(selectedPurchase.enrollment_id ?? selectedPurchase.id);
                             setSelectedPurchase(null);
                          }}
                          disabled={approvingId !== null}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#9c6b2e] hover:bg-[#7a5220] transition shadow-md disabled:opacity-60"
                        >
                           {approvingId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                              <CheckCircle2 className="h-4 w-4" />
                           )}
                           Approve
                        </button>
                      </>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}