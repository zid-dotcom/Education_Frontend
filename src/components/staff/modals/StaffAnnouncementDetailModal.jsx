import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  User,
  X,
  ExternalLink,
  Maximize2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatAnnouncementDateTime, isNewOrRecent } from '../../../utils/announcements';
import { getCourseImageUrl } from '../../../services/courses';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const StaffAnnouncementDetailModal = ({
  announcement,
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [viewingImage, setViewingImage] = useState(null);
  useStaffModalBlur(Boolean(isOpen || viewingImage));

  useEffect(() => {
    if (!isOpen) {
      setViewingImage(null);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingImage) {
          setViewingImage(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewingImage, onClose]);

  if (!isOpen || !announcement) return null;

  const isCourse = announcement.type === 'course';
  const isRecent = isNewOrRecent(announcement);

  const rawEventTime =
    announcement.scheduled_event_time ||
    announcement.event_time ||
    announcement.exam_time ||
    announcement.scheduled_time;

  let formattedEventTime = null;
  if (rawEventTime) {
    try {
      const d = new Date(rawEventTime);
      if (!isNaN(d.getTime())) {
        formattedEventTime = d.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      } else {
        formattedEventTime = String(rawEventTime);
      }
    } catch {
      formattedEventTime = String(rawEventTime);
    }
  }

  const handleOpenPage = () => {
    onClose();
    if (typeof onNavigateToTab === 'function') {
      onNavigateToTab(isCourse ? 'announcements' : 'institution_announcements');
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm sa-fade"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-announcement-title"
        onClick={onClose}
      >
        <div
          className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl p-5 sm:p-7 sa-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-xl bg-[#FAF8F4] p-2 text-slate-400 border border-[#E3DDD0] transition hover:bg-[#F1EDE4] hover:text-[#17140F] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Type & Source Badges Header */}
          <div className="flex flex-wrap items-center gap-2 pr-10 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${
                isCourse
                  ? 'bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isCourse ? (
                <BookOpen className="h-3.5 w-3.5 text-[#9C6B2E]" />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-amber-700" />
              )}
              <span>{isCourse ? 'Course Announcement' : 'Institutional Notice'}</span>
            </span>

            {/* Scope Badge (Course title only for Course Announcements) */}
            {isCourse && announcement.course_title && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] px-3 py-1 text-[11px] font-semibold text-[#5B5346] border border-[#E3DDD0] truncate max-w-xs">
                📚 {announcement.course_title}
              </span>
            )}

            {/* New / Recent indicator */}
            {isRecent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                New
              </span>
            )}
          </div>

          {/* Announcement Title */}
          <h2
            id="modal-announcement-title"
            className="text-lg sm:text-xl font-bold text-[#17140F] leading-snug tracking-tight mb-3"
          >
            {announcement.title}
          </h2>

          {/* Metadata Row: Published Time, Author/Publisher */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8A8175] pb-3 mb-4 border-b border-[#E3DDD0]">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Published: {formatAnnouncementDateTime(announcement.created_at)}</span>
            </div>

            {announcement.publisher && (
              <div className="flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Source: <strong className="text-[#17140F] font-semibold">{announcement.publisher}</strong></span>
              </div>
            )}
          </div>

          {/* Optional Event / Exam Time Callout */}
          {formattedEventTime && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl p-3.5 bg-[#FAF8F4] border border-[#E3DDD0]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C6B2E]">
                  Scheduled Exam / Event Time
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#17140F]">
                  {formattedEventTime}
                </div>
              </div>
            </div>
          )}

          {/* Announcement Full Message Text */}
          <div className="prose prose-sm max-w-none mb-5">
            <p className="whitespace-pre-line text-xs sm:text-sm text-[#5B5346] leading-relaxed">
              {announcement.message || 'No additional details provided in this announcement.'}
            </p>
          </div>

          {/* Attached Image with Lightbox click */}
          {announcement.image && (
            <div className="mb-6">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175] mb-2">
                Attached Media
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 flex items-center justify-center max-h-80">
                <img
                  src={getCourseImageUrl(announcement.image)}
                  alt={announcement.title}
                  className="max-h-72 w-auto max-w-full rounded-xl object-contain shadow-xs cursor-pointer transition hover:scale-[1.01]"
                  onClick={() =>
                    setViewingImage({
                      url: getCourseImageUrl(announcement.image),
                      title: announcement.title,
                    })
                  }
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() =>
                    setViewingImage({
                      url: getCourseImageUrl(announcement.image),
                      title: announcement.title,
                    })
                  }
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-slate-900 cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Enlarge</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer with Actions */}
          <div className="pt-4 border-t border-[#E3DDD0] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOpenPage}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#9C6B2E] hover:text-[#855923] py-2 px-3 rounded-xl hover:bg-[#F1EDE4] transition cursor-pointer"
            >
              <span>{isCourse ? 'Open Course Announcements Page' : 'Open Institution Notices Page'}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-6 py-2.5 text-xs font-bold text-white bg-[#9C6B2E] hover:bg-[#855923] transition cursor-pointer shadow-sm text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full Resolution Image View */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm sa-fade"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col sa-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3 bg-[#FAF8F4]">
              <h3 className="text-sm font-bold text-[#17140F] truncate pr-4">
                {viewingImage.title || 'Announcement Attachment'}
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
            <div className="p-4 bg-[#F1EDE4] flex items-center justify-center overflow-auto max-h-[calc(92vh-60px)]">
              <img
                src={viewingImage.url}
                alt={viewingImage.title || 'Announcement Media'}
                className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default StaffAnnouncementDetailModal;
