import React from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, PlusCircle } from 'lucide-react';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const StaffAssignmentModal = ({
  isOpen,
  onClose,
  activeCourseObj,
  assignmentForm,
  setAssignmentForm,
  assignmentMsg,
  assignmentSubmitting,
  handleCreateAssignment,
}) => {
  useStaffModalBlur(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-xl max-h-[90vh] overflow-y-auto flex-col rounded-3xl bg-white shadow-2xl border border-[#E3DDD0] sa-rise">
        <div className="flex items-center justify-between border-b border-[#E3DDD0] px-6 py-5 bg-[#FAF8F4]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Create Course Assignment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeCourseObj?.title || 'Selected Course'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
          {assignmentMsg.text && (
            <div
              className={`rounded-2xl border p-3.5 text-xs font-semibold ${
                assignmentMsg.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-[#E3DDD0] bg-[#F1EDE4] text-[#9C6B2E]'
              }`}
            >
              {assignmentMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assignment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Practical Exercise 1 - JavaScript DOM Manipulation"
              className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 focus:border-[#9C6B2E] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm((p) => ({ ...p, due_date: e.target.value }))}
                className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 focus:border-[#9C6B2E] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Max Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={assignmentForm.max_marks}
                onChange={(e) => setAssignmentForm((p) => ({ ...p, max_marks: e.target.value }))}
                placeholder="e.g. 50 or 100"
                className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 focus:border-[#9C6B2E] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Description & Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Provide detailed instructions, submission guidelines, or task requirements for the students..."
              className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 focus:border-[#9C6B2E] transition-all resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-[#E3DDD0]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold border border-[#E3DDD0] text-slate-600 hover:bg-[#F1EDE4] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignmentSubmitting}
              className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-gradient-to-r from-[#9C6B2E] to-[#855923] hover:from-[#855923] hover:to-[#6E4717]"
            >
              {assignmentSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Creating...
                </>
              ) : (
                'Publish Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StaffAssignmentModal;
