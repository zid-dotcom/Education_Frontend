import React from 'react';
import { createPortal } from 'react-dom';
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
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const StaffStudentModal = ({
  isOpen,
  onClose,
  selectedStudent,
  activeCourseObj,
}) => {
  useStaffModalBlur(isOpen);

  if (!isOpen || !selectedStudent) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-6 sa-fade">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-2xl flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#E3DDD0] sa-rise">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E3DDD0] px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {(selectedStudent.name || selectedStudent.student_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 truncate">
                  {selectedStudent.name || selectedStudent.student_name || 'Student Details'}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    String(selectedStudent.account_status || 'active').toLowerCase() === 'active'
                      ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedStudent.account_status || 'Active'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Course: <span className="font-semibold text-[#9C6B2E]">{activeCourseObj?.title || 'Assigned Course'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Structured Tables */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Table 1: Personal & Contact Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              Personal & Contact Information
            </h4>
            <div className="rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[#E3DDD0]">
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Full Name</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-slate-800 text-[11px] sm:text-xs">{selectedStudent.name || '—'}</td>
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Email Address</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-800 text-[11px] sm:text-xs">
                      {selectedStudent.email ? (
                        <a
                          href={`mailto:${selectedStudent.email}`}
                          className="text-[#9C6B2E] hover:underline inline-flex items-center gap-1.5 font-medium"
                        >
                          <Mail className="h-3 w-3" />
                          {selectedStudent.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Phone Number</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-mono font-medium text-slate-800 text-[11px] sm:text-xs">
                      {selectedStudent.phone ? (
                        <a
                          href={`tel:${selectedStudent.phone}`}
                          className="text-slate-800 hover:text-[#9C6B2E] inline-flex items-center gap-1.5 font-bold"
                        >
                          <Phone className="h-3 w-3 text-[#9C6B2E]" />
                          {selectedStudent.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Residential Address</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-700 capitalize text-[11px] sm:text-xs">
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
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Highest Qualification</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-700 capitalize text-[11px] sm:text-xs">
                      {selectedStudent.highest_qualification ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <GraduationCap className="h-3.5 w-3.5 text-[#9C6B2E]" />
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
              <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <Users className="h-3 w-3" />
              </div>
              Parent / Guardian Details
            </h4>
            <div className="rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[#E3DDD0]">
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Guardian / Parent Name</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-slate-800 capitalize text-[11px] sm:text-xs">
                      {selectedStudent.parent_name || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Guardian Contact Phone</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-slate-800 text-[11px] sm:text-xs">
                      {selectedStudent.parent_phone ? (
                        <a
                          href={`tel:${selectedStudent.parent_phone}`}
                          className="text-slate-800 hover:text-[#9C6B2E] inline-flex items-center gap-1.5 font-medium"
                        >
                          <Phone className="h-3 w-3 text-[#9C6B2E]" />
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
              <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <FileText className="h-3 w-3" />
              </div>
              Course Enrollment & Approvals
            </h4>
            <div className="rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[#E3DDD0]">
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Enrollment ID</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                      #{selectedStudent.enrollment?.enrollment_id ?? selectedStudent.enrollment_id ?? selectedStudent.id ?? '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Enrolled At</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-700 text-[11px] sm:text-xs">
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
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Admission Date</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-700 text-[11px] sm:text-xs">
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
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Course Status</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(
                            selectedStudent.enrollment?.course_status || selectedStudent.status || 'pending'
                          ).toLowerCase().includes('active') ||
                          String(
                            selectedStudent.enrollment?.course_status || selectedStudent.status || 'pending'
                          ).toLowerCase().includes('approved')
                            ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedStudent.enrollment?.course_status || selectedStudent.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-[#FAF8F4]/60">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Branch Approval</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(selectedStudent.enrollment?.branch_approval_status || 'pending')
                            .toLowerCase()
                            .includes('approved')
                            ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedStudent.enrollment?.branch_approval_status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 w-2/5 sm:w-1/3 text-[11px] sm:text-xs">Super Admin Approval</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          String(selectedStudent.enrollment?.super_admin_approval_status || 'pending')
                            .toLowerCase()
                            .includes('approved')
                            ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
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
        <div className="border-t border-[#E3DDD0] px-4 sm:px-6 py-3 sm:py-4 bg-[#FAF8F4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 sm:py-2 text-xs font-bold border border-[#E3DDD0] transition bg-white hover:bg-[#F1EDE4] text-slate-700 shadow-2xs cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StaffStudentModal;
