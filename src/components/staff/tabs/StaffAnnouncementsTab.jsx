import React from 'react';
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
} from 'lucide-react';

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
  return (
    <div className="space-y-6 sa-fade">
      {/* Header with course selector & New Announcement button */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Filter Announcements
            </label>
            <select
              value={selectedAnnouncementCourseId}
              onChange={(e) => setSelectedAnnouncementCourseId(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 font-bold text-xs bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {assignedCourses.map((c) => {
                const id = c.id || c.course_id;
                return (
                  <option key={id} value={id}>
                    {c.title}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="pt-2 sm:pt-4 text-xs font-semibold text-slate-500">
            <span className="font-bold text-slate-800">{staffAnnouncements.length}</span> announcement
            {staffAnnouncements.length === 1 ? '' : 's'}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateAnnouncement}
          className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Announcement
        </button>
      </div>

      {/* Announcements List */}
      {announcementsLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">Loading staff announcements...</p>
        </div>
      ) : staffAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800">No Announcements Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Publish an announcement to notify enrolled students about exam times, schedule updates, or important classroom notices.
          </p>
          <button
            type="button"
            onClick={onOpenCreateAnnouncement}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
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

            const itemCourseTitle =
              item.course_title ||
              item.course?.title ||
              assignedCourses.find((c) => String(c.id || c.course_id) === String(item.course_id))?.title ||
              (selectedAnnouncementCourseId !== 'ALL' ? activeCourseObj?.title : null) ||
              'Assigned Course';

            const itemAnnId = item.id ?? item.announcement_id ?? idx;

            return (
              <div
                key={itemAnnId}
                className="bg-white rounded-3xl border border-slate-100 p-6 transition-all hover:shadow-md hover:border-emerald-100 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100">
                        <BookOpen className="h-3 w-3 text-emerald-600" />
                        {itemCourseTitle}
                      </span>
                      {createdDateStr && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Published: {createdDateStr}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-800 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {formattedEventTime && (
                    <div className="shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-emerald-700 font-extrabold">
                          Exam / Event Time
                        </div>
                        <div className="font-bold text-emerald-950">{formattedEventTime}</div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                  {item.message}
                </p>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Instructor:{' '}
                    <span className="font-semibold text-slate-700">
                      {item.staff_name || item.staff || user?.name || 'Assigned Staff'}
                    </span>
                  </span>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onOpenEditAnnouncement(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition cursor-pointer"
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
    </div>
  );
};

export default StaffAnnouncementsTab;
