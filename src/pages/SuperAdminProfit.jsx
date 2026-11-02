import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, IndianRupee, Loader2, RefreshCw, TrendingUp, Users, AlertCircle, X, CreditCard,
  Calendar, GraduationCap, MapPin, Mail, Phone, BookOpen, Receipt, Banknote, Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getSuperAdminProfitBranchesApi,
  getSuperAdminBranchProfitApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-modal-enter { animation: sa-rise .3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);

const StatCard = ({ label, value, icon: Icon, accent, delay = 0 }) => (
  <div className="sa-rise rounded-2xl p-5 flex flex-col gap-3"
    style={{ animationDelay: `${delay}ms`, background: '#ffffff', border: '1px solid #e3ddd0', boxShadow: '0 2px 12px rgba(14,26,43,.06)' }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a39a8c' }}>{label}</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent + '15' }}>
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
    </div>
    <p className="text-2xl font-bold" style={{ color: '#17140f' }}>{value}</p>
  </div>
);

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  let colors = 'text-slate-600 bg-slate-50 border-slate-200';
  if (s === 'paid' || s === 'approved') colors = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  else if (s === 'due') colors = 'text-rose-700 bg-rose-50 border-rose-200';
  else if (s === 'partial' || s === 'pending') colors = 'text-amber-700 bg-amber-50 border-amber-200';
  
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border capitalize ${colors}`}>
      {status || 'Unknown'}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPaymentDate = (enr, fromDateStr, toDateStr) => {
  if (Array.isArray(enr.installments)) {
    const matchingInst = enr.installments.find(i => 
      (i.paid_date && i.paid_date >= fromDateStr && i.paid_date <= toDateStr) ||
      i.paid_date === fromDateStr
    );
    if (matchingInst) return matchingInst.paid_date;
  }
  if (enr.payment_date) return enr.payment_date;
  if (enr.paid_at) return enr.paid_at;
  return fromDateStr;
};

// Strict enrollment-first matching helper for payment records
const getEnrollmentPayments = (enrollment, rootProfit) => {
  if (!enrollment) return [];
  const enrollmentId = enrollment.enrollment_id ?? enrollment.id;
  const courseId = enrollment.course_id ?? enrollment.course?.id;
  const studentId = enrollment.student_id ?? enrollment.student?.id;

  const allSources = [
    ...(Array.isArray(enrollment.payments) ? enrollment.payments : []),
    ...(Array.isArray(enrollment.payment_history) ? enrollment.payment_history : []),
    ...(Array.isArray(enrollment.transactions) ? enrollment.transactions : []),
    ...(Array.isArray(enrollment.installment_payments) ? enrollment.installment_payments : []),
    ...(Array.isArray(enrollment.recent_payments) ? enrollment.recent_payments : []),
    ...(Array.isArray(rootProfit?.payments) ? rootProfit.payments : []),
    ...(Array.isArray(rootProfit?.all_payments) ? rootProfit.all_payments : []),
    ...(Array.isArray(rootProfit?.transactions) ? rootProfit.transactions : []),
    ...(Array.isArray(rootProfit?.recent_payments) ? rootProfit.recent_payments : []),
    ...(Array.isArray(rootProfit) ? rootProfit : []),
  ];

  const uniqueMap = new Map();
  allSources.forEach((p, idx) => {
    if (!p) return;
    const pEnrId = p.enrollment_id ?? p.enrollmentId;
    const pCourseId = p.course_id ?? p.courseId;
    const pStdId = p.student_id ?? p.studentId;
    const pStdName = p.student_name ?? p.studentName ?? p.name;

    // Strict enrollment-first matching:
    if (enrollmentId && pEnrId !== undefined && pEnrId !== null) {
      if (Number(pEnrId) !== Number(enrollmentId)) return;
    } else if (courseId && pCourseId !== undefined && pCourseId !== null) {
      if (Number(pCourseId) !== Number(courseId)) return;
      if (studentId && pStdId !== undefined && pStdId !== null && Number(pStdId) !== Number(studentId)) return;
    } else {
      const studentMatch =
        (studentId && pStdId !== undefined && pStdId !== null && Number(pStdId) === Number(studentId)) ||
        (enrollment.name && pStdName && String(pStdName).trim().toLowerCase() === String(enrollment.name).trim().toLowerCase());
      if (!studentMatch) return;
    }

    const key = p.payment_id || p.id || `${p.installment_number}_${p.amount}_${p.payment_date || idx}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, p);
    }
  });

  return Array.from(uniqueMap.values());
};

const SuperAdminProfit = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  
  const [todayProfit, setTodayProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profitLoading, setProfitLoading] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [dateError, setDateError] = useState('');
  const [error, setError] = useState('');
  
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminProfitBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.branches ?? []);
        setBranches(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadProfit = (branchId, from, to) => {
    if (!token || !branchId) return;
    if (from && to && from > to) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    setProfitLoading(true);
    setError('');
    
    getSuperAdminBranchProfitApi(branchId, token, { fromDate: from, toDate: to })
      .then((data) => {
        setTodayProfit(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setProfitLoading(false));
  };

  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    if (selectedBranchId) {
      loadProfit(selectedBranchId, fromDate, toDate);
    }
  }, [selectedBranchId, fromDate, toDate, token]);

  const enrollments = Array.isArray(todayProfit?.enrollments)
    ? todayProfit.enrollments
    : Array.isArray(todayProfit?.payments)
    ? todayProfit.payments
    : Array.isArray(todayProfit?.recent_payments)
    ? todayProfit.recent_payments
    : [];
  
  const totalReceived =
    todayProfit?.total_received ??
    todayProfit?.today_profit ??
    todayProfit?.total_collected ??
    todayProfit?.total_profit ??
    0;

  const totalEnrolledStudents =
    todayProfit?.total_enrolled_students ??
    todayProfit?.total_enrollments ??
    enrollments.length;

  const cashReceived = todayProfit?.cash_received ?? 0;

  const razorpayReceived =
    todayProfit?.razorpay_received ??
    todayProfit?.online_received ??
    0;

  const upiReceived = todayProfit?.upi_received ?? 0;

  const dueStudentAmount =
    todayProfit?.due_student_amount ??
    todayProfit?.outstanding_due ??
    todayProfit?.total_due ??
    0;

  const modalPayments = selectedEnrollment ? getEnrollmentPayments(selectedEnrollment, todayProfit) : [];

  // Enrollment-level Cash & UPI totals for Payment Summary
  const enrollmentCashTotal = (() => {
    if (!selectedEnrollment) return 0;
    let total = 0;
    let hasVal = false;
    if (modalPayments.length > 0) {
      modalPayments.forEach((p) => {
        const m = String(p.payment_method || '').toLowerCase();
        if (p.cash_amount !== undefined && p.cash_amount !== null) {
          total += Number(p.cash_amount);
          hasVal = true;
        } else if (m === 'cash') {
          total += Number(p.amount || 0);
          hasVal = true;
        }
      });
    }
    if (hasVal) return total;

    if (Array.isArray(selectedEnrollment.installments)) {
      selectedEnrollment.installments.forEach((inst) => {
        const m = String(inst.payment_method || '').toLowerCase();
        if (inst.cash_amount !== undefined && inst.cash_amount !== null) {
          total += Number(inst.cash_amount);
          hasVal = true;
        } else if (m === 'cash') {
          total += Number(inst.amount || inst.paid_amount || 0);
          hasVal = true;
        }
      });
    }
    if (hasVal) return total;

    if (selectedEnrollment.cash_amount !== undefined && selectedEnrollment.cash_amount !== null) {
      return Number(selectedEnrollment.cash_amount);
    }
    return 0;
  })();

  const enrollmentUpiTotal = (() => {
    if (!selectedEnrollment) return 0;
    let total = 0;
    let hasVal = false;
    if (modalPayments.length > 0) {
      modalPayments.forEach((p) => {
        const m = String(p.payment_method || '').toLowerCase();
        if (p.upi_amount !== undefined && p.upi_amount !== null) {
          total += Number(p.upi_amount);
          hasVal = true;
        } else if (m === 'upi') {
          total += Number(p.amount || 0);
          hasVal = true;
        }
      });
    }
    if (hasVal) return total;

    if (Array.isArray(selectedEnrollment.installments)) {
      selectedEnrollment.installments.forEach((inst) => {
        const m = String(inst.payment_method || '').toLowerCase();
        if (inst.upi_amount !== undefined && inst.upi_amount !== null) {
          total += Number(inst.upi_amount);
          hasVal = true;
        } else if (m === 'upi') {
          total += Number(inst.amount || inst.paid_amount || 0);
          hasVal = true;
        }
      });
    }
    if (hasVal) return total;

    if (selectedEnrollment.upi_amount !== undefined && selectedEnrollment.upi_amount !== null) {
      return Number(selectedEnrollment.upi_amount);
    }
    return 0;
  })();

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="profit" />

      <main className="min-w-0 flex-1">
        <header className="hidden md:flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>Branch Revenue</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/super-admin/expenses')}
              className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-[#f1ede4]"
            >
              <Receipt className="h-4 w-4 text-[#9c6b2e]" />
              <span>Branch Expenses</span>
            </button>
            <button
              onClick={() => {
                if (fromDate && toDate && fromDate > toDate) {
                  setDateError('From Date cannot be later than To Date.');
                  return;
                }
                loadProfit(selectedBranchId, fromDate, toDate);
              }}
              className="rounded-lg p-2 hover:bg-[#f1ede4]"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${profitLoading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div className="rounded-xl px-4 py-4 text-sm font-medium flex items-center justify-between" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
              <button
                onClick={() => {
                  if (fromDate && toDate && fromDate > toDate) return;
                  loadProfit(selectedBranchId, fromDate, toDate);
                }}
                className="underline font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {dateError && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{dateError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9c6b2e' }} /></div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>Branch:</label>
                  <div className="relative">
                    <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="appearance-none rounded-xl border pl-4 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                      style={{ borderColor: '#e3ddd0', background: '#ffffff', color: '#17140f' }}>
                      <option value="" disabled>Please select a branch</option>
                      {branches.map(b => <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>{b.name || b.branch_name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#a39a8c' }} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>From Date:</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: dateError ? '#ef4444' : '#e3ddd0', background: '#ffffff', color: '#17140f' }} />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>To Date:</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: dateError ? '#ef4444' : '#e3ddd0', background: '#ffffff', color: '#17140f' }} />
                </div>
              </div>

              {profitLoading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse"></div>)}
                  </div>
                  <div className="h-64 rounded-2xl bg-slate-200 animate-pulse"></div>
                </div>
              ) : !selectedBranchId ? (
                <div className="rounded-2xl px-5 py-14 text-center text-sm font-medium" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#5b5346' }}>
                  Please select a branch from the dropdown above to view its revenue data.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      label="Total Received"
                      value={fmt(totalReceived)}
                      icon={IndianRupee}
                      accent="#10b981"
                      delay={0}
                    />
                    <StatCard
                      label="Students Enrolled"
                      value={Number(totalEnrolledStudents || 0).toLocaleString('en-IN')}
                      icon={Users}
                      accent="#8b5cf6"
                      delay={50}
                    />
                    <StatCard
                      label="Cash Received"
                      value={fmt(cashReceived)}
                      icon={Banknote}
                      accent="#059669"
                      delay={100}
                    />
                    <StatCard
                      label="Razorpay Received"
                      value={fmt(razorpayReceived)}
                      icon={CreditCard}
                      accent="#3b82f6"
                      delay={150}
                    />
                    <StatCard
                      label="UPI Received"
                      value={fmt(upiReceived)}
                      icon={Smartphone}
                      accent="#f59e0b"
                      delay={200}
                    />
                    <StatCard
                      label="Outstanding Due"
                      value={fmt(dueStudentAmount)}
                      icon={AlertCircle}
                      accent="#ef4444"
                      delay={250}
                    />
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="rounded-2xl px-5 py-14 text-center text-sm" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#a39a8c' }}>
                      No payments or enrollments found for the selected date range.
                    </div>
                  ) : (
                    <section className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}>
                      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1ede4' }}>
                        <h2 className="font-semibold" style={{ color: '#17140f' }}>Payment Records</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                          <thead>
                            <tr style={{ background: '#faf8f4', borderBottom: '1px solid #e3ddd0' }}>
                              {['Student', 'Course', 'Total Fee', 'Paid Today', 'Total Paid', 'Balance', 'Installments', 'Status', 'Date', 'Action'].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#a39a8c' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map((enr, i) => (
                              <tr key={enr.enrollment_id ?? i} className="transition hover:bg-sky-50" style={{ borderBottom: '1px solid #f1ede4' }}>
                                <td className="px-5 py-3 font-medium">{enr.name || '—'}</td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>{enr.course_title || '—'}</td>
                                <td className="px-5 py-3 font-medium" style={{ color: '#17140f' }}>{fmt(enr.total_fee)}</td>
                                <td className="px-5 py-3 font-semibold" style={{ color: '#10b981' }}>{fmt(enr.amount_paid_on_date)}</td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>{fmt(enr.total_paid)}</td>
                                <td className="px-5 py-3 font-medium" style={{ color: Number(enr.balance_amount) > 0 ? '#ef4444' : '#5b5346' }}>
                                  {fmt(enr.balance_amount)}
                                </td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>
                                  {enr.paid_installment_count ?? 0} / {enr.installment_count ?? 0}
                                </td>
                                <td className="px-5 py-3">{getStatusBadge(enr.status)}</td>
                                <td className="px-5 py-3 text-xs" style={{ color: '#5b5346' }}>
                                  {formatDate(getPaymentDate(enr, fromDate, toDate))}
                                </td>
                                <td className="px-5 py-3">
                                  <button
                                    onClick={() => setSelectedEnrollment(enr)}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-800 underline"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div className="sa-modal-enter w-full max-w-4xl bg-[#faf8f4] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ border: '1px solid #e3ddd0' }}>
            <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-[#e3ddd0]">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>Enrollment Details</h2>
              <button onClick={() => setSelectedEnrollment(null)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Student Information */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Student Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 w-32 inline-block">Name:</span> <span className="font-semibold">{selectedEnrollment.name || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Email:</span> <span>{selectedEnrollment.email || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Phone:</span> <span>{selectedEnrollment.phone || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Parent Name:</span> <span>{selectedEnrollment.parent_name || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Parent Phone:</span> <span>{selectedEnrollment.parent_phone || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Qualification:</span> <span>{selectedEnrollment.highest_qualification || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Address:</span> <span>{selectedEnrollment.address || '—'}</span></p>
                  </div>
                </section>

                {/* Section 2: Course Information */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Course Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 w-32 inline-block">Course:</span> <span className="font-semibold">{selectedEnrollment.course_title || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Course ID:</span> <span>{selectedEnrollment.course_id || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Duration:</span> <span>{selectedEnrollment.course_duration || '—'}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Course Status:</span> {getStatusBadge(selectedEnrollment.course_status)}</p>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 3: Payment Summary */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Payment Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Fee:</span>
                      <span className="font-medium">{fmt(selectedEnrollment.total_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                      <span className="font-medium">Total Paid:</span>
                      <span className="font-bold text-base">{fmt(selectedEnrollment.total_paid)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-sky-50 text-sky-800 rounded-lg">
                      <span className="font-medium">Paid Today:</span>
                      <span className="font-bold text-base">{fmt(selectedEnrollment.amount_paid_on_date)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-rose-50 text-rose-800 rounded-lg">
                      <span className="font-medium">Balance:</span>
                      <span className="font-bold text-base">{fmt(selectedEnrollment.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-50/80 text-amber-950 rounded-lg border border-amber-200/60">
                      <span className="font-medium text-amber-900">Cash:</span>
                      <span className="font-bold text-base">{fmt(enrollmentCashTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-sky-50/80 text-sky-950 rounded-lg border border-sky-200/60">
                      <span className="font-medium text-sky-900">UPI:</span>
                      <span className="font-bold text-base">{fmt(enrollmentUpiTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Payment Status:</span>
                      {getStatusBadge(selectedEnrollment.status)}
                    </div>
                  </div>
                </section>

                {/* Section 4: Installment Summary */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Installment Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-slate-500 w-40 inline-block">Total Installments:</span> <span className="font-medium">{selectedEnrollment.installment_count ?? 0}</span></p>
                    <p><span className="text-slate-500 w-40 inline-block">Paid Installments:</span> <span className="font-medium text-emerald-600">{selectedEnrollment.paid_installment_count ?? 0}</span></p>
                    <p><span className="text-slate-500 w-40 inline-block">Remaining Installments:</span> <span className="font-medium text-slate-700">{selectedEnrollment.remaining_installment_count ?? 0}</span></p>
                    <p><span className="text-slate-500 w-40 inline-block">Due Installments:</span> <span className="font-medium text-rose-600">{selectedEnrollment.due_installment_count ?? 0}</span></p>
                    
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-slate-600 text-center text-xs font-semibold uppercase tracking-widest border border-slate-200">
                      {selectedEnrollment.paid_installment_count ?? 0} / {selectedEnrollment.installment_count ?? 0} Paid • {selectedEnrollment.remaining_installment_count ?? 0} Remaining • {selectedEnrollment.due_installment_count ?? 0} Due
                    </div>
                  </div>
                </section>
              </div>

              {/* Section 5: Installment Details */}
              {Array.isArray(selectedEnrollment.installments) && selectedEnrollment.installments.length > 0 && (
                <section className="bg-white rounded-xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e3ddd0] bg-slate-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Installment Details
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-xs border-b border-[#e3ddd0]">
                          <th className="px-5 py-3 font-semibold">Term</th>
                          <th className="px-5 py-3 font-semibold">Amount</th>
                          <th className="px-5 py-3 font-semibold">Paid</th>
                          <th className="px-5 py-3 font-semibold">Remaining</th>
                          <th className="px-5 py-3 font-semibold">Due Date</th>
                          <th className="px-5 py-3 font-semibold">Paid Date</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Payment Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEnrollment.installments.map((inst, i) => {
                          const instNum = Number(inst.installment_number ?? i + 1);

                          const matchedPayment =
                            modalPayments.find((p) => {
                              if (!p) return false;
                              if (Array.isArray(p.installment_numbers) && p.installment_numbers.map(Number).includes(instNum)) {
                                return true;
                              }
                              if (p.installment_number !== undefined && p.installment_number !== null) {
                                return Number(p.installment_number) === instNum;
                              }
                              if (inst.payment_id && (p.payment_id === inst.payment_id || p.id === inst.payment_id)) {
                                return true;
                              }
                              return false;
                            }) || null;

                          const isInstPaid = String(inst.status || '').toLowerCase() === 'paid';

                          const razorpayId = (() => {
                            if (matchedPayment?.razorpay_payment_id) return matchedPayment.razorpay_payment_id;
                            if (matchedPayment?.payment_reference && String(matchedPayment.payment_reference).startsWith('pay_')) {
                              return matchedPayment.payment_reference;
                            }
                            if (matchedPayment?.transaction_id && String(matchedPayment.transaction_id).startsWith('pay_')) {
                              return matchedPayment.transaction_id;
                            }
                            if (inst?.razorpay_payment_id) return inst.razorpay_payment_id;
                            if (inst?.payment_reference && String(inst.payment_reference).startsWith('pay_')) {
                              return inst.payment_reference;
                            }
                            if (inst?.transaction_id && String(inst.transaction_id).startsWith('pay_')) {
                              return inst.transaction_id;
                            }
                            if (selectedEnrollment?.razorpay_payment_id) {
                              return selectedEnrollment.razorpay_payment_id;
                            }
                            return '';
                          })();

                          const rawMethod = String(
                            matchedPayment?.payment_method ||
                            matchedPayment?.method ||
                            inst.payment_method ||
                            inst.method ||
                            (razorpayId ? 'razorpay' : '') ||
                            ''
                          ).toLowerCase().trim();

                          const rawMethodLabel = matchedPayment?.payment_method_label || inst.payment_method_label;

                          const cashAmount =
                            matchedPayment?.cash_amount !== undefined && matchedPayment?.cash_amount !== null
                              ? Number(matchedPayment.cash_amount)
                              : inst.cash_amount !== undefined && inst.cash_amount !== null
                              ? Number(inst.cash_amount)
                              : null;

                          const upiAmount =
                            matchedPayment?.upi_amount !== undefined && matchedPayment?.upi_amount !== null
                              ? Number(matchedPayment.upi_amount)
                              : inst.upi_amount !== undefined && inst.upi_amount !== null
                              ? Number(inst.upi_amount)
                              : null;

                          const isSplit =
                            rawMethod === 'cash_upi' ||
                            rawMethod === 'split' ||
                            rawMethod.includes('cash+upi') ||
                            rawMethod.includes('cash + upi') ||
                            (cashAmount !== null && upiAmount !== null && cashAmount > 0 && upiAmount > 0);

                          const isCash =
                            !isSplit &&
                            (rawMethod === 'cash' || (cashAmount !== null && cashAmount > 0 && (!upiAmount || upiAmount === 0)));

                          const isUpi =
                            !isSplit &&
                            !isCash &&
                            (rawMethod === 'upi' || (upiAmount !== null && upiAmount > 0 && (!cashAmount || cashAmount === 0)));

                          const isRazorpay =
                            !isSplit &&
                            !isCash &&
                            !isUpi &&
                            (rawMethod === 'razorpay' ||
                              rawMethod === 'online' ||
                              rawMethod.includes('razorpay') ||
                              Boolean(razorpayId));

                          const paymentRef =
                            matchedPayment?.payment_reference ||
                            inst.payment_reference ||
                            matchedPayment?.upi_transaction_id ||
                            inst.upi_transaction_id ||
                            '';

                          return (
                            <tr key={inst.installment_id ?? i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 font-medium text-slate-700">#{inst.installment_number}</td>
                              <td className="px-5 py-3 font-medium text-slate-800">{fmt(inst.amount)}</td>
                              <td className="px-5 py-3 text-emerald-600 font-semibold">{fmt(inst.paid_amount)}</td>
                              <td className="px-5 py-3 text-slate-600">{fmt(inst.remaining_amount)}</td>
                              <td className="px-5 py-3 text-slate-500">{formatDate(inst.due_date)}</td>
                              <td className="px-5 py-3 text-slate-500">{formatDate(inst.paid_date)}</td>
                              <td className="px-5 py-3">{getStatusBadge(inst.status)}</td>
                              <td className="px-5 py-3 text-xs">
                                {!isInstPaid ? (
                                  <span className="text-slate-400 font-medium">Pending payment</span>
                                ) : isSplit ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-[#9c6b2e]">Cash + UPI:</span>{' '}
                                    <span className="text-slate-700">Cash {fmt(cashAmount ?? 0)} + UPI {fmt(upiAmount ?? 0)}</span>
                                    {paymentRef && <div className="font-mono text-[10px] text-slate-500">Ref: {paymentRef}</div>}
                                  </div>
                                ) : isCash ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-[#9c6b2e]">Cash</span>
                                    {paymentRef && <div className="font-mono text-[10px] text-slate-500">Ref: {paymentRef}</div>}
                                  </div>
                                ) : isUpi ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-[#9c6b2e]">UPI</span>
                                    {paymentRef && <div className="font-mono text-[10px] text-slate-500">Txn: {paymentRef}</div>}
                                  </div>
                                ) : isRazorpay ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-[#9c6b2e]">Razorpay</span>
                                    {razorpayId && <div className="font-mono text-[10px] text-slate-600 font-bold select-all">{razorpayId}</div>}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">{rawMethodLabel || 'Online'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Section 6: Payment / Razorpay Information */}
              {(selectedEnrollment.razorpay_order_id || selectedEnrollment.razorpay_payment_id) ? (
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Razorpay Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 w-48 inline-block">Razorpay Order ID:</span> <span className="font-mono text-slate-700">{selectedEnrollment.razorpay_order_id || '—'}</span></p>
                    <p><span className="text-slate-500 w-48 inline-block">Razorpay Payment ID:</span> <span className="font-mono text-slate-700">{selectedEnrollment.razorpay_payment_id || '—'}</span></p>
                  </div>
                </section>
              ) : null}



            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminProfit;
