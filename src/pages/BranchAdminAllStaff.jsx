import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  getBranchStaffApi,
  updateBranchAdminStaffStatusApi,
} from "../services/branchadminstaff";

/* Same display-font pairing used across branch admin pages */
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

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const ALL_STAFF_CSS = `
@keyframes ba-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.ba-fade { animation: ba-fade .25s ease both; }
.ba-press { transition: transform .08s ease, filter .15s ease; }
.ba-press:active { transform: scale(0.98); }
.ba-toast { animation: ba-fade .2s ease both; }
`;

const formatCurrency = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* Verification / KYC status pill */
const VerificationBadge = ({ status }) => {
  const s = String(status || "pending").toLowerCase();
  if (s === "approved" || s === "success" || s === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        Verified
      </span>
    );
  }
  if (s === "rejected" || s === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
        <XCircle className="h-3 w-3 text-rose-600" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
      <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
      Pending
    </span>
  );
};

/* ── Staff Details Modal ── */
const StaffDetailsModal = ({
  member,
  onClose,
  onToggleStatus,
  statusUpdatingId,
}) => {
  if (!member) return null;

  const staffId = member.id ?? member.staff_id ?? member.user_id;
  const currentStatus = String(
    member.status || (member.is_active === false ? "inactive" : "active")
  ).toLowerCase();
  const isActive = currentStatus === "active";
  const isUpdating = statusUpdatingId === staffId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(23, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ba-fade relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 sm:px-8"
          style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold"
              style={{ background: "#f1ede4", color: "#7a531f" }}
            >
              {member.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h2
                className="text-lg leading-tight"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                {member.name}
              </h2>
              <p className="text-xs" style={{ color: "#8a8175" }}>
                Staff Code: #{member.staff_code || member.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 ${FOCUS_RING}`}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
          {/* Status Bar */}
          <div className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50 border border-[#e3ddd0]">
            <div>
              <p className="text-xs font-semibold text-[#17140f]">Account Status</p>
              <p className="text-xs text-[#8a8175]">
                Control staff portal access & activity status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onToggleStatus(member, isActive ? "Inactive" : "Active")}
                className={`ba-press relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? "bg-emerald-600" : "bg-stone-300"
                } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                title={`Click to set ${isActive ? "Inactive" : "Active"}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  {isUpdating && (
                    <Loader2 className="h-3 w-3 animate-spin text-stone-500" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Section: General Info */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-[#a39a8c] mb-3 flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-[#9c6b2e]" /> General Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl p-4 bg-[#faf8f4] border border-[#e3ddd0]">
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Full Name</p>
                <p className="mt-0.5 text-sm font-medium text-[#17140f]">{member.name || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Staff Code</p>
                <p className="mt-0.5 text-sm font-medium text-[#17140f]">#{member.staff_code || member.id}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Email</p>
                <a
                  href={member.email ? `mailto:${member.email}` : undefined}
                  className="mt-0.5 text-sm font-medium text-[#9c6b2e] hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" /> {member.email || "—"}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Phone</p>
                <a
                  href={member.phone ? `tel:${member.phone}` : undefined}
                  className="mt-0.5 text-sm font-medium text-[#17140f] hover:text-[#9c6b2e] flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" /> {member.phone || "—"}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Address</p>
                <p className="mt-0.5 text-sm font-medium text-[#17140f] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#a39a8c]" /> {member.address || "No address specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Academic & Course */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-[#a39a8c] mb-3 flex items-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#9c6b2e]" /> Course & Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl p-4 bg-[#faf8f4] border border-[#e3ddd0]">
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Assigned Course</p>
                <p className="mt-0.5 text-sm font-semibold text-[#17140f]">
                  {member.course_name || member.course_names?.join(", ") || "No course assigned"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Course ID</p>
                <p className="mt-0.5 text-sm font-medium text-[#17140f]">
                  {member.course_id ? `#${member.course_id}` : member.course_ids?.join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Branch ID</p>
                <p className="mt-0.5 text-sm font-medium text-[#17140f]">
                  {member.branch_id ? `#${member.branch_id}` : "Branch #1"}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Compensation & Payroll */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-[#a39a8c] mb-3 flex items-center gap-1.5"
            >
              <IndianRupee className="h-3.5 w-3.5 text-[#5c7a5a]" /> Compensation & Payroll
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl p-4 bg-[#faf8f4] border border-[#e3ddd0]">
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Monthly Salary</p>
                <p className="mt-1 text-xl font-bold text-[#5c7a5a]" style={serif}>
                  {formatCurrency(member.salary)}
                  <span className="text-xs font-normal text-stone-500 ml-1">/ month</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase">Annual Estimate</p>
                <p className="mt-1 text-xl font-bold text-[#17140f]" style={serif}>
                  {formatCurrency(Number(member.salary || 0) * 12)}
                  <span className="text-xs font-normal text-stone-500 ml-1">/ year</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section: Verification & Metadata */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-[#a39a8c] mb-3 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#9c6b2e]" /> Verification Status & Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl p-4 bg-[#faf8f4] border border-[#e3ddd0]">
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase mb-1">KYC Verification</p>
                <VerificationBadge status={member.verification_status} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase mb-1">Document Status</p>
                <VerificationBadge status={member.document_status} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#8a8175] uppercase mb-1">Registration</p>
                <VerificationBadge status={member.registration_status} />
              </div>
              <div className="sm:col-span-3 pt-2 border-t border-[#efe9dd] flex items-center justify-between text-xs text-[#8a8175]">
                <span>Registered Date: {formatDate(member.created_at)}</span>
                <span>User ID: #{member.user_id || member.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-6 py-4 sm:px-8"
          style={{ background: "#ffffff", borderTop: "1px solid #e3ddd0" }}
        >
          <button
            type="button"
            onClick={onClose}
            className={`ba-press rounded-lg px-5 py-2.5 text-sm font-medium text-white ${FOCUS_RING}`}
            style={{ background: "#17140f" }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main BranchAdminAllStaff Page ── */
const BranchAdminAllStaff = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const loadStaffData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchStaffApi(token);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [token]);

  /* Status Toggle Handler with PATCH /branch-admin/staff/{staff_id}/status */
  const handleToggleStatus = async (member, targetStatus) => {
    const staffId = member.id ?? member.staff_id ?? member.user_id;
    if (!staffId || !token) return;
    const normalizedStatus =
      String(targetStatus).toLowerCase() === "active" ? "Active" : "Inactive";
    const isNowActive = normalizedStatus === "Active";

    try {
      setStatusUpdatingId(staffId);
      setError("");
      setSuccess("");

      await updateBranchAdminStaffStatusApi(staffId, normalizedStatus, token);

      // Optimistic update local staff list
      setStaff((prev) =>
        prev.map((s) => {
          const sId = s.id ?? s.staff_id ?? s.user_id;
          if (String(sId) === String(staffId)) {
            return {
              ...s,
              status: normalizedStatus,
              is_active: isNowActive,
            };
          }
          return s;
        })
      );

      // Also update selectedMember if modal is open
      setSelectedMember((prev) => {
        if (!prev) return null;
        const pId = prev.id ?? prev.staff_id ?? prev.user_id;
        if (String(pId) === String(staffId)) {
          return {
            ...prev,
            status: normalizedStatus,
            is_active: isNowActive,
          };
        }
        return prev;
      });

      setSuccess(
        `${member.name || "Staff member"}'s status updated to ${normalizedStatus} successfully.`
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || "Failed to update staff status.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* Filtered staff based on search query */
  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((m) => {
      const name = String(m.name || "").toLowerCase();
      const code = String(m.staff_code || m.id || "").toLowerCase();
      const email = String(m.email || "").toLowerCase();
      const phone = String(m.phone || "").toLowerCase();
      const course = String(m.course_name || "").toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        course.includes(q)
      );
    });
  }, [staff, searchTerm]);

  /* Stats summary */
  const stats = useMemo(() => {
    const total = staff.length;
    let active = 0;
    let inactive = 0;
    let payroll = 0;
    staff.forEach((m) => {
      const s = String(
        m.status || (m.is_active === false ? "inactive" : "active")
      ).toLowerCase();
      if (s === "active") active++;
      else inactive++;
      payroll += Number(m.salary || 0);
    });
    return { total, active, inactive, payroll };
  }, [staff]);

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#fcfbf9", color: "#17140f", ...sans }}
    >
      <style>{ALL_STAFF_CSS}</style>

      {/* Sidebar */}
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="all-staff"
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Header bar */}
        <header
          className="sticky top-0 z-20 flex h-[92px] items-center justify-between px-6 sm:px-10 border-b border-[#e3ddd0] bg-[#faf8f4]/95 backdrop-blur-md shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl bg-[#faf8f4] border border-[#e3ddd0] p-2 text-[#17140f] hover:bg-[#f1ede4] transition md:hidden"
              aria-label="Open sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                All Staffs
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadStaffData}
              disabled={loading}
              className={`ba-press flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 border border-[#e3ddd0] ${FOCUS_RING}`}
              title="Refresh staff list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/branch-admin/staff", { state: { openCreate: true } })}
              className={`ba-press flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs ${FOCUS_RING}`}
              style={{ background: "#17140f" }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Staff</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 space-y-6 p-6 sm:p-10 max-w-7xl w-full mx-auto">
          {/* Toast / alerts */}
          {error && (
            <div
              role="alert"
              className="ba-toast rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: "#fdf2f0", color: "#a24a3a", border: "1px solid #f4c7c0" }}
            >
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-bold underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="ba-toast rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #cce0c6" }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {success}
              </span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="text-xs font-bold underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Banner / Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              className="rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <p className="text-xs font-medium" style={{ color: "#8a8175" }}>
                Total Staff
              </p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{ ...serif, color: "#17140f" }}
              >
                {stats.total}
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <p className="text-xs font-medium" style={{ color: "#8a8175" }}>
                Active Accounts
              </p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{ ...serif, color: "#2d6a4f" }}
              >
                {stats.active}
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <p className="text-xs font-medium" style={{ color: "#8a8175" }}>
                Inactive Accounts
              </p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{ ...serif, color: "#a24a3a" }}
              >
                {stats.inactive}
              </p>
            </div>
          </div>

          {/* Directory section & search */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2
                className="text-lg font-medium"
                style={{ ...serif, color: "#17140f" }}
              >
                Staff Directory
              </h2>
              <p className="text-xs" style={{ color: "#8a8175" }}>
                {filteredStaff.length} of {staff.length} staff members shown
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "#a39a8c" }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, code, course..."
                className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm ${FOCUS_RING}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e3ddd0",
                  color: "#17140f",
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Staff Table (Desktop) & Cards (Mobile) */}
          {loading ? (
            <div
              className="overflow-hidden rounded-2xl p-12 text-center"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-stone-400" />
              <p className="mt-3 text-sm text-stone-500">Loading branch staff directory…</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div
              className="ba-fade rounded-2xl px-6 py-16 text-center"
              style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
            >
              <Users className="mx-auto h-8 w-8" style={{ color: "#d9b77b" }} />
              <h3 className="mt-3 text-base font-semibold" style={{ ...serif, color: "#17140f" }}>
                {searchTerm ? "No matching staff found" : "No staff accounts registered"}
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                {searchTerm
                  ? "Try clearing your search term or searching by a different name or course."
                  : "You can add staff members from the Staff section."}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-[#e3ddd0]"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div
                className="hidden md:block overflow-hidden rounded-2xl shadow-2xs"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid #e3ddd0",
                          background: "#faf8f4",
                        }}
                      >
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          Staff Member
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          Contact Info
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          Assigned Course
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          Monthly Salary
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-[#8a8175]">
                          KYC Verification
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#8a8175]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#efe9dd]">
                      {filteredStaff.map((member) => {
                        const staffId = member.id ?? member.staff_id ?? member.user_id;
                        const currentStatus = String(
                          member.status || (member.is_active === false ? "inactive" : "active")
                        ).toLowerCase();
                        const isActive = currentStatus === "active";
                        const isUpdating = statusUpdatingId === staffId;

                        return (
                          <tr
                            key={member.id}
                            className="transition-colors hover:bg-[#faf8f4]"
                          >
                            {/* Member info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                  style={{ background: "#f1ede4", color: "#7a531f" }}
                                >
                                  {member.name?.charAt(0).toUpperCase() || "S"}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className="font-medium truncate text-[#17140f]"
                                    style={{ ...serif, fontSize: "0.95rem" }}
                                  >
                                    {member.name}
                                  </p>
                                  <p className="text-xs text-[#8a8175]">
                                    #{member.staff_code || member.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Contact info */}
                            <td className="px-6 py-4">
                              <p className="truncate text-xs font-medium text-[#17140f]">
                                {member.email}
                              </p>
                              <p className="text-xs text-[#8a8175] mt-0.5">
                                {member.phone || "—"}
                              </p>
                            </td>

                            {/* Course */}
                            <td className="px-6 py-4">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                                style={{
                                  background: "#f4f1ea",
                                  color: "#17140f",
                                  border: "1px solid #e3ddd0",
                                }}
                              >
                                <BookOpen className="h-3 w-3 text-[#9c6b2e]" />
                                <span className="max-w-[160px] truncate">
                                  {member.course_name || "Not assigned"}
                                </span>
                              </span>
                            </td>

                            {/* Salary */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 font-semibold text-[#5c7a5a]">
                                <IndianRupee className="h-3.5 w-3.5" />
                                <span>{formatCurrency(member.salary)}</span>
                              </div>
                              <span className="text-[10px] text-[#8a8175]">per month</span>
                            </td>

                            {/* Status Toggle Switch */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleToggleStatus(member, isActive ? "Inactive" : "Active")
                                  }
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isActive ? "bg-emerald-600" : "bg-stone-300"
                                  } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                                  title={`Click to set ${isActive ? "Inactive" : "Active"}`}
                                >
                                  <span
                                    aria-hidden="true"
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

                            {/* Verification */}
                            <td className="px-6 py-4">
                              <VerificationBadge status={member.verification_status} />
                            </td>

                            {/* Action: View details */}
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedMember(member)}
                                className={`ba-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#9c6b2e] hover:bg-[#faf8f4] ${FOCUS_RING}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {filteredStaff.map((member) => {
                  const staffId = member.id ?? member.staff_id ?? member.user_id;
                  const currentStatus = String(
                    member.status || (member.is_active === false ? "inactive" : "active")
                  ).toLowerCase();
                  const isActive = currentStatus === "active";
                  const isUpdating = statusUpdatingId === staffId;

                  return (
                    <article
                      key={member.id}
                      className="rounded-2xl p-5 shadow-2xs space-y-4"
                      style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                            style={{ background: "#f1ede4", color: "#7a531f" }}
                          >
                            {member.name?.charAt(0).toUpperCase() || "S"}
                          </div>
                          <div>
                            <h3
                              className="font-medium text-[#17140f]"
                              style={{ ...serif, fontSize: "1rem" }}
                            >
                              {member.name}
                            </h3>
                            <p className="text-xs text-[#8a8175]">
                              #{member.staff_code || member.id}
                            </p>
                          </div>
                        </div>
                        <VerificationBadge status={member.verification_status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#efe9dd] text-xs">
                        <div>
                          <p className="text-[#8a8175]">Email</p>
                          <p className="font-medium text-[#17140f] truncate">{member.email}</p>
                        </div>
                        <div>
                          <p className="text-[#8a8175]">Phone</p>
                          <p className="font-medium text-[#17140f]">{member.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[#8a8175]">Course</p>
                          <p className="font-medium text-[#17140f] truncate">
                            {member.course_name || "Not assigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#8a8175]">Salary</p>
                          <p className="font-semibold text-[#5c7a5a]">
                            {formatCurrency(member.salary)} / mo
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#efe9dd]">
                        {/* Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleToggleStatus(member, isActive ? "Inactive" : "Active")
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-emerald-600" : "bg-stone-300"
                            } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                            title={`Click to set ${isActive ? "Inactive" : "Active"}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            >
                              {isUpdating && (
                                <Loader2 className="h-2.5 w-2.5 animate-spin text-stone-500" />
                              )}
                            </span>
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              isActive ? "text-emerald-700" : "text-stone-500"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          className={`ba-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#9c6b2e] hover:bg-[#faf8f4] ${FOCUS_RING}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Staff Details Modal */}
      {selectedMember && (
        <StaffDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onToggleStatus={handleToggleStatus}
          statusUpdatingId={statusUpdatingId}
        />
      )}
    </div>
  );
};

export default BranchAdminAllStaff;
