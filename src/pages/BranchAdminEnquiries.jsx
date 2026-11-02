import React, { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Loader2,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle2,
  CheckCheck,
  Check,
  Clock,
  Menu,
  Search,
  X,
  RefreshCw,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getBranchAdminEnquiriesApi,
  markBranchAdminEnquiryReadApi,
  updateBranchAdminEnquiryContactStatusApi,
} from "../services/enquiries";

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

const PAGE_CSS = `
@keyframes ba-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
.ba-rise  { opacity: 0; animation: ba-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-card  { transition: box-shadow .3s ease, border-color .3s ease; }
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 16px 36px -22px rgba(23,20,15,.3); }
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

const BranchAdminEnquiries = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [updatingContactId, setUpdatingContactId] = useState(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters & search
  // Presets: "ALL" | "NOT_CONTACTED" | "CONTACTED" | "UNREAD" | "CUSTOM"
  const [activePreset, setActivePreset] = useState("ALL");
  const [contactFilter, setContactFilter] = useState("ALL"); // ALL, CONTACTED, NOT_CONTACTED
  const [readFilter, setReadFilter] = useState("ALL"); // ALL, PENDING, READ
  const [searchQuery, setSearchQuery] = useState("");

  const loadEnquiries = async (isManual = false) => {
    if (!token) return;
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError("");
      const data = await getBranchAdminEnquiriesApi(token);
      const list = Array.isArray(data) ? data : (data?.enquiries ?? data?.data ?? []);
      setEnquiries(list);
    } catch (err) {
      setError(err.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [token]);

  const isRead = (enq) => {
    const status = String(enq?.branch_admin_status || enq?.status || "").toLowerCase();
    return status === "read" || status === "completed" || enq?.is_read === true || !!enq?.branch_admin_read_at;
  };

  const isContacted = (enq) => {
    return String(enq?.contact_status || "").toLowerCase() === "contacted";
  };

  // Card preset click handler - single active preset, clean switching, toggle to ALL on re-click
  const handleSelectPreset = (preset) => {
    if (activePreset === preset) {
      // Toggle off to ALL
      setActivePreset("ALL");
      setContactFilter("ALL");
      setReadFilter("ALL");
      return;
    }

    setActivePreset(preset);
    if (preset === "ALL") {
      setContactFilter("ALL");
      setReadFilter("ALL");
    } else if (preset === "NOT_CONTACTED") {
      setContactFilter("NOT_CONTACTED");
      setReadFilter("ALL");
    } else if (preset === "CONTACTED") {
      setContactFilter("CONTACTED");
      setReadFilter("ALL");
    } else if (preset === "UNREAD") {
      setReadFilter("PENDING");
      setContactFilter("ALL");
    }
  };

  const handleContactFilterChange = (val) => {
    setContactFilter(val);
    if (val === "CONTACTED" && readFilter === "ALL") {
      setActivePreset("CONTACTED");
    } else if (val === "NOT_CONTACTED" && readFilter === "ALL") {
      setActivePreset("NOT_CONTACTED");
    } else if (val === "ALL" && readFilter === "ALL") {
      setActivePreset("ALL");
    } else if (val === "ALL" && readFilter === "PENDING") {
      setActivePreset("UNREAD");
    } else {
      setActivePreset("CUSTOM");
    }
  };

  const handleReadFilterChange = (val) => {
    setReadFilter(val);
    if (val === "PENDING" && contactFilter === "ALL") {
      setActivePreset("UNREAD");
    } else if (val === "ALL" && contactFilter === "ALL") {
      setActivePreset("ALL");
    } else if (val === "ALL" && contactFilter === "CONTACTED") {
      setActivePreset("CONTACTED");
    } else if (val === "ALL" && contactFilter === "NOT_CONTACTED") {
      setActivePreset("NOT_CONTACTED");
    } else {
      setActivePreset("CUSTOM");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setContactFilter("ALL");
    setReadFilter("ALL");
    setActivePreset("ALL");
  };

  const handleMarkAsRead = async (enquiryId) => {
    if (!token || !enquiryId) return;
    try {
      setMarkingReadId(enquiryId);
      const res = await markBranchAdminEnquiryReadApi(enquiryId, token);
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === enquiryId
            ? {
                ...e,
                ...(typeof res === "object" && res !== null ? res : {}),
                branch_admin_status: "read",
                status: "read",
                is_read: true,
              }
            : e
        )
      );
    } catch (err) {
      alert(err.message || "Failed to mark enquiry as read.");
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleUpdateContactStatus = async (enquiryId, newStatus) => {
    if (!token || !enquiryId) return;
    try {
      setUpdatingContactId(enquiryId);
      const res = await updateBranchAdminEnquiryContactStatusApi(enquiryId, newStatus, token);
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === enquiryId
            ? {
                ...e,
                ...(typeof res === "object" && res !== null ? res : {}),
                contact_status: newStatus,
              }
            : e
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update contact status.");
    } finally {
      setUpdatingContactId(null);
    }
  };

  const isGeneral = (e) => {
    const type = (e.enquiry_type || e.type || "").toLowerCase();
    if (type.includes("admission")) return false;
    if (type.includes("general")) return true;
    const course = (e.course || "").toLowerCase();
    if (course.includes("general")) return true;
    if (!e.course && !e.qualification) return true;
    return false;
  };

  const matchesFilter = (e) => {
    // Contact status filter
    if (contactFilter === "CONTACTED" && !isContacted(e)) return false;
    if (contactFilter === "NOT_CONTACTED" && isContacted(e)) return false;

    // Read status filter
    if (readFilter === "READ" && !isRead(e)) return false;
    if (readFilter === "PENDING" && isRead(e)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = e.name?.toLowerCase().includes(q);
      const emailMatch = e.email?.toLowerCase().includes(q);
      const phoneMatch = e.phone?.toLowerCase().includes(q);
      const courseMatch = e.course?.toLowerCase().includes(q);
      const qualMatch = e.qualification?.toLowerCase().includes(q);
      const msgMatch = e.message?.toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || courseMatch || qualMatch || msgMatch;
    }
    return true;
  };

  const admissionEnquiries = useMemo(
    () => enquiries.filter((e) => !isGeneral(e)),
    [enquiries]
  );
  const generalEnquiries = useMemo(
    () => enquiries.filter((e) => isGeneral(e)),
    [enquiries]
  );

  const filteredAdmissionEnquiries = useMemo(
    () => admissionEnquiries.filter(matchesFilter),
    [admissionEnquiries, contactFilter, readFilter, searchQuery]
  );
  const filteredGeneralEnquiries = useMemo(
    () => generalEnquiries.filter(matchesFilter),
    [generalEnquiries, contactFilter, readFilter, searchQuery]
  );

  const hasAdmissionData = filteredAdmissionEnquiries.length > 0;
  const hasGeneralData = filteredGeneralEnquiries.length > 0;

  // Statistics
  const totalCount = enquiries.length;
  const contactedCount = useMemo(() => enquiries.filter(isContacted).length, [enquiries]);
  const notContactedCount = totalCount - contactedCount;
  const pendingReadCount = useMemo(() => enquiries.filter((e) => !isRead(e)).length, [enquiries]);

  const pendingAdmissionCount = admissionEnquiries.filter((e) => !isRead(e)).length;
  const pendingGeneralCount = generalEnquiries.filter((e) => !isRead(e)).length;

  // Render individual enquiry card
  const renderEnquiryCard = (enq, index) => {
    const readStatus = isRead(enq);
    const contactedStatus = isContacted(enq);

    return (
      <article
        key={enq.id}
        className="ba-card flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#e8e2d5] bg-[#faf8f4] hover:bg-white transition"
        style={{
          animationDelay: `${Math.min(index, 6) * 40}ms`,
        }}
      >
        <div>
          {/* Card Top: Name & Badges */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate text-[#17140f]">
                {enq.name || "Anonymous Applicant"}
              </h3>
              <span className="text-xs font-medium flex items-center gap-1.5 mt-0.5 text-[#8a8175]">
                <Calendar className="w-3.5 h-3.5 text-[#9c6b2e]" />
                {formatDate(enq.created_at)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {/* Contact Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  contactedStatus
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {contactedStatus ? (
                  <>
                    <Check className="w-3 h-3 text-teal-600" />
                    <span>Contacted</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-3 h-3 text-amber-600" />
                    <span>Not Contacted</span>
                  </>
                )}
              </span>

              {/* Read Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  readStatus
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {readStatus ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Read</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 mb-4 text-xs text-[#5b5346]">
            {enq.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                <a href={`mailto:${enq.email}`} className="hover:underline truncate text-stone-700">
                  {enq.email}
                </a>
              </p>
            )}
            {enq.phone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                <a href={`tel:${enq.phone}`} className="hover:underline text-stone-700 font-medium">
                  {enq.phone}
                </a>
              </p>
            )}
            {enq.course && (
              <p className="flex items-center gap-2 font-medium text-[#7a531f]">
                <BookOpen className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                <span className="truncate">{enq.course}</span>
              </p>
            )}
            {enq.qualification && (
              <p className="flex items-center gap-2 text-[#5b5346]">
                <GraduationCap className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                <span className="truncate">{enq.qualification}</span>
              </p>
            )}
          </div>

          {/* Message */}
          {enq.message && (
            <div className="p-3.5 rounded-xl text-xs bg-white border border-[#e3ddd0] text-[#17140f]">
              <p className="text-[11px] mb-1 font-semibold text-[#8a7b68]">Message / Query:</p>
              <p className="whitespace-pre-wrap leading-relaxed">{enq.message}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3.5 border-t border-[#f1ede4] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 text-xs text-[#8a7b68]">
            <span>
              Read:{" "}
              <strong className={readStatus ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                {readStatus ? "Read" : "Pending"}
              </strong>
            </span>
            <span>
              Contact:{" "}
              <strong className={contactedStatus ? "text-teal-700 font-bold" : "text-amber-700 font-bold"}>
                {contactedStatus ? "Contacted" : "Not Contacted"}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contact Status Toggle Button */}
            {contactedStatus ? (
              <button
                type="button"
                onClick={() => handleUpdateContactStatus(enq.id, "not_contacted")}
                disabled={updatingContactId === enq.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-[#e3ddd0] hover:bg-[#f5f1e8] transition disabled:opacity-60 cursor-pointer shadow-2xs"
                title="Mark as Not Contacted"
              >
                {updatingContactId === enq.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9c6b2e]" />
                ) : (
                  <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Mark Not Contacted</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdateContactStatus(enq.id, "contacted")}
                disabled={updatingContactId === enq.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-60 cursor-pointer shadow-2xs"
                style={{ background: "#0d9488" }}
                title="Mark as Contacted"
              >
                {updatingContactId === enq.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Mark Contacted</span>
                  </>
                )}
              </button>
            )}

            {/* Read Status Button */}
            {!readStatus ? (
              <button
                type="button"
                onClick={() => handleMarkAsRead(enq.id)}
                disabled={markingReadId === enq.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-60 cursor-pointer shadow-2xs"
                style={{ background: "#9c6b2e" }}
              >
                {markingReadId === enq.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Marking...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark as Read</span>
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Read
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      className="branch-enquiries-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="enquiries"
      />

      <main className="min-w-0 flex-1 h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[#e3ddd0] bg-[#faf8f4]/95 backdrop-blur-md shrink-0">
          <div className="mx-auto flex min-h-[68px] sm:h-[92px] w-full max-w-[1480px] items-center justify-between px-3.5 sm:px-6 lg:px-10 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e] block truncate">
                  Branch Portal
                </span>
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                  Enquiries & Contact Status
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => loadEnquiries(true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#e3ddd0] bg-white p-2 sm:px-3 sm:py-2 text-xs font-semibold text-stone-700 hover:bg-[#f1ede4] transition cursor-pointer disabled:opacity-60 shrink-0"
                title="Refresh Enquiries"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <div className="hidden text-right sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {user?.name || "Branch Admin"}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {user?.branch_name || "Branch Administrator"}
                </p>
              </div>
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#17140f] text-xs sm:text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0] shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "B"}
              </div>
              <NavLogoutButton redirectTo="/branch-admin-login" />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1480px] px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div
              role="alert"
              className="ba-pop rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              <span>{error}</span>
              <button
                onClick={() => loadEnquiries(false)}
                className="text-xs font-bold underline hover:no-underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Quick Summary Preset Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Total Enquiries */}
            <div
              onClick={() => handleSelectPreset("ALL")}
              className={`ba-card rounded-2xl border bg-white p-4 sm:p-5 cursor-pointer transition ${
                activePreset === "ALL" ? "ring-2 ring-[#9c6b2e] shadow-md" : "shadow-xs hover:border-[#ebd9b3]"
              }`}
              style={{
                borderColor: activePreset === "ALL" ? "#9c6b2e" : "#e3ddd0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                  Total Enquiries
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8edcf] text-[#9c6b2e]">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#17140f]" style={serif}>
                {totalCount}
              </p>
              <p className="mt-0.5 text-xs text-[#8a7b68]">All inquiries in your branch</p>
            </div>

            {/* Not Contacted */}
            <div
              onClick={() => handleSelectPreset("NOT_CONTACTED")}
              className={`ba-card rounded-2xl border bg-white p-4 sm:p-5 cursor-pointer transition ${
                activePreset === "NOT_CONTACTED" ? "ring-2 ring-amber-500 shadow-md" : "shadow-xs hover:border-[#ebd9b3]"
              }`}
              style={{
                borderColor: activePreset === "NOT_CONTACTED" ? "#d97706" : "#e3ddd0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                  Not Contacted
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <PhoneOff className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700" style={serif}>
                {notContactedCount}
              </p>
              <p className="mt-0.5 text-xs text-[#8a7b68]">Follow-up call/message needed</p>
            </div>

            {/* Contacted */}
            <div
              onClick={() => handleSelectPreset("CONTACTED")}
              className={`ba-card rounded-2xl border bg-white p-4 sm:p-5 cursor-pointer transition ${
                activePreset === "CONTACTED" ? "ring-2 ring-teal-600 shadow-md" : "shadow-xs hover:border-[#ebd9b3]"
              }`}
              style={{
                borderColor: activePreset === "CONTACTED" ? "#0d9488" : "#e3ddd0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                  Contacted
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <PhoneCall className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-teal-800" style={serif}>
                {contactedCount}
              </p>
              <p className="mt-0.5 text-xs text-[#8a7b68]">Students contacted successfully</p>
            </div>

            {/* Pending Read */}
            <div
              onClick={() => handleSelectPreset("UNREAD")}
              className={`ba-card rounded-2xl border bg-white p-4 sm:p-5 cursor-pointer transition ${
                activePreset === "UNREAD" ? "ring-2 ring-rose-500 shadow-md" : "shadow-xs hover:border-[#ebd9b3]"
              }`}
              style={{
                borderColor: activePreset === "UNREAD" ? "#e11d48" : "#e3ddd0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                  Unread Enquiries
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-700" style={serif}>
                {pendingReadCount}
              </p>
              <p className="mt-0.5 text-xs text-[#8a7b68]">New unread messages</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by student name, phone, email, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-9 pr-8 text-xs text-[#17140f] outline-none transition placeholder:text-stone-400 focus:border-[#9c6b2e] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filter Selects */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Contact Filter */}
                <select
                  value={contactFilter}
                  onChange={(e) => handleContactFilterChange(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-[#9c6b2e] cursor-pointer"
                >
                  <option value="ALL">All Contact Status ({totalCount})</option>
                  <option value="NOT_CONTACTED">Not Contacted ({notContactedCount})</option>
                  <option value="CONTACTED">Contacted ({contactedCount})</option>
                </select>

                {/* Read Filter */}
                <select
                  value={readFilter}
                  onChange={(e) => handleReadFilterChange(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-[#9c6b2e] cursor-pointer"
                >
                  <option value="ALL">All Read Status</option>
                  <option value="PENDING">Unread / Pending ({pendingReadCount})</option>
                  <option value="READ">Read ({totalCount - pendingReadCount})</option>
                </select>

                {(searchQuery || contactFilter !== "ALL" || readFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f1ede4] transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: "#8a8175" }}>
              <Loader2 className="h-5 w-5 animate-spin text-[#9c6b2e]" />
              <span className="font-medium">Loading enquiries…</span>
            </div>
          ) : !hasAdmissionData && !hasGeneralData ? (
            /* Empty state when NO enquiries match */
            <div className="rounded-2xl border border-dashed border-[#dfc9a9] bg-white p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17140f]" style={serif}>
                No enquiries found
              </h3>
              <p className="mt-1 text-xs text-[#8a7b68] max-w-sm mx-auto">
                {enquiries.length === 0
                  ? "There are currently no enquiries recorded in your branch."
                  : "No enquiries match your current filter selection or search query."}
              </p>
              {enquiries.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset all filters
                </button>
              )}
            </div>
          ) : hasAdmissionData && hasGeneralData ? (
            /* BOTH SECTIONS HAVE DATA: Render side by side in 2 columns */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* LEFT SECTION: Admission Applications */}
              <section className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        Admission Applications
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingAdmissionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingAdmissionCount} unread
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]">
                    {filteredAdmissionEnquiries.length}{" "}
                    {filteredAdmissionEnquiries.length === 1 ? "Application" : "Applications"}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {filteredAdmissionEnquiries.map(renderEnquiryCard)}
                </div>
              </section>

              {/* RIGHT SECTION: General Enquiries */}
              <section
                className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6"
                style={{ animationDelay: "60ms" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        General Enquiries
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingGeneralCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingGeneralCount} unread
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]">
                    {filteredGeneralEnquiries.length}{" "}
                    {filteredGeneralEnquiries.length === 1 ? "Enquiry" : "Enquiries"}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {filteredGeneralEnquiries.map(renderEnquiryCard)}
                </div>
              </section>
            </div>
          ) : hasAdmissionData ? (
            /* ONLY ADMISSION HAS DATA: When 1 item, reduce width to max-w-[700px]; otherwise full width */
            <div className={filteredAdmissionEnquiries.length === 1 ? "w-full max-w-[700px]" : "w-full"}>
              <section className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        Admission Applications
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingAdmissionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingAdmissionCount} unread
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]">
                    {filteredAdmissionEnquiries.length}{" "}
                    {filteredAdmissionEnquiries.length === 1 ? "Application" : "Applications"}
                  </span>
                </div>

                <div className={filteredAdmissionEnquiries.length === 1 ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                  {filteredAdmissionEnquiries.map(renderEnquiryCard)}
                </div>
              </section>
            </div>
          ) : (
            /* ONLY GENERAL HAS DATA: When 1 item, reduce width to max-w-[700px]; otherwise full width */
            <div className={filteredGeneralEnquiries.length === 1 ? "w-full max-w-[700px]" : "w-full"}>
              <section className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        General Enquiries
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingGeneralCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingGeneralCount} unread
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]">
                    {filteredGeneralEnquiries.length}{" "}
                    {filteredGeneralEnquiries.length === 1 ? "Enquiry" : "Enquiries"}
                  </span>
                </div>

                <div className={filteredGeneralEnquiries.length === 1 ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                  {filteredGeneralEnquiries.map(renderEnquiryCard)}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchAdminEnquiries;
