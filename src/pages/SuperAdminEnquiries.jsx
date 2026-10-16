import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminRecordsEnquiriesApi } from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(14px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .3s cubic-bezier(.16,1,.3,1) both; }
`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const safeStr =
      typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')
        ? dateStr.replace(' ', 'T')
        : dateStr;
    const d = new Date(safeStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
};

const SuperAdminEnquiries = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [enquiries, setEnquiries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ADMISSION, GENERAL
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, READ
  const [selectedEnquiryModal, setSelectedEnquiryModal] = useState(null);

  // Helper to determine if branch admin has read the enquiry
  const isBranchAdminRead = (enq) => {
    const baStatus = String(enq?.branch_admin_status || '').toLowerCase().trim();
    if (baStatus === 'read' || baStatus === 'completed') return true;
    if (enq?.branch_admin_read_at) return true;
    if (enq?.is_read === true) return true;
    return false;
  };

  const pendingCount = useMemo(() => {
    return enquiries.filter((e) => !isBranchAdminRead(e)).length;
  }, [enquiries]);

  const readCount = useMemo(() => {
    return enquiries.filter((e) => isBranchAdminRead(e)).length;
  }, [enquiries]);

  const fetchEnquiries = async (isManualRefresh = false) => {
    if (!token) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await getSuperAdminRecordsEnquiriesApi(token);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.enquiries)
        ? res.enquiries
        : [];
      
      const total = typeof res?.total_enquiries === 'number' ? res.total_enquiries : list.length;

      setEnquiries(list);
      setTotalCount(total);
    } catch (err) {
      setError(err?.message || 'Failed to load enquiries from server.');
      setEnquiries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [token]);

  // Distinct branches list for dropdown
  const uniqueBranches = useMemo(() => {
    const map = new Map();
    enquiries.forEach((item) => {
      const bId = item.branch_id;
      const bName = item.branch_name || `Branch #${bId}`;
      if (bId) {
        map.set(String(bId), { id: String(bId), name: bName, location: item.branch_location });
      }
    });
    return Array.from(map.values());
  }, [enquiries]);

  // Helper to categorize enquiry type
  const isGeneralEnquiry = (enq) => {
    const course = (enq.course || '').toLowerCase();
    const type = (enq.enquiry_type || enq.type || '').toLowerCase();
    return course.includes('general') || type.includes('general');
  };

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // Tab filter
      if (activeTab === 'GENERAL' && !isGeneralEnquiry(item)) return false;
      if (activeTab === 'ADMISSION' && isGeneralEnquiry(item)) return false;

      // Status filter
      if (statusFilter === 'PENDING' && isBranchAdminRead(item)) return false;
      if (statusFilter === 'READ' && !isBranchAdminRead(item)) return false;

      // Branch filter
      if (selectedBranch !== 'ALL' && String(item.branch_id) !== String(selectedBranch)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(q);
        const emailMatch = item.email?.toLowerCase().includes(q);
        const phoneMatch = item.phone?.toLowerCase().includes(q);
        const courseMatch = item.course?.toLowerCase().includes(q);
        const branchMatch = item.branch_name?.toLowerCase().includes(q);
        const msgMatch = item.message?.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || courseMatch || branchMatch || msgMatch;
      }

      return true;
    });
  }, [enquiries, activeTab, statusFilter, selectedBranch, searchQuery]);

  // Breakdown counts
  const tabCounts = useMemo(() => {
    let general = 0;
    let admission = 0;
    enquiries.forEach((e) => {
      if (isGeneralEnquiry(e)) general++;
      else admission++;
    });
    return { all: enquiries.length, general, admission };
  }, [enquiries]);

  return (
    <div
      className="min-h-screen md:flex"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="enquiries"
      />

      <main className="min-w-0 flex-1">
        {/* Page Top Header */}
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>
              Super Admin Records
            </p>
            <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
              Student Enquiries
            </h1>
          </div>
          <button
            onClick={() => fetchEnquiries(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition hover:bg-[#f8f5ee] disabled:opacity-50"
            style={{ borderColor: '#e3ddd0', color: '#5b5346', background: '#ffffff' }}
            title="Refresh Enquiries"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <span>{error}</span>
              <button
                onClick={() => fetchEnquiries(false)}
                className="text-xs font-bold underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div
              onClick={() => {
                setActiveTab('ALL');
                setStatusFilter('ALL');
              }}
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer hover:border-[#ebd9b3] hover:shadow-md transition-all duration-200"
              style={{ borderColor: activeTab === 'ALL' && statusFilter === 'ALL' ? '#9c6b2e' : '#e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Total Enquiries</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8edcf] text-[#9c6b2e]">
                  <MessageCircle className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {totalCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">All recorded queries</p>
            </div>

            <div
              onClick={() => setStatusFilter((prev) => (prev === 'PENDING' ? 'ALL' : 'PENDING'))}
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer hover:border-[#ebd9b3] hover:shadow-md transition-all duration-200"
              style={{ borderColor: statusFilter === 'PENDING' ? '#b91c1c' : '#e3ddd0', animationDelay: '40ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Pending Action</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fee2e2] text-rose-700">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {pendingCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Awaiting branch review</p>
            </div>

            <div
              onClick={() => setStatusFilter((prev) => (prev === 'READ' ? 'ALL' : 'READ'))}
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer hover:border-[#ebd9b3] hover:shadow-md transition-all duration-200"
              style={{ borderColor: statusFilter === 'READ' ? '#2e7d32' : '#e3ddd0', animationDelay: '60ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Read Enquiries</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3ea] text-[#2e7d32]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {readCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Reviewed by branch</p>
            </div>

            <div
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs"
              style={{ borderColor: '#e3ddd0', animationDelay: '80ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Active Branches</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3ea] text-[#2e7d32]">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {uniqueBranches.length}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Branches with enquiries</p>
            </div>

            <div
              onClick={() => setActiveTab('ADMISSION')}
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer hover:border-[#ebd9b3] hover:shadow-md transition-all duration-200"
              style={{ borderColor: activeTab === 'ADMISSION' ? '#9c6b2e' : '#e3ddd0', animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Admissions</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7] text-[#9c6b2e]">
                  <GraduationCap className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {tabCounts.admission}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Course applications</p>
            </div>

            <div
              onClick={() => setActiveTab('GENERAL')}
              className="sa-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer hover:border-[#ebd9b3] hover:shadow-md transition-all duration-200"
              style={{ borderColor: activeTab === 'GENERAL' ? '#9c6b2e' : '#e3ddd0', animationDelay: '120ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">General</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8edcf] text-[#9c6b2e]">
                  <MessageCircle className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {tabCounts.general}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">General inquiries</p>
            </div>
          </div>

          {/* Control Bar: Tabs, Branch Filter, Status Filter & Search */}
          <div
            className="rounded-2xl border bg-white p-4 sm:p-5 space-y-4 shadow-xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 lg:border-b-0 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeTab === 'ALL'
                      ? 'bg-[#17140f] text-white shadow-xs'
                      : 'bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]'
                  }`}
                >
                  All ({tabCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ADMISSION')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeTab === 'ADMISSION'
                      ? 'bg-[#17140f] text-white shadow-xs'
                      : 'bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]'
                  }`}
                >
                  Admission ({tabCounts.admission})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('GENERAL')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeTab === 'GENERAL'
                      ? 'bg-[#17140f] text-white shadow-xs'
                      : 'bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]'
                  }`}
                >
                  General ({tabCounts.general})
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Branch selector */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Branches ({uniqueBranches.length})</option>
                  {uniqueBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending ({pendingCount})</option>
                  <option value="READ">Read ({readCount})</option>
                </select>

                {/* Search */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search enquiries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-7 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enquiries Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#9c6b2e]" />
              <p className="mt-3 text-sm font-semibold text-[#8a7b68]">Loading all enquiries...</p>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-12 text-center"
              style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3
                className="mt-4 text-lg font-bold text-[#17140f]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {enquiries.length === 0 ? 'No enquiries found' : 'No matching enquiries found'}
              </h3>
              <p className="mt-1 text-xs text-[#8a7b68]">
                {enquiries.length === 0
                  ? 'There are currently no enquiries submitted across branches.'
                  : 'Try adjusting your search criteria or resetting filters.'}
              </p>
              {enquiries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBranch('ALL');
                    setActiveTab('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-slate-800"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnquiries.map((enq, idx) => {
                const isGeneral = isGeneralEnquiry(enq);
                const isRead = isBranchAdminRead(enq);
                const isPending = !isRead;
                const branchReadAt = enq.branch_admin_read_at || enq.read_at;

                return (
                  <article
                    key={enq.id ?? idx}
                    className="sa-rise flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#c9bea9] hover:shadow-md"
                    style={{ borderColor: '#e3ddd0', animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                  >
                    <div>
                      {/* Top Bar: Name & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-base text-[#17140f]">{enq.name || 'Anonymous'}</h3>
                          <span className="mt-0.5 text-xs font-medium flex items-center gap-1.5 text-[#8a7b68]">
                            <Calendar className="w-3.5 h-3.5 text-[#9c6b2e]" />
                            Submitted: {formatDate(enq.created_at)}
                          </span>
                        </div>
                        <span
                          title={branchReadAt ? `Read on ${formatDateTime(branchReadAt)}` : undefined}
                          className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isRead
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {isRead ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Read</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Branch Info Pill */}
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1 text-xs font-medium text-[#5b5346]">
                          <Building2 className="h-3.5 w-3.5 text-[#9c6b2e]" />
                          <span className="truncate max-w-[200px]">{enq.branch_name || `Branch #${enq.branch_id || '—'}`}</span>
                        </span>
                        {enq.branch_location && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#8a7b68]">
                            <MapPin className="h-3 w-3 text-[#a39a8c]" />
                            <span className="truncate max-w-[140px]">{enq.branch_location}</span>
                          </span>
                        )}
                      </div>

                      {/* Course / General Enquiry & Qualification Tags */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1 text-xs font-medium text-[#17140f]">
                          {isGeneral ? (
                            <MessageCircle className="h-3.5 w-3.5 text-[#9c6b2e]" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5 text-[#9c6b2e]" />
                          )}
                          <span className="truncate max-w-[220px]">{enq.course || 'General Enquiry'}</span>
                        </span>
                        {enq.qualification && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1 text-xs font-medium text-[#5b5346]">
                            <GraduationCap className="h-3.5 w-3.5 text-[#a39a8c]" />
                            <span className="truncate">{enq.qualification}</span>
                          </span>
                        )}
                      </div>

                      {/* Message section */}
                      {enq.message && (
                        <div className="p-3.5 rounded-xl text-xs bg-[#faf8f4] border border-[#e3ddd0] text-[#17140f]">
                          <p className="text-[11px] font-medium text-[#8a7b68] mb-1">
                            Message:
                          </p>
                          <p className="text-[#3d372e] leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {enq.message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Info: Phone, Email, Branch Status */}
                    <div className="mt-4 border-t border-[#f0ebe0] pt-3.5 space-y-2.5">
                      <div className="space-y-1.5 text-xs text-[#5b5346]">
                        {enq.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-[#a39a8c] shrink-0" />
                            <a href={`tel:${enq.phone}`} className="hover:underline">{enq.phone}</a>
                          </p>
                        )}
                        {enq.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-[#a39a8c] shrink-0" />
                            <a href={`mailto:${enq.email}`} className="hover:underline truncate">{enq.email}</a>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[#8a7b68] font-medium">
                            Branch Read Status:{' '}
                            <strong
                              className={
                                isRead
                                  ? 'text-emerald-700 font-bold'
                                  : 'text-red-600 font-bold'
                              }
                            >
                              {isRead ? 'Read' : 'Pending'}
                            </strong>
                          </p>
                          {branchReadAt && (
                            <p className="text-[11px] text-[#8a7b68] mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#9c6b2e] shrink-0" />
                              <span>
                                Read at:{' '}
                                <span className="font-semibold text-[#17140f]">
                                  {formatDateTime(branchReadAt)}
                                </span>
                              </span>
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiryModal(enq)}
                          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17140f] bg-[#faf8f4] border border-[#e3ddd0] hover:bg-[#f1ede4] transition shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#9c6b2e]" /> Details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Enquiry Details Modal */}
      {selectedEnquiryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setSelectedEnquiryModal(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#e3ddd0] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#faf8f4] border border-[#e3ddd0] px-2.5 py-0.5 text-[10px] font-semibold text-[#5b5346]">
                    ID #{selectedEnquiryModal.id}
                  </span>
                  <span className="text-xs text-[#8a7b68]">
                    {formatDate(selectedEnquiryModal.created_at)}
                  </span>
                </div>
                <h3
                  className="mt-1 text-xl font-bold text-[#17140f]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {selectedEnquiryModal.name || 'Anonymous Inquiry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiryModal(null)}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              {/* Branch Details */}
              <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">Target Branch</p>
                <p className="font-semibold text-sm text-[#17140f] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#9c6b2e]" />
                  {selectedEnquiryModal.branch_name || `Branch #${selectedEnquiryModal.branch_id}`}
                </p>
                {selectedEnquiryModal.branch_location && (
                  <p className="text-[#8a7b68] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#a39a8c]" /> {selectedEnquiryModal.branch_location}
                  </p>
                )}
              </div>

              {/* Course & Qualification */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3">
                  <p className="text-[10px] font-semibold text-[#8a7b68] uppercase">Course / Query</p>
                  <p className="mt-1 font-semibold text-[#17140f]">{selectedEnquiryModal.course || 'General Enquiry'}</p>
                </div>
                <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3">
                  <p className="text-[10px] font-semibold text-[#8a7b68] uppercase">Qualification</p>
                  <p className="mt-1 font-semibold text-[#17140f]">{selectedEnquiryModal.qualification || 'Not provided'}</p>
                </div>
              </div>

              {/* Full Message */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e] mb-1.5">
                  Inquiry Message
                </p>
                <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-4 text-xs leading-relaxed text-[#3d372e] whitespace-pre-wrap">
                  {selectedEnquiryModal.message || 'No additional message text submitted.'}
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3.5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7b68]">Contact Details</p>
                <div className="flex flex-col gap-1.5">
                  {selectedEnquiryModal.phone && (
                    <a
                      href={`tel:${selectedEnquiryModal.phone}`}
                      className="flex items-center gap-2 font-medium text-[#17140f] hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#9c6b2e]" />
                      <span>{selectedEnquiryModal.phone}</span>
                    </a>
                  )}
                  {selectedEnquiryModal.email && (
                    <a
                      href={`mailto:${selectedEnquiryModal.email}`}
                      className="flex items-center gap-2 font-medium text-[#17140f] hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5 text-[#9c6b2e]" />
                      <span>{selectedEnquiryModal.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Timestamps & Administrative Details */}
              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 border-t border-[#f0ebe0] pt-3">
                <div>
                  <span className="block font-medium">Created:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(selectedEnquiryModal.created_at)}</span>
                </div>
                <div>
                  <span className="block font-medium">Branch Admin Read Status:</span>
                  <span
                    className={`font-semibold capitalize ${
                      isBranchAdminRead(selectedEnquiryModal)
                        ? 'text-emerald-700 font-bold'
                        : 'text-red-600 font-bold'
                    }`}
                  >
                    {isBranchAdminRead(selectedEnquiryModal) ? 'Read' : 'Pending'}
                  </span>
                  {(selectedEnquiryModal.branch_admin_read_at || selectedEnquiryModal.read_at) && (
                    <span className="block text-[11px] text-[#8a7b68] mt-1 font-medium">
                      Read at:{' '}
                      <strong className="text-slate-800">
                        {formatDateTime(selectedEnquiryModal.branch_admin_read_at || selectedEnquiryModal.read_at)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end border-t border-[#f0ebe0] pt-3">
              <button
                type="button"
                onClick={() => setSelectedEnquiryModal(null)}
                className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEnquiries;
