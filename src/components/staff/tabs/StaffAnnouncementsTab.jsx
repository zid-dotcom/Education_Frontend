import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Loader2,
  Megaphone,
  BookOpen,
  Clock,
  Calendar,
  User,
  Edit2,
  Trash2,
  X,
  Maximize2,
} from 'lucide-react';
import { getCourseImageUrl } from '../../../services/courses';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const StaffAnnouncementsTab = ({
  assignedCourses,
  selectedAnnouncementCourseId,
  setSelectedAnnouncementCourseId,
  staffAnnouncements,
  announcementsLoading,
  onOpenCreateAnnouncement,
  onOpenEditAnnouncement,
  onDeleteAnnouncement,
  deletingAnnouncementId,
  activeCourseObj,
  user,
}) => {
  const [viewingImage, setViewingImage] = useState(null);
  useStaffModalBlur(Boolean(viewingImage));

  return (
    <div className="space-y-6 sa-fade">
      {/* Header with course selector & New Announcement button */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E3DDD0] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175] block mb-1">
              Select Course
            </label>
            <select
              value={selectedAnnouncementCourseId}
              onChange={(e) => setSelectedAnnouncementCourseId(e.target.value)}
              className="w-full sm:w-auto rounded-2xl border border-[#E3DDD0] px-4 py-2 font-bold text-xs bg-[#FAF8F4] text-[#17140F] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer"
            >
              {assignedCourses.length === 0 && (
                <option value="">No Assigned Courses</option>
              )}
              {assignedCourses.map((c) => {
                const id = c.id || c.course_id;
                return (
                  <option key={id} value={id}>
                    📚 {c.title}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="pt-0 sm:pt-4 text-xs font-semibold text-[#5B5346]">
            <span className="font-bold text-[#17140F]">{staffAnnouncements.length}</span> announcement
            {staffAnnouncements.length === 1 ? '' : 's'}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateAnnouncement}
          className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#9C6B2E]/20 bg-[#9C6B2E] hover:bg-[#855923] flex items-center justify-center gap-2 transition cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Announcement
        </button>
      </div>

      {/* Announcements List */}
      {announcementsLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
          <p className="text-xs font-bold text-slate-500">Loading staff announcements...</p>
        </div>
      ) : staffAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E3DDD0] p-12 text-center shadow-sm">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#17140F]">No Announcements Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Publish an announcement to notify enrolled students about exam times, schedule updates, or important classroom notices.
          </p>
          <button
            type="button"
            onClick={onOpenCreateAnnouncement}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-[#9C6B2E] bg-[#F1EDE4] hover:bg-[#E3DDD0] border border-[#E3DDD0] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {staffAnnouncements.map((item, idx) => {
            const rawTime =
              item.scheduled_event_time || item.event_time || item.exam_time || item.scheduled_time;
            let formattedEventTime = null;
            if (rawTime) {
              try {
                const d = new Date(rawTime);
                if (!isNaN(d.getTime())) {
                  formattedEventTime = d.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });
                } else {
                  formattedEventTime = String(rawTime);
                }
              } catch {
                formattedEventTime = String(rawTime);
              }
            }

            let createdDateStr = '';
            if (item.created_at) {
              try {
                const cd = new Date(item.created_at);
                if (!isNaN(cd.getTime())) {
                  const dayDate = cd.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const time = cd.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  createdDateStr = `${dayDate} • ${time}`;
                }
              } catch {
                createdDateStr = '';
              }
            }

            const isInstitutional =
              !item.course_id &&
              (item.branch_name || item.audience || selectedAnnouncementCourseId === 'BRANCH');

            const itemCourseTitle = isInstitutional
              ? (item.branch_name ? `Branch: ${item.branch_name}` : 'Institutional Notice')
              : (
                  item.course_title ||
                  item.course?.title ||
                  assignedCourses.find((c) => String(c.id || c.course_id) === String(item.course_id))?.title ||
                  (selectedAnnouncementCourseId !== 'ALL' && selectedAnnouncementCourseId !== 'BRANCH' ? activeCourseObj?.title : null) ||
                  'Course Announcement'
                );

            const itemAnnId = item.id ?? item.announcement_id ?? idx;

            return (
              <div
                key={itemAnnId}
                className="bg-white rounded-3xl border border-[#E3DDD0] p-6 transition-all hover:shadow-md hover:border-[#9C6B2E]/50 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E] bg-[#F1EDE4] border border-[#E3DDD0]">
                        <BookOpen className="h-3 w-3 text-[#9C6B2E]" />
                        {itemCourseTitle}
                      </span>
                      {createdDateStr && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Published: {createdDateStr}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-[#17140F] leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {formattedEventTime && (
                    <div className="shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold bg-[#F1EDE4] text-[#17140F] border border-[#E3DDD0]">
                      <Calendar className="h-4 w-4 text-[#9C6B2E]" />
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-[#9C6B2E] font-extrabold">
                          Exam / Event Time
                        </div>
                        <div className="font-bold text-[#17140F]">{formattedEventTime}</div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#5B5346] leading-relaxed whitespace-pre-line mb-4">
                  {item.message}
                </p>

                {/* Announcement Image Display */}
                {item.image && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 flex items-center justify-center max-h-72">
                    <img
                      src={getCourseImageUrl(item.image)}
                      alt={item.title}
                      className="max-h-64 w-auto max-w-full rounded-xl object-contain shadow-xs cursor-pointer transition hover:scale-[1.01]"
                      onClick={() =>
                        setViewingImage({
                          url: getCourseImageUrl(item.image),
                          title: item.title,
                        })
                      }
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-[#E3DDD0] flex items-center justify-end">
                  <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEditAnnouncement(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-[#FAF8F4] hover:bg-[#F1EDE4] hover:text-[#9C6B2E] border border-[#E3DDD0] transition cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={deletingAnnouncementId === itemAnnId}
                        onClick={() => onDeleteAnnouncement(itemAnnId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                        title="Delete Announcement"
                      >
                        {deletingAnnouncementId === itemAnnId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
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

export default StaffAnnouncementsTab;
