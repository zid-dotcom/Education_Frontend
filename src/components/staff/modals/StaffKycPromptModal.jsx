import React from 'react';
import { Shield, X, ArrowRight, AlertCircle } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#E3DDD0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: Gold Shield Icon + Close Button */}
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-2xl bg-[#F7EFE0] border border-[#E8DBBE] text-[#9C6B2E] flex items-center justify-center shadow-xs">
            <Shield className="h-6 w-6 stroke-[2]" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Heading & Subtitle */}
        <div className="mt-5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#9C6B2E]">
            Account Setup
          </span>
          <h2
            id="kyc-modal-title"
            className="text-xl sm:text-2xl font-bold text-[#17140F] mt-1 tracking-tight font-serif"
          >
            Complete your account
          </h2>
          <p className="text-xs sm:text-sm text-[#5B5346] mt-2 leading-relaxed">
            Please upload your KYC document. After verification only you can see your enrolled student details.
          </p>
        </div>

        {/* Rejection Alert if rejected */}
        {isRejected && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Document Verification Rejected</span>
            </div>
            <p className="text-rose-700 text-[11.5px] font-medium leading-relaxed">
              {rejectionReason || 'Your previous document submission was rejected. Please re-upload valid documents.'}
            </p>
          </div>
        )}

        {/* Action Option Card (Only KYC documents, NO bank details option) */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              if (typeof onNavigateDocuments === 'function') {
                onNavigateDocuments();
              }
            }}
            className="w-full rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4]/80 hover:bg-[#F3EFE6] p-4 flex items-center justify-between gap-3 text-left transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs hover:border-[#C4B59D]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-[#F7EFE0] border border-[#E8DBBE] text-[#9C6B2E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#17140F] group-hover:text-[#9C6B2E] transition-colors truncate">
                  Upload KYC documents
                </div>
                <p className="text-xs text-[#706757] font-medium mt-0.5 truncate">
                  Aadhaar and PAN verification
                </p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-[#9C6B2E] group-hover:translate-x-1 transition-all shrink-0">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffKycPromptModal;

