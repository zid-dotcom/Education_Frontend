import React from 'react';
import {
  Award,
  X,
  Clock,
  FileCheck2,
  FileText,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';

const StaffGradingModal = ({
  gradingAssignment,
  onClose,
  gradingMsg,
  studentGrades,
  setStudentGrades,
  gradingStudentId,
  handleSaveStudentMarks,
  gradingForm,
  setGradingForm,
  handleSaveMarks,
  gradingSubmitting,
}) => {
  if (!gradingAssignment) return null;

  const studentsList = Array.isArray(gradingAssignment.students)
    ? gradingAssignment.students
    : Array.isArray(gradingAssignment.submissions)
    ? gradingAssignment.submissions
    : [];

  const submittedAtRaw =
    gradingAssignment.submitted_at ||
    gradingAssignment.submission_date ||
    studentsList.find((s) => s.submitted_at || s.submission_date)?.submitted_at ||
    studentsList.find((s) => s.submitted_at || s.submission_date)?.submission_date ||
    studentsList[0]?.submitted_at;

  const markedAtRaw =
    gradingAssignment.marked_at ||
    gradingAssignment.graded_at ||
    gradingAssignment.evaluated_at ||
    gradingAssignment.updated_at ||
    studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.marked_at ||
    studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.graded_at ||
    studentsList.find((s) => s.marked_at || s.graded_at || s.evaluated_at)?.evaluated_at;

  const formatDateTime = (dateVal) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-2xl flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 sa-rise">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Evaluate & Grade Assignment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {gradingAssignment.title || 'Course Assignment'} • Max Marks:{' '}
                <strong className="text-emerald-700">{gradingAssignment.max_marks || 100}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {gradingMsg.text && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold ${
                gradingMsg.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {gradingMsg.text}
            </div>
          )}

          {/* Assignment Overview Strip - Displays Submitted At and Marked At */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Submitted At:</span>
                <span className="font-bold text-slate-900">{formatDateTime(submittedAtRaw)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>Marked At:</span>
                <span className="font-bold text-slate-900">{formatDateTime(markedAtRaw)}</span>
              </div>
            </div>
            {gradingAssignment.description && (
              <p className="text-slate-700 whitespace-pre-wrap mt-1">{gradingAssignment.description}</p>
            )}
          </div>

          {/* Student Submissions & Individual Grading List */}
          {studentsList.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#e3ddd0' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-emerald-700" />
                  Student Submissions & Verification ({studentsList.length})
                </h4>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Verify coursework & assign marks
                </span>
              </div>

              <div className="space-y-4">
                {studentsList.map((st, sIdx) => {
                  const sId = st.student_id ?? st.id ?? st.assignment_id ?? sIdx;
                  const studentGrade = studentGrades[sId] || {
                    marks_obtained:
                      st.marks_obtained !== undefined && st.marks_obtained !== null ? st.marks_obtained : '',
                    feedback: st.feedback || '',
                  };
                  const isSaving = gradingStudentId === sId;
                  const rawFileUrl = st.submission_url || st.file_url || st.submission_file || st.file;
                  const fileName = st.submission_filename || 'homework_submission.pdf';
                  const hasSubmitted = Boolean(
                    st.status === 'submitted' ||
                    st.status === 'graded' ||
                    rawFileUrl ||
                    st.submitted_at
                  );
                  const isMarked = st.marks_obtained !== undefined && st.marks_obtained !== null;
                  const maxMarks = st.max_marks || gradingAssignment.max_marks || 100;

                  const resolvedFileUrl = rawFileUrl
                    ? rawFileUrl.startsWith('http') || rawFileUrl.startsWith('blob:')
                      ? rawFileUrl
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${rawFileUrl.startsWith('/') ? '' : '/'}${rawFileUrl}`
                    : null;

                  return (
                    <div
                      key={sId}
                      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4 transition"
                    >
                      {/* Student Header & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(st.name || st.student_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">
                                {st.name || st.student_name || 'Student'}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                #{st.student_id || sIdx + 1}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{st.email || '—'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isMarked ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3" />
                              Graded: {st.marks_obtained} / {maxMarks}
                            </span>
                          ) : hasSubmitted ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              <FileCheck2 className="h-3 w-3" />
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="h-3 w-3" />
                              Pending Submission
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Submitted PDF File Box */}
                      {hasSubmitted ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
                              <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{fileName}</p>
                              <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                                <span>
                                  {st.submitted_at
                                    ? `Submitted on ${new Date(st.submitted_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                      })}`
                                    : 'PDF coursework uploaded'}
                                </span>
                                {(st.marked_at || st.graded_at || st.updated_at) && isMarked && (
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Marked on {new Date(st.marked_at || st.graded_at || st.updated_at).toLocaleString('en-IN', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {resolvedFileUrl && (
                            <a
                              href={resolvedFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                              <span>View / Verify PDF</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-3 text-xs text-slate-500">
                          No PDF coursework uploaded yet by this student.
                        </div>
                      )}

                      {/* Evaluation / Marks Form for this Student */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-emerald-600" />
                            {isMarked ? 'Update Marks & Remarks' : 'Enter Marks & Feedback'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Max Marks: {maxMarks}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Marks Obtained (0 - {maxMarks}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={studentGrade.marks_obtained}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStudentGrades((prev) => ({
                                  ...prev,
                                  [sId]: { ...prev[sId], marks_obtained: val },
                                }));
                              }}
                              placeholder="e.g. 25"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Feedback / Remarks
                            </label>
                            <input
                              type="text"
                              value={studentGrade.feedback}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStudentGrades((prev) => ({
                                  ...prev,
                                  [sId]: { ...prev[sId], feedback: val },
                                }));
                              }}
                              placeholder="e.g. Good work, detailed solution"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveStudentMarks(st)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 text-white" />
                                {isMarked ? 'Update Marks' : 'Save Marks & Feedback'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fallback general assignment form if no students array */
            <form onSubmit={handleSaveMarks} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Enter Marks & Evaluation Feedback</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marks Obtained (Max {gradingAssignment.max_marks || 100}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={gradingAssignment.max_marks || 100}
                    value={gradingForm.marks_obtained}
                    onChange={(e) => setGradingForm((p) => ({ ...p, marks_obtained: e.target.value }))}
                    placeholder="e.g. 25"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Feedback / Remarks
                  </label>
                  <input
                    type="text"
                    value={gradingForm.feedback}
                    onChange={(e) => setGradingForm((p) => ({ ...p, feedback: e.target.value }))}
                    placeholder="e.g. Good work, detailed solution"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {gradingSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      Saving Marks...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      Save Marks & Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffGradingModal;
