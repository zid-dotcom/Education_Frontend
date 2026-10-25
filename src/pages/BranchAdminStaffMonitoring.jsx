import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  IndianRupee,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Menu,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BranchAdminSidebar from '../components/layout/BranchAdminSidebar';
import { getBranchAdminStaffMonitoringApi } from '../services/staffMonitoring';
import { getBranchAdminDashboardApi } from '../services/branchadmindashboard';

const PAGE_CSS = `
@keyframes ba-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes ba-fade { from { opacity:0; } to { opacity:1; } }
.ba-rise { animation: ba-rise .35s ease both; }
.ba-fade { animation: ba-fade .2s ease both; }
.custom-staff-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.custom-staff-scrollbar::-webkit-scrollbar-track { background: #FAF8F4; }
.custom-staff-scrollbar::-webkit-scrollbar-thumb { background: #E3DDD0; border-radius: 9999px; }
.custom-staff-scrollbar::-webkit-scrollbar-thumb:hover { background: #9C6B2E; }
`;

// Helper: Normalize verification status
export const getKycStatus = (staff) => {
  if (!staff) return 'pending';
  const raw = String(
    staff.verification_status ||
    (staff.is_verified ? 'approved' : '') ||
    staff.document_status ||
    'pending'
  ).toLowerCase().trim();

  if (raw === 'approved' || raw === 'verified' || staff.is_verified === true) {
    return 'approved';
  }
  if (raw === 'rejected') {
    return 'rejected';
  }
  return 'pending';
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getDocumentFileUrl = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

export const getDocumentList = (staff) => {
  if (!staff) return [];
  const docs = staff.documents || staff.kyc || staff;
  if (!docs || typeof docs !== 'object') return [];
  const items = [
    {
      key: 'aadhaar_front',
      label: 'Aadhaar Card (Front)',
      url: getDocumentFileUrl(docs.aadhaar_front_url || docs.aadhaar_front),
    },
    {
      key: 'aadhaar_back',
      label: 'Aadhaar Card (Back)',
      url: getDocumentFileUrl(docs.aadhaar_back_url || docs.aadhaar_back),
    },
    {
      key: 'pan_card',
      label: 'PAN Card',
      url: getDocumentFileUrl(docs.pan_card_url || docs.pan_card),
    },
    {
      key: 'bank_passbook',
      label: 'Bank Passbook / Cheque',
      url: getDocumentFileUrl(docs.bank_passbook_url || docs.bank_passbook),
    },
    {
      key: 'other_document',
      label: docs.other_document_name || (typeof docs.other_document === 'string' && docs.other_document.split('/').pop()) || 'Qualification / Other Document',
      url: getDocumentFileUrl(docs.other_document_url || docs.other_document),
    },
  ];

  return items.filter((d) => Boolean(d.url));
};

// Helper: Extract courses array and title fields safely
export const extractCourses = (staff) => {
  if (!staff) return [];
  if (Array.isArray(staff.courses) && staff.courses.length > 0) {
    return staff.courses.map((c, i) => {
      if (typeof c === 'string') return { id: i + 1, title: c };
      return {
        id: c.id ?? c.course_id ?? (i + 1),
        title: c.title || c.name || c.course_name || 'Untitled Course',
        code: c.code || c.course_code,
        category: c.category || c.category_name,
        duration: c.duration,
        description: c.description,
        ...c,
      };
    });
  }
  if (Array.isArray(staff.course_names) && staff.course_names.length > 0) {
    return staff.course_names.map((name, i) => ({
      id: staff.course_ids?.[i] ?? (i + 1),
      title: typeof name === 'string' ? name : (name.title || name.name || 'Untitled Course'),
    }));
  }
  if (staff.course_title || staff.course_name) {
    return [{ id: staff.course_id ?? 1, title: staff.course_title || staff.course_name }];
  }
  return [];
};

// Helper: Extract assignments array safely
export const extractAssignments = (staff) => {
  if (!staff) return [];
  const list = Array.isArray(staff.assignments)
    ? staff.assignments
    : (Array.isArray(staff.tasks) ? staff.tasks : []);
  return list.map((a, i) => ({
    id: a.id ?? a.task_id ?? a.assignment_id ?? (i + 1),
    title: a.title || 'Untitled Assignment',
    course_title: a.course_title || a.course_name || a.course?.title || a.course?.name,
    description: a.description || '',
    due_date: a.due_date || a.deadline,
    max_marks: a.max_marks ?? a.total_marks,
    created_at: a.created_at || a.assigned_at,
    assigned_student_count: a.assigned_student_count ?? a.student_count ?? a.students?.length ?? (Array.isArray(a.student_ids) ? a.student_ids.length : null),
    ...a,
  }));
};

// Helper: Extract announcements array safely
export const extractAnnouncements = (staff) => {
  if (!staff) return [];
  const list = Array.isArray(staff.announcements) ? staff.announcements : [];
  return list.map((ann, i) => ({
    id: ann.id ?? ann.announcement_id ?? (i + 1),
    title: ann.title || 'Untitled Announcement',
    course_title: ann.course_title || ann.course_name || ann.course?.title || ann.course?.name,
    message: ann.message || ann.content || '',
    event_date: ann.event_date || ann.scheduled_event_time || ann.event_time || ann.exam_time,
    created_at: ann.created_at,
    ...ann,
  }));
};

// Helper: Extract activities safely
export const extractActivities = (staff) => {
  if (!staff) return [];
  if (Array.isArray(staff.activity) && staff.activity.length > 0) return staff.activity;
  if (Array.isArray(staff.activities) && staff.activities.length > 0) return staff.activities;
  if (Array.isArray(staff.recent_activity) && staff.recent_activity.length > 0) return staff.recent_activity;
  if (Array.isArray(staff.logs) && staff.logs.length > 0) return staff.logs;
  return [];
};

// Helper: Format date
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

// Helper: Format currency/salary safely
export const formatSalary = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN')}`;
};

// Helper: Format Aadhaar with 4-digit spacing
export const formatAadhaar = (val) => {
  if (!val) return '—';
  return String(val).replace(/(\d{4})/g, '$1 ').trim();
};

const BranchAdminStaffMonitoring = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Branch-wide summary stats
  const [branchStats, setBranchStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Branch metadata (Name and Location)
  const [branchInfo, setBranchInfo] = useState(() => {
    let cachedName = user?.branch_name || user?.name || '';
    let cachedLoc = user?.branch_location || user?.location || '';
    try {
      const stored = localStorage.getItem('branchAdminUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.branch_name) cachedName = parsed.branch_name;
        if (parsed.branch_location) cachedLoc = parsed.branch_location;
      }
    } catch {}
    return { name: cachedName, location: cachedLoc };
  });

  // Helper to extract branch name for a staff member
  const getStaffBranchName = (staff) => {
    return (
      staff?.branch_name ||
      staff?.branch?.name ||
      staff?.branch?.branch_name ||
      branchInfo.name ||
      user?.branch_name ||
      'Main Branch'
    );
  };

  // Helper to extract branch location for a staff member
  const getStaffBranchLocation = (staff) => {
    return (
      staff?.branch_location ||
      staff?.location ||
      staff?.branch?.location ||
      staff?.branch?.branch_location ||
      branchInfo.location ||
      user?.branch_location ||
      '—'
    );
  };

  // KYC Filter from Summary Cards: 'all' | 'approved' | 'pending' | 'rejected'
  const [selectedKycFilter, setSelectedKycFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected staff for View Details modal
  const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('courses'); // 'courses' | 'assignments' | 'announcements'

  // Load Staff Monitoring Data & Branch details
  const loadMonitoring = async () => {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('branchAdminToken');
    if (!authToken) return;
    try {
      setLoading(true);
      setError('');

      const [resResult, dashResult] = await Promise.allSettled([
        getBranchAdminStaffMonitoringApi({ offset: 0, limit: 500 }, authToken),
        getBranchAdminDashboardApi(authToken),
      ]);

      let items = [];
      let res = null;
      if (resResult.status === 'fulfilled' && resResult.value) {
        res = resResult.value;
        items = Array.isArray(res) ? res : (res?.staff || res?.items || res?.data || res?.results || []);
      } else if (resResult.status === 'rejected') {
        throw resResult.reason;
      }
      setStaffList(items);

      // Extract branch info from dashboard or monitoring response
      if (dashResult.status === 'fulfilled' && dashResult.value) {
        const d = dashResult.value;
        const bName = d.branch_name || d.name || res?.branch_name || branchInfo.name;
        const bLoc = d.branch_location || d.location || res?.branch_location || branchInfo.location;
        if (bName || bLoc) {
          setBranchInfo({ name: bName || 'Main Branch', location: bLoc || '' });
        }
      } else if (res?.branch_name || res?.branch_location) {
        setBranchInfo({
          name: res.branch_name || branchInfo.name || 'Main Branch',
          location: res.branch_location || branchInfo.location || '',
        });
      }

      // Check if API returns pre-aggregated stats in response object
      const apiTotal = res?.total_staff ?? res?.total;
      const apiApproved = res?.kyc_approved ?? res?.approved ?? res?.approved_count;
      const apiPending = res?.kyc_pending ?? res?.pending ?? res?.pending_count;
      const apiRejected = res?.kyc_rejected ?? res?.rejected ?? res?.rejected_count;

      if (apiTotal !== undefined && apiApproved !== undefined && apiRejected !== undefined) {
        setBranchStats({
          total: Number(apiTotal),
          approved: Number(apiApproved),
          pending: Number(apiPending ?? 0),
          rejected: Number(apiRejected),
        });
      } else {
        // Calculate dynamically from the full branch staff dataset
        const total = items.length;
        const approved = items.filter((s) => getKycStatus(s) === 'approved').length;
        const pending = items.filter((s) => getKycStatus(s) === 'pending').length;
        const rejected = items.filter((s) => getKycStatus(s) === 'rejected').length;

        setBranchStats({ total, approved, pending, rejected });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load branch staff monitoring data.');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, [token]);

  // Filter staff by selected KYC card and search query (including branch name and location)
  const filteredStaff = useMemo(() => {
    let list = staffList;
    if (selectedKycFilter !== 'all') {
      list = list.filter((s) => getKycStatus(s) === selectedKycFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => {
      const name = (s.name || s.staff_name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const code = (s.staff_code || s.code || '').toLowerCase();
      const status = (s.status || '').toLowerCase();
      const bName = getStaffBranchName(s).toLowerCase();
      const bLoc = getStaffBranchLocation(s).toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        code.includes(q) ||
        status.includes(q) ||
        bName.includes(q) ||
        bLoc.includes(q)
      );
    });
  }, [staffList, selectedKycFilter, searchQuery, branchInfo]);

  // Modal data for selected staff member
  const modalCourses = useMemo(() => extractCourses(selectedStaffDetail), [selectedStaffDetail]);
  const modalAssignments = useMemo(() => extractAssignments(selectedStaffDetail), [selectedStaffDetail]);
  const modalAnnouncements = useMemo(() => extractAnnouncements(selectedStaffDetail), [selectedStaffDetail]);
  const modalKycStatus = useMemo(() => getKycStatus(selectedStaffDetail), [selectedStaffDetail]);
  const modalDocuments = useMemo(() => getDocumentList(selectedStaffDetail), [selectedStaffDetail]);

  const [copiedField, setCopiedField] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const openViewDetails = (staff) => {
    setSelectedStaffDetail(staff);
    setModalActiveTab('documents');
  };

  return (
    <div className="min-h-screen md:flex bg-[#FAF8F4]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{PAGE_CSS}</style>

      {/* Sidebar with navigate, user and full scrolling support */}
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="staff-monitoring"
        logout={logout}
      />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl bg-[#faf8f4] border border-[#e3ddd0] p-2 text-[#17140f] hover:bg-[#f1ede4] transition md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Staff Monitoring
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/branch-admin/staff-verification"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3DDD0] bg-white text-xs font-bold text-slate-700 hover:bg-[#F1EDE4] transition shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Verify Documents</span>
            </Link>
            <Link
              to="/branch-admin/staff"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3DDD0] bg-white text-xs font-bold text-slate-700 hover:bg-[#F1EDE4] transition shadow-2xs"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span className="hidden sm:inline">Staff Accounts</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3 ba-fade">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => loadMonitoring()}
                className="underline hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. Four Interactive Summary Filter Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Staff -> Show All */}
            <button
              type="button"
              onClick={() => setSelectedKycFilter('all')}
              className={`text-left rounded-2xl border p-4 shadow-2xs transition-all cursor-pointer ba-rise ${
                selectedKycFilter === 'all'
                  ? 'border-[#9C6B2E] bg-[#FAF8F4] ring-2 ring-[#9C6B2E]/20'
                  : 'border-[#E3DDD0] bg-white hover:border-[#9C6B2E]/40'
              }`}
            >
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
                <Users className="h-4 w-4 text-[#9C6B2E]" />
              </div>
              <p className="text-2xl font-bold text-[#17140F]">{branchStats.total}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selectedKycFilter === 'all' ? '● Showing all staff' : 'Click to show all'}
              </p>
            </button>

            {/* Card 2: KYC Approved -> Filter Approved */}
            <button
              type="button"
              onClick={() => setSelectedKycFilter('approved')}
              className={`text-left rounded-2xl border p-4 shadow-2xs transition-all cursor-pointer ba-rise ${
                selectedKycFilter === 'approved'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-[#E3DDD0] bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">KYC Approved</span>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{branchStats.approved}</p>
              <p className="text-[10px] text-emerald-600/70 mt-0.5">
                {selectedKycFilter === 'approved' ? '● Showing approved' : 'Click to filter approved'}
              </p>
            </button>

            {/* Card 3: KYC Pending -> Filter Pending */}
            <button
              type="button"
              onClick={() => setSelectedKycFilter('pending')}
              className={`text-left rounded-2xl border p-4 shadow-2xs transition-all cursor-pointer ba-rise ${
                selectedKycFilter === 'pending'
                  ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                  : 'border-[#E3DDD0] bg-white hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">KYC Pending</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{branchStats.pending}</p>
              <p className="text-[10px] text-amber-600/70 mt-0.5">
                {selectedKycFilter === 'pending' ? '● Showing pending' : 'Click to filter pending'}
              </p>
            </button>

            {/* Card 4: KYC Rejected -> Filter Rejected */}
            <button
              type="button"
              onClick={() => setSelectedKycFilter('rejected')}
              className={`text-left rounded-2xl border p-4 shadow-2xs transition-all cursor-pointer ba-rise ${
                selectedKycFilter === 'rejected'
                  ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                  : 'border-[#E3DDD0] bg-white hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">KYC Rejected</span>
                <XCircle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-bold text-rose-700">{branchStats.rejected}</p>
              <p className="text-[10px] text-rose-600/70 mt-0.5">
                {selectedKycFilter === 'rejected' ? '● Showing rejected' : 'Click to filter rejected'}
              </p>
            </button>
          </div>

          {/* Search & Actions Bar */}
          <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, code, email, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadMonitoring()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] text-xs font-bold text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#9C6B2E]' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="rounded-2xl border border-[#E3DDD0] bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E3DDD0] bg-[#FAF8F4]/80 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-[#17140F]">Branch Staff Monitoring</h2>
                <p className="text-[11px] text-[#8A8175]">
                  Showing {filteredStaff.length} of {staffList.length} staff records
                  {selectedKycFilter !== 'all' && (
                    <span className="ml-1.5 font-semibold text-[#9C6B2E] capitalize">
                      (Filtered: {selectedKycFilter})
                    </span>
                  )}
                </p>
              </div>

              {selectedKycFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedKycFilter('all')}
                  className="text-xs font-semibold text-[#9C6B2E] hover:underline cursor-pointer"
                >
                  Clear Filter (Show All)
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
                <p className="text-xs font-semibold text-[#8A8175]">Loading branch staff records...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No staff records found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedKycFilter !== 'all'
                    ? `No staff with KYC status "${selectedKycFilter}".`
                    : searchQuery
                    ? 'Try adjusting your search query.'
                    : 'No staff currently registered in this branch.'}
                </p>
                {selectedKycFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedKycFilter('all')}
                    className="mt-3 inline-flex items-center px-3 py-1.5 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] text-xs font-semibold text-[#9C6B2E] hover:bg-[#F1EDE4] cursor-pointer"
                  >
                    Show all staff
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F4]/50 text-[10px] font-bold uppercase tracking-wider text-[#8A8175] border-b border-[#E3DDD0]">
                    <tr>
                      <th className="py-3 px-6">Staff Member</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Branch Name</th>
                      <th className="py-3 px-4">Branch Location</th>
                      <th className="py-3 px-4">KYC Verification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3DDD0]/60">
                    {filteredStaff.map((staff, idx) => {
                      const staffName = staff.name || staff.staff_name || 'Staff Member';
                      const initial = staffName.charAt(0).toUpperCase();
                      const staffCode = staff.staff_code || staff.code || (staff.id ? `STF-${staff.id}` : null);
                      const kyc = getKycStatus(staff);
                      const isApproved = kyc === 'approved';
                      const isRejected = kyc === 'rejected';

                      // Status from actual data
                      const rawStatus = String(staff.status || 'Active').trim();
                      const isStatusActive = rawStatus.toLowerCase() === 'active';

                      const staffBranchName = getStaffBranchName(staff);
                      const staffBranchLoc = getStaffBranchLocation(staff);

                      return (
                        <tr key={staff.id || idx} className="hover:bg-[#FAF8F4]/40 transition">
                          {/* Staff Info */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0] flex items-center justify-center font-bold text-xs shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 truncate">{staffName}</span>
                                  {staffCode && (
                                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {staffCode}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#8A8175] block mt-0.5">
                                  {staff.designation || 'Faculty Instructor'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col text-[11px] text-slate-600">
                              {staff.email && (
                                <span className="flex items-center gap-1 truncate max-w-[180px]">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  {staff.email}
                                </span>
                              )}
                              {staff.phone && (
                                <span className="flex items-center gap-1 text-slate-500 mt-0.5">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {staff.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Branch Name Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                              <Building2 className="h-3.5 w-3.5 text-[#9C6B2E] shrink-0" />
                              <span className="truncate max-w-[160px]" title={staffBranchName}>{staffBranchName}</span>
                            </div>
                          </td>

                          {/* Branch Location Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]" title={staffBranchLoc}>{staffBranchLoc}</span>
                            </div>
                          </td>

                          {/* Verification Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="h-3 w-3" />
                                Approved
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Status (Directly from API data) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border capitalize ${
                                isStatusActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isStatusActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {rawStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openViewDetails(staff)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3DDD0] bg-white text-xs font-bold text-[#9C6B2E] hover:bg-[#F1EDE4] transition cursor-pointer"
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
            )}
          </div>
        </div>
      </main>

      {/* 3. Expanded View Details Modal */}
      {selectedStaffDetail &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm ba-fade"
            onClick={() => setSelectedStaffDetail(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#E3DDD0] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ba-rise"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-[#E3DDD0] bg-white shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0] flex items-center justify-center font-bold text-base shrink-0">
                    {(selectedStaffDetail.name || selectedStaffDetail.staff_name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#17140F]">
                        {selectedStaffDetail.name || selectedStaffDetail.staff_name || 'Staff Member'}
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {selectedStaffDetail.staff_code || (selectedStaffDetail.id ? `STF-${selectedStaffDetail.id}` : 'Staff')}
                      </span>
                    </div>
                    <p className="text-xs text-[#8A8175] mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{selectedStaffDetail.designation || 'Faculty Instructor'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                        {getStaffBranchName(selectedStaffDetail)}
                      </span>
                      {getStaffBranchLocation(selectedStaffDetail) && getStaffBranchLocation(selectedStaffDetail) !== '—' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {getStaffBranchLocation(selectedStaffDetail)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Staff Information Overview: Structural Table Format */}
              <div className="px-6 pt-4 pb-3 bg-white shrink-0">
                <div className="rounded-2xl border border-[#E3DDD0] bg-white overflow-hidden shadow-xs">
                  <div className="overflow-x-auto custom-staff-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[680px]">
                      <tbody>
                        {/* Row 1: Full Name & Staff ID */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Full Name
                          </th>
                          <td className="w-[32%] bg-white text-xs font-bold text-slate-900 px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            {selectedStaffDetail.name || selectedStaffDetail.staff_name || '—'}
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Staff ID / Code
                          </th>
                          <td className="w-[32%] bg-white text-xs font-mono font-semibold text-slate-800 px-3.5 py-2.5 align-middle">
                            <span className="inline-block bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#E3DDD0]/80">
                              {selectedStaffDetail.staff_code || (selectedStaffDetail.id ? `STF-${selectedStaffDetail.id}` : '—')}
                            </span>
                          </td>
                        </tr>

                        {/* Row 2: Account Status & KYC Status */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Account Status
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border capitalize ${
                              String(selectedStaffDetail.status).toLowerCase() === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                String(selectedStaffDetail.status).toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`} />
                              {selectedStaffDetail.status || 'Active'}
                            </span>
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            KYC Verification
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 align-middle">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                              modalKycStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : modalKycStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {modalKycStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                              {modalKycStatus === 'rejected' && <XCircle className="h-3 w-3" />}
                              {modalKycStatus === 'pending' && <AlertCircle className="h-3 w-3" />}
                              <span className="capitalize">{modalKycStatus}</span>
                            </span>
                          </td>
                        </tr>

                        {/* Row 3: Salary & Date Joined */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Monthly Salary
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-mono">
                                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                                {formatSalary(selectedStaffDetail.salary ?? selectedStaffDetail.monthly_salary ?? selectedStaffDetail.basic_salary).replace('₹', '')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">/ month</span>
                            </div>
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Date Joined
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 align-middle">
                            {formatDate(selectedStaffDetail.created_at)}
                          </td>
                        </tr>

                        {/* Row 4: Email Address & Phone Number */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Email Address
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle break-all">
                            {selectedStaffDetail.email || '—'}
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Phone Number
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 align-middle">
                            {selectedStaffDetail.phone || '—'}
                          </td>
                        </tr>

                        {/* Row 5: Branch Name & Branch Location */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Branch Name
                          </th>
                          <td className="w-[32%] bg-white text-xs font-bold text-slate-900 px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle leading-snug">
                            {getStaffBranchName(selectedStaffDetail)}
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Branch Location
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 align-middle">
                            {getStaffBranchLocation(selectedStaffDetail)}
                          </td>
                        </tr>

                        {/* Row 6: Aadhaar Number & PAN Card */}
                        <tr className="border-b border-[#E3DDD0]">
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Aadhaar Number
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-slate-900">
                                {formatAadhaar(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number)}
                              </span>
                              {(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number, 'tbl_aadhaar')}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Copy Aadhaar Number"
                                >
                                  {copiedField === 'tbl_aadhaar' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            PAN Card
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 align-middle">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-slate-900 uppercase">
                                {selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number || '—'}
                              </span>
                              {(selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number, 'tbl_pan')}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Copy PAN Number"
                                >
                                  {copiedField === 'tbl_pan' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Row 7: Bank Account & Bank IFSC */}
                        <tr>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Bank Account
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-slate-900 truncate" title={selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number}>
                                {selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number || '—'}
                              </span>
                              {(selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number, 'tbl_bank')}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Copy Bank Account Number"
                                >
                                  {copiedField === 'tbl_bank' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <th className="w-[18%] bg-[#FAF8F4] text-[#8A8175] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 border-r border-[#E3DDD0] align-middle">
                            Bank IFSC
                          </th>
                          <td className="w-[32%] bg-white text-xs font-semibold px-3.5 py-2.5 align-middle">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-slate-900 uppercase">
                                {selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc || '—'}
                              </span>
                              {(selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc, 'tbl_ifsc')}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Copy Bank IFSC"
                                >
                                  {copiedField === 'tbl_ifsc' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Tabs Bar */}
              <div className="flex items-center gap-1 border-b border-[#E3DDD0] px-6 pt-2 bg-[#FAF8F4]/50 shrink-0 overflow-x-auto">
                {/* 1. KYC & Documents Tab */}
                <button
                  type="button"
                  onClick={() => setModalActiveTab('documents')}
                  className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'documents'
                      ? 'border-[#9C6B2E] text-[#9C6B2E]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>KYC & Documents</span>
                  <span className="ml-1 rounded-full px-2 py-0.2 text-[10px] bg-[#F1EDE4] text-[#9C6B2E]">
                    {modalDocuments.length}
                  </span>
                </button>

                {/* 2. Assigned Courses Tab */}
                <button
                  type="button"
                  onClick={() => setModalActiveTab('courses')}
                  className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'courses'
                      ? 'border-[#9C6B2E] text-[#9C6B2E]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Assigned Courses</span>
                  <span className="ml-1 rounded-full px-2 py-0.2 text-[10px] bg-[#F1EDE4] text-[#9C6B2E]">
                    {modalCourses.length}
                  </span>
                </button>

                {/* 3. Assignments Tab */}
                <button
                  type="button"
                  onClick={() => setModalActiveTab('assignments')}
                  className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'assignments'
                      ? 'border-[#9C6B2E] text-[#9C6B2E]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Assignments</span>
                  <span className="ml-1 rounded-full px-2 py-0.2 text-[10px] bg-[#F1EDE4] text-[#9C6B2E]">
                    {modalAssignments.length}
                  </span>
                </button>

                {/* 4. Announcements Tab */}
                <button
                  type="button"
                  onClick={() => setModalActiveTab('announcements')}
                  className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'announcements'
                      ? 'border-[#9C6B2E] text-[#9C6B2E]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Announcements</span>
                  <span className="ml-1 rounded-full px-2 py-0.2 text-[10px] bg-[#F1EDE4] text-[#9C6B2E]">
                    {modalAnnouncements.length}
                  </span>
                </button>
              </div>

              {/* Modal Body: Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1 min-h-[260px] max-h-[50vh] space-y-4 custom-staff-scrollbar bg-white">
                {/* TAB: KYC & Documents */}
                {modalActiveTab === 'documents' && (
                  <div className="space-y-5">
                    {/* Identification & Banking Information Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5 text-[#9C6B2E]" />
                          <span>Banking & Identification Details</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Aadhaar Number */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 min-w-0 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              Aadhaar Number
                            </span>
                            {(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number) && (
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number, 'aadhaar')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition cursor-pointer shrink-0"
                                title="Copy Aadhaar Number"
                              >
                                {copiedField === 'aadhaar' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-wider whitespace-nowrap overflow-x-auto select-all">
                            {(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number)
                              ? String(selectedStaffDetail.aadhaar_number || selectedStaffDetail.documents?.aadhaar_number).replace(/(\d{4})/g, '$1 ').trim()
                              : 'Not provided'}
                          </p>
                        </div>

                        {/* PAN Card */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 min-w-0 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              PAN Card Number
                            </span>
                            {(selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number) && (
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number, 'pan')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition cursor-pointer shrink-0"
                                title="Copy PAN Number"
                              >
                                {copiedField === 'pan' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-mono font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wider whitespace-nowrap overflow-x-auto select-all">
                            {selectedStaffDetail.pan_number || selectedStaffDetail.documents?.pan_number || 'Not provided'}
                          </p>
                        </div>

                        {/* Bank Account Number */}
                        <div className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/50 min-w-0 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                              Bank Account No.
                            </span>
                            {(selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number) && (
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number, 'account')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition cursor-pointer shrink-0"
                                title="Copy Account Number"
                              >
                                {copiedField === 'account' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-wider whitespace-nowrap overflow-x-auto select-all">
                            {selectedStaffDetail.bank_account_number || selectedStaffDetail.documents?.bank_account_number || 'Not provided'}
                          </p>
                        </div>

                        {/* Bank IFSC Code */}
                        <div className="p-4 rounded-2xl border border-blue-200/90 bg-blue-50/50 min-w-0 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                              Bank IFSC Code
                            </span>
                            {(selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc) && (
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc, 'ifsc')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 transition cursor-pointer shrink-0"
                                title="Copy IFSC Code"
                              >
                                {copiedField === 'ifsc' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-mono font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wider whitespace-nowrap overflow-x-auto select-all">
                            {selectedStaffDetail.bank_ifsc || selectedStaffDetail.documents?.bank_ifsc || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Verification Documents */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileCheck2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                          <span>Uploaded Verification Documents ({modalDocuments.length})</span>
                        </h4>
                      </div>

                      {modalDocuments.length === 0 ? (
                        <div className="py-10 text-center bg-[#FAF8F4]/50 rounded-2xl border border-dashed border-[#E3DDD0]">
                          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No documents uploaded</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">No digital document attachments were found for this staff member.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {modalDocuments.map((doc) => (
                            <div
                              key={doc.key}
                              className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-3.5 flex items-center justify-between gap-3 hover:border-[#c9bea9] transition shadow-xs"
                            >
                              <div className="min-w-0 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E3DDD0] text-[#9C6B2E] shrink-0">
                                  <FileCheck2 className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-xs" title={doc.label}>
                                    {doc.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Verified Government Document</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-[#E3DDD0] hover:bg-[#F1EDE4] transition cursor-pointer"
                                  title="Preview document"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#9C6B2E]" />
                                  <span>Preview</span>
                                </button>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#17140f] bg-white border border-[#E3DDD0] hover:bg-[#F1EDE4] transition"
                                  title="Open in new tab"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: Assigned Courses */}
                {modalActiveTab === 'courses' && (
                  <div>
                    {modalCourses.length === 0 ? (
                      <div className="py-12 text-center bg-[#FAF8F4]/50 rounded-2xl border border-dashed border-[#E3DDD0]">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No courses assigned</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">This staff member currently has no courses assigned.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {modalCourses.map((course, i) => (
                          <div
                            key={course.id || i}
                            className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="h-8 w-8 rounded-xl bg-white border border-[#E3DDD0] text-[#9C6B2E] flex items-center justify-center shrink-0 mt-0.5">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-900 leading-snug truncate" title={course.title}>
                                    {course.title}
                                  </h5>
                                  {course.id && (
                                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                      Course ID: #{course.id}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {course.code && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#E3DDD0] text-slate-600 shrink-0">
                                  {course.code}
                                </span>
                              )}
                            </div>

                            {(course.category || course.duration || course.description) && (
                              <div className="mt-3 pt-2.5 border-t border-[#E3DDD0]/70 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                {course.category && (
                                  <span className="bg-white px-2 py-0.5 rounded border border-[#E3DDD0] font-medium text-slate-600">
                                    {course.category}
                                  </span>
                                )}
                                {course.duration && (
                                  <span>Duration: {course.duration}</span>
                                )}
                                {course.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 w-full mt-1">
                                    {course.description}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Assignments */}
                {modalActiveTab === 'assignments' && (
                  <div className="space-y-3">
                    {modalAssignments.length === 0 ? (
                      <div className="py-12 text-center bg-[#FAF8F4]/50 rounded-2xl border border-dashed border-[#E3DDD0]">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No assignments available</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No assignments published by this staff member.</p>
                      </div>
                    ) : (
                      modalAssignments.map((assignment, i) => (
                        <div
                          key={assignment.id || i}
                          className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-xl bg-white border border-[#E3DDD0] text-[#9C6B2E] flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate" title={assignment.title}>
                                  {assignment.title}
                                </h5>
                                {assignment.course_title && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9C6B2E] mt-0.5">
                                    <BookOpen className="h-2.5 w-2.5" />
                                    <span>{assignment.course_title}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            {assignment.max_marks !== undefined && assignment.max_marks !== null && (
                              <span className="px-2 py-0.5 rounded-lg bg-white border border-[#E3DDD0] text-[10px] font-bold text-slate-700 shrink-0">
                                Max: {assignment.max_marks} marks
                              </span>
                            )}
                          </div>

                          {assignment.description && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-[#E3DDD0]/60">
                              {assignment.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 pt-1">
                            {assignment.due_date && (
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                Due: {formatDate(assignment.due_date)}
                              </span>
                            )}
                            {assignment.created_at && (
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 text-slate-400" />
                                Created: {formatDate(assignment.created_at)}
                              </span>
                            )}
                            {assignment.assigned_student_count !== null && assignment.assigned_student_count !== undefined && (
                              <span className="flex items-center gap-1 font-semibold text-[#9C6B2E]">
                                <Users className="h-3 w-3" />
                                {assignment.assigned_student_count} student{assignment.assigned_student_count !== 1 ? 's' : ''} assigned
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: Announcements */}
                {modalActiveTab === 'announcements' && (
                  <div className="space-y-3">
                    {modalAnnouncements.length === 0 ? (
                      <div className="py-12 text-center bg-[#FAF8F4]/50 rounded-2xl border border-dashed border-[#E3DDD0]">
                        <Megaphone className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No announcements available</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No announcements made by this staff member.</p>
                      </div>
                    ) : (
                      modalAnnouncements.map((ann, i) => (
                        <div
                          key={ann.id || i}
                          className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-xl bg-white border border-[#E3DDD0] text-[#9C6B2E] flex items-center justify-center shrink-0 mt-0.5">
                                <Megaphone className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate" title={ann.title}>
                                  {ann.title}
                                </h5>
                                {ann.course_title && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9C6B2E] mt-0.5">
                                    <BookOpen className="h-2.5 w-2.5" />
                                    <span>{ann.course_title}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {ann.message && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-[#E3DDD0]/60">
                              {ann.message}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 pt-1">
                            {ann.event_date && (
                              <span className="flex items-center gap-1 font-medium text-amber-700">
                                <Calendar className="h-3 w-3" />
                                Event: {formatDate(ann.event_date)}
                              </span>
                            )}
                            {ann.created_at && (
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 text-slate-400" />
                                Posted: {formatDate(ann.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* KYC & Verification Actions Footer */}
              <div className="flex items-center justify-between border-t border-[#E3DDD0] px-6 py-4 bg-[#FAF8F4]/80 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Verification Status:
                  </span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    modalKycStatus === 'approved' ? 'text-emerald-700' : modalKycStatus === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {modalKycStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffDetail(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#F1EDE4] transition border border-[#E3DDD0] cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    to="/branch-admin/staff-verification"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#9C6B2E] text-white hover:bg-[#855923] transition shadow-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verify Documents</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Lightbox Modal for Document Preview */}
      {previewDoc &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm ba-fade"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col border border-[#E3DDD0] ba-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E3DDD0] px-5 py-3.5 bg-[#FAF8F4]">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="h-4 w-4 text-[#9C6B2E] shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {previewDoc.label}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition"
                  >
                    <span>Full View</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                    aria-label="Close Preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[calc(92vh-65px)] min-h-[280px]">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.label}
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none' }} className="flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-12 w-12 text-[#9C6B2E] mb-3" />
                  <p className="text-sm font-bold text-slate-800">Preview not directly displayable</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">This document might be a PDF or protected file.</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#9C6B2E] text-white hover:bg-[#855923] transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Document File</span>
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default BranchAdminStaffMonitoring;
