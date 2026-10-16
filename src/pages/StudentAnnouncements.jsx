import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  User,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  CalendarCheck,
  AlertCircle,
  X,
  Loader2,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentAnnouncementsApi,
  getStudentCourseAnnouncementsApi,
} from '../services/userannouncements';
import { getMyEnrollmentsApi } from '../services/enrollments';

const useAnnouncementFonts = () => {
  useEffect(() => {
    const id = 'student-announcements-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const formatDate = (date) => {
  if (!date) return 'Recently posted';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const dayDate = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dayDate} • ${time}`;
  } catch {
    return String(date);
  }
};

const formatEventTime = (timeStr) => {
  if (!timeStr) return null;
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return String(timeStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(timeStr);
  }
};

const StudentAnnouncements = () => {
  useAnnouncementFonts();
  const { token } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch Student Approved Enrolled Courses for filter dropdown
  useEffect(() => {
    if (!token) return;
    getMyEnrollmentsApi(token)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.enrollments)
          ? data.enrollments
          : [];
        // Map unique courses using course_id (item.id is enrollment_id, not course_id)
        const coursesMap = new Map();
        list.forEach((item) => {
          const cId = item.course_id ?? item.course?.id ?? item.course?.course_id;
          const cTitle =
            item.course_title ??
            item.course?.title ??
            item.course_name ??
            item.course?.name ??
            `Course #${cId}`;

          if (cId && !coursesMap.has(String(cId))) {
            coursesMap.set(String(cId), { id: cId, title: cTitle });
          }
        });
        setEnrolledCourses(Array.from(coursesMap.values()));
      })
      .catch((err) => {
        console.warn('Could not load student enrollments for courses filter:', err);
      });
  }, [token]);

  // 2. Fetch Announcements: GET /student/announcements or GET /student/courses/{course_id}/announcements
  const fetchAnnouncements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');

      let data;
      if (selectedCourseId === 'ALL') {
        data = await getStudentAnnouncementsApi(token);
      } else {
        try {
          data = await getStudentCourseAnnouncementsApi(selectedCourseId, token);
        } catch (courseErr) {
          console.warn(
            `Direct fetch for course ${selectedCourseId} failed, falling back to all announcements:`,
            courseErr
          );
          // Fallback: fetch all student announcements and filter by course_id client-side
          const allData = await getStudentAnnouncementsApi(token);
          const allList = Array.isArray(allData)
            ? allData
            : Array.isArray(allData?.announcements)
            ? allData.announcements
            : [];
          data = allList.filter((a) => {
            const aCourseId = a.course_id ?? a.course?.id ?? a.course?.course_id;
            return String(aCourseId) === String(selectedCourseId);
          });
        }
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.announcements)
        ? data.announcements
        : [];

      // Sort newest first
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setAnnouncements(sorted);
    } catch (err) {
      setError(err?.message || 'Failed to load course announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token, selectedCourseId]);

  // 3. Filter announcements by search query
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const msgMatch = item.message?.toLowerCase().includes(q);
      const staffMatch = (item.staff_name || item.staff || item.instructor_name)?.toLowerCase().includes(q);
      const courseMatch = (item.course_title || item.course?.title || item.course_name)?.toLowerCase().includes(q);
      return titleMatch || msgMatch || staffMatch || courseMatch;
    });
  }, [announcements, searchQuery]);

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

      <div className="w-full space-y-6">
        {/* Header Banner */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#8651E8] via-[#7B3FE4] to-[#9962F7] p-6 sm:p-8 text-white shadow-lg shadow-purple-500/15">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/25">
                <Megaphone className="h-3 w-3 text-purple-200" />
                <span>Course & Academic Bulletins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Course Announcements
              </h1>
              <p className="text-xs sm:text-sm text-purple-100/90 font-normal">
                Stay informed with the latest course notices, schedule changes, exam times, and learning updates from your instructors.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 self-start md:self-auto">
              <div className="flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 px-5 py-3 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white leading-none">
                    {announcements.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-purple-200">
                    Updates
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchAnnouncements}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/30 shadow-sm transition hover:bg-white/30 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.03)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Course Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Course:
              </span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="rounded-xl border border-purple-100 bg-[#F5F2FC] py-2 px-3 text-xs font-semibold text-slate-800 focus:border-purple-300 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="ALL">All Approved Courses</option>
                {enrolledCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Search notices, exams, instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-purple-100 bg-[#F5F2FC] py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-purple-300 focus:border-purple-300 focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Announcements Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-100 bg-purple-50/30 py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
            <p className="mt-3 text-xs font-bold text-slate-600">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
            <p className="mt-2 text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchAnnouncements}
              className="mt-4 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-rose-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-[#FAF8FE] px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Bell className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-base font-extrabold text-slate-800">
              {announcements.length === 0
                ? 'No announcements yet'
                : 'No matching announcements found'}
            </h2>
            <p className="mt-1.5 max-w-md mx-auto text-xs leading-relaxed text-slate-500">
              {announcements.length === 0
                ? 'Your instructors have not posted any announcements for this course yet. Check back soon for updates and exam schedules.'
                : 'Try adjusting your search query or switching to All Approved Courses.'}
            </p>
            {announcements.length > 0 && searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6D28D9] transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((announcement) => {
              const aId = announcement.id || announcement.announcement_id;
              const courseTitle =
                announcement.course_title ||
                announcement.course?.title ||
                announcement.course?.course_title ||
                announcement.course_name ||
                'Course Notice';
              const staffName =
                announcement.staff_name ||
                announcement.staff?.name ||
                announcement.instructor_name ||
                announcement.created_by_name ||
                null;
              const eventTime =
                announcement.scheduled_event_time ||
                announcement.event_time ||
                announcement.scheduled_time ||
                announcement.exam_time ||
                null;

              return (
                <article
                  key={aId || Math.random()}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-100/80 bg-white p-5 sm:p-6 shadow-[0_8px_25px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-purple-300 hover:shadow-md"
                >
                  <div>
                    {/* Top Row: Course Badge & Date */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/70 bg-[#F5F2FC] px-3 py-1 text-[11px] font-bold text-purple-700">
                        <BookOpen className="h-3 w-3 text-purple-600" />
                        <span className="max-w-[150px] truncate">{courseTitle}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5 text-purple-600" />
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#7C3AED] transition">
                      {announcement.title}
                    </h2>

                    {/* Scheduled Event / Exam Time Badge */}
                    {eventTime && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-900">
                        <Clock className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>Exam / Event Time: {formatEventTime(eventTime)}</span>
                      </div>
                    )}

                    {/* Message Preview */}
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500 whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </div>

                  {/* Footer: Instructor & Read Modal Button */}
                  <div className="mt-5 pt-4 border-t border-purple-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-[10px] text-[#7C3AED]">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">
                        {staffName ? `By ${staffName}` : 'Instructor'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition cursor-pointer"
                    >
                      <span>Read Notice</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* Full Notice Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-[modalPop_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-purple-200 bg-white shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute right-4 top-4 z-10 rounded-xl bg-slate-50 p-2 text-slate-400 border border-slate-200 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Close announcement"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-purple-800">
                <Bell className="h-3.5 w-3.5 text-purple-700" /> Course Notice
              </span>
              <span className="text-xs text-slate-400">
                • {formatDate(selectedAnnouncement.created_at)}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-slate-900 leading-snug">
              {selectedAnnouncement.title}
            </h2>

            {/* Course & Instructor details */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-purple-700" />
                <span>
                  Course:{' '}
                  <strong>
                    {selectedAnnouncement.course_title ||
                      selectedAnnouncement.course?.title ||
                      selectedAnnouncement.course_name ||
                      'Enrolled Course'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-blue-700" />
                <span>
                  Staff:{' '}
                  <strong>
                    {selectedAnnouncement.staff_name ||
                      selectedAnnouncement.staff?.name ||
                      selectedAnnouncement.instructor_name ||
                      'Course Instructor'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Scheduled Event / Exam Time Highlight */}
            {(selectedAnnouncement.scheduled_event_time ||
              selectedAnnouncement.event_time ||
              selectedAnnouncement.scheduled_time ||
              selectedAnnouncement.exam_time) && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 font-bold">
                <CalendarCheck className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-rose-700">
                    Scheduled Event / Exam Time
                  </span>
                  <span>
                    {formatEventTime(
                      selectedAnnouncement.scheduled_event_time ||
                        selectedAnnouncement.event_time ||
                        selectedAnnouncement.scheduled_time ||
                        selectedAnnouncement.exam_time
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Message Body */}
            <div className="mt-5 border-t border-purple-100 pt-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {selectedAnnouncement.message}
              </p>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-xl bg-[#7C3AED] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6D28D9]"
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

export default StudentAnnouncements;