import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  IndianRupee,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  AlertCircle,
  X,
  CreditCard,
  Calendar,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  Receipt,
  Banknote,
  Smartphone,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BranchAdminSidebar from '../components/layout/BranchAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import { getBranchAdminProfitApi } from '../services/branchadminprofit';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-modal-enter { animation: sa-rise .3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const StatCard = ({ label, value, icon: Icon, accent, delay = 0 }) => (
  <div
    className="sa-rise rounded-2xl p-5 flex flex-col gap-3"
    style={{
      animationDelay: `${delay}ms`,
      background: '#ffffff',
      border: '1px solid #e3ddd0',
      boxShadow: '0 2px 12px rgba(14,26,43,.06)',
    }}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a39a8c' }}>
        {label}
      </p>
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
  if (s === 'paid' || s === 'approved' || s === 'active') colors = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  else if (s === 'due' || s === 'overdue') colors = 'text-rose-700 bg-rose-50 border-rose-200';
  else if (s === 'partial' || s === 'pending') colors = 'text-amber-700 bg-amber-50 border-amber-200';

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border capitalize ${colors}`}>
      {status || 'Unknown'}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateString);
  }
};

const getPaymentDate = (enr, fromDateStr, toDateStr) => {
  if (Array.isArray(enr.installments)) {
    const matchingInst = enr.installments.find(
      (i) =>
        (i.paid_date && i.paid_date >= fromDateStr && i.paid_date <= toDateStr) ||
        i.paid_date === fromDateStr
    );
    if (matchingInst) return matchingInst.paid_date;
  }
  if (enr.payment_date) return enr.payment_date;
  if (enr.paid_at) return enr.paid_at;
  if (enr.created_at) return enr.created_at;
  return fromDateStr || toDateStr;
};

// Robust helper to gather all matching payment objects for an enrollment from all possible sources
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
    // 1. If enrollmentId is present on both, it MUST match!
    if (enrollmentId && pEnrId !== undefined && pEnrId !== null) {
      if (Number(pEnrId) !== Number(enrollmentId)) {
        return; // Belongs to a different enrollment, reject!
      }
    } else if (courseId && pCourseId !== undefined && pCourseId !== null) {
      // 2. If no enrollmentId but courseId is present on payment, it must match the course
      if (Number(pCourseId) !== Number(courseId)) {
        return; // Belongs to a different course, reject!
      }
      if (studentId && pStdId !== undefined && pStdId !== null && Number(pStdId) !== Number(studentId)) {
        return;
      }
    } else {
      // 3. Fallback only if neither enrollmentId nor courseId is present on payment record
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

export default function BranchAdminProfit() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [dateError, setDateError] = useState('');
  const [error, setError] = useState('');

  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profitLoading, setProfitLoading] = useState(false);

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const loadProfit = async (from, to) => {
    if (!token) return;
    if (from && to && from > to) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    setProfitLoading(true);
    setError('');

    try {
      const data = await getBranchAdminProfitApi(token, { fromDate: from, toDate: to });
      setProfit(data);
    } catch (err) {
      setError(err.message || 'Failed to load branch revenue.');
    } finally {
      setProfitLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    loadProfit(fromDate, toDate);
  }, [fromDate, toDate, token]);

  const enrollments = Array.isArray(profit?.enrollments)
    ? profit.enrollments
    : Array.isArray(profit?.payments)
    ? profit.payments
    : Array.isArray(profit?.recent_payments)
    ? profit.recent_payments
    : [];

  const totalReceived =
    profit?.total_received ??
    profit?.total_profit ??
    profit?.today_profit ??
    profit?.total_collected ??
    enrollments.reduce(
      (acc, e) =>
        acc +
        Number(
          e.amount_paid_on_date ??
            e.amount ??
            e.total_paid ??
            e.total_fee ??
            0
        ),
      0
    );

  const totalEnrolledStudents =
    profit?.total_enrolled_students ??
    profit?.total_enrollments ??
    enrollments.length;

  const cashReceived =
    profit?.cash_received ??
    enrollments
      .filter((e) => {
        const m = String(e.payment_method || '').toLowerCase();
        return m.includes('cash');
      })
      .reduce(
        (acc, e) =>
          acc +
          Number(
            e.cash_amount ??
              e.amount_paid_on_date ??
              e.amount ??
              e.total_paid ??
              e.total_fee ??
              0
          ),
        0
      );

  const razorpayReceived =
    profit?.razorpay_received ??
    profit?.online_received ??
    enrollments
      .filter((e) => {
        const m = String(e.payment_method || '').toLowerCase();
        return (
          m.includes('razorpay') ||
          m === 'online' ||
          Boolean(e.razorpay_payment_id)
        );
      })
      .reduce(
        (acc, e) =>
          acc +
          Number(
            e.amount_paid_on_date ??
              e.amount ??
              e.total_paid ??
              e.total_fee ??
              0
          ),
        0
      );

  const upiReceived =
    profit?.upi_received ??
    enrollments
      .filter((e) => {
        const m = String(e.payment_method || '').toLowerCase();
        return m.includes('upi') && !m.includes('razorpay');
      })
      .reduce(
        (acc, e) =>
          acc +
          Number(
            e.upi_amount ??
              e.amount_paid_on_date ??
              e.amount ??
              e.total_paid ??
              e.total_fee ??
              0
          ),
        0
      );

  const dueStudentAmount =
    profit?.due_student_amount ??
    profit?.outstanding_due ??
    profit?.total_due ??
    enrollments.reduce((acc, e) => acc + Number(e.balance_amount ?? 0), 0);

  // Derived matching payments for the currently opened modal enrollment
  const modalPayments = selectedEnrollment ? getEnrollmentPayments(selectedEnrollment, profit) : [];

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
    <div
      className="min-h-screen md:flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="fees"
      />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header
          className="flex items-center justify-between gap-2 border-b px-3.5 sm:px-6 lg:px-10 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#9c6b2e' }}
              >
                Branch Portal
              </p>
              <h1
                className="mt-1 text-2xl font-bold"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Branch Revenue
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/branch-admin/receipts')}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-[#f1ede4]"
            >
              <Receipt className="h-4 w-4 text-[#9c6b2e]" />
              <span>Payment Receipts</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/branch-admin/expenses')}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-[#f1ede4]"
            >
              <IndianRupee className="h-4 w-4 text-[#9c6b2e]" />
              <span>Branch Expenses</span>
            </button>
            <button
              onClick={() => {
                if (fromDate && toDate && fromDate > toDate) {
                  setDateError('From Date cannot be later than To Date.');
                  return;
                }
                loadProfit(fromDate, toDate);
              }}
              className="rounded-lg p-2 hover:bg-[#f1ede4] transition cursor-pointer"
              title="Refresh Revenue Data"
            >
              <RefreshCw
                className={`h-4 w-4 ${profitLoading ? 'animate-spin' : ''}`}
                style={{ color: '#9c6b2e' }}
              />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {user?.name?.charAt(0).toUpperCase() || 'B'}
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div
              className="rounded-xl px-4 py-4 text-sm font-medium flex items-center justify-between"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
              <button
                onClick={() => {
                  if (fromDate && toDate && fromDate > toDate) return;
                  loadProfit(fromDate, toDate);
                }}
                className="underline font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {dateError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{dateError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9c6b2e' }} />
            </div>
          ) : (
            <>
              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>
                    From Date:
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{
                      borderColor: dateError ? '#ef4444' : '#e3ddd0',
                      background: '#ffffff',
                      color: '#17140f',
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>
                    To Date:
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{
                      borderColor: dateError ? '#ef4444' : '#e3ddd0',
                      background: '#ffffff',
                      color: '#17140f',
                    }}
                  />
                </div>
              </div>

              {profitLoading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Stat Cards - Exactly like Super Admin Branch Revenue */}
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

                  {/* Payment Records Table - Exactly like Super Admin Branch Revenue */}
                  {enrollments.length === 0 ? (
                    <div
                      className="rounded-2xl px-5 py-14 text-center text-sm"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e3ddd0',
                        color: '#a39a8c',
                      }}
                    >
                      No payments or enrollments found for the selected date range.
                    </div>
                  ) : (
                    <section
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
                    >
                      <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: '1px solid #f1ede4' }}
                      >
                        <h2 className="font-semibold" style={{ color: '#17140f' }}>
                          Payment Records
                        </h2>
                        <span className="text-xs font-semibold text-slate-500">
                          {enrollments.length} record{enrollments.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                          <thead>
                            <tr style={{ background: '#faf8f4', borderBottom: '1px solid #e3ddd0' }}>
                              {[
                                'Student',
                                'Course',
                                'Total Fee',
                                'Paid Today',
                                'Total Paid',
                                'Balance',
                                'Installments',
                                'Status',
                                'Date',
                                'Action',
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                                  style={{ color: '#a39a8c' }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map((enr, i) => (
                              <tr
                                key={enr.enrollment_id ?? enr.id ?? i}
                                className="transition hover:bg-sky-50"
                                style={{ borderBottom: '1px solid #f1ede4' }}
                              >
                                <td className="px-5 py-3 font-medium">
                                  {enr.name || enr.student_name || '—'}
                                </td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>
                                  {enr.course_title || '—'}
                                </td>
                                <td className="px-5 py-3 font-medium" style={{ color: '#17140f' }}>
                                  {fmt(enr.total_fee ?? enr.course_fee)}
                                </td>
                                <td className="px-5 py-3 font-semibold" style={{ color: '#10b981' }}>
                                  {fmt(enr.amount_paid_on_date ?? enr.amount ?? enr.paid_today ?? enr.total_paid)}
                                </td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>
                                  {fmt(enr.total_paid ?? enr.amount_paid ?? enr.amount ?? 0)}
                                </td>
                                <td
                                  className="px-5 py-3 font-medium"
                                  style={{
                                    color: Number(enr.balance_amount) > 0 ? '#ef4444' : '#5b5346',
                                  }}
                                >
                                  {fmt(enr.balance_amount)}
                                </td>
                                <td className="px-5 py-3" style={{ color: '#5b5346' }}>
                                  {enr.paid_installment_count ?? 0} / {enr.installment_count ?? enr.total_installments ?? 0}
                                </td>
                                <td className="px-5 py-3">{getStatusBadge(enr.status || enr.payment_status)}</td>
                                <td className="px-5 py-3 text-xs" style={{ color: '#5b5346' }}>
                                  {formatDate(getPaymentDate(enr, fromDate, toDate))}
                                </td>
                                <td className="px-5 py-3">
                                  <button
                                    onClick={() => setSelectedEnrollment(enr)}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-800 underline cursor-pointer"
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

      {/* View Details Modal - With Accurate Payment Method and Split Cash/UPI Breakdown */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div
            className="sa-modal-enter w-full max-w-4xl bg-[#faf8f4] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            style={{ border: '1px solid #e3ddd0' }}
          >
            <header className="px-3.5 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-2 bg-white border-b border-[#e3ddd0]">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                Enrollment Details
              </h2>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
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
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Name:</span>
                      <span className="font-semibold">{selectedEnrollment.name || selectedEnrollment.student_name || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Email:</span>
                      <span>{selectedEnrollment.email || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Phone:</span>
                      <span>{selectedEnrollment.phone || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Parent Name:</span>
                      <span>{selectedEnrollment.parent_name || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Parent Phone:</span>
                      <span>{selectedEnrollment.parent_phone || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Qualification:</span>
                      <span>{selectedEnrollment.highest_qualification || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Address:</span>
                      <span>{selectedEnrollment.address || '—'}</span>
                    </p>
                  </div>
                </section>

                {/* Section 2: Course Information */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Course Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Course:</span>
                      <span className="font-semibold">{selectedEnrollment.course_title || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Course ID:</span>
                      <span>{selectedEnrollment.course_id || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Duration:</span>
                      <span>{selectedEnrollment.course_duration || '—'}</span>
                    </p>
                    <p>
                      <span className="text-slate-500 w-32 inline-block">Course Status:</span>
                      {getStatusBadge(selectedEnrollment.course_status)}
                    </p>
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
                      <span className="font-medium">{fmt(selectedEnrollment.total_fee ?? selectedEnrollment.course_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                      <span className="font-medium">Total Paid:</span>
                      <span className="font-bold text-base">{fmt(selectedEnrollment.total_paid ?? selectedEnrollment.amount_paid ?? selectedEnrollment.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-sky-50 text-sky-800 rounded-lg">
                      <span className="font-medium">Paid Today:</span>
                      <span className="font-bold text-base">
                        {fmt(selectedEnrollment.amount_paid_on_date ?? selectedEnrollment.amount ?? selectedEnrollment.paid_today ?? selectedEnrollment.total_paid)}
                      </span>
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
                      {getStatusBadge(selectedEnrollment.status || selectedEnrollment.payment_status)}
                    </div>
                  </div>
                </section>

                {/* Section 4: Installment Breakdown With Accurate Payment Method and Split Cash/UPI Breakdown */}
                <section className="bg-white rounded-xl p-5 border border-[#e3ddd0] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Installment Breakdown
                  </h3>
                  {(() => {
                    // Extract or synthesize installment list
                    const rawInstList =
                      Array.isArray(selectedEnrollment.installments) && selectedEnrollment.installments.length > 0
                        ? selectedEnrollment.installments
                        : modalPayments.length > 0
                        ? modalPayments.map((p, pIdx) => ({
                            installment_number: p.installment_number ?? pIdx + 1,
                            amount: p.amount,
                            paid_amount: p.amount,
                            paid_date: p.payment_date || p.created_at,
                            due_date: p.due_date || p.payment_date,
                            status: p.status || 'paid',
                            ...p,
                          }))
                        : [];

                    if (rawInstList.length === 0) {
                      return (
                        <div className="text-xs text-slate-500 text-center py-6">
                          No installment terms scheduled. Paid in full.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {rawInstList.map((inst, idx) => {
                          const instNum = Number(inst.installment_number ?? idx + 1);

                          // Match authoritative payment record for this installment strictly
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

                          const paidDate =
                            inst.paid_date ||
                            matchedPayment?.payment_date ||
                            matchedPayment?.paid_at ||
                            (inst.status === 'paid' ? selectedEnrollment.payment_date || selectedEnrollment.paid_at : null);

                          const isPaid =
                            String(inst.status || '').toLowerCase() === 'paid' ||
                            String(matchedPayment?.status || '').toLowerCase() === 'paid' ||
                            String(matchedPayment?.status || '').toLowerCase() === 'received' ||
                            Boolean(paidDate);

                          // Resolve Razorpay ID from payment record, installment, or enrollment
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
                            if (matchedPayment?.payment_reference && !String(matchedPayment.payment_reference).startsWith('BRANCH-')) {
                              return matchedPayment.payment_reference;
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

                          let methodDisplay = 'Pending';
                          if (rawMethodLabel) {
                            methodDisplay = rawMethodLabel;
                          } else if (isSplit) {
                            methodDisplay = 'Cash + UPI';
                          } else if (isUpi) {
                            methodDisplay = 'UPI';
                          } else if (isCash) {
                            methodDisplay = 'Cash';
                          } else if (isRazorpay) {
                            methodDisplay = 'Razorpay';
                          } else if (rawMethod) {
                            if (rawMethod === 'cash_upi') methodDisplay = 'Cash + UPI';
                            else methodDisplay = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);
                          } else if (isPaid) {
                            methodDisplay = 'Razorpay';
                          }

                          const paymentRef =
                            matchedPayment?.payment_reference ||
                            inst.payment_reference ||
                            matchedPayment?.upi_transaction_id ||
                            inst.upi_transaction_id ||
                            matchedPayment?.transaction_id ||
                            inst.transaction_id ||
                            '';

                          return (
                            <div
                              key={inst.id ?? inst.installment_id ?? idx}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-slate-900 font-extrabold">Term #{instNum}</span>
                                <span className="text-slate-900 font-extrabold">
                                  {fmt(inst.amount ?? matchedPayment?.amount ?? selectedEnrollment.total_fee / (rawInstList.length || 1))}
                                </span>
                              </div>

                              <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>Due: {formatDate(inst.due_date)}</span>
                                <span>
                                  Status: {getStatusBadge(isPaid ? 'paid' : inst.status || 'pending')}
                                </span>
                              </div>

                              {isPaid && (
                                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                                  <div className="flex justify-between text-slate-600">
                                    <span>Paid: {formatDate(paidDate)}</span>
                                    <span className="font-bold text-slate-800">
                                      Payment Method:{' '}
                                      <span className="text-[#9c6b2e] font-extrabold">
                                        {methodDisplay}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Cash + UPI Breakdown */}
                                  {isSplit && (
                                    <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] space-y-1 mt-1">
                                      <div className="flex justify-between">
                                        <span className="text-amber-900 font-semibold">Cash Amount:</span>
                                        <span className="font-extrabold text-amber-950">{fmt(cashAmount ?? 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-amber-900 font-semibold">UPI Amount:</span>
                                        <span className="font-extrabold text-amber-950">{fmt(upiAmount ?? 0)}</span>
                                      </div>
                                      {paymentRef && (
                                        <div className="flex justify-between pt-1 border-t border-amber-200/60 font-mono text-[10px]">
                                          <span className="text-amber-800">Payment Ref:</span>
                                          <span className="text-amber-950 font-bold select-all">{paymentRef}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Pure Cash with amount */}
                                  {isCash && (
                                    <div className="space-y-1 mt-1">
                                      {cashAmount !== null && (
                                        <div className="flex justify-between text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                          <span>Cash Amount:</span>
                                          <span className="font-bold text-slate-900">{fmt(cashAmount)}</span>
                                        </div>
                                      )}
                                      {paymentRef && (
                                        <div className="flex justify-between font-mono text-[10px] bg-slate-100 p-1.5 rounded-lg text-slate-700">
                                          <span>Receipt / Ref:</span>
                                          <span className="font-bold select-all">{paymentRef}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Pure UPI with amount and transaction id */}
                                  {isUpi && (
                                    <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-200 text-[11px] space-y-1 mt-1">
                                      {upiAmount !== null && (
                                        <div className="flex justify-between">
                                          <span className="text-sky-900 font-semibold">UPI Amount:</span>
                                          <span className="font-extrabold text-sky-950">{fmt(upiAmount)}</span>
                                        </div>
                                      )}
                                      {paymentRef && (
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-sky-800">UPI Ref:</span>
                                          <span className="text-sky-950 font-bold select-all">{paymentRef}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Razorpay transaction details - ALWAYS show razorpay_payment_id if Razorpay */}
                                  {isRazorpay && (
                                    <div className="flex justify-between items-center font-mono text-[10px] bg-slate-100 px-2.5 py-1.5 rounded-lg text-slate-700 mt-1">
                                      <span className="font-sans font-semibold text-slate-500">Razorpay ID:</span>
                                      <span className="font-bold select-all text-slate-900">
                                        {razorpayId || 'Online Payment'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
