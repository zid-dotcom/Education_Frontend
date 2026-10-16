import React from 'react';
import { Search, Users, Loader2, Phone, Eye, BookOpen } from 'lucide-react';

const StaffCoursesTab = ({
  assignedCourses,
  selectedCourseId,
  setSelectedCourseId,
  studentsSearch,
  setStudentsSearch,
  filteredStudents,
  activeCourseObj,
  studentsLoading,
  onSelectStudent,
}) => {
  const getStudentEnrolledDate = (s) => {
    if (!s) return '—';
    const raw =
      s.enrolled_at ||
      s.enrollment?.enrolled_at ||
      s.admission_date ||
      s.enrollment?.admission_date ||
      s.admission?.admission_date ||
      s.admission?.enrolled_at ||
      s.admission?.created_at ||
      s.enrollment_date ||
      s.enrolled_date ||
      s.enrollment?.enrollment_date ||
      s.enrollment?.enrolled_date ||
      s.created_at ||
      s.createdAt ||
      s.enrollment?.created_at ||
      s.enrollment?.createdAt ||
      s.date_of_admission ||
      s.joining_date ||
      s.student?.admission_date ||
      s.student?.enrolled_at ||
      s.student?.created_at ||
      s.registration_date ||
      s.registered_at ||
      s.date ||
      s.updated_at ||
      s.enrollment?.updated_at;
    if (!raw) return '—';
    try {
      const str = String(raw).trim();
      const d = str.includes('T') ? new Date(str) : new Date(`${str}T00:00:00`);
      if (isNaN(d.getTime())) {
        const fallback = new Date(raw);
        if (isNaN(fallback.getTime())) return str || '—';
        return fallback.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(raw);
    }
  };

  return (
    <div className="space-y-6 sa-fade">
      {/* Course selector header card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Select Assigned Course
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
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
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={studentsSearch}
            onChange={(e) => setStudentsSearch(e.target.value)}
            placeholder="Search enrolled students..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-semibold bg-slate-50/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            Enrolled Students ({filteredStudents.length})
          </h3>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold truncate max-w-xs">
            {activeCourseObj?.title || 'Assigned Course'}
          </span>
        </div>

        {studentsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-slate-500">Loading student roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No students found for this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Enrollment ID</th>
                  <th className="px-6 py-3.5">Enrollment Status</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((s, idx) => (
                  <tr
                    key={s.id || s.enrollment_id || s.enrollment?.enrollment_id || idx}
                    onClick={() => onSelectStudent(s)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                    title="Click to view student full details"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {(s.name || s.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name || s.student_name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">{s.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono">
                      {s.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {s.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-slate-600">
                      #{s.enrollment?.enrollment_id ?? s.enrollment_id ?? s.id ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('approved') ||
                          String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('paid') ||
                          String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('active')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.status || s.payment_status || s.enrollment?.course_status || 'Enrolled'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 font-medium">
                      {getStudentEnrolledDate(s)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(s);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCoursesTab;
