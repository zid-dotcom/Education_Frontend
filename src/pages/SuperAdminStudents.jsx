import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Users,
  IndianRupee,
  Wallet,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Search,
  Receipt,
  Eye,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminAllStudentsApi,
  getSuperAdminBranchStudentsApi,
  getSuperAdminRecordBranchesApi,
  getSuperAdminInstallmentStudentsApi,
  getSuperAdminFullyPaidStudentsApi,
  getSuperAdminBranchAdminInstallmentHistoryApi,
  updateSuperAdminStudentStatusApi,
} from '../services/superadmin';
import { getEnrollmentInstallmentsApi } from '../services/enrollments';

const PAGE_CSS = `
@keyframes sa-rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sa-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.sa-rise { animation: sa-rise .35s cubic-bezier(.2,.7,.2,1) both; }
.sa-fade { animation: sa-fade .25s ease both; }
.sa-card {
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.sa-card:hover {
  transform: translateY(-2px);
  border-color: #d8ceb9;
  box-shadow: 0 10px 24px -14px rgba(23,20,15,.18);
}
.sa-row {
  transition: background-color .15s ease;
}
.sa-row:hover {
  background-color: #faf8f4;
}
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const formatDateClean = (date) => {
  if (!date) return { date: '—', time: '' };
  try {
    const d = new Date(date);
    const dateStr = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return { date: dateStr, time: timeStr };
  } catch {
    return { date: String(date), time: '' };
  }
};

const normalizeArray = (res) => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res.students)) return res.students;
  if (Array.isArray(res.enrollments)) return res.enrollments;
  if (Array.isArray(res.history)) return res.history;
  if (Array.isArray(res.payments)) return res.payments;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

const STATUS_META = {
  approved: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  received: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  paid: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  active: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  completed: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  pending: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  awaiting_review: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  pending_review: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  partial: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  rejected: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  failed: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  inactive: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  not_required: { dot: '#64748b', text: '#475569', bg: '#f1f5f9' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[String(status || 'pending').toLowerCase()] || {
    dot: '#a39a8c',
    text: '#8a8175',
    bg: '#f1ede4',
  };
  const label = String(status || 'Pending').replace(/_/g, ' ');
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-black/5"
      style={{ background: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {label}
    </span>
  );
};

const formatPaymentMethod = (method, isSplit, cashAmt, upiAmt) => {
  const m = String(method || '').toLowerCase().replace(/_/g, ' ').trim();
  if (m === 'cash upi' || m === 'split' || isSplit) {
    return {
      label: 'Split (Cash + UPI)',
      detail: (cashAmt && upiAmt) ? `Cash: ${fmt(cashAmt)} • UPI: ${fmt(upiAmt)}` : null,
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    };
  }
  if (m === 'cash') {
    return {
      label: 'Cash',
      detail: null,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    };
  }
  if (m === 'upi') {
    return {
      label: 'UPI',
      detail: null,
      bg: 'bg-purple-50 border-purple-200 text-purple-800',
    };
  }
  if (m.includes('razorpay') || m === 'online') {
    return {
      label: 'Razorpay Online',
      detail: null,
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
    };
  }
  return {
    label: method ? String(method).replace(/_/g, ' ') : 'In-Person',
    detail: null,
    bg: 'bg-stone-50 border-stone-200 text-stone-700',
  };
};

const Avatar = ({ name, size = 'h-8 w-8 text-xs' }) => (
  <div
    className={`flex ${size} shrink-0 items-center justify-center rounded-full font-bold shadow-2xs`}
    style={{ background: '#f1ede4', color: '#9c6b2e', border: '1px solid #e3ddd0' }}
  >
    {(name || 'S').charAt(0).toUpperCase()}
  </div>
);

const SuperAdminStudents = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter & Navigation states
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'installment' | 'fully_paid' | 'history'

  // Data states
  const [students, setStudents] = useState([]);
  const [installmentStudents, setInstallmentStudents] = useState([]);
  const [fullyPaidStudents, setFullyPaidStudents] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Feedback & Selection states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPaymentRecord(null);
        setSelectedStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch Branches for branch selector
  useEffect(() => {
    if (!token) return;
    getSuperAdminRecordBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch((err) => {
        console.warn('Could not load record branches:', err);
      });
  }, [token]);

  // 2. Fetch all student & installment datasets (optionally filtered by selectedBranchId)
  const loadAllData = async (branchId = selectedBranchId) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const bId = branchId ? String(branchId) : '';

      const [allRes, installmentRes, fullyPaidRes, historyRes] = await Promise.allSettled([
        bId
          ? getSuperAdminBranchStudentsApi(bId, token)
          : getSuperAdminAllStudentsApi(token),
        getSuperAdminInstallmentStudentsApi(bId, token),
        getSuperAdminFullyPaidStudentsApi(bId, token),
        getSuperAdminBranchAdminInstallmentHistoryApi(bId, token),
      ]);

      if (allRes.status === 'fulfilled') {
        setStudents(normalizeArray(allRes.value));
      } else {
        console.warn('Failed to load all students:', allRes.reason);
      }

      if (installmentRes.status === 'fulfilled') {
        setInstallmentStudents(normalizeArray(installmentRes.value));
      } else {
        console.warn('Failed to load installment students:', installmentRes.reason);
      }

      if (fullyPaidRes.status === 'fulfilled') {
        setFullyPaidStudents(normalizeArray(fullyPaidRes.value));
      } else {
        console.warn('Failed to load fully paid students:', fullyPaidRes.reason);
      }

      if (historyRes.status === 'fulfilled') {
        setPaymentHistory(normalizeArray(historyRes.value));
      } else {
        console.warn('Failed to load installment history:', historyRes.reason);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load student records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(selectedBranchId);
  }, [token, selectedBranchId]);

  // Fallbacks if dedicated endpoints return empty but all students exist
  const effectiveInstallmentStudents = useMemo(() => {
    if (installmentStudents.length > 0) return installmentStudents;
    return students.filter((s) => {
      const bal = Number(s.balance_amount ?? s.enrollments?.[0]?.balance_amount ?? 0);
      return bal > 0;
    });
  }, [installmentStudents, students]);

  const effectiveFullyPaidStudents = useMemo(() => {
    if (fullyPaidStudents.length > 0) return fullyPaidStudents;
    return students.filter((s) => {
      const bal = Number(s.balance_amount ?? s.enrollments?.[0]?.balance_amount ?? 0);
      const paid = Number(s.total_paid ?? s.enrollments?.[0]?.total_paid ?? 0);
      return bal === 0 && paid > 0;
    });
  }, [fullyPaidStudents, students]);

  // Calculate total outstanding balance
  const totalOutstandingBalance = useMemo(() => {
    return effectiveInstallmentStudents.reduce((sum, s) => {
      const bal = Number(s.balance_amount ?? s.remaining_amount ?? s.enrollments?.[0]?.balance_amount ?? 0);
      return sum + bal;
    }, 0);
  }, [effectiveInstallmentStudents]);

  // Account status toggle (Active / Inactive)
  const handleToggleStatus = async (student, targetStatus) => {
    const studentId = student.student_id ?? student.user_id ?? student.id;
    if (!studentId || !token) return;
    const normalizedStatus = String(targetStatus).toLowerCase() === 'active' ? 'Active' : 'Inactive';
    const isNowActive = normalizedStatus === 'Active';
    try {
      setStatusUpdatingId(studentId);
      setError('');
      setSuccess('');
      await updateSuperAdminStudentStatusApi(studentId, normalizedStatus, token);

      const updateItem = (item) => {
        const id = item.student_id ?? item.user_id ?? item.id;
        if (String(id) === String(studentId)) {
          return {
            ...item,
            status: normalizedStatus,
            is_active: isNowActive,
            student_status: normalizedStatus,
          };
        }
        return item;
      };

      setStudents((prev) => prev.map(updateItem));
      setInstallmentStudents((prev) => prev.map(updateItem));
      setFullyPaidStudents((prev) => prev.map(updateItem));

      setSelectedStudent((prev) => {
        if (!prev) return null;
        const prevId = prev.student_id ?? prev.user_id ?? prev.id;
        if (String(prevId) === String(studentId)) {
          return {
            ...prev,
            status: normalizedStatus,
            is_active: isNowActive,
            student_status: normalizedStatus,
          };
        }
        return prev;
      });

      const studentName = student.name || student.student_name || 'Student';
      setSuccess(`${studentName}'s status changed to ${normalizedStatus} successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to update student status.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Open full details modal and fetch fresh installments if needed
  const openStudentDetails = async (item) => {
    const primaryEnrollment = item.enrollments?.[0] || {};

    // Match student across all lists to ensure course duration and enrollment details are populated
    const matchedStudent = students.find((s) => {
      const sId = String(s.user_id || s.student_id || s.id || '');
      const itId = String(item.user_id || item.student_id || item.student?.id || item.id || '');
      if (sId && itId && sId === itId) return true;
      const itEnrId = String(item.enrollment_id || item.id || '');
      return s.enrollments?.some((e) => String(e.enrollment_id || e.id) === itEnrId);
    });

    const matchedEnrollment =
      matchedStudent?.enrollments?.find(
        (e) => String(e.enrollment_id || e.id) === String(item.enrollment_id || item.id)
      ) ||
      matchedStudent?.enrollments?.[0] ||
      {};

    const courseTitle =
      item.course_title ||
      item.course_name ||
      primaryEnrollment.course_title ||
      matchedEnrollment.course_title ||
      '—';

    // Find course_duration across all possible locations and course fallbacks
    const courseDuration =
      item.course_duration ||
      item.duration ||
      item.course?.duration ||
      item.course_details?.duration ||
      primaryEnrollment.course_duration ||
      primaryEnrollment.duration ||
      primaryEnrollment.course?.duration ||
      matchedEnrollment.course_duration ||
      matchedEnrollment.duration ||
      matchedEnrollment.course?.duration ||
      matchedStudent?.course_duration ||
      students
        .flatMap((s) => s.enrollments || [])
        .find((e) => (e.course_title || e.course_name) === courseTitle && (e.course_duration || e.duration))
        ?.course_duration ||
      '';

    const enrId =
      item.enrollment_id ||
      item.id ||
      primaryEnrollment.enrollment_id ||
      matchedEnrollment.enrollment_id ||
      '';

    const enrollment = {
      ...item,
      ...primaryEnrollment,
      ...matchedEnrollment,
      user_id: item.user_id || item.student_id || item.student?.id || matchedStudent?.user_id || item.id,
      name: item.name || item.student_name || item.student?.name || matchedStudent?.name || 'Student',
      phone: item.phone || item.student_phone || item.student?.phone || matchedStudent?.phone || '—',
      email: item.email || item.student_email || item.student?.email || matchedStudent?.email || '—',
      enrollment_id: enrId,
      course_title: courseTitle,
      branch_name:
        item.branch_name ||
        primaryEnrollment.branch_name ||
        matchedEnrollment.branch_name ||
        '—',
      course_duration: courseDuration || '—',
      total_fee: item.total_fee || item.course_fee || primaryEnrollment.total_fee || matchedEnrollment.total_fee || 0,
      total_paid: item.total_paid || item.amount || primaryEnrollment.total_paid || matchedEnrollment.total_paid || 0,
      balance_amount:
        item.balance_amount ??
        item.remaining_amount ??
        primaryEnrollment.balance_amount ??
        matchedEnrollment.balance_amount ??
        0,
      status: item.status || item.student_status || matchedStudent?.status || (item.is_active === false ? 'Inactive' : 'Active'),
      is_active:
        item.is_active !== undefined
          ? item.is_active
          : matchedStudent?.is_active !== undefined
          ? matchedStudent.is_active
          : (item.status === 'Active' || item.status === 'active'),
    };

    setSelectedStudent(enrollment);

    if (enrId) {
      try {
        const schedule = await getEnrollmentInstallmentsApi(enrId, token);
        if (schedule) {
          const fetchedInstallments = Array.isArray(schedule)
            ? schedule
            : schedule.installments || schedule.schedule || [];

          const apiDuration =
            schedule.course_duration ||
            schedule.duration ||
            schedule.course?.duration ||
            schedule.enrollment?.course_duration;

          setSelectedStudent((prev) =>
            prev && String(prev.enrollment_id) === String(enrId)
              ? {
                  ...prev,
                  ...(apiDuration ? { course_duration: apiDuration } : {}),
                  installments: fetchedInstallments.length > 0 ? fetchedInstallments : prev.installments,
                  balance_amount: schedule.balance_amount ?? prev.balance_amount,
                  total_paid: schedule.total_paid ?? prev.total_paid,
                  payments: schedule.payments || prev.payments || [],
                }
              : prev
          );
        }
      } catch (err) {
        console.warn('Could not load detailed installment schedule:', err);
      }
    }
  };

  // Helper memo: resolve course duration even if omitted in branch-specific response
  const resolvedCourseDuration = useMemo(() => {
    if (!selectedStudent) return '—';
    if (selectedStudent.course_duration && selectedStudent.course_duration !== '—') {
      return selectedStudent.course_duration;
    }
    if (selectedStudent.duration && selectedStudent.duration !== '—') {
      return selectedStudent.duration;
    }
    const courseTitle = (selectedStudent.course_title || selectedStudent.course_name || '').trim().toLowerCase();
    for (const s of students) {
      for (const e of s.enrollments || []) {
        const eTitle = (e.course_title || e.course_name || '').trim().toLowerCase();
        if (courseTitle && eTitle === courseTitle && (e.course_duration || e.duration)) {
          return e.course_duration || e.duration;
        }
      }
    }
    for (const s of installmentStudents) {
      const sTitle = (s.course_title || s.course_name || '').trim().toLowerCase();
      if (courseTitle && sTitle === courseTitle && (s.course_duration || s.duration)) {
        return s.course_duration || s.duration;
      }
    }
    for (const s of fullyPaidStudents) {
      const sTitle = (s.course_title || s.course_name || '').trim().toLowerCase();
      if (courseTitle && sTitle === courseTitle && (s.course_duration || s.duration)) {
        return s.course_duration || s.duration;
      }
    }
    return selectedStudent.course_duration || '—';
  }, [selectedStudent, students, installmentStudents, fullyPaidStudents]);

  // Helper memo: resolve latest paid date & time for the student modal
  const latestPaidDateTime = useMemo(() => {
    if (!selectedStudent) return null;
    const currEnrId = String(selectedStudent.enrollment_id || selectedStudent.id || '');
    const currName = (selectedStudent.name || selectedStudent.student_name || '').toLowerCase();

    const historyMatches = paymentHistory.filter((h) => {
      const hEnrId = String(h.enrollment_id || h.id || '');
      const hStudentName = (h.student_name || h.name || '').toLowerCase();
      return (currEnrId && hEnrId === currEnrId) || (currName && hStudentName === currName);
    });

    const dates = [
      ...historyMatches.map((h) => h.created_at || h.payment_date || h.updated_at),
      ...(selectedStudent.payments || []).map((p) => p.payment_date || p.reviewed_at || p.created_at || p.updated_at),
      ...(selectedStudent.installments || []).map((i) => i.paid_at || i.paid_date || i.payment_date || (String(i.status).toLowerCase() === 'paid' ? i.reviewed_at || i.updated_at || i.created_at : null)),
      selectedStudent.paid_at,
      selectedStudent.payment_date,
    ].filter(Boolean);

    if (dates.length === 0) return null;
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return formatDateClean(dates[0]);
  }, [selectedStudent, paymentHistory]);

  // Search filtering logic
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter((s) => {
      const name = (s.name || s.student_name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const idStr = String(s.user_id || s.student_id || s.id || '');
      const courses = (s.enrollments?.map((e) => e.course_title).join(' ') || s.course_title || '').toLowerCase();
      const branches = (s.enrollments?.map((e) => e.branch_name).join(' ') || s.branch_name || '').toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        idStr.includes(term) ||
        courses.includes(term) ||
        branches.includes(term)
      );
    });
  }, [students, searchTerm]);

  const filteredInstallmentStudents = useMemo(() => {
    if (!searchTerm.trim()) return effectiveInstallmentStudents;
    const term = searchTerm.toLowerCase();
    return effectiveInstallmentStudents.filter((s) => {
      const name = (s.name || s.student_name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const idStr = String(s.user_id || s.student_id || s.enrollment_id || s.id || '');
      const course = (s.course_title || s.course_name || s.enrollments?.[0]?.course_title || '').toLowerCase();
      const branch = (s.branch_name || s.enrollments?.[0]?.branch_name || '').toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        idStr.includes(term) ||
        course.includes(term) ||
        branch.includes(term)
      );
    });
  }, [effectiveInstallmentStudents, searchTerm]);

  const filteredFullyPaidStudents = useMemo(() => {
    if (!searchTerm.trim()) return effectiveFullyPaidStudents;
    const term = searchTerm.toLowerCase();
    return effectiveFullyPaidStudents.filter((s) => {
      const name = (s.name || s.student_name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const idStr = String(s.user_id || s.student_id || s.enrollment_id || s.id || '');
      const course = (s.course_title || s.course_name || s.enrollments?.[0]?.course_title || '').toLowerCase();
      const branch = (s.branch_name || s.enrollments?.[0]?.branch_name || '').toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        idStr.includes(term) ||
        course.includes(term) ||
        branch.includes(term)
      );
    });
  }, [effectiveFullyPaidStudents, searchTerm]);

  const filteredPaymentHistory = useMemo(() => {
    if (!searchTerm.trim()) return paymentHistory;
    const term = searchTerm.toLowerCase();
    return paymentHistory.filter((h) => {
      const studentName = (h.student_name || h.name || h.student?.name || '').toLowerCase();
      const course = (h.course_title || h.course_name || '').toLowerCase();
      const branch = (h.branch_name || h.branch?.name || '').toLowerCase();
      const method = (h.payment_method || '').toLowerCase();
      const ref = (h.reference_id || h.razorpay_payment_id || '').toLowerCase();
      const enrId = String(h.enrollment_id || h.id || '');
      return (
        studentName.includes(term) ||
        course.includes(term) ||
        branch.includes(term) ||
        method.includes(term) ||
        ref.includes(term) ||
        enrId.includes(term)
      );
    });
  }, [paymentHistory, searchTerm]);

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
        activePage="students"
      />

      <main className="min-w-0 flex-1 pb-16">
        {/* Sticky Header */}
        <header
          className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b px-6 py-5 sm:px-10 backdrop-blur-md bg-white/95"
          style={{ borderColor: '#e3ddd0' }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#9c6b2e' }}
            >
              Super Admin Portal
            </p>
            <h1
              className="mt-1 text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              All Students & Installments
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData(selectedBranchId)}
              className="rounded-xl border border-[#e3ddd0] p-2.5 hover:bg-[#f1ede4] transition bg-white shadow-2xs cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                style={{ color: '#9c6b2e' }}
              />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {/* Notifications */}
          {error && (
            <div
              className="sa-rise rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {success && (
            <div
              className="sa-rise rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Top Metric Cards (Clickable Tabs) */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* 1. All Students */}
            <div
              onClick={() => setActiveTab('all')}
              className={`sa-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#9c6b2e] ring-2 ring-[#9c6b2e]/20 shadow-sm'
                  : 'border-[#e3ddd0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Total Students
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-slate-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {loading ? '…' : students.length}
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                {selectedBranchId ? 'In selected branch' : 'Across all branches'}
              </p>
            </div>

            {/* 2. Installments Due */}
            <div
              onClick={() => setActiveTab('installment')}
              className={`sa-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer ${
                activeTab === 'installment'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'border-[#e3ddd0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Installments Due
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-[#9c6b2e]">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-amber-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {loading ? '…' : effectiveInstallmentStudents.length}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-rose-600 truncate">
                {totalOutstandingBalance > 0
                  ? `${fmt(totalOutstandingBalance)} pending`
                  : 'Students with balance'}
              </p>
            </div>

            {/* 3. Fully Paid */}
            <div
              onClick={() => setActiveTab('fully_paid')}
              className={`sa-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer ${
                activeTab === 'fully_paid'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-[#e3ddd0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Fully Paid
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-emerald-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {loading ? '…' : effectiveFullyPaidStudents.length}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                100% fees completed
              </p>
            </div>

            {/* 4. Payment History */}
            <div
              onClick={() => setActiveTab('history')}
              className={`sa-card rounded-2xl p-4 sm:p-5 bg-white border cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#9c6b2e] ring-2 ring-[#9c6b2e]/20 shadow-sm'
                  : 'border-[#e3ddd0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Payment History
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-[#9c6b2e]">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-2 text-2xl font-bold text-slate-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {loading ? '…' : paymentHistory.length}
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                Installment records
              </p>
            </div>
          </div>

          {/* Filter Bar: Branch selection + Search Input */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border shadow-2xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by student name, email, phone, branch, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50 transition"
                style={{ borderColor: '#e3ddd0', color: '#17140f' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Branch Selector Dropdown */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#9c6b2e] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="rounded-xl border px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50 cursor-pointer text-slate-800"
                style={{ borderColor: '#e3ddd0' }}
              >
                <option value="">All Branches</option>
                {branches.map((b) => {
                  const bId = b.branch_id ?? b.id;
                  const bName = b.branch_name ?? b.name ?? `Branch #${bId}`;
                  return (
                    <option key={bId} value={bId}>
                      {bName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: '#e3ddd0' }}>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#9c6b2e] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-[#e3ddd0]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Students</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('installment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'installment'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-[#e3ddd0]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Installments Due</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'installment' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {effectiveInstallmentStudents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fully_paid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'fully_paid'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-[#e3ddd0]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Fully Paid</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'fully_paid' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {effectiveFullyPaidStudents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-[#e3ddd0]'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Payment History</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {paymentHistory.length}
              </span>
            </button>
          </div>

          {/* Content Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#e3ddd0]">
              <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e]" />
              <p className="mt-3 text-xs font-semibold text-stone-500">
                Loading student records...
              </p>
            </div>
          ) : (
            <>
              {/* ───────────────────────────────────────────────────
                 VIEW 1: ALL STUDENTS TAB
                 Structured Table: # | Student Details | Branch | Course | Course Fee | Paid / Due | Status | Action
                 ─────────────────────────────────────────────────── */}
              {activeTab === 'all' && (
                filteredStudents.length === 0 ? (
                  <div className="rounded-2xl px-5 py-16 text-center text-sm bg-white border border-[#e3ddd0]">
                    <Users className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No students found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'No students matching your search criteria.' : 'No students found for this branch.'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-white border shadow-2xs" style={{ borderColor: '#e3ddd0' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[960px] text-sm text-left">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {['#', 'Student Details', 'Branch', 'Course', 'Course Fee', 'Paid / Due', 'Account Status', 'Action'].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#9c6b2e]"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1ede4]">
                          {filteredStudents.map((p, i) => {
                            const studentId = p.student_id ?? p.user_id ?? p.id;
                            const studentName = p.name || p.student_name || 'Student';
                            const branchName = p.enrollments?.[0]?.branch_name || p.branch_name || '—';
                            const courseTitle = p.enrollments?.[0]?.course_title || p.course_title || '—';
                            const fee = Number(p.enrollments?.[0]?.total_fee || p.total_fee || p.course_fee || 0);
                            const paid = Number(p.enrollments?.[0]?.total_paid || p.total_paid || 0);
                            const balance = Number(p.enrollments?.[0]?.balance_amount ?? p.balance_amount ?? (fee - paid));
                            const currentStatus = String(p.status || p.student_status || (p.is_active === false ? 'inactive' : 'active')).toLowerCase();
                            const isActive = currentStatus === 'active';
                            const isUpdating = statusUpdatingId === studentId;

                            return (
                              <tr key={p.enrollment_id ?? studentId ?? i} className="sa-row transition hover:bg-stone-50/70">
                                <td className="px-4 py-3.5 text-xs font-bold font-mono text-[#9c6b2e] w-12">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-[170px]">
                                    <Avatar name={studentName} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{studentName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                          ID #{studentId}
                                        </span>
                                        {p.phone && <span className="text-[10px] text-stone-500 font-medium">{p.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80">
                                    <Building2 className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                                    <span className="truncate max-w-[180px]">{branchName}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 min-w-[180px] max-w-[240px]">
                                    <BookOpen className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 line-clamp-2" title={courseTitle}>
                                      {courseTitle}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {fmt(fee)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div>
                                    <p className="text-xs font-bold text-emerald-700">{fmt(paid)} Paid</p>
                                    <p className={`text-[10px] font-semibold mt-0.5 ${balance > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                                      {balance > 0 ? `${fmt(balance)} Due` : 'Cleared'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleStatus(p, isActive ? 'Inactive' : 'Active')}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isActive ? 'bg-emerald-600' : 'bg-slate-300'
                                      } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                          isActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      >
                                        {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
                                      </span>
                                    </button>
                                    <span className={`text-xs font-bold capitalize ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <button
                                    onClick={() => openStudentDetails(p)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#9c6b2e]" />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 2: INSTALLMENTS DUE TAB
                 Structured Table: # | Student Details | Branch | Course | Total Fee | Paid | Balance Due | Progress | Status | Action
                 ─────────────────────────────────────────────────── */}
              {activeTab === 'installment' && (
                filteredInstallmentStudents.length === 0 ? (
                  <div className="rounded-2xl px-5 py-16 text-center text-sm bg-white border border-[#e3ddd0]">
                    <Clock className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No installment students found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'No installment students matching your search.' : 'All students are fully cleared!'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-white border shadow-2xs" style={{ borderColor: '#e3ddd0' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1020px] text-sm text-left">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {['#', 'Student Details', 'Branch', 'Course', 'Total Fee', 'Paid', 'Balance Due', 'Installments', 'Account Status', 'Action'].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#9c6b2e]"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1ede4]">
                          {filteredInstallmentStudents.map((s, idx) => {
                            const studentId = s.student_id ?? s.user_id ?? s.id;
                            const studentName = s.name || s.student_name || 'Student';
                            const branchName = s.branch_name || s.enrollments?.[0]?.branch_name || '—';
                            const courseTitle = s.course_title || s.course_name || s.enrollments?.[0]?.course_title || '—';
                            const balance = Number(s.balance_amount ?? s.remaining_amount ?? s.enrollments?.[0]?.balance_amount ?? 0);
                            const totalFee = Number(s.total_fee ?? s.course_fee ?? s.enrollments?.[0]?.total_fee ?? 0);
                            const totalPaid = Number(s.total_paid ?? s.amount ?? s.enrollments?.[0]?.total_paid ?? 0);
                            const currentStatus = String(s.status || s.student_status || (s.is_active === false ? 'inactive' : 'active')).toLowerCase();
                            const isActive = currentStatus === 'active';
                            const isUpdating = statusUpdatingId === studentId;
                            const isOverdue = Number(s.due_installment_count) > 0;

                            return (
                              <tr key={s.enrollment_id ?? studentId ?? idx} className="sa-row transition hover:bg-stone-50/70">
                                <td className="px-4 py-3.5 text-xs font-bold font-mono text-[#9c6b2e] w-12">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-[170px]">
                                    <Avatar name={studentName} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{studentName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                          #{s.enrollment_id || studentId}
                                        </span>
                                        {s.phone && <span className="text-[10px] text-stone-500 font-medium">{s.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80">
                                    <Building2 className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                                    <span className="truncate max-w-[180px]">{branchName}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 min-w-[180px] max-w-[240px]">
                                    <BookOpen className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 line-clamp-2" title={courseTitle}>
                                      {courseTitle}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800 text-sm">
                                  {fmt(totalFee)}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-emerald-700 text-sm">
                                  {fmt(totalPaid)}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                    {fmt(balance)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  {isOverdue ? (
                                    <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold">
                                      {s.due_installment_count} Overdue
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                                      Installment Active
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleStatus(s, isActive ? 'Inactive' : 'Active')}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isActive ? 'bg-emerald-600' : 'bg-slate-300'
                                      } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                          isActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      >
                                        {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
                                      </span>
                                    </button>
                                    <span className={`text-xs font-bold capitalize ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <button
                                    onClick={() => openStudentDetails(s)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#9c6b2e]" />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 3: FULLY PAID TAB
                 Structured Table: # | Student Details | Branch | Course | Total Fee Paid | Payment Status | Account Status | Action
                 ─────────────────────────────────────────────────── */}
              {activeTab === 'fully_paid' && (
                filteredFullyPaidStudents.length === 0 ? (
                  <div className="rounded-2xl px-5 py-16 text-center text-sm bg-white border border-[#e3ddd0]">
                    <CheckCircle2 className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No fully paid students found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'No matching students found.' : 'Fully paid students will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-white border shadow-2xs" style={{ borderColor: '#e3ddd0' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[960px] text-sm text-left">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {['#', 'Student Details', 'Branch', 'Course', 'Total Fee Paid', 'Payment Status', 'Account Status', 'Action'].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#9c6b2e]"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1ede4]">
                          {filteredFullyPaidStudents.map((s, idx) => {
                            const studentId = s.student_id ?? s.user_id ?? s.id;
                            const studentName = s.name || s.student_name || 'Student';
                            const branchName = s.branch_name || s.enrollments?.[0]?.branch_name || '—';
                            const courseTitle = s.course_title || s.course_name || s.enrollments?.[0]?.course_title || '—';
                            const totalPaid = Number(s.total_paid ?? s.amount ?? s.total_fee ?? s.enrollments?.[0]?.total_paid ?? 0);
                            const currentStatus = String(s.status || s.student_status || (s.is_active === false ? 'inactive' : 'active')).toLowerCase();
                            const isActive = currentStatus === 'active';
                            const isUpdating = statusUpdatingId === studentId;

                            return (
                              <tr key={s.enrollment_id ?? studentId ?? idx} className="sa-row transition hover:bg-stone-50/70">
                                <td className="px-4 py-3.5 text-xs font-bold font-mono text-[#9c6b2e] w-12">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-[170px]">
                                    <Avatar name={studentName} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{studentName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                          #{s.enrollment_id || studentId}
                                        </span>
                                        {s.phone && <span className="text-[10px] text-stone-500 font-medium">{s.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80">
                                    <Building2 className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                                    <span className="truncate max-w-[180px]">{branchName}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 min-w-[180px] max-w-[240px]">
                                    <BookOpen className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 line-clamp-2" title={courseTitle}>
                                      {courseTitle}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="font-bold text-emerald-800 text-sm">
                                    {fmt(totalPaid)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                                    ✓ Cleared All Dues
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleStatus(s, isActive ? 'Inactive' : 'Active')}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isActive ? 'bg-emerald-600' : 'bg-slate-300'
                                      } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                          isActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      >
                                        {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
                                      </span>
                                    </button>
                                    <span className={`text-xs font-bold capitalize ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <button
                                    onClick={() => openStudentDetails(s)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#9c6b2e]" />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* ───────────────────────────────────────────────────
                 VIEW 4: PAYMENT HISTORY TAB (Structured & User-Friendly)
                 Columns: # | Date & Time | Student Details | Branch | Course | Installment | Amount | Method | Status | Notes | Action
                 ─────────────────────────────────────────────────── */}
              {activeTab === 'history' && (
                filteredPaymentHistory.length === 0 ? (
                  <div className="rounded-2xl px-5 py-16 text-center text-sm bg-white border border-[#e3ddd0]">
                    <Receipt className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No payment history found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'No payments matching your search criteria.' : 'Installment payments recorded by branch admins will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-white border border-[#e3ddd0] shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {['#', 'Paid Date & Time', 'Student Details', 'Branch', 'Course', 'Amount', 'Payment Method', 'Status', 'Actions'].map(
                              (h) => (
                                <th
                                  key={h}
                                  className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#9c6b2e] ${
                                    h === 'Actions' ? 'text-right' : ''
                                  }`}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1ede4]">
                          {filteredPaymentHistory.map((hist, idx) => {
                            const studentName = hist.student_name || hist.name || hist.student?.name || 'Student';
                            const enrId = hist.enrollment_id || hist.id;
                            const courseTitle = hist.course_title || hist.course_name || 'Course';
                            const branchName = hist.branch_name || hist.branch?.name || '—';
                            const status = String(hist.status || 'received').toLowerCase();
                            const isSplit = String(hist.payment_method).toLowerCase() === 'split' || String(hist.payment_method).toLowerCase() === 'cash_upi';
                            const methodMeta = formatPaymentMethod(hist.payment_method, isSplit, hist.cash_amount, hist.upi_amount);
                            const dt = formatDateClean(hist.created_at || hist.payment_date || hist.updated_at);

                            return (
                              <tr key={hist.id || hist.payment_id || idx} className="sa-row transition hover:bg-stone-50/70">
                                {/* 1. Number Index */}
                                <td className="px-4 py-3.5 text-xs font-bold font-mono text-[#9c6b2e] w-12">
                                  {idx + 1}
                                </td>

                                {/* 2. Paid Date & Time */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <div>
                                      <p className="font-semibold text-slate-800 text-xs">{dt.date}</p>
                                      {dt.time && <p className="text-[10px] text-stone-400 font-medium">{dt.time}</p>}
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Student Details */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-[170px]">
                                    <Avatar name={studentName} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{studentName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                          Enr #{enrId}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 4. Branch */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80">
                                    <Building2 className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                                    <span className="truncate max-w-[160px]">{branchName}</span>
                                  </span>
                                </td>

                                {/* 5. Course */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 min-w-[160px] max-w-[220px]">
                                    <BookOpen className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 line-clamp-2" title={courseTitle}>
                                      {courseTitle}
                                    </span>
                                  </div>
                                </td>

                                {/* 6. Amount */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <p className="font-bold text-slate-900 text-sm">
                                    {fmt(hist.amount ?? hist.payment_amount)}
                                  </p>
                                  {methodMeta.detail && (
                                    <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                                      {methodMeta.detail}
                                    </p>
                                  )}
                                </td>

                                {/* 7. Payment Method */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${methodMeta.bg}`}>
                                    {methodMeta.label}
                                  </span>
                                </td>

                                {/* 8. Status */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <StatusPill status={status} />
                                </td>

                                {/* 9. Actions */}
                                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPaymentRecord(hist)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs cursor-pointer hover:border-stone-300 active:scale-95"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#9c6b2e]" />
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
                )
              )}
            </>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────
         VIEW DETAILS MODAL (Full Enrollment & Installment Breakdown)
         ───────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="sa-rise relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
            {/* Modal Header */}
            <div className="shrink-0 flex flex-wrap gap-4 items-center justify-between p-5 sm:px-6 border-b border-[#e3ddd0] bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedStudent.name || selectedStudent.student_name}
                  {(selectedStudent.enrollment_id || selectedStudent.id) && (
                    <span className="text-slate-400 font-normal ml-2">
                      #{selectedStudent.enrollment_id || selectedStudent.id}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-stone-500" />{' '}
                    {selectedStudent.course_title || selectedStudent.course_name}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-stone-500" />{' '}
                    {selectedStudent.branch_name}
                  </span>
                </p>
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
                      {selectedStudent.branch_approval_status || '—'}
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
                      {selectedStudent.super_admin_approval_status || '—'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200 cursor-pointer"
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
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                      <User className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Student Information
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Name
                        </p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {selectedStudent.name || selectedStudent.student_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          User ID
                        </p>
                        <p className="text-sm font-mono text-slate-800 mt-1">
                          #{selectedStudent.user_id}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Email
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.email || '—'}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Phone
                        </p>
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
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Address
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0 mt-0.5" />{' '}
                          {selectedStudent.address || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Parent / Guardian
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Parent Name
                        </p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {selectedStudent.parent_name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Parent Phone
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.parent_phone || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course & Branch */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
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
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-5 flex-1">
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Course Name
                          </p>
                          <p className="text-sm font-bold text-[#9c6b2e] mt-1">
                            {selectedStudent.course_title || selectedStudent.course_name}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Branch Name
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedStudent.branch_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Course Duration
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-stone-500" /> {resolvedCourseDuration}
                          </p>
                        </div>
                        <div>
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
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden bg-gradient-to-br from-white to-stone-50/50">
                    <div className="px-5 py-3.5 border-b border-stone-100 bg-white/60 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Payment Summary
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Total Fee
                        </p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                          {fmt(selectedStudent.total_fee || selectedStudent.course_fee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Total Paid
                        </p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">
                          {fmt(selectedStudent.total_paid || selectedStudent.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Balance
                        </p>
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
                      <div className="col-span-2 pt-4 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                            Paid Date & Time
                          </p>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            {latestPaidDateTime && latestPaidDateTime.date !== '—' ? (
                              <span>
                                {latestPaidDateTime.date}
                                {latestPaidDateTime.time && (
                                  <span className="text-[10px] text-stone-500 font-normal ml-1">
                                    ({latestPaidDateTime.time})
                                  </span>
                                )}
                              </span>
                            ) : Number(selectedStudent.total_paid || selectedStudent.amount) > 0 ? (
                              <span className="text-emerald-700">Paid</span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                            Installments Paid
                          </p>
                          <p className="text-xs font-bold text-slate-700 bg-white inline-block px-2.5 py-1 rounded-lg border border-stone-100">
                            {Number(selectedStudent.installment_count) > 0
                              ? `${selectedStudent.paid_installment_count ?? 0} of ${selectedStudent.installment_count} Paid`
                              : selectedStudent.installments?.length
                              ? `${selectedStudent.installments.filter((i) => String(i.status).toLowerCase() === 'paid').length} of ${selectedStudent.installments.length} Paid`
                              : 'No Installments'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval & Enrollment Status */}
                  <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
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

                      {/* Account Status and Toggle */}
                      <div className="col-span-2 pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Account Status
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${
                                String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active'
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active'
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={statusUpdatingId === (selectedStudent.student_id ?? selectedStudent.user_id ?? selectedStudent.id)}
                          onClick={() => {
                            const isAct =
                              String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active';
                            handleToggleStatus(selectedStudent, isAct ? 'Inactive' : 'Active');
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                            String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {statusUpdatingId === (selectedStudent.student_id ?? selectedStudent.user_id ?? selectedStudent.id) && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {String(selectedStudent.status || (selectedStudent.is_active === false ? 'inactive' : 'active')).toLowerCase() === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
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
                    <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
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

              {/* Installment Schedule Table (Full Width) */}
              {selectedStudent.installments && selectedStudent.installments.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden mt-6">
                  <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-stone-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Installment Schedule
                    </h3>
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
                          <th className="px-5 py-3">Paid Date & Time</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1ede4]">
                        {selectedStudent.installments.map((inst, idx) => {
                          const matchingHist = paymentHistory.find((h) => {
                            const sameEnr = String(h.enrollment_id || h.id || '') === String(selectedStudent.enrollment_id || selectedStudent.id || '');
                            return sameEnr && Number(h.installment_number) === Number(inst.installment_number);
                          });

                          const matchingPayment = (selectedStudent.payments || []).find((p) => {
                            return Number(p.installment_number) === Number(inst.installment_number);
                          });

                          const rawPaidDate =
                            inst.paid_at ||
                            inst.paid_date ||
                            inst.payment_date ||
                            matchingHist?.created_at ||
                            matchingHist?.payment_date ||
                            matchingPayment?.reviewed_at ||
                            matchingPayment?.payment_date ||
                            matchingPayment?.created_at ||
                            (String(inst.status).toLowerCase() === 'paid' ? (inst.reviewed_at || inst.updated_at || inst.created_at) : null);

                          const isPaid = String(inst.status).toLowerCase() === 'paid' || Number(inst.paid_amount) > 0 || Boolean(rawPaidDate);
                          const paidDt = rawPaidDate ? formatDateClean(rawPaidDate) : null;

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="px-5 py-3 font-medium text-slate-800">
                                #{inst.installment_number}
                              </td>
                              <td className="px-5 py-3 font-bold text-slate-700">
                                {fmt(inst.amount)}
                              </td>
                              <td className="px-5 py-3 font-semibold text-emerald-600">
                                {fmt(inst.paid_amount)}
                              </td>
                              <td className="px-5 py-3 font-semibold text-rose-600">
                                {fmt(inst.remaining_amount)}
                              </td>
                              <td className="px-5 py-3 text-xs font-medium text-slate-600">
                                {inst.due_date
                                  ? new Date(inst.due_date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </td>
                              <td className="px-5 py-3 text-xs whitespace-nowrap">
                                {paidDt && paidDt.date !== '—' ? (
                                  <div>
                                    <span className="font-semibold text-slate-800">{paidDt.date}</span>
                                    {paidDt.time && (
                                      <span className="text-[10px] text-stone-400 block font-medium">
                                        {paidDt.time}
                                      </span>
                                    )}
                                  </div>
                                ) : isPaid ? (
                                  <span className="text-emerald-700 font-semibold text-xs">Paid</span>
                                ) : (
                                  <span className="text-stone-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                    String(inst.status).toLowerCase() === 'paid'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : String(inst.status).toLowerCase() === 'partial'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : inst.is_due
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {inst.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs p-8 flex flex-col items-center justify-center text-center mt-6">
                  <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-600">
                    No installment schedule for this enrollment.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-5 sm:px-6 border-t border-[#e3ddd0] bg-white flex justify-end rounded-b-2xl">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
         PAYMENT RECORD DETAILS MODAL
         ───────────────────────────────────────────────────────── */}
      {selectedPaymentRecord && (() => {
        const p = selectedPaymentRecord;
        const studentName = p.student_name || p.name || p.student?.name || '—';
        const userId = p.user_id ?? p.student_id;
        const email = p.email || p.student?.email || '—';
        const phone = p.phone || p.phone_number || p.student?.phone || '—';
        const enrollmentId = p.enrollment_id ?? p.id;
        const branchName = p.branch_name || p.branch?.name || '—';
        const branchId = p.branch_id ?? p.branch?.id;

        const courseTitle = p.course_title || p.course_name || '—';
        const courseId = p.course_id;
        const installmentNum = p.installment_number;
        const installmentId = p.installment_id;

        const paymentId = p.payment_id ?? p.id;
        const amount = p.amount ?? p.payment_amount;
        const isSplit = String(p.payment_method).toLowerCase() === 'split' || String(p.payment_method).toLowerCase() === 'cash_upi';
        const methodMeta = formatPaymentMethod(p.payment_method, isSplit, p.cash_amount, p.upi_amount);
        const paymentDateObj = formatDateClean(p.payment_date || p.paid_at || p.created_at);
        const paymentDateDisplay = paymentDateObj.date !== '—'
          ? (paymentDateObj.time ? `${paymentDateObj.date} at ${paymentDateObj.time}` : paymentDateObj.date)
          : '—';

        const overallStatus = String(p.status || 'received').toLowerCase();
        const paymentStatus = p.payment_status || p.status || null;

        // Credited to balance
        const credited = p.credited_to_balance;
        const creditedDisplay =
          credited === true || credited === 1 || String(credited).toLowerCase() === 'true'
            ? 'Yes'
            : credited === false || credited === 0 || String(credited).toLowerCase() === 'false'
            ? 'No'
            : '—';

        // Rejection reason (only display when non-empty)
        const rejectionReason =
          p.rejection_reason && String(p.rejection_reason).trim() !== ''
            ? String(p.rejection_reason).trim()
            : null;

        // Review Details
        const reviewedByUserId = p.reviewed_by_user_id ?? p.reviewed_by;
        const reviewedAtObj = formatDateClean(p.reviewed_at);
        const reviewedAtDisplay = reviewedAtObj.date !== '—'
          ? (reviewedAtObj.time ? `${reviewedAtObj.date} at ${reviewedAtObj.time}` : reviewedAtObj.date)
          : '—';

        const createdAtObj = formatDateClean(p.created_at);
        const createdAtDisplay = createdAtObj.date !== '—'
          ? (createdAtObj.time ? `${createdAtObj.date} at ${createdAtObj.time}` : createdAtObj.date)
          : '—';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPaymentRecord(null);
            }}
          >
            <div className="sa-rise relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
              {/* Modal Header */}
              <div className="shrink-0 flex items-center justify-between p-5 sm:px-6 border-b border-[#e3ddd0] bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] flex items-center justify-center text-[#9c6b2e] shadow-2xs">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        Payment Details
                      </h2>
                      {paymentId && (
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                          #{paymentId}
                        </span>
                      )}
                      {/* Overall Status Badge */}
                      {overallStatus === 'received' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Received
                        </span>
                      )}
                      {overallStatus === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          Rejected
                        </span>
                      )}
                      {(overallStatus === 'pending_review' || overallStatus === 'pending') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {!['received', 'rejected', 'pending_review', 'pending'].includes(overallStatus) && (
                        <StatusPill status={overallStatus || '—'} />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{studentName}</span>
                      <span>•</span>
                      <span>{courseTitle}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentRecord(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200 cursor-pointer"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Rejection Banner if rejected */}
                {rejectionReason && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-2xs">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejection Reason</p>
                      <p className="text-sm font-semibold text-rose-950 mt-0.5">{rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Section A: Student Details */}
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e3ddd0] bg-slate-50/70 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#9c6b2e]" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Student Details
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Student Name
                      </p>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <Avatar name={studentName} />
                        <p className="text-sm font-bold text-slate-900">{studentName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Student ID (User ID)
                      </p>
                      <p className="text-sm font-mono font-semibold text-slate-800 mt-1.5">
                        {userId != null ? `#${userId}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Enrollment ID
                      </p>
                      <p className="text-sm font-mono font-semibold text-slate-800 mt-1.5">
                        {enrollmentId != null ? `#${enrollmentId}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Email
                      </p>
                      <p className="text-sm font-medium text-slate-700 mt-1.5 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Phone Number
                      </p>
                      <p className="text-sm font-medium text-slate-700 mt-1.5 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{phone}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Branch
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          <Building2 className="h-3.5 w-3.5 text-[#9c6b2e] shrink-0" />
                          <span>{branchName}</span>
                        </span>
                        {branchId != null && (
                          <span className="text-[11px] font-mono text-stone-500 font-medium">
                            (ID: #{branchId})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Course Details */}
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e3ddd0] bg-slate-50/70 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#9c6b2e]" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Course Details
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Course Title
                      </p>
                      <p className="text-sm font-bold text-[#9c6b2e] mt-1.5">
                        {courseTitle}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Course ID
                      </p>
                      <p className="text-sm font-mono font-semibold text-slate-800 mt-1.5">
                        {courseId != null ? `#${courseId}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Installment Number & ID
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">
                          {installmentNum != null ? `Installment #${installmentNum}` : '—'}
                        </span>
                        {installmentId != null && (
                          <span className="text-[11px] font-mono text-stone-500 font-medium">
                            (ID: #{installmentId})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Payment Details */}
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e3ddd0] bg-slate-50/70 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#9c6b2e]" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Payment Details
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Payment ID
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-1.5">
                        {paymentId != null ? `#${paymentId}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Amount
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 mt-1">
                        {fmt(amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Payment Method
                      </p>
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${methodMeta.bg}`}>
                          {methodMeta.label}
                        </span>
                        {methodMeta.detail && (
                          <p className="text-[11px] text-stone-500 font-medium mt-1">
                            {methodMeta.detail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Payment Date
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{paymentDateDisplay}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        Overall Status
                      </p>
                      {overallStatus === 'received' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Received
                        </span>
                      )}
                      {overallStatus === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          Rejected
                        </span>
                      )}
                      {(overallStatus === 'pending_review' || overallStatus === 'pending') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {!['received', 'rejected', 'pending_review', 'pending'].includes(overallStatus) && (
                        <StatusPill status={overallStatus || '—'} />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        Payment Status
                      </p>
                      {paymentStatus ? (
                        <StatusPill status={paymentStatus} />
                      ) : (
                        <span className="text-stone-400 text-sm">—</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        Credited to Balance
                      </p>
                      {creditedDisplay === 'Yes' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" /> Yes
                        </span>
                      )}
                      {creditedDisplay === 'No' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          No
                        </span>
                      )}
                      {creditedDisplay === '—' && (
                        <span className="text-stone-400 text-sm">—</span>
                      )}
                    </div>
                    {rejectionReason && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 pt-3 border-t border-stone-100">
                        <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                          Rejection Reason
                        </p>
                        <p className="text-sm font-semibold text-rose-900 mt-1 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200">
                          {rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section D: Review Details */}
                <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e3ddd0] bg-slate-50/70 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#9c6b2e]" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Review Details
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Reviewed By User ID
                      </p>
                      <p className="text-sm font-mono font-semibold text-slate-800 mt-1.5">
                        {reviewedByUserId != null ? `#${reviewedByUserId}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Reviewed At
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{reviewedAtDisplay}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Created At
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{createdAtDisplay}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 p-4 sm:px-6 border-t border-[#e3ddd0] bg-white flex justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentRecord(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-stone-100 hover:bg-stone-200 transition border border-stone-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SuperAdminStudents;
