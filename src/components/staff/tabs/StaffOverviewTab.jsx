import React, { useMemo } from 'react';
import {
  BookOpen,
  Users,
  FileText,
  Building2,
  MapPin,
  Loader2,
  Eye,
  FileCheck2,
  GraduationCap,
  Award,
  Plus,
  ArrowRight,
  MoreVertical,
  Folder,
  FolderOpen,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const StaffOverviewTab = ({
  dashboardData,
  profileData,
  user,
  branchName,
  branchLocation,
  assignedCourses = [],
  courseStudents = [],
  assignments = [],
  selectedCourseId,
  setSelectedCourseId,
  activeCourseObj,
  studentsLoading,
  assignmentsLoading,
  setActiveTab,
  onOpenNewAssignment,
  onSelectStudent,
}) => {
  const totalCourses = assignedCourses.length || dashboardData?.total_courses || 0;
  const totalStudents =
    dashboardData?.total_students ??
    dashboardData?.students_count ??
    courseStudents.length ??
    0;
  const totalAssignments =
    dashboardData?.total_assignments ??
    dashboardData?.assignments_count ??
    assignments.length ??
    0;

  const staffName = profileData?.name || user?.name || 'Faculty Member';

  // Format date helper (handles ISO strings, date-only YYYY-MM-DD, and timestamp numbers)
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const str = String(val).trim();
      const d = str.includes('T') ? new Date(str) : new Date(`${str}T00:00:00`);
      if (isNaN(d.getTime())) {
        const fallback = new Date(val);
        if (isNaN(fallback.getTime())) return str || '—';
        return fallback.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(val);
    }
  };

  // Comprehensive enrolled/admission date extractor
  const getStudentEnrolledDate = (s) => {
    if (!s) return '—';
    const raw =
      s.enrolled_at ||
      s.enrollment?.enrolled_at ||
      s.admission_date ||
      s.enrollment?.admission_date ||
      s.admission?.admission_date ||
      s.admission?.enrolled_at ||
      s.admission?.created_at ||
      s.enrollment_date ||
      s.enrolled_date ||
      s.enrollment?.enrollment_date ||
      s.enrollment?.enrolled_date ||
      s.created_at ||
      s.createdAt ||
      s.enrollment?.created_at ||
      s.enrollment?.createdAt ||
      s.date_of_admission ||
      s.joining_date ||
      s.student?.admission_date ||
      s.student?.enrolled_at ||
      s.student?.created_at ||
      s.registration_date ||
      s.registered_at ||
      s.date ||
      s.updated_at ||
      s.enrollment?.updated_at;
    if (!raw) return '—';
    return formatDate(raw);
  };

  // Sorted recent students (last 3 enrolled students only)
  const recentStudents = useMemo(() => {
    if (!Array.isArray(courseStudents)) return [];
    return [...courseStudents]
      .sort((a, b) => {
        const getRawTime = (item) => {
          const val =
            item.enrolled_at ||
            item.enrollment?.enrolled_at ||
            item.admission_date ||
            item.enrollment?.admission_date ||
            item.admission?.admission_date ||
            item.admission?.enrolled_at ||
            item.enrollment_date ||
            item.enrolled_date ||
            item.created_at ||
            item.createdAt ||
            item.enrollment?.created_at ||
            item.student?.created_at ||
            0;
          const t = new Date(val).getTime();
          return isNaN(t) ? 0 : t;
        };
        const timeA = getRawTime(a);
        const timeB = getRawTime(b);
        if (timeA > 0 && timeB > 0 && timeA !== timeB) {
          return timeB - timeA;
        }
        return (b.id || 0) - (a.id || 0);
      })
      .slice(0, 3);
  }, [courseStudents]);

  return (
    <div className="space-y-7 sa-fade">
      {/* ── 1. Welcome Header Banner with Staff Name (Matching Emerald/Mint Theme) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100/70 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Soft emerald background gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Welcome back, {staffName}! 👋
            </h1>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{branchName ? `Faculty at ${branchName}` : 'Manage your courses, enrolled students, and classroom assignments.'}</span>
            {branchLocation && <span>• {branchLocation}</span>}
          </p>
        </div>

        {/* 3D-styled Staff / Faculty Animated Emblem (Matching Student Portal Style) */}
        <div className="hidden sm:flex items-center justify-center shrink-0 pr-2 sm:pr-4 relative z-10">
          <div className="relative flex items-center justify-center group cursor-default">
            {/* Floating decorative elements in matching emerald theme */}
            <div className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/40 animate-bounce flex items-center justify-center text-white">
              <Award className="h-3.5 w-3.5 text-white stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-teal-400 shadow-md shadow-teal-400/30 animate-pulse" />
            <div className="absolute top-1/2 -right-4 h-5 w-5 rounded-full bg-emerald-500/90 shadow-md shadow-emerald-500/30 flex items-center justify-center text-[10px] font-black text-white">
              ★
            </div>

            {/* Center Floating Faculty Emblem */}
            <div className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100/60 to-teal-100/50 backdrop-blur-md border border-emerald-200/80 shadow-lg shadow-emerald-600/10 transform hover:rotate-3 hover:scale-105 transition-all duration-300">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Access (Matching MyCloud Reference's Top Section) ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Quick Access
          </h2>
          {(branchName || branchLocation) && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <Building2 className="h-3 w-3 text-emerald-600" />
              <span>{branchName}</span>
              {branchLocation && <span>• {branchLocation}</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Primary Highlighted Green Card */}
          <div
            onClick={() => setActiveTab('courses')}
            className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden group flex flex-col justify-between"
          >
            {/* Ambient soft glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="flex items-start justify-between relative z-10 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <Folder className="h-5 w-5 text-white fill-white/20" />
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Active
              </span>
            </div>

            <div className="relative z-10">
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-1.5">
                {totalCourses}
              </p>
              <p className="text-sm font-bold text-white tracking-tight leading-tight">
                Assigned Courses
              </p>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                {totalCourses} course{totalCourses !== 1 ? 's' : ''} in curriculum
              </p>
            </div>
          </div>

          {/* Card 2: White Card (Enrolled Students) */}
          <div
            onClick={() => setActiveTab('courses')}
            className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:border-emerald-100 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold shadow-2xs">
                <Users className="h-5 w-5" />
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1.5 group-hover:text-emerald-600 transition-colors">
                {totalStudents}
              </p>
              <p className="text-sm font-bold text-slate-800 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                Enrolled Students
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {totalStudents} active student{totalStudents !== 1 ? 's' : ''} enrolled
              </p>
            </div>
          </div>

          {/* Card 3: White Card (Assignments & Tasks) */}
          <div
            onClick={() => setActiveTab('assignments')}
            className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:border-emerald-100 flex flex-col justify-between group sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold shadow-2xs">
                <FileText className="h-5 w-5" />
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Tasks
              </span>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1.5 group-hover:text-emerald-600 transition-colors">
                {totalAssignments}
              </p>
              <p className="text-sm font-bold text-slate-800 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                Course Assignments
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''} posted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. My Courses (Replacing 'Folders' label as requested) ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              My Courses
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {assignedCourses.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No assigned courses found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignedCourses.map((c) => {
              const id = c.id || c.course_id;
              const isSelected = String(id) === String(selectedCourseId);
              return (
                <div
                  key={id}
                  onClick={() => setSelectedCourseId(id)}
                  className={`rounded-2xl p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {/* Cute Folder Icon Shape (like reference) */}
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      <Folder className="h-5 w-5 fill-current" />
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Pick'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate" title={c.title}>
                    {c.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="truncate max-w-[100px]">
                      {c.category || c.level || 'Course'}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {c.duration || `${courseStudents.length} students`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Recent Students (Last 3 Enrolled Students) ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Recent Students
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {courseStudents.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {studentsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-medium">Loading enrolled students...</p>
            </div>
          ) : recentStudents.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No students enrolled in this course yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Enrolled Date</th>
                  <th className="pb-3 font-semibold">Contact / Email</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentStudents.map((s, idx) => (
                  <tr
                    key={s.id || s.enrollment_id || idx}
                    onClick={() => onSelectStudent && onSelectStudent(s)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {(s.name || s.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                            {s.name || s.student_name || 'Student'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {activeCourseObj?.title || 'Enrolled Course'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {getStudentEnrolledDate(s)}
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {s.email || s.phone || '—'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffOverviewTab;
