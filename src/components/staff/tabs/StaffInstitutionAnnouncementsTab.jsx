import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Calendar,
  Clock,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  User,
  X,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { getStaffAnnouncementsApi } from '../../../services/staff';
import { getCourseImageUrl } from '../../../services/courses';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

export const formatPostedDateTime = (dateStr) => {
  if (!dateStr) return 'Recently posted';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return String(dateStr);
  }
};

const StaffInstitutionAnnouncementsTab = ({ token, user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  useStaffModalBlur(Boolean(selectedAnnouncement || viewingImage));

  const loadAnnouncements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await getStaffAnnouncementsApi(token);
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
      console.warn('Failed to load institution announcements for staff:', err);
      setError(err?.message || 'Failed to load institution announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [token]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase().trim();
    return announcements.filter((a) => {
      const title = String(a.title || '').toLowerCase();
      const message = String(a.message || a.content || '').toLowerCase();
      const branch = String(a.branch_name || '').toLowerCase();
      const audience = String(a.audience || '').toLowerCase();
      return title.includes(q) || message.includes(q) || branch.includes(q) || audience.includes(q);
    });
  }, [announcements, searchQuery]);

  return (
    <div className="space-y-6 sa-fade font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] border border-[#E3DDD0] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#17140F] border border-[#E3DDD0] mb-2">
              <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Campus & Administration Notices</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17140F] leading-tight">
              Institution Announcements
            </h1>
            <p className="mt-1 text-xs text-[#5B5346]">
              Official circulars and notices targeted to faculty & staff from branch administration and central headquarters.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center rounded-2xl bg-white border border-[#E3DDD0] px-4 py-2.5 text-center shadow-2xs">
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#17140F] leading-none">
                  {announcements.length}
                </div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Updates
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold bg-[#9C6B2E] text-white shadow-sm hover:bg-[#855923] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search Input Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E3DDD0] shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C6B2E]" />
          <input
            type="text"
            placeholder="Search circulars, branch announcements, target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] py-2.5 pl-10 pr-9 text-xs text-slate-800 placeholder:text-[#8A8175] focus:border-[#9C6B2E] focus:bg-white focus:outline-none transition"
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
      </div>

      {/* List Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#E3DDD0] p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
          <p className="mt-3 text-xs font-bold text-slate-600">Loading institution announcements...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-2 text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={loadAnnouncements}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#E3DDD0] p-12 text-center text-slate-600">
          <Building2 className="mx-auto h-12 w-12 text-[#9C6B2E]/60 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No institution announcements found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? 'No announcements match your search criteria.'
              : 'There are currently no active administrative notices for your branch.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#855923] transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement, idx) => {
            const aId = announcement.id ?? idx;
            const branchLabel =
              announcement.branch_name && !String(announcement.branch_name).toLowerCase().startsWith('branch #')
                ? announcement.branch_name
                : 'Institutional Notice';

            return (
              <article
                key={aId}
                className="bg-white rounded-3xl border border-[#E3DDD0] p-6 transition-all hover:shadow-md hover:border-[#9C6B2E]/50 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E] bg-[#F1EDE4] border border-[#E3DDD0]">
                        <Building2 className="h-3 w-3 text-[#9C6B2E]" />
                        {branchLabel}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Posted on: {formatPostedDateTime(announcement.created_at)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#17140F] leading-snug">
                      {announcement.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[#5B5346] leading-relaxed whitespace-pre-line mb-4">
                  {announcement.message || announcement.content}
                </p>

                {/* Announcement Image Display */}
                {announcement.image && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 flex items-center justify-center max-h-72">
                    <img
                      src={getCourseImageUrl(announcement.image)}
                      alt={announcement.title}
                      className="max-h-64 w-auto max-w-full rounded-xl object-contain shadow-xs cursor-pointer transition hover:scale-[1.01]"
                      onClick={() =>
                        setViewingImage({
                          url: getCourseImageUrl(announcement.image),
                          title: announcement.title,
                        })
                      }
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-[#E3DDD0] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#9C6B2E] bg-[#FAF8F4] hover:bg-[#F1EDE4] border border-[#E3DDD0] transition cursor-pointer"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>View Notice</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedAnnouncement &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm sa-fade"
            role="dialog"
            aria-modal="true"
          >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute right-4 top-4 z-10 rounded-xl bg-slate-50 p-2 text-slate-400 border border-slate-200 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EDE4] px-3 py-1 text-[11px] font-bold text-[#9C6B2E] border border-[#E3DDD0]">
                <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                {selectedAnnouncement.branch_name && !String(selectedAnnouncement.branch_name).toLowerCase().startsWith('branch #')
                  ? selectedAnnouncement.branch_name
                  : 'Institution Notice'}
              </span>
              <span className="text-xs text-slate-400">
                • {formatPostedDateTime(selectedAnnouncement.created_at)}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-slate-900 leading-snug">
              {selectedAnnouncement.title}
            </h2>

            {/* Modal Image */}
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

      {/* Lightbox Modal for full-size image */}
      {viewingImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm sa-fade"
            onClick={() => setViewingImage(null)}
          >
            <div
              className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col sa-rise"
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

export default StaffInstitutionAnnouncementsTab;
