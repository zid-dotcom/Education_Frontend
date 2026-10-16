import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Building2, CalendarCheck, GraduationCap, IndianRupee,
  Loader2, MessageCircle, RefreshCw, ShoppingCart, TrendingUp, UserPlus, Users,
  CheckCircle, Clock, KeyRound, Wallet, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminDashboardOverviewApi } from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .4s ease both; }
.sa-fade { animation: sa-fade .3s ease both; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);

const StatCard = ({ icon: Icon, label, value, accent, delay = 0 }) => (
  <div
    className="sa-rise rounded-2xl p-5 flex flex-col gap-3"
    style={{ animationDelay: `${delay}ms`, background: '#ffffff', border: '1px solid #e3ddd0', boxShadow: '0 2px 12px rgba(14,26,43,.06)' }}
  >
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#a39a8c' }}>{label}</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent + '20' }}>
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
    </div>
    <p className="text-2xl font-bold" style={{ color: '#17140f' }}>{value}</p>
  </div>
);

// Payment bar
const PaymentDistribution = ({ methods }) => {
  const total = ['cash', 'upi', 'razorpay'].reduce((a, key) => a + Number(methods?.[key] || 0), 0);
  if (total === 0) return <p className="text-sm font-medium" style={{ color: '#a39a8c' }}>No payment data available.</p>;

  const getWidth = (val) => `${((Number(val) / total) * 100).toFixed(1)}%`;
  
  const colors = {
    cash: '#10b981',
    upi: '#8b5cf6',
    razorpay: '#0ea5e9'
  };

  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full shadow-inner bg-slate-100">
        {methods.cash > 0 && <div style={{ width: getWidth(methods.cash), background: colors.cash }} title="Cash" />}
        {methods.upi > 0 && <div style={{ width: getWidth(methods.upi), background: colors.upi }} title="UPI" />}
        {methods.razorpay > 0 && <div style={{ width: getWidth(methods.razorpay), background: colors.razorpay }} title="Razorpay" />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Cash', key: 'cash', color: colors.cash },
          { label: 'UPI', key: 'upi', color: colors.upi },
          { label: 'Razorpay', key: 'razorpay', color: colors.razorpay }
        ].map(m => methods[m.key] > 0 && (
          <div key={m.key} className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8a8175' }}>{m.label}</span>
            </div>
            <span className="text-sm font-bold mt-1" style={{ color: '#17140f' }}>{fmt(methods[m.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BranchDetailsModal = ({ branch, onClose }) => {
  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex w-full max-w-4xl max-h-full flex-col overflow-hidden rounded-2xl bg-[#faf8f4] shadow-2xl sa-rise">
        
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b px-6 py-5 bg-[#ffffff]" style={{ borderColor: '#e3ddd0' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>{branch.branch_name}</h2>
            <div className="mt-1.5 flex items-center gap-3">
              <p className="text-sm font-medium" style={{ color: '#5b5346' }}>{branch.location}</p>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: branch.status === 'Active' ? '#ecfdf5' : '#fef2f2', color: branch.status === 'Active' ? '#065f46' : '#991b1b' }}>
                {branch.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-[#f1ede4]">
            <X className="h-5 w-5" style={{ color: '#17140f' }} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Academic & Staff (Left Column) */}
            <div className="space-y-6">
              
              {/* Academic Overview */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sky-600" />
                    Academic Overview
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Courses</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_courses}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Active Courses</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{branch.active_courses}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Students</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.total_students}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Staff & Admin */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-600" />
                    Staff & Administration
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Staff</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_staff}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Staff Present Today</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.staff_attendance_today}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Branch Admins</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_branch_admins}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Admins Present Today</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.branch_admin_attendance_today}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Enrollments & Revenue (Right Column) */}
            <div className="space-y-6">
              
              {/* Enrollments & Enquiries */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-sky-600" />
                    Enrollments & Enquiries
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#f1ede4]">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">Total Enrollments</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Paid Enrollments</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{branch.paid_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Pending Enrollments</td>
                      <td className="px-5 py-3 font-bold text-amber-600">{branch.pending_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Today's Enrollments</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enrollments}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Total Enquiries</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{branch.total_enquiries}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 text-slate-500 font-medium">Today's Enquiries</td>
                      <td className="px-5 py-3 font-bold text-sky-600">{branch.today_enquiries}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Revenue Summary */}
              <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-sky-50/30">
                <div className="p-4 border-b border-sky-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    Revenue Summary
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-sky-50">
                    <tr className="hover:bg-sky-50/50 transition">
                      <td className="px-5 py-3 text-slate-600 font-medium w-1/2">Total Received</td>
                      <td className="px-5 py-3 font-bold text-emerald-700 text-base">{fmt(branch.total_received)}</td>
                    </tr>
                    <tr className="hover:bg-sky-50/50 transition">
                      <td className="px-5 py-3 text-slate-600 font-medium">Received Today</td>
                      <td className="px-5 py-3 font-bold text-emerald-600 text-base">{fmt(branch.today_received)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="mt-6 bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e3ddd0] bg-[#faf8f4]">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-sky-600" />
                Payment Methods Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf8f4] border-b border-[#e3ddd0]">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1ede4]">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">Cash</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.cash)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">UPI</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.upi)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 font-medium">Razorpay</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{fmt(branch.payment_methods?.razorpay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSuperAdminDashboardOverviewApi(token);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const overview = dashboardData?.overview || {};
  const methods = dashboardData?.payment_methods || {};
  const branches = dashboardData?.branches || [];

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="dashboard" />

      <main className="min-w-0 flex-1 relative">
        <header className="flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#17140f' }}>Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {dashboardData?.date && (
              <span className="hidden text-sm font-semibold sm:block" style={{ color: '#8a8175' }}>
                {new Date(dashboardData.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
            <button onClick={load} disabled={loading} className="rounded-xl p-2.5 transition hover:bg-[#f1ede4]" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm shadow-sm" style={{ background: '#17140f', color: '#f4b942' }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-8">
          {/* Welcome Message */}
          <div className="sa-rise pb-6 sm:pb-8">
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>
              Welcome super admin 👋
            </h2>
            <p className="text-sm mt-2 font-medium" style={{ color: '#8a8175' }}>
              Here's an overview of what's happening across all branches today.
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-5 py-4 text-sm font-semibold" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={load} className="underline hover:text-red-900 transition">Retry Request</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#9c6b2e' }} />
              <p className="text-sm font-semibold" style={{ color: '#8a8175' }}>Loading dashboard data...</p>
            </div>
          ) : dashboardData ? (
            <>
              {/* Overview Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Building2} label="Total Branches" value={overview.total_branches} accent="#9c6b2e" />
                <StatCard icon={CheckCircle} label="Active Branches" value={overview.active_branches} accent="#10b981" delay={20} />
                <StatCard icon={BookOpen} label="Total Courses" value={overview.total_courses} accent="#3b82f6" delay={40} />
                <StatCard icon={CheckCircle} label="Active Courses" value={overview.active_courses} accent="#10b981" delay={60} />
                
                <StatCard icon={Users} label="Total Students" value={overview.total_students} accent="#8b5cf6" delay={80} />
                <StatCard icon={GraduationCap} label="Total Enrollments" value={overview.total_enrollments} accent="#0ea5e9" delay={100} />
                <StatCard icon={Wallet} label="Paid Enrollments" value={overview.paid_enrollments} accent="#10b981" delay={120} />
                <StatCard icon={Clock} label="Pending Enrollments" value={overview.pending_enrollments} accent="#f59e0b" delay={140} />
                
                <StatCard icon={UserPlus} label="Total Staff" value={overview.total_staff} accent="#ec4899" delay={160} />
                <StatCard icon={KeyRound} label="Branch Admins" value={overview.total_branch_admins} accent="#f43f5e" delay={180} />
                <StatCard icon={MessageCircle} label="Total Enquiries" value={overview.total_enquiries} accent="#f97316" delay={200} />
                <StatCard icon={MessageCircle} label="Today's Enquiries" value={overview.today_enquiries} accent="#eab308" delay={220} />
                
                <StatCard icon={IndianRupee} label="Total Received" value={fmt(overview.total_received)} accent="#10b981" delay={240} />
                <StatCard icon={TrendingUp} label="Today Received" value={fmt(overview.today_received)} accent="#059669" delay={260} />
                <StatCard icon={CalendarCheck} label="Staff Attendance Today" value={overview.staff_attendance_today} accent="#14b8a6" delay={280} />
                <StatCard icon={CalendarCheck} label="Admin Attendance Today" value={overview.branch_admin_attendance_today} accent="#0d9488" delay={300} />
              </div>

              {/* Payment Methods */}
              <section className="sa-rise rounded-2xl p-6 sm:p-8" style={{ background: '#ffffff', border: '1px solid #e3ddd0', animationDelay: '350ms' }}>
                <div className="mb-6">
                  <h2 className="text-lg font-bold" style={{ color: '#17140f' }}>Payment Methods Distribution</h2>
                  <p className="text-xs mt-1" style={{ color: '#8a8175' }}>Overall revenue breakdown by payment type</p>
                </div>
                <PaymentDistribution methods={methods} />
              </section>

              {/* Branches Overview Table */}
              <section className="sa-rise rounded-2xl overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #e3ddd0', animationDelay: '400ms' }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1ede4', background: '#faf8f4' }}>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#17140f' }}>Branch Overview</h2>
                    <p className="text-xs mt-1" style={{ color: '#8a8175' }}>Quick overview of all registered branches</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e3ddd0' }}>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap sticky top-0 bg-[#faf8f4]" style={{ color: '#a39a8c', zIndex: 10 }}>Branch</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Courses</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Students</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Enrollments</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Revenue</th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#faf8f4]" style={{ color: '#a39a8c' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-medium" style={{ color: '#a39a8c' }}>No branches found.</td></tr>
                      ) : branches.map((b) => (
                        <tr key={b.branch_id} className="transition hover:bg-[#faf8f4]" style={{ borderBottom: '1px solid #f1ede4' }}>
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            <p className="font-bold text-base" style={{ color: '#17140f' }}>{b.branch_name}</p>
                            <p className="text-xs mt-1 font-medium" style={{ color: '#5b5346' }}>{b.location}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_courses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_students}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-medium" style={{ color: '#17140f' }}>
                            {b.total_enrollments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle text-sm font-semibold" style={{ color: '#10b981' }}>
                            {fmt(b.total_received)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            <button onClick={() => setSelectedBranch(b)} className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition hover:-translate-y-0.5 shadow-sm" style={{ background: '#ffffff', color: '#9c6b2e', border: '1px solid #e3ddd0' }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
        
        {/* Branch Details Modal */}
        <BranchDetailsModal branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
