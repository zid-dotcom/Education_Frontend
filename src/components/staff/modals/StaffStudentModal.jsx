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
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  IndianRupee,
  AlertCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
};

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
      <div className="relative flex w-full max-w-4xl lg:max-w-5xl flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#E3DDD0] sa-rise">
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

          {/* Table 4: Course Fee & Payment Balance */}
          {(() => {
            const totalFee = Number(
              selectedStudent.total_fee ??
              selectedStudent.enrollment?.total_fee ??
              activeCourseObj?.fee ??
              0
            );
            const totalPaid = Number(
              selectedStudent.total_paid ??
              selectedStudent.enrollment?.total_paid ??
              0
            );
            const balance = Number(
              selectedStudent.balance_amount ??
              selectedStudent.enrollment?.balance_amount ??
              Math.max(0, totalFee - totalPaid)
            );
            const rawInstallments = Array.isArray(selectedStudent.installments)
              ? selectedStudent.installments
              : Array.isArray(selectedStudent.enrollment?.installments)
              ? selectedStudent.enrollment.installments
              : [];
            const rawPayments = Array.isArray(selectedStudent.payment_history)
              ? selectedStudent.payment_history
              : Array.isArray(selectedStudent.payments)
              ? selectedStudent.payments
              : Array.isArray(selectedStudent.enrollment?.payments)
              ? selectedStudent.enrollment.payments
              : [];

            const isPendingReview =
              selectedStudent.payment_review_status === 'pending' ||
              selectedStudent.payment_review_status === 'awaiting_review' ||
              rawInstallments.some(
                (inst) =>
                  String(inst.status || '').toLowerCase().includes('review') ||
                  String(inst.approval_status || '').toLowerCase() === 'pending'
              ) ||
              rawPayments.some((p) => String(p.status || '').toLowerCase() === 'pending');

            const paidInstallmentCount =
              selectedStudent.paid_installment_count ??
              rawInstallments.filter((inst) => String(inst.status || '').toLowerCase() === 'paid').length;
            const totalInstallmentCount =
              selectedStudent.installment_count ?? rawInstallments.length;

            return (
              <div className="space-y-4 pt-1">
                {/* Pending Review Banner */}
                {isPendingReview && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 flex items-center gap-3 text-amber-900 shadow-2xs">
                    <Clock className="h-5 w-5 text-amber-700 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">Payment Verification Pending</p>
                      <p className="text-[11px] text-amber-800">
                        An installment payment was submitted and is awaiting branch admin review.
                      </p>
                    </div>
                  </div>
                )}

                {/* Financial Summary Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                      <IndianRupee className="h-3 w-3" />
                    </div>
                    Course Fee & Payment Balance
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Total Fee
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
                        {formatCurrency(totalFee)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Total Paid
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-800 mt-0.5 block">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>

                    <div className={`rounded-xl border p-3 text-left ${balance > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        Balance Due
                      </span>
                      <span className={`text-sm sm:text-base font-extrabold mt-0.5 block ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Installments
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#9C6B2E] mt-0.5 block">
                        {paidInstallmentCount} / {totalInstallmentCount || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table 5: Installments Schedule */}
                {rawInstallments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                        <Calendar className="h-3 w-3" />
                      </div>
                      Installment Breakdown
                    </h4>
                    <div className="rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead className="border-b border-[#E3DDD0] bg-[#FAF8F4] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Term</th>
                              <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">Amount</th>
                              <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">Paid</th>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Due Date</th>
                              <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">Status</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-[#E3DDD0]">
                          {rawInstallments.map((inst, idx) => {
                            const isPaid = String(inst.status || '').toLowerCase() === 'paid';
                            const isPartial = String(inst.status || '').toLowerCase() === 'partial';
                            const isReview = String(inst.status || '').toLowerCase().includes('review') || String(inst.approval_status || '').toLowerCase() === 'pending';

                            return (
                              <tr key={inst.id || inst.installment_id || idx} className="hover:bg-[#FAF8F4]/50">
                                <td className="px-3 sm:px-4 py-2.5 font-bold text-slate-800">
                                  Term #{inst.installment_number ?? idx + 1}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-right font-medium text-slate-700">
                                  {formatCurrency(inst.amount)}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-right font-bold text-emerald-700">
                                  {formatCurrency(inst.paid_amount !== undefined ? inst.paid_amount : isPaid ? inst.amount : 0)}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-slate-600 text-[11px]">
                                  {formatDate(inst.due_date)}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-right">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                      isPaid
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : isReview
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : isPartial
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isReview ? 'Review Pending' : inst.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table 6: Payment History & Records */}
                {rawPayments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                        <Receipt className="h-3 w-3" />
                      </div>
                      Payment History & Transactions
                    </h4>
                    <div className="rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[620px]">
                          <thead className="border-b border-[#E3DDD0] bg-[#FAF8F4] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Ref</th>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Installment(s)</th>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Method</th>
                              <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Date</th>
                              <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">Amount</th>
                              <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">Status</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-[#E3DDD0]">
                          {rawPayments.map((p, pIdx) => {
                            const payId = p.id || p.payment_id || pIdx + 1;
                            const installmentsLabel = Array.isArray(p.installment_numbers) && p.installment_numbers.length > 0
                              ? p.installment_numbers.length === 1
                                ? `Term ${p.installment_numbers[0]}`
                                : `Terms ${p.installment_numbers.join(', ')}`
                              : p.installment_number
                              ? `Term ${p.installment_number}`
                              : 'Course Balance';

                            const rawMethod = String(p.payment_method || 'online').toLowerCase();
                            let method = 'Online';
                            if (rawMethod.includes('cash_upi')) method = 'Cash + UPI';
                            else if (rawMethod.includes('cash')) method = 'Cash';
                            else if (rawMethod.includes('upi')) method = 'UPI';
                            else if (rawMethod.includes('razorpay')) method = 'Razorpay';

                            const pStatus = String(p.status || 'received').toLowerCase();
                            const isApproved = pStatus === 'received' || pStatus === 'approved' || pStatus === 'success';

                            return (
                              <tr key={payId} className="hover:bg-[#FAF8F4]/50">
                                <td className="px-3 sm:px-4 py-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                  #{p.receipt_number || p.payment_reference || payId}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                  {installmentsLabel}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                  {method}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                                  {formatDate(p.payment_date || p.created_at)}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                      isApproved
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {isApproved ? 'Verified' : p.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
