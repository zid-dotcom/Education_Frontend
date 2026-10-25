import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  BookOpen,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';

const StaffProfileTab = ({
  profileData,
  user,
  branchName,
  branchLocation,
  assignedCourses,
  coursesCatalog = [],
  setActiveTab,
}) => {
  return (
    <div className="space-y-6 sa-fade">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3DDD0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 shadow-md bg-gradient-to-br from-[#9C6B2E] to-[#B88746] text-white">
            {profileData?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {profileData?.name || user?.name || 'Staff Member'}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  String(profileData?.account_status || 'active').toLowerCase() === 'active'
                    ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {profileData?.account_status || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-[#9C6B2E]">
                Staff Code: {profileData?.staff_code || user?.staff_code || '—'}
              </span>
              {profileData?.created_at && (
                <span>
                  • Member Since:{' '}
                  {new Date(profileData.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className="rounded-xl px-4 py-2.5 text-xs font-bold transition bg-[#F1EDE4] hover:bg-[#E3DDD0] text-[#9C6B2E] border border-[#E3DDD0] cursor-pointer shadow-xs"
          >
            Edit / Upload KYC Documents
          </button>
        </div>
      </div>

      {/* Grid of Profile Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Personal & Contact Information */}
        <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#E3DDD0] flex items-center justify-between bg-[#FAF8F4]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <User className="h-3.5 w-3.5" />
              </div>
              Personal & Contact Information
            </h4>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[#E3DDD0] font-medium">
                <tr className="bg-[#FAF8F4]/60">
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Full Name</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-800 font-bold">{profileData?.name || '—'}</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Email Address</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-800 font-medium">
                    {profileData?.email ? (
                      <a href={`mailto:${profileData.email}`} className="text-[#9C6B2E] hover:text-[#855923] hover:underline inline-flex items-center gap-1.5 font-semibold">
                        <Mail className="h-3 w-3" />
                        {profileData.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                <tr className="bg-[#FAF8F4]/60">
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Phone Number</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-800 font-mono">
                    {profileData?.phone ? (
                      <a href={`tel:${profileData.phone}`} className="hover:text-[#9C6B2E] inline-flex items-center gap-1.5 font-bold">
                        <Phone className="h-3 w-3 text-[#9C6B2E]" />
                        {profileData.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Residential Address</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-700 font-medium">
                    {profileData?.address ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {profileData.address}
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

        {/* 2. Employment & Branch Profile */}
        <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#E3DDD0] flex items-center justify-between bg-[#FAF8F4]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              Branch & Employment Profile
            </h4>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[#E3DDD0] font-medium">
                <tr className="bg-[#FAF8F4]/60">
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Assigned Branch</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-800 font-bold">
                    {profileData?.branch?.branch_name || profileData?.branch_name || branchName || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Branch Location</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-700 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#9C6B2E]" />
                      {profileData?.branch?.branch_location || profileData?.branch_location || branchLocation || '—'}
                    </span>
                  </td>
                </tr>
                <tr className="bg-[#FAF8F4]/60">
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Employment Status</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        String(profileData?.employment_status || 'active').toLowerCase() === 'active'
                          ? 'bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {profileData?.employment_status || 'Active'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Monthly Salary</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-[#9C6B2E] font-bold font-mono text-sm">
                    {profileData?.salary != null
                      ? `₹${Number(profileData.salary).toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                </tr>
                <tr className="bg-[#FAF8F4]/60">
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-500 w-1/3 font-semibold">Staff Code</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-slate-800 font-mono font-bold">
                    {profileData?.staff_code || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Assigned Courses */}
        <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-[#E3DDD0] flex items-center justify-between bg-[#FAF8F4]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              Assigned Teaching Courses ({profileData?.courses?.length || assignedCourses.length || 0})
            </h4>
          </div>
          <div className="p-6">
            {profileData?.courses && profileData.courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profileData.courses.map((crs, idx) => {
                  const catalogMatch = coursesCatalog.find(
                    (c) => String(c.id) === String(crs.course_id || crs.id)
                  );
                  const subtitle =
                    crs.duration ||
                    crs.category ||
                    catalogMatch?.duration ||
                    catalogMatch?.category ||
                    '';
                  return (
                    <div
                      key={crs.course_id || idx}
                      className="p-5 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4]/40 hover:bg-white hover:border-[#9C6B2E]/50 transition-all shadow-xs flex flex-col justify-between"
                    >
                      <p className="font-bold text-sm text-slate-800">
                        {crs.course_title || crs.title || catalogMatch?.title || 'Assigned Course'}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>{subtitle}</span>
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                          Assigned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : assignedCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {assignedCourses.map((crs, idx) => (
                  <div
                    key={crs.id || idx}
                    className="p-5 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4]/40 hover:bg-white hover:border-[#9C6B2E]/50 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <p className="font-bold text-sm text-slate-800">{crs.title}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{crs.duration || crs.category || 'Curriculum'}</span>
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                        Assigned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">No courses assigned yet.</p>
            )}
          </div>
        </div>

        {/* 4. KYC Identification & Banking Records */}
        <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-[#E3DDD0] flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F4]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              KYC Documents & Banking Verification Records
            </h4>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                String(profileData?.verification_status).toLowerCase() === 'approved' || profileData?.is_verified
                  ? 'bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]'
                  : String(profileData?.verification_status).toLowerCase() === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className="text-[11px] font-medium text-slate-500 normal-case">Status:</span>
              <span className="font-extrabold uppercase">
                {profileData?.verification_status || (profileData?.is_verified ? 'Approved' : 'Pending')}
              </span>
            </span>
          </div>

          {/* Responsive Grid for KYC & Banking Records */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Aadhaar Number
              </p>
              <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                {profileData?.aadhaar_number || <span className="text-slate-400 font-sans font-normal italic">Not submitted</span>}
              </p>
            </div>

            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                PAN Card Number
              </p>
              <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm uppercase">
                {profileData?.pan_number || <span className="text-slate-400 font-sans font-normal italic">Not submitted</span>}
              </p>
            </div>

            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Bank Account Number
              </p>
              <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                {profileData?.bank_account_number || <span className="text-slate-400 font-sans font-normal italic">Not submitted</span>}
              </p>
            </div>

            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Bank IFSC Code
              </p>
              <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm uppercase">
                {profileData?.bank_ifsc || <span className="text-slate-400 font-sans font-normal italic">Not submitted</span>}
              </p>
            </div>

            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between sm:col-span-1 lg:col-span-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Verification Submitted At
              </p>
              <p className="font-semibold text-slate-700 text-xs sm:text-sm">
                {profileData?.verification_submitted_at
                  ? new Date(profileData.verification_submitted_at).toLocaleString('en-IN')
                  : '—'}
              </p>
            </div>

            <div className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#E3DDD0] flex flex-col justify-between sm:col-span-1 lg:col-span-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Verification Approved At
              </p>
              {Boolean(
                profileData?.verification_approved_at &&
                (String(profileData?.verification_status || '').toLowerCase() === 'approved' ||
                  Boolean(profileData?.is_verified) ||
                  !profileData?.verification_status)
              ) ? (
                <p className="font-semibold text-[#9C6B2E] text-xs sm:text-sm">
                  {new Date(profileData.verification_approved_at).toLocaleString('en-IN')}
                </p>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 w-fit">
                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Verification is not approved yet
                </span>
              )}
            </div>

            {profileData?.verification_rejection_reason && (
              <div className="bg-rose-50/80 rounded-2xl p-4 border border-rose-200 sm:col-span-2 lg:col-span-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 mb-1">
                  Rejection Reason
                </p>
                <p className="text-xs sm:text-sm text-rose-900 font-medium">
                  {profileData.verification_rejection_reason}
                </p>
              </div>
            )}
          </div>

            {/* Uploaded Document Files List */}
            <div className="p-6 border-t border-[#E3DDD0] bg-[#FAF8F4]/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Document Upload Files
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: 'Aadhaar Front', url: profileData?.documents?.aadhaar_front_url },
                  { label: 'Aadhaar Back', url: profileData?.documents?.aadhaar_back_url },
                  { label: 'PAN Card', url: profileData?.documents?.pan_card_url },
                  { label: 'Bank Passbook', url: profileData?.documents?.bank_passbook_url },
                  { label: profileData?.documents?.other_document_name || 'Other Document', url: profileData?.documents?.other_document_url },
                ].map((d, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-[#E3DDD0] bg-white text-center flex flex-col justify-between shadow-xs"
                  >
                    <span className="text-[11px] font-bold text-slate-700 truncate">{d.label}</span>
                    <div className="mt-2.5">
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C6B2E] hover:text-[#855923] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View File
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Not uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default StaffProfileTab;
