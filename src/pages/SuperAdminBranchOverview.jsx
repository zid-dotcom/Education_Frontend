import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  KeyRound,
  LayoutGrid,
  ListFilter,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Table,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminDashboardOverviewApi } from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(14px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .25s ease both; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(v) || 0
  );

const StatCard = ({ icon: Icon, label, value, subtext, accent, delay = 0 }) => (
  <div
    className="sa-rise flex flex-col justify-between rounded-2xl p-5"
    style={{
      animationDelay: `${delay}ms`,
      background: '#ffffff',
      border: '1px solid #e3ddd0',
      boxShadow: '0 2px 10px rgba(14,26,43,.04)',
    }}
  >
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#a39a8c' }}>
        {label}
      </p>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent + '1a' }}>
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold tracking-tight" style={{ color: '#17140f' }}>
        {value}
      </p>
      {subtext && (
        <p className="mt-1 text-xs font-medium" style={{ color: '#8a8175' }}>
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const BranchDetailsModal = ({ branch, onClose, navigate }) => {
  if (!branch) return null;

  const totalPayments = ['cash', 'upi', 'razorpay'].reduce(
    (acc, key) => acc + Number(branch?.payment_methods?.[key] || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-[#faf8f4] shadow-2xl sa-rise">
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between border-b px-6 py-5 bg-[#ffffff]"
          style={{ borderColor: '#e3ddd0' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="text-2xl font-bold"
                style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}
              >
                {branch.branch_name}
              </h2>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: branch.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                  color: branch.status === 'Active' ? '#065f46' : '#991b1b',
                }}
              >
                {branch.status || 'Active'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium" style={{ color: '#5b5346' }}>
              <MapPin className="h-3.5 w-3.5 text-[#9c6b2e]" />
              {branch.location || 'Location not specified'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-[#f1ede4]"
            aria-label="Close details"
          >
            <X className="h-5 w-5" style={{ color: '#17140f' }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Overview */}
            <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4] flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  Academic Overview
                </h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#f1ede4]">
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Courses</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{branch.total_courses ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Active Courses</td>
                    <td className="px-5 py-3 font-bold text-emerald-600">{branch.active_courses ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Total Students</td>
                    <td className="px-5 py-3 font-bold text-sky-600">{branch.total_students ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Staff & Admin */}
            <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-600" />
                  Staff & Administration
                </h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#f1ede4]">
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Staff</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{branch.total_staff ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Staff Present Today</td>
                    <td className="px-5 py-3 font-bold text-teal-600">{branch.staff_attendance_today ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Total Branch Admins</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{branch.total_branch_admins ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Admins Present Today</td>
                    <td className="px-5 py-3 font-bold text-teal-600">{branch.branch_admin_attendance_today ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Enrollments & Enquiries */}
            <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-sky-600" />
                  Enrollments & Enquiries
                </h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#f1ede4]">
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Enrollments</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enrollments ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Paid Enrollments</td>
                    <td className="px-5 py-3 font-bold text-emerald-600">{branch.paid_enrollments ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Pending Enrollments</td>
                    <td className="px-5 py-3 font-bold text-amber-600">{branch.pending_enrollments ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Today's Enrollments</td>
                    <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enrollments ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Total Enquiries</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enquiries ?? 0}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-500 font-medium">Today's Enquiries</td>
                    <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enquiries ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
              <div className="p-4 border-b border-emerald-100 bg-[#faf8f4]">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  Revenue Summary
                </h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-emerald-50">
                  <tr className="hover:bg-emerald-50/30 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium w-1/2">Total Received</td>
                    <td className="px-5 py-3 font-bold text-emerald-700 text-base">{fmt(branch.total_received)}</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/30 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">Received Today</td>
                    <td className="px-5 py-3 font-bold text-emerald-600 text-base">{fmt(branch.today_received)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-sky-600" />
                Payment Methods Breakdown
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {totalPayments > 0 ? (
                <>
                  <div className="flex h-3 w-full overflow-hidden rounded-full shadow-inner bg-slate-100">
                    {Number(branch.payment_methods?.cash || 0) > 0 && (
                      <div
                        style={{
                          width: `${((Number(branch.payment_methods.cash) / totalPayments) * 100).toFixed(1)}%`,
                          background: '#10b981',
                        }}
                        title={`Cash: ${fmt(branch.payment_methods.cash)}`}
                      />
                    )}
                    {Number(branch.payment_methods?.upi || 0) > 0 && (
                      <div
                        style={{
                          width: `${((Number(branch.payment_methods.upi) / totalPayments) * 100).toFixed(1)}%`,
                          background: '#8b5cf6',
                        }}
                        title={`UPI: ${fmt(branch.payment_methods.upi)}`}
                      />
                    )}
                    {Number(branch.payment_methods?.razorpay || 0) > 0 && (
                      <div
                        style={{
                          width: `${((Number(branch.payment_methods.razorpay) / totalPayments) * 100).toFixed(1)}%`,
                          background: '#0ea5e9',
                        }}
                        title={`Razorpay: ${fmt(branch.payment_methods.razorpay)}`}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#8a8175] uppercase flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Cash
                      </span>
                      <span className="text-sm font-bold text-[#17140f] mt-1">
                        {fmt(branch.payment_methods?.cash)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#8a8175] uppercase flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500" /> UPI
                      </span>
                      <span className="text-sm font-bold text-[#17140f] mt-1">
                        {fmt(branch.payment_methods?.upi)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#8a8175] uppercase flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-sky-500" /> Razorpay
                      </span>
                      <span className="text-sm font-bold text-[#17140f] mt-1">
                        {fmt(branch.payment_methods?.razorpay)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-center py-2" style={{ color: '#a39a8c' }}>
                  No payment method data recorded for this branch.
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e3ddd0]">
            <p className="text-xs text-[#8a8175]">Direct branch management shortcuts:</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/admin/branch-admins');
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition hover:bg-[#f1ede4] border"
                style={{ borderColor: '#e3ddd0', color: '#17140f', background: '#ffffff' }}
              >
                Branch Admins
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/super-admin/navigation-settings');
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition hover:bg-[#f1ede4] border"
                style={{ borderColor: '#e3ddd0', color: '#9c6b2e', background: '#ffffff' }}
              >
                Navigation Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/admin/branches');
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition hover:bg-[#9c6b2e]/90 text-white shadow-xs"
                style={{ background: '#9c6b2e' }}
              >
                Edit Branch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuperAdminBranchOverview = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('revenue_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSuperAdminDashboardOverviewApi(token);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load branch overview data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const rawBranches = dashboardData?.branches || [];
  const overview = dashboardData?.overview || {};

  // Filter & sort
  const filteredBranches = useMemo(() => {
    let list = [...rawBranches];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.branch_name?.toLowerCase().includes(q) ||
          b.location?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((b) => (b.status || 'Active').toUpperCase() === statusFilter);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'revenue_desc':
          return Number(b.total_received || 0) - Number(a.total_received || 0);
        case 'revenue_asc':
          return Number(a.total_received || 0) - Number(b.total_received || 0);
        case 'students_desc':
          return Number(b.total_students || 0) - Number(a.total_students || 0);
        case 'courses_desc':
          return Number(b.total_courses || 0) - Number(a.total_courses || 0);
        case 'enrollments_desc':
          return Number(b.total_enrollments || 0) - Number(a.total_enrollments || 0);
        case 'name_asc':
          return (a.branch_name || '').localeCompare(b.branch_name || '');
        default:
          return 0;
      }
    });

    return list;
  }, [rawBranches, search, statusFilter, sortBy]);

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
        activePage="branch-overview"
      />

      <main className="min-w-0 flex-1 relative">
        {/* Top Header */}
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>
              Super Admin
            </p>
            <h1
              className="mt-1 text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", color: '#17140f' }}
            >
              Branch Overview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {dashboardData?.date && (
              <span className="hidden text-sm font-semibold sm:block" style={{ color: '#8a8175' }}>
                {new Date(dashboardData.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl p-2.5 transition hover:bg-[#f1ede4] border"
              style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm shadow-sm"
              style={{ background: '#17140f', color: '#f4b942' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-8">
          {/* Page Intro Banner */}
          <div className="sa-rise flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}
              >
                All Branches Directory
              </h2>
              <p className="text-sm mt-1 font-medium" style={{ color: '#8a8175' }}>
                Comprehensive cross-branch performance, enrollments, students, and financial metrics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/branches')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:bg-[#f1ede4] border"
                style={{ borderColor: '#e3ddd0', background: '#ffffff', color: '#17140f' }}
              >
                <Building2 className="h-4 w-4 text-[#9c6b2e]" />
                Manage Branches
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl px-5 py-4 text-sm font-semibold"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={load} className="underline hover:text-red-900 transition">
                  Retry
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#9c6b2e' }} />
              <p className="text-sm font-semibold" style={{ color: '#8a8175' }}>
                Loading branch overview data...
              </p>
            </div>
          ) : (
            <>
              {/* Summary Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={Building2}
                  label="Total Branches"
                  value={overview.total_branches ?? rawBranches.length}
                  subtext={`${overview.active_branches ?? rawBranches.length} active`}
                  accent="#9c6b2e"
                  delay={0}
                />
                <StatCard
                  icon={BookOpen}
                  label="Total Courses"
                  value={overview.total_courses ?? 0}
                  subtext={`${overview.active_courses ?? 0} active courses`}
                  accent="#3b82f6"
                  delay={40}
                />
                <StatCard
                  icon={Users}
                  label="Total Students"
                  value={overview.total_students ?? 0}
                  subtext="Enrolled across branches"
                  accent="#8b5cf6"
                  delay={80}
                />
                <StatCard
                  icon={IndianRupee}
                  label="Total Revenue"
                  value={fmt(overview.total_received)}
                  subtext={`Today: ${fmt(overview.today_received)}`}
                  accent="#10b981"
                  delay={120}
                />
              </div>

              {/* Filter and Search Bar */}
              <div
                className="sa-rise rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4"
                style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
              >
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: '#a39a8c' }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by branch name or city..."
                    className="w-full rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none transition border"
                    style={{
                      background: '#faf8f4',
                      borderColor: '#e3ddd0',
                      color: '#17140f',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[#e3ddd0]"
                    >
                      <X className="h-3 w-3 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Filters & View Controls */}
                <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center rounded-xl p-1 border" style={{ background: '#faf8f4', borderColor: '#e3ddd0' }}>
                    {['ALL', 'ACTIVE'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-lg transition ${
                          statusFilter === status
                            ? 'bg-white shadow-xs text-[#9c6b2e]'
                            : 'text-[#8a8175] hover:text-[#17140f]'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : 'Active'}
                      </button>
                    ))}
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#5b5346' }}>
                    <span className="hidden sm:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer"
                      style={{ background: '#faf8f4', borderColor: '#e3ddd0', color: '#17140f' }}
                    >
                      <option value="revenue_desc">Highest Revenue</option>
                      <option value="revenue_asc">Lowest Revenue</option>
                      <option value="students_desc">Most Students</option>
                      <option value="courses_desc">Most Courses</option>
                      <option value="enrollments_desc">Most Enrollments</option>
                      <option value="name_asc">Branch Name (A-Z)</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-xl p-1 border" style={{ background: '#faf8f4', borderColor: '#e3ddd0' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'table' ? 'bg-white shadow-xs text-[#9c6b2e]' : 'text-[#8a8175] hover:text-[#17140f]'
                      }`}
                      title="Table View"
                    >
                      <Table className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'cards' ? 'bg-white shadow-xs text-[#9c6b2e]' : 'text-[#8a8175] hover:text-[#17140f]'
                      }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Presentation */}
              {viewMode === 'table' ? (
                /* Branches Overview Table */
                <section
                  className="sa-rise rounded-2xl overflow-hidden shadow-sm"
                  style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
                >
                  <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{ borderBottom: '1px solid #f1ede4', background: '#faf8f4' }}
                  >
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: '#17140f' }}>
                        Branch Overview
                      </h2>
                      <p className="text-xs mt-1" style={{ color: '#8a8175' }}>
                        Showing {filteredBranches.length} of {rawBranches.length} registered branches
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e3ddd0' }}>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Branch
                          </th>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Courses
                          </th>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Students
                          </th>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Enrollments
                          </th>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Revenue
                          </th>
                          <th
                            className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]"
                            style={{ color: '#a39a8c' }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBranches.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-sm font-medium"
                              style={{ color: '#a39a8c' }}
                            >
                              No branches match your current search or filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredBranches.map((b) => (
                            <tr
                              key={b.branch_id}
                              className="transition hover:bg-[#faf8f4]"
                              style={{ borderBottom: '1px solid #f1ede4' }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap align-middle">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-base" style={{ color: '#17140f' }}>
                                    {b.branch_name}
                                  </p>
                                  {b.status && (
                                    <span
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                      style={{
                                        background: b.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                                        color: b.status === 'Active' ? '#065f46' : '#991b1b',
                                      }}
                                    >
                                      {b.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs mt-1 font-medium flex items-center gap-1" style={{ color: '#5b5346' }}>
                                  <MapPin className="h-3 w-3 text-[#9c6b2e]" />
                                  {b.location}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                                <span className="font-bold">{b.total_courses ?? 0}</span>
                                {b.active_courses !== undefined && (
                                  <span className="text-xs ml-1.5 text-emerald-600 font-normal">
                                    ({b.active_courses} active)
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                                <span className="font-bold">{b.total_students ?? 0}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                                <span className="font-bold">{b.total_enrollments ?? 0}</span>
                                {b.paid_enrollments !== undefined && (
                                  <span className="text-xs ml-1.5 text-emerald-600 font-normal">
                                    ({b.paid_enrollments} paid)
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-semibold" style={{ color: '#10b981' }}>
                                <div>{fmt(b.total_received)}</div>
                                {Number(b.today_received || 0) > 0 && (
                                  <div className="text-[11px] font-normal text-emerald-600">
                                    +{fmt(b.today_received)} today
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap align-middle">
                                <button
                                  onClick={() => setSelectedBranch(b)}
                                  className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition hover:-translate-y-0.5 shadow-sm"
                                  style={{ background: '#ffffff', color: '#9c6b2e', border: '1px solid #e3ddd0' }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                /* Branches Grid Cards View */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBranches.length === 0 ? (
                    <div
                      className="col-span-full rounded-2xl p-12 text-center text-sm font-medium"
                      style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#a39a8c' }}
                    >
                      No branches match your current search or filter criteria.
                    </div>
                  ) : (
                    filteredBranches.map((b) => (
                      <div
                        key={b.branch_id}
                        className="sa-rise rounded-2xl p-6 flex flex-col justify-between transition hover:shadow-md"
                        style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3
                                className="font-bold text-lg leading-tight"
                                style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}
                              >
                                {b.branch_name}
                              </h3>
                              <p className="text-xs mt-1 font-medium flex items-center gap-1" style={{ color: '#5b5346' }}>
                                <MapPin className="h-3.5 w-3.5 text-[#9c6b2e]" />
                                {b.location}
                              </p>
                            </div>
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                background: b.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                                color: b.status === 'Active' ? '#065f46' : '#991b1b',
                              }}
                            >
                              {b.status || 'Active'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 my-5 py-4 border-y border-[#f1ede4]">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a39a8c]">Courses</p>
                              <p className="text-base font-bold text-[#17140f] mt-0.5">{b.total_courses ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a39a8c]">Students</p>
                              <p className="text-base font-bold text-[#17140f] mt-0.5">{b.total_students ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a39a8c]">Enrollments</p>
                              <p className="text-base font-bold text-[#17140f] mt-0.5">{b.total_enrollments ?? 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#8a8175]">Total Revenue:</span>
                            <span className="text-base font-bold text-emerald-600">{fmt(b.total_received)}</span>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#f1ede4] flex items-center justify-between">
                          <span className="text-xs text-[#8a8175]">
                            Staff: <strong className="text-[#17140f]">{b.total_staff ?? 0}</strong>
                          </span>
                          <button
                            onClick={() => setSelectedBranch(b)}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:bg-[#faf8f4] border"
                            style={{ borderColor: '#e3ddd0', color: '#9c6b2e', background: '#ffffff' }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Branch Details Modal */}
        <BranchDetailsModal
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
          navigate={navigate}
        />
      </main>
    </div>
  );
};

export default SuperAdminBranchOverview;
