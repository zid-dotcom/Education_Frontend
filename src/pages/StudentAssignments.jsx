import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentAssignmentsApi,
  submitStudentAssignmentApi,
} from '../services/studentassignments';
import { useStudentModalBlur } from '../utils/useStudentModalBlur';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const resolveDocumentUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

const useAssignmentsFonts = () => {
  useEffect(() => {
    const id = 'student-portal-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No date specified';
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
  if (!dateStr) return 'Date unavailable';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Calculate status info from due date
const getDueStatus = (dueDateStr) => {
  if (!dueDateStr) return { status: 'none', label: 'No Deadline', color: 'slate', daysDiff: null };
  const now = new Date();
  const due = new Date(dueDateStr);

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
      daysDiff: diffDays,
    };
  }
  if (diffDays === 0) {
    return {
      status: 'today',
      label: 'Due Today',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
      daysDiff: 0,
    };
  }
  if (diffDays === 1) {
    return {
      status: 'tomorrow',
      label: 'Due Tomorrow',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
      daysDiff: 1,
    };
  }
  if (diffDays <= 5) {
    return {
      status: 'soon',
      label: `${diffDays} days left`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      daysDiff: diffDays,
    };
  }
  return {
    status: 'active',
    label: `${diffDays} days left`,
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    pillClass: 'bg-sky-50 text-sky-700 border-sky-200',
    daysDiff: diffDays,
  };
};

const extractSubmissionDetails = (a) => {
  if (!a) return {};
  const sub = a.submission || a.student_submission || {};
  const marksObtained =
    a.marks_obtained !== undefined && a.marks_obtained !== null
      ? a.marks_obtained
      : sub.marks_obtained !== undefined && sub.marks_obtained !== null
      ? sub.marks_obtained
      : a.marks ?? sub.marks ?? null;

  const maxMarks = a.max_marks ?? sub.max_marks ?? a.course?.max_marks ?? 100;
  const feedback = a.feedback || sub.feedback || a.remarks || sub.remarks || '';
  const fileUrl = resolveDocumentUrl(
    a.file_url ||
    sub.file_url ||
    a.submission_file ||
    sub.submission_file ||
    a.file ||
    sub.file
  );
  const submittedAt = a.submitted_at || sub.submitted_at || a.submission_date || sub.submission_date || null;
  const isSubmitted = Boolean(
    a.is_submitted ||
    sub.id ||
    fileUrl ||
    submittedAt ||
    marksObtained !== null ||
    String(a.status || a.submission_status || sub.status).toLowerCase().includes('submit') ||
    String(a.status || a.submission_status || sub.status).toLowerCase().includes('grad') ||
    String(a.status || a.submission_status || sub.status).toLowerCase().includes('verif')
  );

  const isGraded =
    marksObtained !== null ||
    String(a.status || a.submission_status || sub.status).toLowerCase().includes('grad') ||
    String(a.status || a.submission_status || sub.status).toLowerCase().includes('verif');

  return {
    isSubmitted,
    isGraded,
    marksObtained,
    maxMarks,
    feedback,
    fileUrl,
    submittedAt,
  };
};

const StudentAssignments = () => {
  useAssignmentsFonts();
  const { token } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UPCOMING, OVERDUE, SUBMITTED
  const [activeModalAssignment, setActiveModalAssignment] = useState(null);

  useStudentModalBlur(Boolean(activeModalAssignment));

  // Submission in-flight & feedback state
  const [submittingId, setSubmittingId] = useState(null);
  const [submissionAlert, setSubmissionAlert] = useState(null);

  const fetchAssignments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await getStudentAssignmentsApi(token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.assignments)
        ? data.assignments
        : [];
      const count = typeof data?.total_assignments === 'number'
        ? data.total_assignments
        : list.length;
      setAssignments(list);
      setTotalCount(count);

      // Keep active modal in sync if open
      if (activeModalAssignment) {
        const modalId = activeModalAssignment.assignment_id || activeModalAssignment.id;
        const updated = list.find((item) => (item.assignment_id || item.id) === modalId);
        if (updated) setActiveModalAssignment(updated);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load assignments.');
      setAssignments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [token]);

  // Handle PDF submission
  const handlePdfSubmit = async (assignmentId, file) => {
    if (!file) return;
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setSubmissionAlert({
        id: assignmentId,
        type: 'error',
        text: 'Only PDF format is accepted. Please upload a valid .pdf file.',
      });
      return;
    }

    try {
      setSubmittingId(assignmentId);
      setSubmissionAlert(null);

      const formData = new FormData();
      formData.append('file', file);

      await submitStudentAssignmentApi(assignmentId, formData, token);

      setSubmissionAlert({
        id: assignmentId,
        type: 'success',
        text: 'Your PDF assignment was submitted successfully!',
      });

      await fetchAssignments();
    } catch (err) {
      setSubmissionAlert({
        id: assignmentId,
        type: 'error',
        text: err?.message || 'Failed to upload assignment PDF.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  // Extract unique courses for filtering
  const uniqueCourses = useMemo(() => {
    const coursesMap = new Map();
    assignments.forEach((a) => {
      if (a?.course?.course_id && a?.course?.course_title) {
        coursesMap.set(a.course.course_id, a.course.course_title);
      }
    });
    return Array.from(coursesMap.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments]);

  // Compute stat totals
  const stats = useMemo(() => {
    let submittedCount = 0;
    let gradedCount = 0;
    let pendingCount = 0;

    assignments.forEach((a) => {
      const sub = extractSubmissionDetails(a);

      if (sub.isSubmitted) {
        submittedCount++;
      } else {
        pendingCount++;
      }

      if (sub.isGraded) {
        gradedCount++;
      }
    });

    return {
      total: assignments.length,
      pending: pendingCount,
      submitted: submittedCount,
      graded: gradedCount,
      coursesCount: uniqueCourses.length,
    };
  }, [assignments, uniqueCourses]);

  // Filtered list
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Course filter
      if (
        selectedCourseFilter !== 'ALL' &&
        item?.course?.course_id?.toString() !== selectedCourseFilter.toString()
      ) {
        return false;
      }

      // Status filter
      const sub = extractSubmissionDetails(item);

      if (statusFilter === 'SUBMITTED' && !sub.isSubmitted) return false;
      if (statusFilter === 'PENDING_SUBMIT' && sub.isSubmitted) return false;
      if (statusFilter === 'GRADED' && !sub.isGraded) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const courseMatch = item.course?.course_title?.toLowerCase().includes(q);
        return titleMatch || descMatch || courseMatch;
      }

      return true;
    });
  }, [assignments, selectedCourseFilter, statusFilter, searchQuery]);

  const handleCardClick = (filterId) => {
    setStatusFilter(filterId);
    const element = document.getElementById('assignments-list-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="w-full pb-8 font-['Plus_Jakarta_Sans',sans-serif] opacity-0 animate-[pageFadeIn_0.4s_ease-out_forwards]"
    >
      <style>{`
        @keyframes pageFadeIn {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero Banner (Warm Light Theme) */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] p-6 sm:p-8 text-[#17140F] border border-[#E3DDD0] shadow-xs mb-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#9C6B2E]/10 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[#9C6B2E] border border-[#E3DDD0]">
              <ClipboardList className="h-3 w-3 text-[#9C6B2E]" />
              <span>Student Coursework & Submissions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17140F] leading-tight">
              My Assignments
            </h1>
            <p className="text-xs sm:text-sm text-[#5B5346] font-normal">
              Access tasks, submit coursework directly in PDF format, and review evaluation marks and feedback from your instructors.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAssignments}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] border border-[#E3DDD0] shadow-xs transition hover:bg-[#F1EDE4] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* Global Alerts */}
      {submissionAlert && (
        <div
          role="alert"
          className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-2xs ${
            submissionAlert.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {submissionAlert.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{submissionAlert.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionAlert(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Cards (Warm Light Theme) */}
      <section className="mb-6 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* Total Tasks */}
        <button
          type="button"
          onClick={() => handleCardClick('ALL')}
          className={`group rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            statusFilter === 'ALL'
              ? 'border-2 border-[#9C6B2E] bg-white shadow-[0_12px_30px_rgba(156,107,46,0.12)]'
              : 'border border-[#E3DDD0] bg-white shadow-2xs hover:shadow-md hover:border-[#9C6B2E]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9C6B2E]">Total Tasks</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              statusFilter === 'ALL' ? 'bg-[#9C6B2E]/10 text-[#9C6B2E]' : 'bg-[#F1EDE4] text-[#5B5346]'
            }`}>
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${statusFilter === 'ALL' ? 'text-[#9C6B2E]' : 'text-slate-900'}`}>
              {stats.total}
            </p>
            <p className="mt-1 text-xs text-slate-400 font-medium">Assigned to your profile</p>
          </div>
        </button>

        {/* Pending */}
        <button
          type="button"
          onClick={() => handleCardClick('PENDING_SUBMIT')}
          className={`group rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            statusFilter === 'PENDING_SUBMIT'
              ? 'border-2 border-[#9C6B2E] bg-white shadow-[0_12px_30px_rgba(156,107,46,0.12)]'
              : 'border border-[#E3DDD0] bg-white shadow-2xs hover:shadow-md hover:border-[#9C6B2E]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9C6B2E]">Pending</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              statusFilter === 'PENDING_SUBMIT' ? 'bg-[#9C6B2E]/10 text-[#9C6B2E]' : 'bg-[#F1EDE4] text-[#5B5346]'
            }`}>
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${statusFilter === 'PENDING_SUBMIT' ? 'text-[#9C6B2E]' : 'text-slate-900'}`}>
              {stats.pending}
            </p>
            <p className="mt-1 text-xs text-slate-400 font-medium">Awaiting submission</p>
          </div>
        </button>

        {/* Submitted */}
        <button
          type="button"
          onClick={() => handleCardClick('SUBMITTED')}
          className={`group rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            statusFilter === 'SUBMITTED'
              ? 'border-2 border-[#9C6B2E] bg-white shadow-[0_12px_30px_rgba(156,107,46,0.12)]'
              : 'border border-[#E3DDD0] bg-white shadow-2xs hover:shadow-md hover:border-[#9C6B2E]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9C6B2E]">Submitted</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              statusFilter === 'SUBMITTED' ? 'bg-[#9C6B2E]/10 text-[#9C6B2E]' : 'bg-[#F1EDE4] text-[#5B5346]'
            }`}>
              <FileCheck2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${statusFilter === 'SUBMITTED' ? 'text-[#9C6B2E]' : 'text-slate-900'}`}>
              {stats.submitted}
            </p>
            <p className="mt-1 text-xs text-slate-400 font-medium">Homework PDF uploaded</p>
          </div>
        </button>

        {/* Graded & Marked */}
        <button
          type="button"
          onClick={() => handleCardClick('GRADED')}
          className={`group rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            statusFilter === 'GRADED'
              ? 'border-2 border-[#9C6B2E] bg-white shadow-[0_12px_30px_rgba(156,107,46,0.12)]'
              : 'border border-[#E3DDD0] bg-white shadow-2xs hover:shadow-md hover:border-[#9C6B2E]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9C6B2E]">Graded</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              statusFilter === 'GRADED' ? 'bg-[#9C6B2E]/10 text-[#9C6B2E]' : 'bg-[#F1EDE4] text-[#5B5346]'
            }`}>
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${statusFilter === 'GRADED' ? 'text-[#9C6B2E]' : 'text-slate-900'}`}>
              {stats.graded}
            </p>
            <p className="mt-1 text-xs text-slate-400 font-medium">Marks & remarks released</p>
          </div>
        </button>
      </section>

      {/* Filter and Search Bar */}
      <section className="mb-6 rounded-2xl border border-[#E3DDD0] bg-white p-4 shadow-2xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: `All (${assignments.length})` },
              { id: 'PENDING_SUBMIT', label: `Pending Submit (${stats.pending})` },
              { id: 'SUBMITTED', label: `Submitted (${stats.submitted})` },
              { id: 'GRADED', label: `Graded (${stats.graded})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#9C6B2E] text-white shadow-xs'
                    : 'bg-[#F1EDE4] text-[#5B5346] border border-[#E3DDD0] hover:bg-[#E8E2D5] hover:text-[#17140F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Course Filter Dropdown */}
            {uniqueCourses.length > 0 && (
              <div className="relative min-w-[180px]">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] py-2 px-3 text-xs font-semibold text-[#17140F] focus:border-[#9C6B2E] focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  <option value="ALL">All Enrolled Courses</option>
                  {uniqueCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8175]" />
              <input
                type="text"
                placeholder="Search tasks, courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] py-2 pl-9 pr-8 text-xs text-[#17140F] placeholder:text-[#8A8175] focus:border-[#9C6B2E] focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8175] hover:text-[#17140F]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Assignment Cards Section */}
      <section id="assignments-list-section">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4]">
            <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
            <p className="mt-3 text-xs font-bold text-[#5B5346]">Loading your assignments...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
            <p className="mt-2 text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchAssignments}
              className="mt-4 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-rose-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E3DDD0] bg-[#FAF8F4] p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDE4] text-[#9C6B2E]">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-[#17140F]">
              {assignments.length === 0 ? 'No assignments assigned yet' : 'No matching assignments found'}
            </h3>
            <p className="mt-1.5 max-w-md mx-auto text-xs leading-relaxed text-[#5B5346]">
              {assignments.length === 0
                ? 'Your instructors have not posted any assignments for your enrolled courses yet. Check back soon or consult your course schedule.'
                : 'Try adjusting your search terms or filters to find what you are looking for.'}
            </p>
            {assignments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSelectedCourseFilter('ALL');
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#855923] transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.map((assignment) => {
              const aId = assignment.assignment_id || assignment.id || assignment.task_id;
              const dueInfo = getDueStatus(assignment.due_date);
              const courseTitle = assignment.course?.course_title || 'Enrolled Course';
              const subDetails = extractSubmissionDetails(assignment);
              const isCurrentSubmitting = submittingId === aId;

              return (
                <article
                  key={aId}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E3DDD0] bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:border-[#9C6B2E]/50 hover:shadow-md"
                >
                  {/* Top Bar: Course Badge & Due Status */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E3DDD0] bg-[#FAF8F4] px-3 py-1 text-[11px] font-bold text-[#5B5346]">
                        <BookOpen className="h-3 w-3 text-[#9C6B2E]" />
                        <span className="max-w-[150px] truncate">{courseTitle}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-tight ${dueInfo.badgeClass}`}
                      >
                        {dueInfo.status === 'overdue' && <AlertCircle className="h-3 w-3" />}
                        {dueInfo.status === 'today' && <Clock className="h-3 w-3" />}
                        <span>{dueInfo.label}</span>
                      </span>
                    </div>

                    {/* Assignment Title */}
                    <h3 className="mt-3.5 text-base font-extrabold leading-snug text-[#17140F] transition group-hover:text-[#9C6B2E]">
                      {assignment.title || 'Untitled Assignment'}
                    </h3>

                    {/* Max Marks & Status Pill Row */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#17140F] bg-[#F1EDE4] px-2.5 py-0.5 rounded-md border border-[#E3DDD0]">
                        Max Marks: {subDetails.maxMarks}
                      </span>

                      {subDetails.isGraded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          <Award className="h-3.5 w-3.5 text-emerald-600" />
                          Score: {subDetails.marksObtained} / {subDetails.maxMarks}
                        </span>
                      ) : subDetails.isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C6B2E] bg-[#9C6B2E]/10 px-2.5 py-0.5 rounded-md border border-[#9C6B2E]/30">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B5346] bg-[#F1EDE4] px-2.5 py-0.5 rounded-md border border-[#E3DDD0]">
                          Not Submitted
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-[#5B5346]">
                      {assignment.description || 'No additional instructions provided for this assignment.'}
                    </p>

                    {/* Feedback Callout if available */}
                    {subDetails.feedback && (
                      <div className="mt-3 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-2.5 text-[11px] text-[#17140F]">
                        <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#9C6B2E]">
                          <MessageSquare className="h-3 w-3" /> Instructor Remarks:
                        </span>
                        <p className="mt-1 italic text-[#5B5346] leading-relaxed">
                          "{subDetails.feedback}"
                        </p>
                      </div>
                    )}

                    {/* Submitted File View Link */}
                    {subDetails.fileUrl && (
                      <div className="mt-3 flex items-center justify-between text-xs bg-[#FAF8F4] p-2.5 rounded-xl border border-[#E3DDD0]">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#17140F] truncate">
                          <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          <span>Submitted PDF Document</span>
                        </span>
                        <a
                          href={subDetails.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C6B2E] hover:text-[#855923] hover:underline shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Bottom details & Submission Action */}
                  <div className="mt-5 border-t border-[#E3DDD0] pt-4 space-y-3">
                    <div className="space-y-1.5 text-[11px] text-[#5B5346]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#9C6B2E]" /> Assigned:
                        </span>
                        <span className="font-semibold text-[#17140F]">
                          {formatDate(assignment.assigned_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#9C6B2E]" /> Due Date:
                        </span>
                        <span
                          className={`font-semibold ${
                            dueInfo.status === 'overdue' ? 'text-rose-700' : 'text-[#17140F]'
                          }`}
                        >
                          {formatDate(assignment.due_date)}
                        </span>
                      </div>
                    </div>

                    {/* PDF Submission Controls */}
                    <div className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3">
                      {!subDetails.isSubmitted ? (
                        <div>
                          <label className="block text-[11px] font-bold text-[#17140F] mb-1">
                            Upload Submission (PDF only)
                          </label>
                          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#E3DDD0] bg-white py-2 px-3 text-xs font-semibold text-[#9C6B2E] hover:bg-[#F1EDE4] hover:border-[#9C6B2E]/50 transition">
                            {isCurrentSubmitting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Uploading PDF...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 text-[#9C6B2E]" />
                                <span>Select & Submit PDF</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              disabled={isCurrentSubmitting}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePdfSubmit(aId, file);
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Submitted {subDetails.submittedAt ? formatDate(subDetails.submittedAt) : 'Successfully'}
                          </span>
                          <label className="cursor-pointer text-[11px] font-bold text-[#9C6B2E] hover:underline">
                            Re-submit PDF
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              disabled={isCurrentSubmitting}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePdfSubmit(aId, file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveModalAssignment(assignment)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E8E2D5] text-[#17140F] border border-[#E3DDD0] py-2 text-xs font-bold transition shadow-2xs"
                    >
                      <span>View Full Instructions</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {activeModalAssignment && (() => {
        const modalId = activeModalAssignment.assignment_id || activeModalAssignment.id || activeModalAssignment.task_id;
        const subDetails = extractSubmissionDetails(activeModalAssignment);
        const dueInfo = getDueStatus(activeModalAssignment.due_date);
        const isCurrentSubmitting = submittingId === modalId;

        return createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sa-fade"
          >
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setActiveModalAssignment(null)}
            />
            <div
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E3DDD0] bg-white p-6 shadow-2xl sm:p-8 sa-rise"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#E3DDD0] pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E3DDD0] bg-[#FAF8F4] px-3 py-1 text-[11px] font-bold text-[#5B5346]">
                      <BookOpen className="h-3 w-3 text-[#9C6B2E]" />
                      {activeModalAssignment.course?.course_title || 'Enrolled Course'}
                    </span>
                    {modalId && (
                      <span className="rounded-full bg-[#F1EDE4] px-2.5 py-0.5 text-[10px] font-bold text-[#5B5346]">
                        Task #{modalId}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-[#17140F]">
                    {activeModalAssignment.title || 'Untitled Assignment'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalAssignment(null)}
                  className="rounded-xl border border-[#E3DDD0] p-2 text-[#8A8175] transition hover:bg-[#F1EDE4] hover:text-[#17140F]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-5 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Due Status Banner */}
                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    dueInfo.status === 'overdue'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : dueInfo.status === 'today'
                      ? 'border-[#9C6B2E]/40 bg-[#FAF8F4] text-[#17140F]'
                      : 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        dueInfo.status === 'overdue'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-[#9C6B2E]/10 text-[#9C6B2E]'
                      }`}
                    >
                      {dueInfo.status === 'overdue' ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        Deadline Status
                      </p>
                      <p className="text-sm font-semibold">{dueInfo.label}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <p className="font-bold text-[#8A8175]">Target Due Date</p>
                    <p className="font-extrabold text-[#17140F]">
                      {formatDate(activeModalAssignment.due_date)}
                    </p>
                  </div>
                </div>

                {/* Score & Evaluation Strip */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A8175] block">Maximum Marks</span>
                    <span className="text-xl font-black text-[#17140F]">{subDetails.maxMarks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A8175] block">Marks Awarded</span>
                    <span className={`text-xl font-black ${subDetails.isGraded ? 'text-emerald-700' : 'text-[#8A8175]'}`}>
                      {subDetails.isGraded ? `${subDetails.marksObtained} / ${subDetails.maxMarks}` : 'Pending Evaluation'}
                    </span>
                  </div>
                </div>

                {/* Instructions / Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9C6B2E]">
                    Assignment Description & Instructions
                  </h4>
                  <div className="mt-2 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 text-sm leading-relaxed text-[#17140F] whitespace-pre-wrap">
                    {activeModalAssignment.description ||
                      'No detailed instructions provided for this assignment.'}
                  </div>
                </div>

                {/* Feedback note if any */}
                {subDetails.feedback && (
                  <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 text-xs text-[#17140F]">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[#9C6B2E]">
                      <MessageSquare className="h-4 w-4" /> Instructor Evaluation Feedback
                    </p>
                    <p className="mt-1 leading-relaxed text-[#5B5346] italic">
                      "{subDetails.feedback}"
                    </p>
                  </div>
                )}

                {/* PDF Submission Box */}
                <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#17140F]">Your Submission</h4>
                      <p className="text-[11px] text-[#5B5346]">Upload your completed assignment in PDF format.</p>
                    </div>
                    {subDetails.isSubmitted && (
                      <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-bold text-emerald-800">
                        ✓ Submitted
                      </span>
                    )}
                  </div>

                  {subDetails.fileUrl && (
                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E3DDD0]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                        <span className="truncate text-xs font-semibold text-[#17140F]">Uploaded PDF File</span>
                      </div>
                      <a
                        href={subDetails.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#9C6B2E] hover:text-[#855923] hover:underline"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#E3DDD0] bg-white py-3 px-4 text-xs font-bold text-[#9C6B2E] hover:bg-[#F1EDE4] transition shadow-2xs">
                    {isCurrentSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading Homework PDF...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-[#9C6B2E]" />
                        <span>{subDetails.isSubmitted ? 'Re-upload / Update PDF File' : 'Upload Assignment PDF'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      disabled={isCurrentSubmitting}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePdfSubmit(modalId, file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-[#E3DDD0] pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModalAssignment(null)}
                  className="rounded-xl bg-[#9C6B2E] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#855923] shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default StudentAssignments;
