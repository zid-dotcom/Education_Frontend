import React, { useMemo, useState } from 'react';
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

import StaffAnnouncementTicker from '../announcements/StaffAnnouncementTicker';
import StaffRecentAnnouncements from '../announcements/StaffRecentAnnouncements';
import StaffAnnouncementDetailModal from '../modals/StaffAnnouncementDetailModal';

/* ── Custom Watermark Illustrations matching Staff Portal Quick Access Design ── */
const StackedBooksGraphic = () => (
  <svg
    className="w-32 h-32 sm:w-36 sm:h-36"
    viewBox="0 0 130 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Ambient background glow */}
      <radialGradient id="books-ambient-glow" cx="55%" cy="55%" r="50%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.16" />
        <stop offset="60%" stopColor="#d97706" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
      </radialGradient>

      {/* Top cover leather/cloth gradient */}
      <linearGradient id="book-top-cover" x1="25" y1="32" x2="98" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e5be7e" />
        <stop offset="45%" stopColor="#d4a75e" />
        <stop offset="100%" stopColor="#be8f45" />
      </linearGradient>

      {/* Spine gradient (curved lighting: dark - highlight - dark) */}
      <linearGradient id="book-spine-1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#966a26" />
        <stop offset="35%" stopColor="#d9aa5f" />
        <stop offset="70%" stopColor="#be8d41" />
        <stop offset="100%" stopColor="#8d6121" />
      </linearGradient>

      {/* Shadow cast under books */}
      <linearGradient id="book-shadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </linearGradient>

      {/* Page block paper gradient */}
      <linearGradient id="book-pages-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fdfcf9" />
        <stop offset="60%" stopColor="#f5f0e6" />
        <stop offset="100%" stopColor="#ede5d5" />
      </linearGradient>
    </defs>

    {/* Soft background ambient glow */}
    <ellipse cx="66" cy="62" rx="52" ry="44" fill="url(#books-ambient-glow)" />

    {/* Ground contact shadow */}
    <ellipse cx="58" cy="106" rx="42" ry="9" fill="#17140f" fillOpacity="0.07" />

    {/* ═══════════ BOOK 1 (BOTTOM BOOK) ═══════════ */}
    <g id="book-bottom">
      {/* Bottom Cover Rim */}
      <polygon points="19,84 49,100 93,76 93,78.5 49,102.5 19,86.5" fill="#845a1c" />

      {/* White Pages Block */}
      <polygon points="49,89 91,65 91,76 49,100" fill="url(#book-pages-grad)" />
      {/* Delicate horizontal page texture lines */}
      <line x1="51" y1="92" x2="89" y2="68" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="51" y1="94.5" x2="89" y2="70.5" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="51" y1="97" x2="89" y2="73" stroke="#d5cbbb" strokeWidth="0.75" />

      {/* Top Cover Overhang Rim */}
      <polygon points="49,86.5 93,62.5 93,65 49,89" fill="#b98a3f" />

      {/* Curved Spine on Left */}
      <path
        d="M 19 68 C 14 70, 14 82, 19 84 L 49 100 L 49 84 Z"
        fill="url(#book-spine-1)"
      />
      {/* Spine decorative embossed gold line */}
      <path d="M 18 73 C 15 74.5, 15 77.5, 18 79" stroke="#fef3c7" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />
    </g>

    {/* Shadow between Book 1 and Book 2 */}
    <polygon points="21,68 49,83 91,59 85,55 49,70 21,57" fill="url(#book-shadow)" />

    {/* ═══════════ BOOK 2 (MIDDLE BOOK) ═══════════ */}
    <g id="book-middle">
      {/* Bottom Cover Rim */}
      <polygon points="22,66 52,82 96,58 96,60.5 52,84.5 22,68.5" fill="#845a1c" />

      {/* White Pages Block */}
      <polygon points="52,71 94,47 94,58 52,82" fill="url(#book-pages-grad)" />
      {/* Delicate horizontal page texture lines */}
      <line x1="54" y1="74" x2="92" y2="50" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="54" y1="76.5" x2="92" y2="52.5" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="54" y1="79" x2="92" y2="55" stroke="#d5cbbb" strokeWidth="0.75" />

      {/* Top Cover Overhang Rim */}
      <polygon points="52,68.5 96,44.5 96,47 52,71" fill="#c99b4d" />

      {/* Curved Spine on Left */}
      <path
        d="M 22 50 C 17 52, 17 64, 22 66 L 52 82 L 52 66 Z"
        fill="url(#book-spine-1)"
      />
      {/* Spine decorative embossed gold line */}
      <path d="M 21 55 C 18 56.5, 18 59.5, 21 61" stroke="#fef3c7" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />
    </g>

    {/* Shadow between Book 2 and Book 3 */}
    <polygon points="24,50 52,65 94,41 88,37 52,52 24,39" fill="url(#book-shadow)" />

    {/* ═══════════ BOOK 3 (TOP BOOK - FULL DETAILS) ═══════════ */}
    <g id="book-top">
      {/* Bottom Cover Rim */}
      <polygon points="25,48 55,64 99,40 99,42.5 55,66.5 25,50.5" fill="#845a1c" />

      {/* White Pages Block (Right Face) */}
      <polygon points="55,53 97,29 97,40 55,64" fill="url(#book-pages-grad)" />
      {/* Delicate horizontal page texture lines */}
      <line x1="57" y1="56" x2="95" y2="32" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="57" y1="58.5" x2="95" y2="34.5" stroke="#d5cbbb" strokeWidth="0.75" />
      <line x1="57" y1="61" x2="95" y2="37" stroke="#d5cbbb" strokeWidth="0.75" />

      {/* Top Cover Overhang Rim (Front & Right) */}
      <polygon points="55,50.5 99,26.5 99,29 55,53" fill="#be8f45" />

      {/* Curved Spine on Left */}
      <path
        d="M 25 32 C 20 34, 20 46, 25 48 L 55 64 L 55 48 Z"
        fill="url(#book-spine-1)"
      />
      {/* Spine decorative embossed gold line */}
      <path d="M 24 37 C 21 38.5, 21 41.5, 24 43" stroke="#fef3c7" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />

      {/* Top Cover Face (The big flat hardcover surface!) */}
      <polygon points="25,32 55,48 99,24 69,8" fill="url(#book-top-cover)" />

      {/* Hardcover book hinge crease line parallel to spine */}
      <line x1="29" y1="31" x2="59" y2="47" stroke="#9a6e27" strokeWidth="1" strokeOpacity="0.4" />
      {/* Subtle cover highlight line */}
      <line x1="30" y1="30" x2="60" y2="46" stroke="#fef9ee" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Subtle embossed decorative corner ornament on book cover */}
      <path d="M 66 17 L 70 15 L 74 17" stroke="#9a6e27" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
      <circle cx="70" cy="19" r="1.5" fill="#9a6e27" fillOpacity="0.3" />
    </g>
  </svg>
);

const EnrolledStudentsGraphic = () => (
  <svg className="w-36 h-32 sm:w-40 sm:h-36" viewBox="0 0 140 120" fill="none">
    <defs>
      <radialGradient id="pink-glow-staff" cx="80%" cy="85%" r="70%">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
        <stop offset="50%" stopColor="#fb7185" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="student-fill-staff" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb7185" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="student-side-fill-staff" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#f87171" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <path d="M25 120 C 45 68, 85 46, 140 50 L 140 120 Z" fill="url(#pink-glow-staff)" />
    <g transform="translate(42, 50)">
      <circle cx="12" cy="10" r="7" fill="url(#student-side-fill-staff)" />
      <path d="M0 45 C 0 28, 6 22, 12 22 C 18 22, 24 28, 24 45 Z" fill="url(#student-side-fill-staff)" />
    </g>
    <g transform="translate(94, 50)">
      <circle cx="12" cy="10" r="7" fill="url(#student-side-fill-staff)" />
      <path d="M0 45 C 0 28, 6 22, 12 22 C 18 22, 24 28, 24 45 Z" fill="url(#student-side-fill-staff)" />
    </g>
    <g transform="translate(64, 34)">
      <circle cx="16" cy="12" r="9.5" fill="url(#student-fill-staff)" />
      <path d="M0 60 C 0 36, 8 28, 16 28 C 24 28, 32 36, 32 60 Z" fill="url(#student-fill-staff)" />
    </g>
  </svg>
);

const AssignmentsGraphic = () => (
  <svg className="w-36 h-32 sm:w-40 sm:h-36" viewBox="0 0 140 120" fill="none">
    <defs>
      <radialGradient id="blue-glow-staff" cx="80%" cy="85%" r="70%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="doc-gradient-staff" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    <path d="M15 120 C 40 70, 80 46, 140 52 L 140 120 Z" fill="url(#blue-glow-staff)" />
    <g transform="translate(64, 28)">
      <rect x="0" y="0" width="46" height="58" rx="8" fill="#38bdf8" fillOpacity="0.08" transform="translate(2, 3)" />
      <rect x="0" y="0" width="46" height="58" rx="8" fill="url(#doc-gradient-staff)" stroke="#bae6fd" strokeWidth="1.2" />
      <rect x="9" y="14" width="28" height="3" rx="1.5" fill="#38bdf8" fillOpacity="0.6" />
      <rect x="9" y="22" width="22" height="3" rx="1.5" fill="#38bdf8" fillOpacity="0.35" />
      <rect x="9" y="30" width="16" height="3" rx="1.5" fill="#38bdf8" fillOpacity="0.35" />
      <g transform="translate(26, 36)">
        <circle cx="13" cy="13" r="13" fill="#60a5fa" fillOpacity="0.85" />
        <circle cx="13" cy="13" r="13" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M8.5 13.5 L 11.5 16.5 L 17.5 9.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

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
  dashboardAnnouncements = [],
  announcementsLoading = false,
  onRefreshAnnouncements,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
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
      {/* ── 1. Welcome Header Banner with Staff Name (Warm Light Theme) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3DDD0] shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Soft warm background gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#FAF8F4] via-[#F1EDE4]/50 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight">
              Welcome back, {staffName}! 👋
            </h1>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-[#5B5346] font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{branchName ? `Faculty at ${branchName}` : 'Manage your courses, enrolled students, and classroom assignments.'}</span>
            {branchLocation && <span>• {branchLocation}</span>}
          </p>
        </div>

        {/* 3D-styled Staff / Faculty Animated Emblem (Matching Student Portal Style) */}
        <div className="hidden sm:flex items-center justify-center shrink-0 pr-2 sm:pr-4 relative z-10">
          <div className="relative flex items-center justify-center group cursor-default">
            {/* Floating decorative elements in warm amber & gold theme */}
            <div className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-gradient-to-tr from-[#9C6B2E] to-[#F4B942] shadow-md shadow-[#9C6B2E]/40 animate-bounce flex items-center justify-center text-white">
              <Award className="h-3.5 w-3.5 text-white stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#F4B942] shadow-md shadow-[#F4B942]/30 animate-pulse" />
            <div className="absolute top-1/2 -right-4 h-5 w-5 rounded-full bg-[#9C6B2E] shadow-md shadow-[#9C6B2E]/30 flex items-center justify-center text-[10px] font-black text-white">
              ★
            </div>

            {/* Center Floating Faculty Emblem */}
            <div className="flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FAF8F4] via-[#F1EDE4] to-[#FAF8F4] backdrop-blur-md border border-[#E3DDD0] shadow-lg shadow-[#9C6B2E]/10 transform hover:rotate-3 hover:scale-105 transition-all duration-300">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-[#9C6B2E] drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcement Ticker (Course & Institutional Notices) ── */}
      <StaffAnnouncementTicker
        announcements={dashboardAnnouncements}
        loading={announcementsLoading}
        onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)}
        onViewAll={() => setActiveTab('announcements')}
      />

      {/* ── 2. Quick Access ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F] tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Quick Access
            </h2>
            <p className="text-xs text-[#8A8175] mt-0.5">
              Here's a quick overview of your current activities.
            </p>
          </div>
          {(branchName || branchLocation) && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#825A25] bg-[#F8F5EE] border border-[#E3DDD0] px-3.5 py-1.5 rounded-full shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>{branchName}</span>
              {branchLocation && <span>• {branchLocation}</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Assigned Courses */}
          <div
            onClick={() => setActiveTab('courses')}
            className="relative flex flex-col justify-between rounded-3xl p-6 bg-white border border-[#E5DFD3] shadow-xs hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group min-h-[220px]"
          >
            {/* Top: Icon & Badge */}
            <div className="flex items-start justify-between z-10">
              <div className="h-12 w-12 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]/60 text-[#B45309] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <Folder className="h-6 w-6 stroke-[1.8] fill-[#B45309]/15" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#059669] border border-[#A7F3D0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Active
              </span>
            </div>

            {/* Middle: Number, Title & Subtitle */}
            <div className="mt-4 z-10">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#17140F] tracking-tight leading-none mb-1.5">
                {totalCourses}
              </p>
              <p className="text-base font-bold text-[#17140F] tracking-tight leading-tight">
                Assigned Courses
              </p>
              <p className="text-xs text-[#2563EB] font-medium mt-1">
                {totalCourses} course{totalCourses !== 1 ? 's' : ''} in curriculum
              </p>
            </div>

            {/* Bottom Action Link */}
            <div className="mt-5 pt-1 z-10 flex items-center gap-1.5 text-xs font-semibold text-[#8A8175] group-hover:text-[#9C6B2E] transition-colors">
              <span>View Courses</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>

            {/* Watermark Illustration */}
            <div className="absolute -bottom-2 -right-2 pointer-events-none select-none">
              <StackedBooksGraphic />
            </div>
          </div>

          {/* Card 2: Enrolled Students */}
          <div
            onClick={() => setActiveTab('courses')}
            className="relative flex flex-col justify-between rounded-3xl p-6 bg-white border border-[#E5DFD3] shadow-xs hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group min-h-[220px]"
          >
            {/* Top: Icon & Badge */}
            <div className="flex items-start justify-between z-10">
              <div className="h-12 w-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3]/60 text-[#E11D48] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <Users className="h-6 w-6 stroke-[1.8]" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#059669] border border-[#A7F3D0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Active
              </span>
            </div>

            {/* Middle: Number, Title & Subtitle */}
            <div className="mt-4 z-10">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#17140F] tracking-tight leading-none mb-1.5">
                {totalStudents}
              </p>
              <p className="text-base font-bold text-[#17140F] tracking-tight leading-tight">
                Enrolled Students
              </p>
              <p className="text-xs text-[#2563EB] font-medium mt-1">
                {totalStudents} active student{totalStudents !== 1 ? 's' : ''} enrolled
              </p>
            </div>

            {/* Bottom Action Link */}
            <div className="mt-5 pt-1 z-10 flex items-center gap-1.5 text-xs font-semibold text-[#8A8175] group-hover:text-[#9C6B2E] transition-colors">
              <span>View Students</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>

            {/* Watermark Illustration */}
            <div className="absolute bottom-0 right-0 pointer-events-none select-none">
              <EnrolledStudentsGraphic />
            </div>
          </div>

          {/* Card 3: Course Assignments */}
          <div
            onClick={() => setActiveTab('assignments')}
            className="relative flex flex-col justify-between rounded-3xl p-6 bg-white border border-[#E5DFD3] shadow-xs hover:shadow-md hover:border-[#D6CCBA] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group min-h-[220px] sm:col-span-2 lg:col-span-1"
          >
            {/* Top: Icon & Badge */}
            <div className="flex items-start justify-between z-10">
              <div className="h-12 w-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]/60 text-[#2563EB] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-6 w-6 stroke-[1.8]" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-semibold text-[#D97706] border border-[#FDE68A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                Active Tasks
              </span>
            </div>

            {/* Middle: Number, Title & Subtitle */}
            <div className="mt-4 z-10">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#17140F] tracking-tight leading-none mb-1.5">
                {totalAssignments}
              </p>
              <p className="text-base font-bold text-[#17140F] tracking-tight leading-tight">
                Course Assignments
              </p>
              <p className="text-xs text-[#2563EB] font-medium mt-1">
                {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''} posted
              </p>
            </div>

            {/* Bottom Action Link */}
            <div className="mt-5 pt-1 z-10 flex items-center gap-1.5 text-xs font-semibold text-[#8A8175] group-hover:text-[#9C6B2E] transition-colors">
              <span>View Assignments</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>

            {/* Watermark Illustration */}
            <div className="absolute bottom-0 right-0 pointer-events-none select-none">
              <AssignmentsGraphic />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Announcements (Course & Institutional Combined) ── */}
      <StaffRecentAnnouncements
        announcements={dashboardAnnouncements}
        loading={announcementsLoading}
        onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)}
        onNavigateToTab={setActiveTab}
      />

      {/* ── 3. My Courses ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#17140F] tracking-tight">
              My Courses
            </h2>
            <span className="text-[11px] font-bold text-[#9C6B2E] bg-[#F1EDE4] px-2.5 py-0.5 rounded-full border border-[#E3DDD0]">
              {assignedCourses.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] flex items-center gap-1 group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E3DDD0] text-center text-slate-400">
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
                      ? 'bg-[#F1EDE4] border-[#9C6B2E] shadow-md shadow-[#9C6B2E]/10'
                      : 'bg-white border-[#E3DDD0] hover:border-[#9C6B2E]/50 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#9C6B2E] text-white'
                          : 'bg-[#F1EDE4] text-[#9C6B2E]'
                      }`}
                    >
                      <Folder className="h-5 w-5 fill-current" />
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#9C6B2E] text-white'
                          : 'bg-[#FAF8F4] text-[#5B5346] border border-[#E3DDD0]'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Pick'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#17140F] truncate" title={c.title}>
                    {c.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="truncate max-w-[100px]">
                      {c.category || c.level || 'Course'}
                    </span>
                    <span className="font-semibold text-[#5B5346]">
                      {c.duration || `${courseStudents.length} students`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Recent Students ── */}
      <div className="bg-white rounded-3xl p-6 border border-[#E3DDD0] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#17140F] tracking-tight">
              Recent Students
            </h2>
            <span className="text-[11px] font-bold text-[#9C6B2E] bg-[#F1EDE4] px-2.5 py-0.5 rounded-full border border-[#E3DDD0]">
              {courseStudents.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] flex items-center gap-1 group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {studentsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#9C6B2E] mb-2" />
            <p className="text-xs font-medium">Loading enrolled students...</p>
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No students enrolled in this course yet.
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="space-y-3 sm:hidden">
              {recentStudents.map((s, idx) => (
                <div
                  key={s.id || s.enrollment_id || idx}
                  onClick={() => onSelectStudent && onSelectStudent(s)}
                  className="p-3.5 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] hover:bg-[#F1EDE4] transition-all cursor-pointer flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-[#E3DDD0]">
                        {(s.name || s.student_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#17140F] truncate">
                          {s.name || s.student_name || 'Student'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {activeCourseObj?.title || 'Enrolled Course'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-[#9C6B2E] border border-[#E3DDD0] shrink-0"
                    >
                      View
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E3DDD0] text-slate-500">
                    <span className="truncate max-w-[170px] text-[10px] text-[#5B5346]">
                      {s.email || s.phone || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-[#9C6B2E] bg-[#F1EDE4] px-2 py-0.5 rounded-md border border-[#E3DDD0]">
                      {getStudentEnrolledDate(s)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-[#E3DDD0]">
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Enrolled Date</th>
                    <th className="pb-3 font-semibold">Contact / Email</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DDD0]/50">
                  {recentStudents.map((s, idx) => (
                    <tr
                      key={s.id || s.enrollment_id || idx}
                      onClick={() => onSelectStudent && onSelectStudent(s)}
                      className="hover:bg-[#FAF8F4] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-[#E3DDD0]">
                            {(s.name || s.student_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#17140F] group-hover:text-[#9C6B2E] transition-colors truncate">
                              {s.name || s.student_name || 'Student'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {activeCourseObj?.title || 'Enrolled Course'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-[#5B5346] font-medium">
                        {getStudentEnrolledDate(s)}
                      </td>
                      <td className="py-3 text-[#5B5346] font-medium">
                        {s.email || s.phone || '—'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FAF8F4] hover:bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0] transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Full Announcement Details Modal */}
      <StaffAnnouncementDetailModal
        announcement={selectedAnnouncement}
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        onNavigateToTab={setActiveTab}
      />
    </div>
  );
};

export default StaffOverviewTab;
