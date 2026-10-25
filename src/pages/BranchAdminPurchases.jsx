import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  approveBranchAdminPurchaseApi,
  getBranchAdminApprovedPurchasesApi,
  getBranchAdminPendingPurchasesApi,
  getBranchAdminPurchasesApi,
  getBranchAdminRejectedPurchasesApi
} from "../services/branchadminpurchases";

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

const PurchaseCard = ({ purchase, pending, approvingId, onApprove, index, onSelectPurchase }) => {
  const isApproving = approvingId === purchase.enrollment_id;
  const initial = purchase.name?.charAt(0).toUpperCase() || "S";

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
        ) : (
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill 
              status={
                String(purchase.super_admin_approval_status).toLowerCase() === "approved" 
                  ? "super admin approved" 
                  : (String(purchase.course_status).toLowerCase() === "approved" || String(purchase.course_status).toLowerCase() === "partially approved" 
                    ? "branch admin approved" 
                    : purchase.course_status)
              } 
            />
          </div>
        )}
      </div>

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
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadPurchases = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [pendingData, approvedData, rejectedData, historyData] = await Promise.all([
        getBranchAdminPendingPurchasesApi(token),
        getBranchAdminApprovedPurchasesApi(token),
        getBranchAdminRejectedPurchasesApi(token),
        getBranchAdminPurchasesApi(token),
      ]);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setApproved(Array.isArray(approvedData) ? approvedData : []);
      setRejected(Array.isArray(rejectedData) ? rejectedData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(err.message || "Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Auto-dismiss the success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

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

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock3, items: pending },
    { id: "approved", label: "Approved", icon: CheckCircle2, items: approved },
    { id: "rejected", label: "Super admin rejected", icon: X, items: rejected },
    { id: "history", label: "Purchase history", icon: History, items: history },
  ];
  const currentTab = tabs.find((tab) => tab.id === activeTab);

  const partiallyApprovedCount = history.filter((p) => String(p.course_status).toLowerCase() === "partially approved" || (String(p.course_status).toLowerCase() === "approved" && String(p.super_admin_approval_status).toLowerCase() !== "approved")).length;
  const superAdminApprovedCount = history.filter((p) => String(p.super_admin_approval_status).toLowerCase() === "approved" || (String(p.course_status).toLowerCase() === "super admin approved")).length;

  const summary = [
    { label: "Awaiting approval", value: pending.length, color: "#b0803a" },
    { label: "Branch admin approvals", value: partiallyApprovedCount, color: "#4b6b8a" },
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
          className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0"
        >
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
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-10">
          <p className="mb-6 max-w-2xl text-[0.8rem] rounded-xl px-3.5 py-2.5" style={{ background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030" }}>
            <strong style={{ color: "#9b2c2c" }}>Note:</strong> Branch Admin Approved means the purchase has been approved by the Branch Admin. For the main access, Super Admin approvals are also needed.
          </p>
          {error && (
            <div
              role="alert"
              className="ba-toast mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
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
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : selectedPurchase.branch_approval_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{selectedPurchase.branch_approval_status}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-700">Super Admin:</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedPurchase.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{selectedPurchase.super_admin_approval_status}</span>
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
                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : selectedPurchase.branch_approval_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {selectedPurchase.branch_approval_status || '—'}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Super Admin Approval</p>
                             <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedPurchase.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {selectedPurchase.super_admin_approval_status || '—'}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase border ${selectedPurchase.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {selectedPurchase.payment_status || '—'}
                             </span>
                           </div>
                           {selectedPurchase.super_admin_rejection_reason && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">{selectedPurchase.super_admin_rejection_reason}</p>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Payment Gateway Details */}
                     {(selectedPurchase.razorpay_order_id || selectedPurchase.razorpay_payment_id) && (
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Gateway Details</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 gap-4">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Razorpay Order ID</p>
                             <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">{selectedPurchase.razorpay_order_id || 'Not applicable'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Razorpay Payment ID</p>
                             <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">{selectedPurchase.razorpay_payment_id || 'Not applicable'}</p>
                           </div>
                        </div>
                     </div>
                     )}

                   </div>
                </div>

                {/* Installment Schedule (Full Width) */}
                {selectedPurchase.installments && selectedPurchase.installments.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden mt-6">
                     <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-stone-500" />
                       <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Installment Schedule</h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-[#faf8f4] border-b border-[#e3ddd0] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              <tr>
                                 <th className="px-5 py-3">Term</th>
                                 <th className="px-5 py-3">Amount</th>
                                 <th className="px-5 py-3">Paid</th>
                                 <th className="px-5 py-3">Remaining</th>
                                 <th className="px-5 py-3">Due Date</th>
                                 <th className="px-5 py-3">Paid Date</th>
                                 <th className="px-5 py-3">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-[#f1ede4]">
                              {selectedPurchase.installments.map((inst, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition">
                                   <td className="px-5 py-3 font-medium text-slate-800">#{inst.installment_number}</td>
                                   <td className="px-5 py-3 font-bold text-slate-700">{formatAmount(inst.amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-emerald-600">{formatAmount(inst.paid_amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-rose-600">{formatAmount(inst.remaining_amount)}</td>
                                   <td className="px-5 py-3 text-xs font-medium text-slate-600">{inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                   <td className="px-5 py-3 text-xs font-medium text-slate-600">{inst.paid_date ? new Date(inst.paid_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                   <td className="px-5 py-3">
                                     <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${inst.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : inst.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : inst.is_due ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {inst.status}
                                     </span>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm p-8 flex flex-col items-center justify-center text-center mt-6">
                     <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                     <p className="text-sm font-semibold text-slate-600">No installment schedule for this enrollment.</p>
                  </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="shrink-0 p-5 sm:px-6 border-t border-[#e3ddd0] bg-white flex flex-col gap-3 rounded-b-2xl">
                <div className="flex justify-end gap-3 items-center w-full">
                  <button
                     onClick={() => setSelectedPurchase(null)}
                     className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                  >
                     Close
                  </button>
                  {activeTab === 'pending' && (
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
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}