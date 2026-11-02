import React from 'react';
import { Shield, X, ArrowRight, AlertCircle, ShieldCheck, Users, FileText } from 'lucide-react';

/**
 * Helper to determine KYC status and whether the prompt modal should be shown.
 * Rules:
 * 1. If status is approved -> do NOT show popup.
 * 2. If status is rejected -> SHOW popup (with rejection reason if present).
 * 3. If GET API has documents data (and not rejected) -> do NOT show popup.
 * 4. If GET API does not have documents data -> SHOW popup.
 */
export const getKycStatusInfo = (profileData, user) => {
  const profile = profileData?.data || profileData || user || {};

  const isApproved = Boolean(
    profile.is_verified ||
    String(profile.verification_status || '').toLowerCase() === 'approved' ||
    String(profile.document_status || '').toLowerCase() === 'approved'
  );

  const isRejected =
    String(profile.verification_status || '').toLowerCase() === 'rejected' ||
    String(profile.document_status || '').toLowerCase() === 'rejected';

  // Check if documents object exists and has non-empty values
  const docs = profile.documents;
  let hasDocuments = false;

  if (docs && typeof docs === 'object') {
    hasDocuments = Object.entries(docs).some(([key, val]) => {
      return typeof val === 'string' && val.trim().length > 0;
    });
  }

  // Also check top-level fields in case backend returns flattened document URLs
  if (!hasDocuments) {
    const topLevelUrls = [
      profile.aadhaar_front_url,
      profile.aadhaar_front,
      profile.pan_card_url,
      profile.pan_card,
      profile.bank_passbook_url,
      profile.bank_passbook,
      profile.aadhaar_back_url,
      profile.aadhaar_back,
      profile.other_document_url,
      profile.other_document,
    ];
    hasDocuments = topLevelUrls.some(
      (val) => typeof val === 'string' && val.trim().length > 0
    );
  }

  // Strict modal display condition as requested
  const shouldPromptKyc = !isApproved && (!hasDocuments || isRejected);

  const rejectionReason =
    profile.verification_rejection_reason ||
    profile.rejection_reason ||
    profile.verification_reason ||
    '';

  return {
    isApproved,
    isRejected,
    hasDocuments,
    shouldPromptKyc,
    rejectionReason,
  };
};

/**
 * Clean SVG/CSS Illustration matching Aadhaar & PAN verification graphic
 */
const KycDocumentsGraphic = () => {
  return (
    <div className="relative w-full max-w-[300px] h-[190px] mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* Soft warm ambient background glow */}
      <div className="absolute inset-2 bg-gradient-to-tr from-[#fbf2e3]/70 via-[#fff8ed] to-[#faeedb]/50 rounded-3xl -z-10" />

      {/* Decorative sparkle 1 (top right) */}
      <div className="absolute top-2 right-4 text-amber-500 animate-pulse">
        <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 24 24">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>

      {/* Decorative sparkle 2 (bottom left) */}
      <div className="absolute bottom-5 left-3 text-amber-400">
        <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>

      {/* Cards Wrapper */}
      <div className="relative w-[255px] h-[155px]">
        {/* 1. AADHAAR CARD (Back Card, tilted -5deg) */}
        <div
          className="absolute top-0 left-0 w-[195px] h-[116px] rounded-2xl bg-white border border-[#e2e8f0] shadow-[0_6px_18px_rgba(0,0,0,0.06)] p-2.5 overflow-hidden"
          style={{ transform: 'rotate(-5deg)' }}
        >
          {/* Tricolor Header Bar */}
          <div className="flex flex-col gap-[2px] w-full mb-1.5">
            <div className="h-[3px] w-full bg-[#f97316] rounded-full" />
            <div className="h-[3px] w-full bg-[#16a34a] rounded-full" />
          </div>

          {/* Aadhaar Sun Emblem Top Right */}
          <div className="absolute top-2 right-2.5">
            <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="5" fill="#ef4444" />
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="18"
                  y1="5"
                  x2="18"
                  y2="8"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 18 18)`}
                />
              ))}
            </svg>
          </div>

          {/* Card Content */}
          <div className="flex gap-2 mt-2">
            {/* Avatar placeholder */}
            <div className="w-9 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            {/* Details lines */}
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2 w-14 bg-slate-200 rounded" />
              <div className="h-1.5 w-18 bg-slate-100 rounded" />
              <div className="h-1.5 w-12 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Bottom Aadhaar Number block */}
          <div className="mt-2 flex items-center gap-1.5 px-0.5">
            <div className="h-1 w-6 bg-slate-200 rounded-full" />
            <div className="h-1 w-6 bg-slate-200 rounded-full" />
            <div className="h-1 w-6 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* 2. PAN CARD (Front Card, overlapping at bottom right) */}
        <div
          className="absolute bottom-0 right-2 w-[185px] h-[110px] rounded-2xl bg-[#dbe8fc] border border-[#bcd5f8] shadow-[0_10px_25px_rgba(30,58,138,0.14)] p-2.5 overflow-hidden"
          style={{ transform: 'rotate(1.5deg)' }}
        >
          {/* Header: PAN text + Chip */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black tracking-wider text-[#1e3a8a] font-sans">PAN</span>
            <div className="w-5 h-3.5 rounded bg-[#93c5fd]/50 border border-[#60a5fa]/60 flex items-center justify-center">
              <div className="w-2.5 h-1.5 rounded-xs border border-[#3b82f6]/40" />
            </div>
          </div>

          {/* Card Content */}
          <div className="flex gap-2">
            {/* Avatar placeholder */}
            <div className="w-8 h-10 rounded-lg bg-[#c4daf8] border border-[#a8c7f2] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            {/* Details lines */}
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2 w-12 bg-[#93c5fd] rounded" />
              <div className="h-1.5 w-16 bg-[#bfdbfe] rounded" />
              <div className="h-1.5 w-10 bg-[#bfdbfe] rounded" />
            </div>
          </div>

          {/* Bottom signature line */}
          <div className="mt-2 flex items-center justify-between">
            <div className="h-1.5 w-10 bg-[#bfdbfe] rounded" />
          </div>
        </div>

        {/* 3. VERIFIED GREEN CHECKMARK BADGE */}
        <div className="absolute -bottom-1 -right-0.5 w-9 h-9 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-lg border-[2.5px] border-white">
          <svg className="w-5 h-5 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const StaffKycPromptModal = ({
  isOpen,
  onClose,
  onNavigateDocuments,
  profileData,
  user,
}) => {
  if (!isOpen) return null;

  const { isRejected, rejectionReason } = getKycStatusInfo(profileData, user);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-3xl rounded-[28px] bg-white p-6 sm:p-8 md:p-9 shadow-2xl border border-[#e6dfd3] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button in top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Close"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Section: Left Text + Right Illustration */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Account Setup Info */}
          <div className="md:col-span-7 flex flex-col justify-center">
            {/* Shield Icon + Tag */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#faf3e8] border border-[#ebdcc4] text-[#9c6b2e] flex items-center justify-center shrink-0 shadow-2xs">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-widest text-[#9c6b2e]">
                Account Setup
              </span>
            </div>

            {/* Title */}
            <h2
              id="kyc-modal-title"
              className="text-2xl sm:text-3xl font-extrabold text-[#17140f] mt-4 tracking-tight"
            >
              Complete your account
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#6b6255] mt-2 sm:mt-2.5 leading-relaxed max-w-md">
              Please upload your KYC document to verify your identity. After verification only you can see your enrolled student details.
            </p>

            {/* Rejection Alert if rejected */}
            {isRejected && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>Document Verification Rejected</span>
                </div>
                <p className="text-rose-700 text-[11px] font-medium leading-relaxed">
                  {rejectionReason || 'Your previous document submission was rejected. Please re-upload valid documents.'}
                </p>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => {
                  if (typeof onNavigateDocuments === 'function') {
                    onNavigateDocuments();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl bg-[#9c6b2e] hover:bg-[#855721] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
              >
                Upload KYC Documents <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Aadhaar & PAN Illustration */}
          <div className="md:col-span-5 flex items-center justify-center">
            <KycDocumentsGraphic />
          </div>
        </div>

        {/* Bottom Section: Why KYC is required? */}
        <div className="mt-6 sm:mt-7 rounded-2xl border border-[#ede5d8] bg-[#faf8f4] p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-extrabold text-[#17140f] tracking-tight mb-3 sm:mb-4">
            Why KYC is required?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 items-center">
            {/* Benefit 1 */}
            <div className="flex items-center gap-3 sm:pr-4">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#10b981] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-[#17140f] leading-snug">
                  Secure &amp; Verified Access
                </p>
                <p className="text-[11px] text-[#6b6255] mt-0.5 leading-snug">
                  Keeps your account safe and secure
                </p>
              </div>
            </div>

            {/* Benefit 2 (with vertical dividers on desktop) */}
            <div className="flex items-center gap-3 sm:px-4 sm:border-x sm:border-[#e5ded0]">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-[#17140f] leading-snug">
                  View Enrolled Students
                </p>
                <p className="text-[11px] text-[#6b6255] mt-0.5 leading-snug">
                  After verification you can see your enrolled details
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-center gap-3 sm:pl-4">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-[#17140f] leading-snug">
                  As per Compliance
                </p>
                <p className="text-[11px] text-[#6b6255] mt-0.5 leading-snug">
                  Required for regulatory and institutional policies
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffKycPromptModal;
