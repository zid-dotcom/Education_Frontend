import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, Loader2, RefreshCw, ShoppingCart, X, User, Mail, Phone, GraduationCap, MapPin, Users, IndianRupee, Wallet, Calendar, AlertCircle, ShieldCheck, CreditCard, BookOpen, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminRecordBranchesApi, getSuperAdminAllDueStudentsApi, getSuperAdminBranchDueStudentsApi } from '../services/superadmin';

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



const SuperAdminDueStudents = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueStudents, setDueStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  const handleApprove = async (student) => {
    console.warn("Approve action not implemented for due students");
  };

  const handleReject = async () => {
    console.warn("Reject action not implemented for due students");
  };


  // Fetch branches for purchase filtering
  useEffect(() => {
    if (!token) return;
    getSuperAdminRecordBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch(() => {
        // Fallback or silent if branches fail
      });
  }, [token]);

  const loadDueStudents = async (branchId = selectedBranchId) => {
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const bId = branchId ? Number(branchId) : undefined;
      let data;
      if (bId) {
        data = await getSuperAdminBranchDueStudentsApi(bId, token);
      } else {
        data = await getSuperAdminAllDueStudentsApi(token);
      }
      setDueStudents(Array.isArray(data) ? data : data?.due_students || []);
    } catch (err) {
      setError(err.message || 'Failed to load dueStudents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueStudents(selectedBranchId);
  }, [selectedBranchId, token]);

  

  

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
        activePage="dueStudents"
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
              Due Students
            </h1>
          </div>
          <button
            onClick={() => loadDueStudents(selectedBranchId)}
            className="rounded-lg p-2 hover:bg-[#f1ede4]"
            title="Refresh dueStudents"
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

            {/* Search Input */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by student name or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50"
                  style={{ borderColor: '#e3ddd0', color: '#17140f' }}
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
          ) : dueStudents.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
              style={{ borderColor: '#e3ddd0', color: '#64748b' }}
            >
              <ShoppingCart className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No due students found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || selectedBranchId
                  ? 'No students found matching your criteria.'
                  : `There are currently no students with pending dues.`}
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
                        'Student Details',
                        'Courses',
                        'Branches',
                        'Due Date',
                        'Total Due',
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
                    {dueStudents.filter(p => {
                      const branchMatches = !selectedBranchId || p.due_enrollments?.some(e => String(e.branch_id) === String(selectedBranchId));
                      if (!searchTerm) return branchMatches;
                      
                      const term = searchTerm.toLowerCase();
                      const nameMatches = p.name?.toLowerCase().includes(term);
                      const courseMatches = p.due_enrollments?.some(e => e.course_title?.toLowerCase().includes(term));
                      return branchMatches && (nameMatches || courseMatches);
                    }).map((p, i) => {
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
                            <p className="font-bold text-slate-900">{p.name || '—'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID #{p.student_id}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{p.phone || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {p.due_enrollments?.map(e => e.course_title).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {p.due_enrollments?.map(e => e.branch_name).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {p.due_enrollments?.[0]?.due_installments?.[0]?.due_date ? new Date(p.due_enrollments[0].due_installments[0].due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3 font-bold text-sm">
                            <span className="text-rose-600">{fmt(p.total_due_amount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                               onClick={() => setSelectedStudent({
                                 ...p,
                                 ...(p.due_enrollments?.[0] || {}),
                                 installments: p.due_enrollments?.[0]?.due_installments || [],
                                 user_id: p.student_id
                               })}
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
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="sa-rise relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
             {/* Header */}
             <div className="shrink-0 flex flex-wrap gap-4 items-center justify-between p-5 sm:px-6 border-b border-[#e3ddd0] bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedStudent.name || selectedStudent.student_name} 
                    <span className="text-slate-400 font-normal ml-2">#{selectedStudent.enrollment_id ?? selectedStudent.id}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.course_title || selectedStudent.course_name}</span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.branch_name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end mr-4">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Branch:</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${selectedStudent.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedStudent.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : selectedStudent.branch_approval_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{selectedStudent.branch_approval_status}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-700">Super Admin:</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${selectedStudent.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedStudent.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedStudent.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{selectedStudent.super_admin_approval_status}</span>
                     </div>
                   </div>
                   <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200">
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
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedStudent.name || selectedStudent.student_name}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User ID</p>
                             <p className="text-sm font-mono text-slate-800 mt-1">#{selectedStudent.user_id}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.email || '—'}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.phone || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Highest Qualification</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.highest_qualification || '—'}</p>
                           </div>
                           <div className="col-span-2">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0 mt-0.5"/> {selectedStudent.address || '—'}</p>
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
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedStudent.parent_name || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.parent_phone || '—'}</p>
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
                          {selectedStudent.course_image && (
                            <img src={selectedStudent.course_image} alt="Course" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                          )}
                          <div className="grid grid-cols-2 gap-5 flex-1">
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Name</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1">{selectedStudent.course_title || selectedStudent.course_name}</p>
                             </div>
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Name</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.branch_name}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Duration</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-stone-500"/> {selectedStudent.course_duration || '—'}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Course Fee</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1 flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]"/> {fmt(selectedStudent.total_fee || selectedStudent.course_fee).replace('₹','')}</p>
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
                             <p className="text-xl font-bold text-slate-800 mt-1">{fmt(selectedStudent.total_fee || selectedStudent.course_fee)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Paid</p>
                             <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(selectedStudent.total_paid || selectedStudent.amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance</p>
                             <p className={`text-xl font-bold mt-1 ${Number(selectedStudent.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(selectedStudent.balance_amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase border shadow-2xs ${selectedStudent.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                                {selectedStudent.payment_status || '—'}
                             </span>
                           </div>
                           <div className="col-span-2 pt-4 border-t border-stone-100">
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Installments Paid</p>
                             <p className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-stone-100">
                                {Number(selectedStudent.installment_count) > 0 
                                  ? `${selectedStudent.paid_installment_count ?? 0} of ${selectedStudent.installment_count} Paid`
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
                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedStudent.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedStudent.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : selectedStudent.branch_approval_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {selectedStudent.branch_approval_status || '—'}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Super Admin Approval</p>
                             <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${selectedStudent.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedStudent.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedStudent.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {selectedStudent.super_admin_approval_status || '—'}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase border ${selectedStudent.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {selectedStudent.payment_status || '—'}
                             </span>
                           </div>
                           {selectedStudent.super_admin_rejection_reason && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">{selectedStudent.super_admin_rejection_reason}</p>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Payment Gateway Details */}
                     {(selectedStudent.razorpay_order_id || selectedStudent.razorpay_payment_id) && (
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Gateway Details</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 gap-4">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Razorpay Order ID</p>
                             <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">{selectedStudent.razorpay_order_id || 'Not applicable'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Razorpay Payment ID</p>
                             <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">{selectedStudent.razorpay_payment_id || 'Not applicable'}</p>
                           </div>
                        </div>
                     </div>
                     )}

                   </div>
                </div>

                {/* Installment Schedule (Full Width) */}
                {selectedStudent.installments && selectedStudent.installments.length > 0 ? (
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
                                 <th className="px-5 py-3">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-[#f1ede4]">
                              {selectedStudent.installments.map((inst, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition">
                                   <td className="px-5 py-3 font-medium text-slate-800">#{inst.installment_number}</td>
                                   <td className="px-5 py-3 font-bold text-slate-700">{fmt(inst.amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-emerald-600">{fmt(inst.paid_amount)}</td>
                                   <td className="px-5 py-3 font-semibold text-rose-600">{fmt(inst.remaining_amount)}</td>
                                   <td className="px-5 py-3 text-xs font-medium text-slate-600">{inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
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
             <div className="shrink-0 p-5 sm:px-6 border-t border-[#e3ddd0] bg-white flex justify-end rounded-b-2xl">
                <button
                   onClick={() => setSelectedStudent(null)}
                   className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
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

export default SuperAdminDueStudents;
