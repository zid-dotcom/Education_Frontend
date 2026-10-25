import React from 'react';
import { Search, Users, Loader2, Phone, Eye, BookOpen, MapPin } from 'lucide-react';

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
  const getStudentAddress = (s) => {
    if (!s) return '—';
    return s.address || s.residential_address || s.student?.address || s.city || '—';
  };

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
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E3DDD0] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175] block mb-1">
            Select Assigned Course
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full sm:w-auto rounded-2xl border border-[#E3DDD0] px-4 py-2 font-bold text-xs bg-[#FAF8F4] text-[#17140F] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer"
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8175]" />
          <input
            type="text"
            value={studentsSearch}
            onChange={(e) => setStudentsSearch(e.target.value)}
            placeholder="Search enrolled students..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#E3DDD0] text-xs font-semibold bg-[#FAF8F4] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition-all"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-[#E3DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="font-bold text-sm text-[#17140F] flex items-center gap-2">
            <Users className="h-4 w-4 text-[#9C6B2E] shrink-0" />
            <span>Enrolled Students ({filteredStudents.length})</span>
          </h3>
          <span className="text-[11px] sm:text-xs text-[#9C6B2E] bg-[#F1EDE4] px-3 py-1 rounded-full font-semibold truncate max-w-full sm:max-w-xs self-start sm:self-auto border border-[#E3DDD0] shadow-2xs">
            {activeCourseObj?.title || 'Assigned Course'}
          </span>
        </div>

        {studentsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
            <p className="text-xs font-bold text-slate-500">Loading student roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No students found for this course.
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Student Cards (sm:hidden) */}
            <div className="p-3.5 space-y-3 sm:hidden">
              {filteredStudents.map((s, idx) => {
                const isApproved =
                  String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('approved') ||
                  String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('paid') ||
                  String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('active');
                const statusText = s.status || s.payment_status || s.enrollment?.course_status || 'Enrolled';

                return (
                  <div
                    key={s.id || s.enrollment_id || s.enrollment?.enrollment_id || idx}
                    onClick={() => onSelectStudent(s)}
                    className="p-4 rounded-2xl border border-[#E3DDD0] bg-white shadow-2xs hover:border-[#9C6B2E]/50 transition-all cursor-pointer space-y-3"
                  >
                    {/* Header: Avatar, Name, Email, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-[#E3DDD0]">
                          {(s.name || s.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {s.name || s.student_name || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {s.email || '—'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                          isApproved
                            ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {statusText}
                      </span>
                    </div>

                    {/* Middle Info: Residential Address, Phone, Joined Date */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#E3DDD0] bg-[#FAF8F4] p-2.5 rounded-xl">
                      <div>
                        <span className="text-[#8A8175] text-[10px] block font-semibold">RESIDENTIAL ADDRESS</span>
                        <span className="text-slate-700 font-semibold text-[11px] truncate block capitalize">
                          {getStudentAddress(s)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8A8175] text-[10px] block font-semibold">JOINED DATE</span>
                        <span className="text-slate-700 font-semibold text-[11px]">{getStudentEnrolledDate(s)}</span>
                      </div>
                      {s.phone && (
                        <div className="col-span-2 pt-1 border-t border-[#E3DDD0] flex items-center gap-1.5 text-slate-700 text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{s.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(s);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-[#9C6B2E] bg-[#F1EDE4] hover:bg-[#E3DDD0] border border-[#E3DDD0] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#9C6B2E]" />
                      <span>View Full Details</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F4] border-b border-[#E3DDD0] text-[10px] font-extrabold text-[#8A8175] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Residential Address</th>
                    <th className="px-6 py-3.5">Enrollment Status</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DDD0]/50 font-medium text-slate-700">
                  {filteredStudents.map((s, idx) => (
                    <tr
                      key={s.id || s.enrollment_id || s.enrollment?.enrollment_id || idx}
                      onClick={() => onSelectStudent(s)}
                      className="hover:bg-[#FAF8F4] cursor-pointer transition-colors"
                      title="Click to view student full details"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-[#E3DDD0]">
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
                          <span className="inline-flex items-center gap-1.5 text-slate-700 bg-[#FAF8F4] px-2 py-0.5 rounded-md border border-[#E3DDD0]">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {s.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-medium text-slate-700">
                        {getStudentAddress(s) !== '—' ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700 capitalize">
                            <MapPin className="h-3.5 w-3.5 text-[#9C6B2E] shrink-0" />
                            <span>{getStudentAddress(s)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('approved') ||
                            String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('paid') ||
                            String(s.status || s.payment_status || s.enrollment?.course_status || 'enrolled').toLowerCase().includes('active')
                              ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.status || s.payment_status || s.enrollment?.course_status || 'Enrolled'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[#5B5346] font-medium">
                        {getStudentEnrolledDate(s)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(s);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-[#9C6B2E] bg-[#F1EDE4] hover:bg-[#E3DDD0] border border-[#E3DDD0] transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#9C6B2E]" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffCoursesTab;
