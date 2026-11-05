import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Check,
  Clock,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import { getBranchesApi, getStoredBranches } from '../services/adminbranches';
import {
  getSuperAdminRecordsEnquiriesApi,
  getSuperAdminBranchEnquiriesApi,
  getSuperAdminRecordBranchesApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(14px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .3s cubic-bezier(.16,1,.3,1) both; }
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

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
  const [allBranches, setAllBranches] = useState(() => getStoredBranches());
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Helper to merge newly found branches into allBranches without duplicates
  const mergeBranches = (newList) => {
    if (!Array.isArray(newList) || newList.length === 0) return;
    setAllBranches((prev) => {
      const map = new Map(prev.map((b) => [String(b.id), b]));
      newList.forEach((b) => {
        const id = String(b.id || b.branch_id || '');
        if (id) {
          const existing = map.get(id);
          map.set(id, {
            id,
            name: b.name || b.branch_name || existing?.name || `Branch #${id}`,
            location: b.location || b.branch_location || existing?.location || '',
          });
        }
      });
      return Array.from(map.values());
    });
  };

  // Fetch branches on mount from multiple reliable endpoints
  useEffect(() => {
    if (!token) return;

    // 1. Fetch from global branches endpoint
    getBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        if (list.length > 0) mergeBranches(list);
      })
      .catch(() => {});

    // 2. Also try record branches endpoint
    getSuperAdminRecordBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        if (list.length > 0) mergeBranches(list);
      })
      .catch(() => {});
  }, [token]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ADMISSION, GENERAL
  const [activePreset, setActivePreset] = useState('ALL'); // ALL, UNREAD, READ, NOT_CONTACTED, CONTACTED, CUSTOM
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, READ
  const [contactFilter, setContactFilter] = useState('ALL'); // ALL, CONTACTED, NOT_CONTACTED
  const [selectedEnquiryModal, setSelectedEnquiryModal] = useState(null);

  // Helper to determine if branch admin has read the enquiry
  const isBranchAdminRead = (enq) => {
    const baStatus = String(enq?.branch_admin_status || '').toLowerCase().trim();
    if (baStatus === 'read' || baStatus === 'completed') return true;
    if (enq?.branch_admin_read_at || enq?.read_at) return true;
    if (enq?.is_read === true) return true;
    return false;
  };

  // Helper to determine contact status
  const isContacted = (enq) => {
    return String(enq?.contact_status || '').toLowerCase() === 'contacted';
  };

  const handleSelectPreset = (preset) => {
    if (activePreset === preset) {
      setActivePreset('ALL');
      setStatusFilter('ALL');
      setContactFilter('ALL');
      return;
    }
    setActivePreset(preset);
    if (preset === 'ALL') {
      setStatusFilter('ALL');
      setContactFilter('ALL');
    } else if (preset === 'UNREAD') {
      setStatusFilter('PENDING');
      setContactFilter('ALL');
    } else if (preset === 'READ') {
      setStatusFilter('READ');
      setContactFilter('ALL');
    } else if (preset === 'NOT_CONTACTED') {
      setContactFilter('NOT_CONTACTED');
      setStatusFilter('ALL');
    } else if (preset === 'CONTACTED') {
      setContactFilter('CONTACTED');
      setStatusFilter('ALL');
    }
  };

  const handleContactFilterChange = (val) => {
    setContactFilter(val);
    if (val === 'CONTACTED' && statusFilter === 'ALL') setActivePreset('CONTACTED');
    else if (val === 'NOT_CONTACTED' && statusFilter === 'ALL') setActivePreset('NOT_CONTACTED');
    else if (val === 'ALL' && statusFilter === 'ALL') setActivePreset('ALL');
    else if (val === 'ALL' && statusFilter === 'PENDING') setActivePreset('UNREAD');
    else if (val === 'ALL' && statusFilter === 'READ') setActivePreset('READ');
    else setActivePreset('CUSTOM');
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    if (val === 'PENDING' && contactFilter === 'ALL') setActivePreset('UNREAD');
    else if (val === 'READ' && contactFilter === 'ALL') setActivePreset('READ');
    else if (val === 'ALL' && contactFilter === 'ALL') setActivePreset('ALL');
    else if (val === 'ALL' && contactFilter === 'CONTACTED') setActivePreset('CONTACTED');
    else if (val === 'ALL' && contactFilter === 'NOT_CONTACTED') setActivePreset('NOT_CONTACTED');
    else setActivePreset('CUSTOM');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBranch('ALL');
    setActiveTab('ALL');
    setStatusFilter('ALL');
    setContactFilter('ALL');
    setActivePreset('ALL');
  };

  // Fetch enquiries with specific branch or all records
  const fetchEnquiries = async (branchId = selectedBranch, isManualRefresh = false) => {
    if (!token) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      let res;
      if (branchId && branchId !== 'ALL') {
        res = await getSuperAdminBranchEnquiriesApi(branchId, token);
      } else {
        res = await getSuperAdminRecordsEnquiriesApi(token);
      }

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.enquiries)
        ? res.enquiries
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const total =
        typeof res?.total_enquiries === 'number'
          ? res.total_enquiries
          : typeof res?.total === 'number'
          ? res.total
          : list.length;

      setEnquiries(list);
      if (branchId === 'ALL') {
        setTotalCount(total);
        // Extract all branches from full records and merge them
        const extracted = [];
        list.forEach((item) => {
          if (item.branch_id) {
            extracted.push({
              id: String(item.branch_id),
              name: item.branch_name || `Branch #${item.branch_id}`,
              location: item.branch_location || '',
            });
          }
        });
        mergeBranches(extracted);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load enquiries from server.');
      setEnquiries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when branch selection changes
  useEffect(() => {
    fetchEnquiries(selectedBranch);
  }, [token, selectedBranch]);

  // Distinct branches list for dropdown - remains persistent across selections
  const availableBranches = useMemo(() => {
    return [...allBranches].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allBranches]);

  // Helper to categorize enquiry type
  const isGeneralEnquiry = (enq) => {
    const course = (enq.course || '').toLowerCase();
    const type = (enq.enquiry_type || enq.type || '').toLowerCase();
    return course.includes('general') || type.includes('general') || (!enq.course && !enq.qualification);
  };

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // Tab filter
      if (activeTab === 'GENERAL' && !isGeneralEnquiry(item)) return false;
      if (activeTab === 'ADMISSION' && isGeneralEnquiry(item)) return false;

      // Read status filter
      if (statusFilter === 'PENDING' && isBranchAdminRead(item)) return false;
      if (statusFilter === 'READ' && !isBranchAdminRead(item)) return false;

      // Contact status filter
      if (contactFilter === 'CONTACTED' && !isContacted(item)) return false;
      if (contactFilter === 'NOT_CONTACTED' && isContacted(item)) return false;

      // Branch filter (in case frontend filter is applied)
      if (selectedBranch !== 'ALL' && item.branch_id && String(item.branch_id) !== String(selectedBranch)) {
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
  }, [enquiries, activeTab, statusFilter, contactFilter, selectedBranch, searchQuery]);

  // Statistics
  const pendingCount = useMemo(() => enquiries.filter((e) => !isBranchAdminRead(e)).length, [enquiries]);
  const readCount = useMemo(() => enquiries.filter((e) => isBranchAdminRead(e)).length, [enquiries]);
  const contactedCount = useMemo(() => enquiries.filter(isContacted).length, [enquiries]);
  const notContactedCount = useMemo(() => enquiries.filter((e) => !isContacted(e)).length, [enquiries]);

  // Breakdown counts for tabs
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
      className="min-h-screen md:flex max-w-full overflow-x-hidden"
      style={{ ...sans, background: '#faf8f4', color: '#17140f' }}
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

      <main className="min-w-0 flex-1 flex flex-col max-w-full overflow-x-hidden">
        {/* Page Top Header - Centered */}
        <header
          className="hidden md:block sticky top-0 z-20 w-full border-b"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div className="w-full px-6 py-5 sm:px-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-[#e3ddd0] bg-white p-2 text-stone-600 hover:bg-[#f1ede4] transition md:hidden cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9c6b2e]">
                  Super Admin Records
                </p>
                <h1 className="mt-0.5 text-xl sm:text-2xl font-bold leading-tight" style={serif}>
                  Student Enquiries & Follow-ups
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchEnquiries(selectedBranch, true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-[#f1ede4] transition cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Refresh Enquiries"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        {/* Content Body - Centered */}
        <div className="w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-10 space-y-6">
          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => fetchEnquiries(selectedBranch, false)}
                className="text-xs font-bold underline hover:no-underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Stat Summary Preset Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {/* Total Enquiries */}
            <div
              onClick={() => handleSelectPreset('ALL')}
              className={`sa-rise rounded-2xl p-4 sm:p-5 border bg-white cursor-pointer transition-all duration-200 ${
                activePreset === 'ALL'
                  ? 'ring-2 ring-[#9c6b2e] shadow-md border-[#9c6b2e]'
                  : 'shadow-xs border-[#e3ddd0] hover:border-[#ebd9b3] hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Total</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8edcf] text-[#9c6b2e]">
                  <MessageCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#17140f]" style={serif}>
                {selectedBranch === 'ALL' ? totalCount : enquiries.length}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">All queries</p>
            </div>

            {/* Pending Branch Action */}
            <div
              onClick={() => handleSelectPreset('UNREAD')}
              className={`sa-rise rounded-2xl p-4 sm:p-5 border bg-white cursor-pointer transition-all duration-200 ${
                activePreset === 'UNREAD'
                  ? 'ring-2 ring-rose-500 shadow-md border-rose-500'
                  : 'shadow-xs border-[#e3ddd0] hover:border-[#ebd9b3] hover:shadow-md'
              }`}
              style={{ animationDelay: '40ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Unread</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fee2e2] text-rose-700">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-700" style={serif}>
                {pendingCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Branch not read</p>
            </div>

            {/* Read Enquiries */}
            <div
              onClick={() => handleSelectPreset('READ')}
              className={`sa-rise rounded-2xl p-4 sm:p-5 border bg-white cursor-pointer transition-all duration-200 ${
                activePreset === 'READ'
                  ? 'ring-2 ring-emerald-600 shadow-md border-emerald-600'
                  : 'shadow-xs border-[#e3ddd0] hover:border-[#ebd9b3] hover:shadow-md'
              }`}
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Read</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3ea] text-[#2e7d32]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-800" style={serif}>
                {readCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Reviewed by branch</p>
            </div>

            {/* Not Contacted */}
            <div
              onClick={() => handleSelectPreset('NOT_CONTACTED')}
              className={`sa-rise rounded-2xl p-4 sm:p-5 border bg-white cursor-pointer transition-all duration-200 ${
                activePreset === 'NOT_CONTACTED'
                  ? 'ring-2 ring-amber-500 shadow-md border-amber-500'
                  : 'shadow-xs border-[#e3ddd0] hover:border-[#ebd9b3] hover:shadow-md'
              }`}
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Not Contacted</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <PhoneOff className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700" style={serif}>
                {notContactedCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Pending contact</p>
            </div>

            {/* Contacted */}
            <div
              onClick={() => handleSelectPreset('CONTACTED')}
              className={`sa-rise rounded-2xl p-4 sm:p-5 border bg-white cursor-pointer transition-all duration-200 ${
                activePreset === 'CONTACTED'
                  ? 'ring-2 ring-teal-600 shadow-md border-teal-600'
                  : 'shadow-xs border-[#e3ddd0] hover:border-[#ebd9b3] hover:shadow-md'
              }`}
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Contacted</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-teal-800" style={serif}>
                {contactedCount}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Follow-up completed</p>
            </div>

            {/* Active Branches */}
            <div
              className="sa-rise rounded-2xl p-4 sm:p-5 border bg-white shadow-xs"
              style={{ borderColor: '#e3ddd0', animationDelay: '120ms' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Branches</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8edcf] text-[#9c6b2e]">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#17140f]" style={serif}>
                {availableBranches.length}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Available branches</p>
            </div>
          </div>

          {/* Control Bar: Tabs, Branch Filter, Contact Status, Read Status & Search */}
          <div
            className="rounded-2xl border bg-white p-4 sm:p-5 space-y-4 shadow-xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Top Row: Category Tabs on Left + Search Box on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-[#f0ebe0]">
              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
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
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
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
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'GENERAL'
                      ? 'bg-[#17140f] text-white shadow-xs'
                      : 'bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]'
                  }`}
                >
                  General ({tabCounts.general})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72 md:w-80 shrink-0">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search student, course, message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-9 pr-7 text-xs text-[#17140f] outline-none transition placeholder:text-stone-400 focus:border-[#9c6b2e] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Filter Dropdowns + Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Branch selector */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-[#9c6b2e] cursor-pointer max-w-[260px] truncate"
                  title={selectedBranch === 'ALL' ? 'All Branches' : availableBranches.find(b => b.id === selectedBranch)?.name}
                >
                  <option value="ALL">All Branches ({availableBranches.length})</option>
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Contact Status filter */}
                <select
                  value={contactFilter}
                  onChange={(e) => handleContactFilterChange(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-[#9c6b2e] cursor-pointer"
                >
                  <option value="ALL">All Contact Status</option>
                  <option value="NOT_CONTACTED">Not Contacted ({notContactedCount})</option>
                  <option value="CONTACTED">Contacted ({contactedCount})</option>
                </select>

                {/* Read Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-[#9c6b2e] cursor-pointer"
                >
                  <option value="ALL">All Read Status</option>
                  <option value="PENDING">Unread ({pendingCount})</option>
                  <option value="READ">Read ({readCount})</option>
                </select>
              </div>

              {(searchQuery || selectedBranch !== 'ALL' || contactFilter !== 'ALL' || statusFilter !== 'ALL' || activeTab !== 'ALL' || activePreset !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f1ede4] transition cursor-pointer shrink-0 ml-auto sm:ml-0"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Enquiries Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#9c6b2e]" />
              <p className="mt-3 text-sm font-semibold text-[#8a7b68]">Loading enquiries...</p>
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
                style={serif}
              >
                {enquiries.length === 0 ? 'No enquiries found' : 'No matching enquiries found'}
              </h3>
              <p className="mt-1 text-xs text-[#8a7b68]">
                {enquiries.length === 0
                  ? selectedBranch !== 'ALL'
                    ? 'There are currently no enquiries recorded for this branch.'
                    : 'There are currently no enquiries submitted across branches.'
                  : 'Try adjusting your search criteria or resetting filters.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBranch('ALL');
                  setActiveTab('ALL');
                  setStatusFilter('ALL');
                  setContactFilter('ALL');
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-slate-800 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnquiries.map((enq, idx) => {
                const isGeneral = isGeneralEnquiry(enq);
                const isRead = isBranchAdminRead(enq);
                const isContact = isContacted(enq);
                const branchReadAt = enq.branch_admin_read_at || enq.read_at;

                return (
                  <article
                    key={enq.id ?? idx}
                    className="sa-rise flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#c9bea9] hover:shadow-md"
                    style={{ borderColor: '#e3ddd0', animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                  >
                    <div>
                      {/* Top Bar: Name & Dual Status Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-base text-[#17140f]">
                            {enq.name || 'Anonymous Applicant'}
                          </h3>
                          <span className="mt-0.5 text-xs font-medium flex items-center gap-1.5 text-[#8a7b68]">
                            <Calendar className="w-3.5 h-3.5 text-[#9c6b2e]" />
                            Submitted: {formatDate(enq.created_at)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Contact Status Badge */}
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isContact
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isContact ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                                <span>Contacted</span>
                              </>
                            ) : (
                              <>
                                <Phone className="w-3.5 h-3.5 text-amber-600" />
                                <span>Not Contacted</span>
                              </>
                            )}
                          </span>

                          {/* Read Status Badge */}
                          <span
                            title={branchReadAt ? `Read on ${formatDateTime(branchReadAt)}` : undefined}
                            className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isRead
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                      </div>

                      {/* Branch Info Pill */}
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-[#faf8f4] px-2.5 py-1 text-xs font-medium text-[#5b5346]">
                          <Building2 className="h-3.5 w-3.5 text-[#9c6b2e]" />
                          <span className="truncate max-w-[200px]">
                            {enq.branch_name || `Branch #${enq.branch_id || '—'}`}
                          </span>
                        </span>
                        {enq.branch_location && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#8a7b68]">
                            <MapPin className="h-3 w-3 text-[#a39a8c]" />
                            <span className="truncate max-w-[140px]">{enq.branch_location}</span>
                          </span>
                        )}
                      </div>

                      {/* Course / Query & Qualification Tags */}
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

                      {/* Message preview */}
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

                    {/* Bottom Info: Phone, Email, Status & Action */}
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
                        <div className="min-w-0 text-xs text-[#8a7b68]">
                          <p>
                            Contact:{' '}
                            <strong className={isContact ? 'text-teal-700 font-bold' : 'text-amber-700 font-bold'}>
                              {isContact ? 'Contacted' : 'Not Contacted'}
                            </strong>
                          </p>
                          <p className="text-[11px] mt-0.5">
                            Branch Read:{' '}
                            <strong className={isRead ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              {isRead ? 'Read' : 'Pending'}
                            </strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiryModal(enq)}
                          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17140f] bg-[#faf8f4] border border-[#e3ddd0] hover:bg-[#f1ede4] transition shadow-2xs cursor-pointer"
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
                  style={serif}
                >
                  {selectedEnquiryModal.name || 'Anonymous Inquiry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiryModal(null)}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
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

              {/* Status Overview Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3">
                  <p className="text-[10px] font-semibold text-[#8a7b68] uppercase">Student Contact Status</p>
                  <p className="mt-1 font-bold flex items-center gap-1.5">
                    {isContacted(selectedEnquiryModal) ? (
                      <span className="text-teal-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Contacted
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <PhoneOff className="w-3.5 h-3.5" /> Not Contacted
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] p-3">
                  <p className="text-[10px] font-semibold text-[#8a7b68] uppercase">Branch Admin Read Status</p>
                  <p className="mt-1 font-bold">
                    {isBranchAdminRead(selectedEnquiryModal) ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </p>
                </div>
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
                  <span className="block font-medium">Submitted:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(selectedEnquiryModal.created_at)}</span>
                </div>
                <div>
                  <span className="block font-medium">Branch Read Timestamp:</span>
                  {(selectedEnquiryModal.branch_admin_read_at || selectedEnquiryModal.read_at) ? (
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(selectedEnquiryModal.branch_admin_read_at || selectedEnquiryModal.read_at)}
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600">Not yet opened</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end border-t border-[#f0ebe0] pt-3">
              <button
                type="button"
                onClick={() => setSelectedEnquiryModal(null)}
                className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
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
