import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  Megaphone,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStudentInstitutionAnnouncementsApi } from '../services/userannouncements';
import { getCourseImageUrl } from '../services/courses';
import { useStudentModalBlur } from '../utils/useStudentModalBlur';

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

const StudentInstitutionAnnouncements = () => {
  useAnnouncementFonts();
  const { token } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useStudentModalBlur(Boolean(selectedAnnouncement || viewingImage));

  const fetchAnnouncements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await getStudentInstitutionAnnouncementsApi(token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.announcements)
        ? data.announcements
        : [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setAnnouncements(sorted);
    } catch (err) {
      setError(err?.message || 'Failed to load institution announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const msgMatch = (item.message || item.content)?.toLowerCase().includes(q);
      const branchMatch = item.branch_name?.toLowerCase().includes(q);
      const audienceMatch = item.audience?.toLowerCase().includes(q);
      return titleMatch || msgMatch || branchMatch || audienceMatch;
    });
  }, [announcements, searchQuery]);

  return (
    <div className="w-full pb-8 font-['Plus_Jakarta_Sans',sans-serif] opacity-0 animate-[pageFadeIn_0.4s_ease-out_forwards]">
      <style>{`
        @keyframes pageFadeIn {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full space-y-6">
        {/* Header Banner */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] border border-[#E3DDD0] p-6 sm:p-8 text-[#17140F] shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#9C6B2E]/5 blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#17140F] border border-[#E3DDD0]">
                <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Campus & Branch Bulletins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17140F] leading-tight">
                Institution Announcements
              </h1>
              <p className="text-xs sm:text-sm text-[#5B5346] font-normal">
                Official notices, circulars, and administrative updates issued by branch leadership and central administration.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 self-start md:self-auto">
              <div className="flex items-center justify-center rounded-2xl bg-white border border-[#E3DDD0] px-5 py-3 text-center shadow-2xs">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#17140F] leading-none">
                    {announcements.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                    Notices
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchAnnouncements}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] border border-[#E3DDD0] shadow-2xs transition hover:bg-[#F1EDE4] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="rounded-2xl border border-[#E3DDD0] bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.03)] sm:p-5">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C6B2E]" />
            <input
              type="text"
              placeholder="Search institution notices, branch circulars, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] py-2.5 pl-10 pr-9 text-xs text-slate-800 placeholder:text-[#8A8175] focus:border-[#9C6B2E] focus:bg-white focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
            <p className="mt-3 text-xs font-bold text-slate-600">Loading institution announcements...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
            <p className="mt-2 text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchAnnouncements}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E3DDD0] bg-white p-12 text-center text-slate-600">
            <Building2 className="mx-auto h-12 w-12 text-[#9C6B2E]/60 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No institution announcements</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery
                ? 'No announcements match your search query.'
                : 'There are currently no active institution or branch notices.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#855923] transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((announcement) => {
              const aId = announcement.id ?? announcement.announcement_id;
              const branchLabel = announcement.branch_name
                ? `Branch: ${announcement.branch_name}`
                : 'Institutional Notice';
              const targetAudience = announcement.audience || 'both';

              return (
                <article
                  key={aId || Math.random()}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E3DDD0] bg-white p-5 sm:p-6 shadow-[0_8px_25px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-[#9C6B2E] hover:shadow-md"
                >
                  <div>
                    {/* Announcement Image Thumbnail */}
                    {announcement.image && (
                      <div
                        className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 h-48 overflow-hidden bg-[#FAF8F4] border-b border-[#E3DDD0] flex items-center justify-center cursor-pointer relative group/img"
                        onClick={() => setSelectedAnnouncement(announcement)}
                      >
                        <img
                          src={getCourseImageUrl(announcement.image)}
                          alt={announcement.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Top Row: Scope & Date */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E3DDD0] bg-[#FAF8F4] px-3 py-1 text-[11px] font-bold text-[#9C6B2E]">
                          <Building2 className="h-3 w-3 text-[#9C6B2E]" />
                          <span className="max-w-[150px] truncate">{branchLabel}</span>
                        </span>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                          Target: {targetAudience === 'both' ? 'Students & Staff' : targetAudience === 'all' ? 'Everyone' : targetAudience}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0">
                        <CalendarDays className="h-3.5 w-3.5 text-[#9C6B2E]" />
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#9C6B2E] transition">
                      {announcement.title}
                    </h2>

                    {/* Message Preview */}
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500 whitespace-pre-wrap">
                      {announcement.message || announcement.content}
                    </p>
                  </div>

                  {/* Footer: Read Modal Button */}
                  <div className="mt-5 pt-4 border-t border-[#E3DDD0] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#9C6B2E] hover:text-[#855923] transition cursor-pointer"
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
      {selectedAnnouncement &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sa-fade"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedAnnouncement(null)}
            />
            <div
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl p-6 sm:p-8 sa-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute right-4 top-4 z-10 rounded-xl bg-slate-50 p-2 text-slate-400 border border-slate-200 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close announcement"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EDE4] px-3 py-1 text-[11px] font-bold text-[#9C6B2E] border border-[#E3DDD0]">
                  <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  {selectedAnnouncement.branch_name || 'Institutional Notice'}
                </span>
                <span className="text-xs text-slate-400">
                  • {formatDate(selectedAnnouncement.created_at)}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              {/* Modal Image (if present) */}
              {selectedAnnouncement.image && (
                <div className="mt-4 relative group overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 flex items-center justify-center">
                  <img
                    src={getCourseImageUrl(selectedAnnouncement.image)}
                    alt={selectedAnnouncement.title}
                    className="max-h-80 w-auto max-w-full rounded-xl object-contain shadow-xs cursor-pointer transition hover:scale-[1.01]"
                    onClick={() =>
                      setViewingImage({
                        url: getCourseImageUrl(selectedAnnouncement.image),
                        title: selectedAnnouncement.title,
                      })
                    }
                  />
                </div>
              )}

              {/* Notice details */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  <span>
                    Branch:{' '}
                    <strong>{selectedAnnouncement.branch_name || 'All Branches'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  <span>
                    Target:{' '}
                    <strong>{selectedAnnouncement.audience || 'Students & Staff'}</strong>
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="mt-5 border-t border-[#E3DDD0] pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selectedAnnouncement.message || selectedAnnouncement.content}
                </p>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-xl bg-[#9C6B2E] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Lightbox Modal for full image */}
      {viewingImage &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 sa-fade">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setViewingImage(null)}
            />
            <div
              className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col border border-[#E3DDD0] sa-rise"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-5 py-3 bg-[#faf8f4]">
                <h3 className="text-sm font-bold text-slate-800 truncate pr-4">
                  {viewingImage.title || 'Announcement Image'}
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingImage(null)}
                  className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 bg-[#f1ede4] flex items-center justify-center overflow-auto max-h-[calc(92vh-60px)]">
                <img
                  src={viewingImage.url}
                  alt={viewingImage.title || 'Full announcement image'}
                  className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default StudentInstitutionAnnouncements;
