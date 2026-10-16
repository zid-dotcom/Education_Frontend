import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingCart,
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Users,
  Image as ImageIcon,
  IndianRupee,
  Wallet,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminPurchaseBranchesApi,
  getSuperAdminPendingPurchasesApi,
  getSuperAdminApprovedPurchasesApi,
  getSuperAdminPurchaseHistoryApi,
  approvePurchaseAsSuperAdminApi,
  rejectPurchaseAsSuperAdminApi,
  getSuperAdminRejectedPurchasesApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rejected', icon: X },
  { id: 'history', label: 'History', icon: ShoppingCart },
];

const SuperAdminPurchases = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch branches for purchase filtering
  useEffect(() => {
    if (!token) return;
    getSuperAdminPurchaseBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch(() => {
        // Fallback or silent if branches fail
      });
  }, [token]);

  const loadPurchases = async (tab, branchId = selectedBranchId) => {
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const bId = branchId ? Number(branchId) : undefined;
      let data;
      if (tab === 'pending') {
        data = await getSuperAdminPendingPurchasesApi(token, bId);
      } else if (tab === 'approved') {
        data = await getSuperAdminApprovedPurchasesApi(token, bId);
      } else if (tab === 'rejected') {
        data = await getSuperAdminRejectedPurchasesApi(token, bId);
      } else {
        data = await getSuperAdminPurchaseHistoryApi(token, bId);
      }
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load purchases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases(activeTab, selectedBranchId);
  }, [activeTab, selectedBranchId, token]);

  const handleApprove = async (purchase) => {
    const id = purchase.enrollment_id ?? purchase.id;
    setApprovingId(id);
    setError('');
    setSuccess('');
    try {
      await approvePurchaseAsSuperAdminApi(id, token);
      setSuccess(`Purchase #${id} approved successfully.`);
      setPurchases((prev) =>
        prev.filter((p) => (p.enrollment_id ?? p.id) !== id)
      );
    } catch (err) {
      setError(err.message || 'Failed to approve purchase.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setApprovingId(rejectingPurchaseId);
    setError('');
    setSuccess('');
    try {
      await rejectPurchaseAsSuperAdminApi(rejectingPurchaseId, rejectReason, token);
      setSuccess(`Purchase #${rejectingPurchaseId} rejected successfully.`);
      setPurchases((prev) =>
        prev.filter((p) => (p.enrollment_id ?? p.id) !== rejectingPurchaseId)
      );
      setRejectingPurchaseId(null);
      setRejectReason('');
      setSelectedPurchase(null);
    } catch (err) {
      setError(err.message || 'Failed to reject purchase.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div
      className="min-h-screen md:flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="purchases"
      />

      <main className="min-w-0 flex-1">
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#9c6b2e' }}
            >
              Super Admin
            </p>
            <h1
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Purchases & Approvals
            </h1>
          </div>
          <button
            onClick={() => loadPurchases(activeTab, selectedBranchId)}
            className="rounded-lg p-2 hover:bg-[#f1ede4]"
            title="Refresh purchases"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              style={{ color: '#9c6b2e' }}
            />
          </button>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              }}
            >
              {success}
            </div>
          )}

          {/* Filter Bar: Branch selection + Tabs */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border shadow-2xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-2 relative px-4 py-2 text-sm font-semibold rounded-xl transition"
                    style={{
                      background: isActive ? '#9c6b2e' : '#faf8f4',
                      color: isActive ? '#ffffff' : '#7a5220',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Branch Filter dropdown */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-stone-500" />
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="appearance-none rounded-xl border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50"
                  style={{ borderColor: '#e3ddd0', color: '#17140f' }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option
                      key={b.id ?? b.branch_id}
                      value={String(b.id ?? b.branch_id)}
                    >
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style={{ color: '#a39a8c' }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: '#9c6b2e' }}
              />
            </div>
          ) : purchases.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
              style={{ borderColor: '#e3ddd0', color: '#64748b' }}
            >
              <ShoppingCart className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No {activeTab} purchases found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedBranchId
                  ? 'Try selecting "All Branches" to view records across all locations.'
                  : `There are currently no items under the ${activeTab} purchases tab.`}
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden bg-white border shadow-2xs"
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        background: '#faf8f4',
                        borderBottom: '1px solid #e3ddd0',
                      }}
                    >
                      {[
                        '#',
                        'Student',
                        'Course',
                        'Payment',
                        'Balance',
                        'Amount',
                        'Branch',
                        'Date',
                        'Action',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: '#9c6b2e' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.filter(p => !selectedBranchId || String(p.branch_id) === String(selectedBranchId)).map((p, i) => {
                      const id = p.enrollment_id ?? p.id;
                      return (
                        <tr
                          key={id ?? i}
                          className="transition hover:bg-stone-50/70"
                          style={{ borderBottom: '1px solid #f1ede4' }}
                        >
                          <td className="px-4 py-3 text-xs font-bold font-mono" style={{ color: '#9c6b2e' }}>
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{p.student_name || p.name || '—'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID #{p.user_id}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {p.course_title || p.course_name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-600 font-bold text-xs">Paid</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-sm">
                            {Number(p.balance_amount) > 0 ? (
                               <span className="text-rose-600">{fmt(p.balance_amount)}</span>
                            ) : (
                               <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#9c6b2e]">
                            {fmt(p.total_fee ?? p.amount ?? p.course_fee)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                            {p.branch_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                               onClick={() => setSelectedPurchase(p)}
                               className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs"
                            >
                               View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="sa-rise relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
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
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1 flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]"/> {fmt(selectedPurchase.total_fee || selectedPurchase.course_fee).replace('₹','')}</p>
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
                             <p className="text-xl font-bold text-slate-800 mt-1">{fmt(selectedPurchase.total_fee || selectedPurchase.course_fee)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Paid</p>
                             <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(selectedPurchase.total_paid || selectedPurchase.amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance</p>
                             <p className={`text-xl font-bold mt-1 ${Number(selectedPurchase.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(selectedPurchase.balance_amount)}</p>
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
                                   <td className="px-5 py-3 font-bold text-slate-700">{fmt(inst.amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-emerald-600">{fmt(inst.paid_amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-rose-600">{fmt(inst.remaining_amount)}</td>
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
                {rejectingPurchaseId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                  <div className="flex flex-col gap-3 w-full animate-in slide-in-from-bottom-2">
                    <label className="text-sm font-bold text-slate-700">Rejection Reason</label>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please specify why this is being rejected..."
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
                        onClick={handleReject}
                        disabled={approvingId !== null}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md disabled:opacity-60"
                      >
                         {approvingId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
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
                       onClick={() => setSelectedPurchase(null)}
                       className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                    >
                       Close
                    </button>
                    {selectedPurchase.super_admin_approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => setRejectingPurchaseId(selectedPurchase.enrollment_id ?? selectedPurchase.id)}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-sm"
                        >
                           Reject
                        </button>
                        <button
                          onClick={() => {
                             handleApprove(selectedPurchase);
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

    </div>
  );
};

export default SuperAdminPurchases;
