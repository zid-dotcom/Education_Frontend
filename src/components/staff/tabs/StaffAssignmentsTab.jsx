import React from 'react';
import { Award, Plus, Loader2, FileText, Clock, FileCheck2 } from 'lucide-react';

const formatCardDateTime = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
};

const StaffAssignmentsTab = ({
  assignedCourses,
  selectedCourseId,
  setSelectedCourseId,
  assignmentFilterTab,
  setAssignmentFilterTab,
  assignments,
  assignmentsLoading,
  onOpenCreateAssignment,
  onOpenGradingModal,
}) => {
  return (
    <div className="space-y-6 sa-fade">
      {/* Header with course selector, filter tabs, & New Assignment button */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Select Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full sm:w-auto rounded-2xl border border-slate-200 px-4 py-2 font-bold text-xs bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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

          {/* Filter toggle: All vs Graded/Verified */}
          <div className="flex items-center gap-1.5 pt-0 sm:pt-4 flex-wrap">
            <button
              type="button"
              onClick={() => setAssignmentFilterTab('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                assignmentFilterTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Assignments
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilterTab('verified')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                assignmentFilterTab === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Graded / Verified
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateAssignment}
          className="w-full sm:w-auto justify-center rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </button>
      </div>

      {/* Assignment Cards */}
      {assignmentsLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">Loading course assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800">
            {assignmentFilterTab === 'verified' ? 'No Graded Assignments Found' : 'No Assignments Yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {assignmentFilterTab === 'verified'
              ? 'Assignments will appear here once you evaluate and assign marks to student submissions.'
              : 'Publish course assignments, homework, and task deadlines for your enrolled students.'}
          </p>
          {assignmentFilterTab === 'verified' ? (
            <button
              type="button"
              onClick={() => setAssignmentFilterTab('all')}
              className="mt-4 rounded-xl px-4 py-2 text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              View All Assignments
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCreateAssignment}
              className="mt-4 rounded-xl px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
            >
              + Create First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((a, idx) => {
            const maxMarks = a.max_marks || 100;
            const studentsList = Array.isArray(a.students) ? a.students : Array.isArray(a.submissions) ? a.submissions : [];
            const submittedStudents = studentsList.filter(
              (s) => s.status === 'submitted' || s.status === 'graded' || s.submission_url || s.submitted_at || s.file_url
            );
            const submissionsCount = submittedStudents.length || a.submission_count || 0;
            const obtainedMark =
              a.marks_obtained !== undefined && a.marks_obtained !== null
                ? a.marks_obtained
                : studentsList.find((s) => s.marks_obtained !== undefined && s.marks_obtained !== null)?.marks_obtained;
            const isGraded =
              (a.marks_obtained !== undefined && a.marks_obtained !== null) ||
              (studentsList.length > 0 && studentsList.some((s) => s.marks_obtained !== null && s.marks_obtained !== undefined));
            const feedbackText = a.feedback || studentsList.find((s) => s.feedback)?.feedback;

            const submittedAt =
              a.submitted_at ||
              a.submission_date ||
              studentsList.find((s) => s.submitted_at || s.submission_date)?.submitted_at ||
              studentsList.find((s) => s.submitted_at || s.submission_date)?.submission_date ||
              studentsList[0]?.submitted_at;

            const markedAt =
              a.marked_at ||
              a.graded_at ||
              a.evaluated_at ||
              (isGraded ? a.updated_at : null) ||
              studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.marked_at ||
              studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.graded_at ||
              studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.evaluated_at;

            return (
              <div
                key={a.id || a.assignment_id || a.task_id || idx}
                className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md hover:border-emerald-100 shadow-sm"
              >
                <div>
                  {a.due_date && (
                    <div className="flex items-center justify-end mb-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <Clock className="h-3 w-3 text-emerald-600" />
                        Due: {a.due_date}
                      </span>
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-slate-800 mb-1">{a.title}</h4>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Max Marks: {maxMarks}
                    </span>
                    {isGraded && (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Graded: {obtainedMark !== undefined && obtainedMark !== null ? `${obtainedMark} / ${maxMarks}` : 'Marked'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {a.description}
                  </p>

                  {/* Remarks or status strip */}
                  {feedbackText ? (
                    <div className="mt-3 rounded-xl bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900 border border-emerald-100">
                      <span className="font-bold text-[10px] uppercase block text-emerald-800">Feedback:</span>
                      <span className="italic">"{feedbackText}"</span>
                    </div>
                  ) : isGraded ? null : submissionsCount === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-2.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Awaiting student submissions</span>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-2.5 text-[11px] text-emerald-700 flex items-center gap-1.5">
                      <FileCheck2 className="h-3 w-3 text-emerald-600" />
                      <span>Submissions ready for evaluation</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                        Submitted At:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCardDateTime(submittedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-emerald-600" />
                        Marked At:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCardDateTime(markedAt)}
                      </span>
                    </div>
                  </div>

                  {/* View Submissions & Grade Marks Action Button */}
                  <button
                    type="button"
                    onClick={() => onOpenGradingModal(a)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                  >
                    <Award className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{isGraded ? 'Edit Marks & Feedback' : 'View Submissions & Grade'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffAssignmentsTab;
