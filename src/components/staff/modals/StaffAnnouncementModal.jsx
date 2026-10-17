import React from 'react';
import { Megaphone, X, CheckCircle, AlertCircle, Loader2, Edit2 } from 'lucide-react';

const StaffAnnouncementModal = ({
  isOpen,
  onClose,
  editingAnnouncement,
  selectedAnnouncementCourseId,
  activeCourseObj,
  assignedCourses,
  announcementForm,
  setAnnouncementForm,
  announcementMsg,
  announcementSubmitting,
  handleSaveAnnouncement,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs sa-fade">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-100 shadow-2xl sa-rise">
        {/* Modal Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                {editingAnnouncement ? 'Edit Staff Announcement' : 'Create Course Announcement'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingAnnouncement ? (
                  <span>Updating published announcement</span>
                ) : (
                  <>
                    Course:{' '}
                    <span className="font-semibold text-emerald-700">
                      {activeCourseObj?.title || assignedCourses[0]?.title || 'Assigned Course'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
          {announcementMsg.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                announcementMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {announcementMsg.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{announcementMsg.text}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Exam Schedule & Room Allocation"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Scheduled Exam / Event Time <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              The message can include information such as an exam time.
            </p>
            <input
              type="datetime-local"
              value={announcementForm.scheduled_event_time}
              onChange={(e) =>
                setAnnouncementForm((prev) => ({ ...prev, scheduled_event_time: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide all details for your enrolled students..."
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold border border-slate-200 transition hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={announcementSubmitting}
              className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {announcementSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  {editingAnnouncement ? 'Saving Changes...' : 'Publishing...'}
                </>
              ) : editingAnnouncement ? (
                <>
                  <Edit2 className="h-4 w-4 text-white" />
                  Save Changes
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 text-white" />
                  Publish Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffAnnouncementModal;
