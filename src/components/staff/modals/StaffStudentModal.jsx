import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  FileText,
} from 'lucide-react';

const StaffStudentModal = ({
  isOpen,
  onClose,
  selectedStudent,
  activeCourseObj,
}) => {
  if (!isOpen || !selectedStudent) return null;

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
              {(selectedStudent.name || selectedStudent.student_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800">
                  {selectedStudent.name || selectedStudent.student_name || 'Student Details'}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    String(selectedStudent.account_status || 'active').toLowerCase() === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedStudent.account_status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Course: <span className="font-semibold text-emerald-700">{activeCourseObj?.title || 'Assigned Course'}</span>
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

        {/* Modal Content - Structured Tables */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Table 1: Personal & Contact Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              Personal & Contact Information
            </h4>
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Full Name</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{selectedStudent.name || '—'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Email Address</td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {selectedStudent.email ? (
                        <a
                          href={`mailto:${selectedStudent.email}`}
                          className="text-emerald-700 hover:underline inline-flex items-center gap-1.5 font-medium"
                        >
                          <Mail className="h-3 w-3" />
                          {selectedStudent.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Phone Number</td>
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-800">
                      {selectedStudent.phone ? (
                        <a
                          href={`tel:${selectedStudent.phone}`}
                          className="text-slate-800 hover:text-emerald-700 inline-flex items-center gap-1.5 font-bold"
                        >
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {selectedStudent.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Residential Address</td>
                    <td className="px-4 py-2.5 text-slate-700 capitalize">
                      {selectedStudent.address ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {selectedStudent.address}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Highest Qualification</td>
                    <td className="px-4 py-2.5 text-slate-700 capitalize">
                      {selectedStudent.highest_qualification ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                          {selectedStudent.highest_qualification}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Parent / Guardian Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center">
                <Users className="h-3 w-3" />
              </div>
              Parent / Guardian Details
            </h4>
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Guardian / Parent Name</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800 capitalize">
                      {selectedStudent.parent_name || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Guardian Contact Phone</td>
                    <td className="px-4 py-2.5 font-mono text-slate-800">
                      {selectedStudent.parent_phone ? (
                        <a
                          href={`tel:${selectedStudent.parent_phone}`}
                          className="text-slate-800 hover:text-emerald-700 inline-flex items-center gap-1.5 font-medium"
                        >
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {selectedStudent.parent_phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Course Enrollment & Approval Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileText className="h-3 w-3" />
              </div>
              Course Enrollment & Approvals
            </h4>
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Enrollment ID</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                      #{selectedStudent.enrollment?.enrollment_id ?? selectedStudent.enrollment_id ?? selectedStudent.id ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Enrolled At</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {(() => {
                        const raw =
                          selectedStudent.enrolled_at ||
                          selectedStudent.enrollment?.enrolled_at ||
                          selectedStudent.admission_date ||
                          selectedStudent.enrollment?.admission_date ||
                          selectedStudent.created_at ||
                          selectedStudent.createdAt;
                        if (!raw) return '—';
                        try {
                          return new Date(raw).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          });
                        } catch {
                          return String(raw);
                        }
                      })()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Admission Date</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {(() => {
                        const raw =
                          selectedStudent.admission_date ||
                          selectedStudent.enrollment?.admission_date ||
                          selectedStudent.enrolled_at ||
                          selectedStudent.enrollment?.enrolled_at ||
                          selectedStudent.created_at;
                        if (!raw) return 'Pending confirmation';
                        try {
                          return new Date(raw).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                        } catch {
                          return String(raw);
                        }
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Course Status</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(
                            selectedStudent.enrollment?.course_status || selectedStudent.status || 'pending'
                          ).toLowerCase().includes('active') ||
                          String(
                            selectedStudent.enrollment?.course_status || selectedStudent.status || 'pending'
                          ).toLowerCase().includes('approved')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedStudent.enrollment?.course_status || selectedStudent.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Branch Approval</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(selectedStudent.enrollment?.branch_approval_status || 'pending')
                            .toLowerCase()
                            .includes('approved')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedStudent.enrollment?.branch_approval_status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">Super Admin Approval</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(selectedStudent.enrollment?.super_admin_approval_status || 'pending')
                            .toLowerCase()
                            .includes('approved')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedStudent.enrollment?.super_admin_approval_status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-bold border border-slate-200 transition hover:bg-white text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffStudentModal;
