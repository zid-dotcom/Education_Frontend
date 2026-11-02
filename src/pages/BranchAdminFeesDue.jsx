import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  GraduationCap,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
  Wallet,
  X,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BranchAdminSidebar from '../components/layout/BranchAdminSidebar';
import { getDueAdmissionsApi } from '../services/branchadminadmissions';
import { getBranchAdminDashboardApi } from '../services/branchadmindashboard';

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

const getStudentDueDates = (student) => {
  const dates = [];
  if (Array.isArray(student.due_enrollments)) {
    student.due_enrollments.forEach((enr) => {
      if (Array.isArray(enr.due_installments)) {
        enr.due_installments.forEach((inst) => {
          if (inst.due_date) dates.push(inst.due_date);
        });
      }
    });
  }
  if (Array.isArray(student.due_installments)) {
    student.due_installments.forEach((inst) => {
      if (inst.due_date) dates.push(inst.due_date);
    });
  }
  if (Array.isArray(student.installments)) {
    student.installments.forEach((inst) => {
      if (inst.due_date) dates.push(inst.due_date);
    });
  }
  if (student.next_installment?.due_date) dates.push(student.next_installment.due_date);
  if (student.next_due_date) dates.push(student.next_due_date);
  if (student.due_date) dates.push(student.due_date);
  if (student.firstDue) dates.push(student.firstDue);
  if (student.admission_date && dates.length === 0) dates.push(student.admission_date);
  return dates;
};

const getPendingTermsText = (student) => {
  if (!student) return '';
  const installments = student.installments || [];
  const pendingInstalls = installments.filter((inst) => {
    const status = String(inst.status || '').toLowerCase();
    const rem = Number(inst.remaining_amount ?? (Number(inst.amount || 0) - Number(inst.paid_amount || 0)));
    return status !== 'paid' && (status === 'pending' || status === 'due' || status === 'partial' || rem > 0);
  });

  const listToUse = pendingInstalls.length > 0 ? pendingInstalls : installments;
  if (listToUse.length === 0) return '';

  const numbers = listToUse.map((inst, idx) => inst.installment_number || idx + 1);
  if (numbers.length === 1) return `#${numbers[0]}`;
  return `#${numbers.slice(0, -1).join(', #')} and #${numbers[numbers.length - 1]}`;
};

const formatDisplayDate = (dStr) => {
  if (!dStr) return '—';
  try {
    const clean = dStr.includes('T') ? dStr : `${dStr}T00:00:00`;
    const d = new Date(clean);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dStr);
  }
};

const normalizeDueStudent = (item, defaultBranchName = 'Branch Office') => {
  const primaryEnrollment = item.due_enrollments?.[0] || item;
  const installments =
    primaryEnrollment.due_installments ||
    primaryEnrollment.installments ||
    item.due_installments ||
    item.installments ||
    [];

  const studentId =
    item.student_id ||
    item.user_id ||
    primaryEnrollment.student_id ||
    primaryEnrollment.user_id ||
    item.id;

  const enrollmentId =
    primaryEnrollment.enrollment_id ||
    item.enrollment_id ||
    item.id;

  const totalDue = Number(
    item.total_due_amount ??
    primaryEnrollment.balance_amount ??
    item.balance_amount ??
    primaryEnrollment.remaining_amount ??
    item.remaining_amount ??
    0
  );

  const courseTitle =
    primaryEnrollment.course_title ||
    primaryEnrollment.course_name ||
    item.course_title ||
    item.course_name ||
    '—';

  const branchName =
    primaryEnrollment.branch_name ||
    item.branch_name ||
    item.branch_details?.name ||
    primaryEnrollment.branch_details?.name ||
    defaultBranchName;

  return {
    ...item,
    ...primaryEnrollment,
    student_id: studentId,
    enrollment_id: enrollmentId,
    user_id: studentId,
    name: item.name || item.student_name || primaryEnrollment.name || primaryEnrollment.student_name || '—',
    email: item.email || primaryEnrollment.email || '—',
    phone: item.phone || primaryEnrollment.phone || '—',
    parent_name: item.parent_name || primaryEnrollment.parent_name || '—',
    parent_phone: item.parent_phone || primaryEnrollment.parent_phone || '—',
    highest_qualification: item.highest_qualification || primaryEnrollment.highest_qualification || '—',
    address: item.address || primaryEnrollment.address || '—',
    course_title: courseTitle,
    course_name: courseTitle,
    course_duration: primaryEnrollment.course_duration || item.course_duration || '—',
    course_image: primaryEnrollment.course_image || item.course_image || null,
    branch_name: branchName,
    total_due_amount: totalDue,
    total_fee:
      primaryEnrollment.total_fee ||
      primaryEnrollment.amount ||
      primaryEnrollment.course_fee ||
      item.total_fee ||
      item.amount ||
      0,
    total_paid:
      primaryEnrollment.total_paid ||
      primaryEnrollment.paid_amount ||
      item.total_paid ||
      item.paid_amount ||
      0,
    balance_amount: totalDue,
    payment_status: primaryEnrollment.payment_status || item.payment_status || (totalDue > 0 ? 'Pending' : 'Paid'),
    branch_approval_status: primaryEnrollment.branch_approval_status || item.branch_approval_status || 'approved',
    super_admin_approval_status: primaryEnrollment.super_admin_approval_status || item.super_admin_approval_status || 'approved',
    super_admin_rejection_reason: primaryEnrollment.super_admin_rejection_reason || item.super_admin_rejection_reason || null,
    razorpay_order_id: primaryEnrollment.razorpay_order_id || item.razorpay_order_id || null,
    razorpay_payment_id: primaryEnrollment.razorpay_payment_id || item.razorpay_payment_id || null,
    installment_count: primaryEnrollment.installment_count || item.installment_count || installments.length,
    paid_installment_count: primaryEnrollment.paid_installment_count ?? item.paid_installment_count ?? installments.filter(i => i.status === 'paid').length,
    installments: installments,
    due_enrollments: item.due_enrollments || [
      {
        ...primaryEnrollment,
        course_title: courseTitle,
        branch_name: branchName,
        due_installments: installments,
      },
    ],
  };
};

function BranchAdminFeesDue() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dueStudents, setDueStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (document.getElementById('ba-due-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ba-due-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const loadDueStudents = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      let list = [];
      try {
        const data = await getDueAdmissionsApi(token);
        if (Array.isArray(data)) list = data;
        else if (data?.due_students) list = data.due_students;
        else if (data?.admissions) list = data.admissions;
      } catch (err) {
        console.warn('Failed to load from getDueAdmissionsApi', err);
      }

      if (list.length === 0) {
        try {
          const dashData = await getBranchAdminDashboardApi(token);
          if (Array.isArray(dashData?.due_students) && dashData.due_students.length > 0) {
            list = dashData.due_students;
          }
        } catch (dashErr) {
          console.warn('Dashboard fallback also failed', dashErr);
        }
      }

      setDueStudents(list);
    } catch (err) {
      setError(err?.message || 'Failed to load due students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueStudents();
  }, [token]);

  const normalizedList = useMemo(() => {
    return dueStudents.map((s) => normalizeDueStudent(s, user?.branch_name));
  }, [dueStudents, user?.branch_name]);

  const filteredDueStudents = useMemo(() => {
    return normalizedList.filter((p) => {
      const term = searchTerm.trim().toLowerCase();
      const nameMatches = !term || p.name?.toLowerCase().includes(term);
      const courseMatches =
        !term ||
        p.due_enrollments?.some((e) => e.course_title?.toLowerCase().includes(term)) ||
        p.course_title?.toLowerCase().includes(term);
      const contactMatches =
        !term ||
        p.phone?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term);
      const searchMatches = !term || nameMatches || courseMatches || contactMatches;

      let dateMatches = true;
      if (fromDate || toDate) {
        const dates = getStudentDueDates(p);
        if (dates.length === 0) {
          dateMatches = false;
        } else {
          dateMatches = dates.some((dStr) => {
            const cleanDate = dStr.split('T')[0];
            if (fromDate && cleanDate < fromDate) return false;
            if (toDate && cleanDate > toDate) return false;
            return true;
          });
        }
      }

      return searchMatches && dateMatches;
    });
  }, [normalizedList, searchTerm, fromDate, toDate]);

  const totalOutstanding = useMemo(() => {
    return normalizedList.reduce((sum, s) => sum + Number(s.total_due_amount || 0), 0);
  }, [normalizedList]);

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
        activePage="fees-due"
      />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-xl bg-[#faf8f4] border border-[#e3ddd0] p-2 text-[#17140f] hover:bg-[#f1ede4] transition md:hidden"
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
                Due Students
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadDueStudents}
              className="rounded-lg p-2 hover:bg-[#f1ede4] transition"
              title="Refresh due students"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                style={{ color: '#9c6b2e' }}
              />
            </button>

            <div className="flex items-center gap-2.5 shrink-0 border-l pl-4 border-stone-200">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
                style={{ background: '#17140f', color: '#f4b942' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {user?.name || 'Branch Admin'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {user?.branch_name || 'Branch Administrator'}
                </p>
              </div>
            </div>
          </div>
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

          {/* Summary Stat Cards */}
          <section className="grid gap-4 sm:grid-cols-2" aria-label="Fees due summary">
            <div
              className="rounded-2xl p-5 bg-white border shadow-2xs"
              style={{ borderColor: '#e3ddd0' }}
            >
              <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                Students with dues
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', serif" }}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin mt-1" /> : normalizedList.length}
              </p>
            </div>
            <div
              className="rounded-2xl p-5 bg-white border shadow-2xs"
              style={{ borderColor: '#e3ddd0' }}
            >
              <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                Total outstanding due
              </p>
              <p className="mt-2 text-3xl font-bold text-[#9c6b2e]" style={{ fontFamily: "'Fraunces', serif" }}>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1" />
                ) : (
                  fmt(totalOutstanding)
                )}
              </p>
            </div>
          </section>

          {/* Filter Bar: Date Range + Search */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border shadow-2xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Left controls: Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                <Calendar className="h-3.5 w-3.5 text-[#9c6b2e]" />
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e]"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border border-[#e3ddd0] bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e]"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="rounded-lg px-2 py-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition text-xs font-semibold flex items-center gap-1 border border-stone-200"
                  title="Clear date filter"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="flex-1 min-w-[220px] max-w-md w-full sm:w-auto">
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
          ) : filteredDueStudents.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
              style={{ borderColor: '#e3ddd0', color: '#64748b' }}
            >
              <ShoppingCart className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No due students found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || fromDate || toDate
                  ? 'No students found matching your search criteria or date range.'
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
                    {filteredDueStudents.map((p, i) => {
                      const id = p.enrollment_id ?? p.id;
                      const primaryDueDate = getStudentDueDates(p)[0];
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
                            {p.due_enrollments?.map((e) => e.course_title).join(', ') || p.course_title || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {formatDisplayDate(primaryDueDate)}
                          </td>
                          <td className="px-4 py-3 font-bold text-sm">
                            <span className="text-rose-600">{fmt(p.total_due_amount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const enr = p.due_enrollments?.[0] || p;
                                setSelectedStudent({
                                  ...p,
                                  ...enr,
                                  installments: enr.due_installments || enr.installments || p.due_installments || p.installments || [],
                                  user_id: p.student_id || enr.student_id || p.user_id,
                                });
                              }}
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
                  {selectedStudent.name || selectedStudent.student_name}{' '}
                  <span className="text-slate-400 font-normal ml-2">#{selectedStudent.enrollment_id ?? selectedStudent.id}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-stone-500" />{' '}
                    {selectedStudent.course_title || selectedStudent.course_name}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.branch_name}
                  </span>
                </p>
                {getPendingTermsText(selectedStudent) && (
                  <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                    Currently installment {getPendingTermsText(selectedStudent)} is pending
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Branch:</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        selectedStudent.branch_approval_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : selectedStudent.branch_approval_status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : selectedStudent.branch_approval_status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedStudent.branch_approval_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-700">Super Admin:</span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                        selectedStudent.super_admin_approval_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedStudent.super_admin_approval_status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner'
                          : selectedStudent.super_admin_approval_status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {selectedStudent.super_admin_approval_status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200"
                >
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
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Student Information
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Name</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {selectedStudent.name || selectedStudent.student_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User ID</p>
                        <p className="text-sm font-mono text-slate-800 mt-1">#{selectedStudent.user_id}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.email || '—'}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.phone || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Highest Qualification
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-stone-500" />{' '}
                          {selectedStudent.highest_qualification || '—'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0 mt-0.5" />{' '}
                          {selectedStudent.address || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Parent / Guardian
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Name</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {selectedStudent.parent_name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Phone</p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.parent_phone || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course & Branch */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Course & Branch
                      </h3>
                    </div>
                    <div className="p-5 flex gap-5">
                      {selectedStudent.course_image && (
                        <img
                          src={selectedStudent.course_image}
                          alt="Course"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-5 flex-1">
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Name</p>
                          <p className="text-sm font-bold text-[#9c6b2e] mt-1">
                            {selectedStudent.course_title || selectedStudent.course_name}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Name</p>
                          <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.branch_name}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Total Course Fee
                          </p>
                          <p className="text-sm font-bold text-[#9c6b2e] mt-1 flex items-center gap-1.5">
                            <IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]" />{' '}
                            {fmt(selectedStudent.total_fee || selectedStudent.course_fee).replace('₹', '')}
                          </p>
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
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Payment Summary
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Fee</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                          {fmt(selectedStudent.total_fee || selectedStudent.course_fee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Paid</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">
                          {fmt(selectedStudent.total_paid || selectedStudent.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance</p>
                        <p
                          className={`text-xl font-bold mt-1 ${
                            Number(selectedStudent.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {fmt(selectedStudent.balance_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                          Payment Status
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase border shadow-2xs ${
                            selectedStudent.payment_status?.toLowerCase() === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {selectedStudent.payment_status || '—'}
                        </span>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-stone-100">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                          Installments Paid
                        </p>
                        <p className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-stone-100">
                          {Number(selectedStudent.installment_count) > 0
                            ? `${selectedStudent.paid_installment_count ?? 0} of ${selectedStudent.installment_count} Paid`
                            : 'No Installments'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approval & Enrollment Status */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Approval & Enrollment Status
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                          Branch Approval
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            selectedStudent.branch_approval_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : selectedStudent.branch_approval_status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : selectedStudent.branch_approval_status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {selectedStudent.branch_approval_status || '—'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                          Super Admin Approval
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${
                            selectedStudent.super_admin_approval_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : selectedStudent.super_admin_approval_status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner'
                              : selectedStudent.super_admin_approval_status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {selectedStudent.super_admin_approval_status || '—'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                          Payment Status
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase border ${
                            selectedStudent.payment_status?.toLowerCase() === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {selectedStudent.payment_status || '—'}
                        </span>
                      </div>
                      {selectedStudent.super_admin_rejection_reason && (
                        <div className="col-span-2 mt-2">
                          <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">
                            Rejection Reason
                          </p>
                          <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                            {selectedStudent.super_admin_rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Gateway Details */}
                  {(selectedStudent.razorpay_order_id || selectedStudent.razorpay_payment_id) && (
                    <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-stone-500" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Payment Gateway Details
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Razorpay Order ID
                          </p>
                          <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">
                            {selectedStudent.razorpay_order_id || 'Not applicable'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Razorpay Payment ID
                          </p>
                          <p className="text-xs font-mono text-slate-700 mt-1 break-all bg-slate-50 border border-slate-100 rounded-lg p-2">
                            {selectedStudent.razorpay_payment_id || 'Not applicable'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment Schedule (Full Width) */}
              {selectedStudent.installments && selectedStudent.installments.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden mt-6">
                  <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Installment Due Details
                      </h3>
                    </div>
                    {getPendingTermsText(selectedStudent) && (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                        Currently installment {getPendingTermsText(selectedStudent)} is pending
                      </span>
                    )}
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
                            <td className="px-5 py-3 font-medium text-slate-800">
                              #{inst.installment_number || idx + 1}
                            </td>
                            <td className="px-5 py-3 font-bold text-slate-700">{fmt(inst.amount)}</td>
                            <td className="px-5 py-3 font-semibold text-emerald-600">
                              {fmt(inst.paid_amount ?? (inst.status === 'paid' ? inst.amount : 0))}
                            </td>
                            <td className="px-5 py-3 font-semibold text-rose-600">
                              {fmt(
                                inst.remaining_amount ??
                                  (inst.status === 'paid' ? 0 : Math.max(0, Number(inst.amount || 0) - Number(inst.paid_amount || 0)))
                              )}
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-600">
                              {formatDisplayDate(inst.due_date)}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                  inst.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : inst.status === 'partial'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : inst.is_due
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {inst.status || 'Pending'}
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
}

export default BranchAdminFeesDue;
