import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, Upload, Loader2, Lock, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getDocumentFileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl !== 'string') return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

const StaffDocumentsTab = ({
  profileData,
  docMsg,
  handleUpdateDocuments,
  docForm,
  setDocForm,
  docFiles,
  setDocFiles,
  docSubmitting,
}) => {
  const isApproved = Boolean(
    profileData?.is_verified ||
    String(profileData?.verification_status || '').toLowerCase() === 'approved'
  );

  const getDocumentUrl = (key) => {
    const docs = profileData?.documents || {};
    const direct = profileData || {};
    switch (key) {
      case 'aadhaar_front':
        return docs.aadhaar_front_url || docs.aadhaar_front || direct.aadhaar_front_url || direct.aadhaar_front;
      case 'aadhaar_back':
        return docs.aadhaar_back_url || docs.aadhaar_back || direct.aadhaar_back_url || direct.aadhaar_back;
      case 'pan_card':
        return docs.pan_card_url || docs.pan_card || direct.pan_card_url || direct.pan_card;
      case 'bank_passbook':
        return docs.bank_passbook_url || docs.bank_passbook || direct.bank_passbook_url || direct.bank_passbook;
      case 'other_document':
        return docs.other_document_url || docs.other_document || direct.other_document_url || direct.other_document;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sa-fade">
      {/* Document Status Overview */}
      <div className="bg-white rounded-3xl p-6 border border-[#E3DDD0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center border border-[#E3DDD0]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-base text-[#17140F]">Verification & Documents</h3>
          </div>
          <p className="text-xs text-[#5B5346] max-w-xl">
            Submit your government identification (Aadhaar, PAN) and banking records for payroll verification by
            the administration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold border ${
              isApproved
                ? 'bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]'
                : String(profileData?.verification_status).toLowerCase() === 'rejected'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-[#FAF8F4] text-[#9C6B2E] border-[#E3DDD0]'
            }`}
          >
            <span className="font-semibold text-slate-500">Status:</span>
            <span className="font-extrabold uppercase tracking-wider">
              {profileData?.verification_status || (profileData?.is_verified ? 'Approved' : 'Pending Verification')}
            </span>
          </span>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3DDD0] shadow-sm">
        {/* Approved locked notification banner */}
        {isApproved && (
          <div className="mb-6 rounded-2xl border border-[#E3DDD0] bg-[#F1EDE4]/70 p-4 text-xs font-semibold text-[#5B5346] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-white text-[#9C6B2E] border border-[#E3DDD0] flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-[#17140F]">Documents Approved & Verified:</span>
                <span className="ml-1 text-[#5B5346]">
                  Your identification and banking details have been verified and locked. This section is read-only.
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9C6B2E] bg-white px-3 py-1 rounded-xl border border-[#E3DDD0] shrink-0">
              <Lock className="h-3 w-3" />
              <span>Read-Only Mode</span>
            </span>
          </div>
        )}

        {docMsg.text && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-xs font-semibold flex items-center gap-3 ${
              docMsg.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-[#E3DDD0] bg-[#F1EDE4] text-[#9C6B2E]'
            }`}
          >
            {docMsg.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span>{docMsg.text}</span>
          </div>
        )}

        <form onSubmit={isApproved ? (e) => e.preventDefault() : handleUpdateDocuments} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                  Aadhaar Number
                </label>
                {isApproved && (
                  <span className="text-[10px] font-bold text-[#9C6B2E] flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              <input
                type="text"
                readOnly={isApproved}
                disabled={isApproved}
                value={docForm.aadhaar_number}
                onChange={(e) => !isApproved && setDocForm((p) => ({ ...p, aadhaar_number: e.target.value }))}
                placeholder="12-digit Aadhaar Number"
                className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold ${
                  isApproved
                    ? 'border-[#E3DDD0] bg-[#FAF8F4]/80 text-[#5B5346] cursor-not-allowed select-text'
                    : 'border-[#E3DDD0] bg-[#FAF8F4] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                  PAN Card Number
                </label>
                {isApproved && (
                  <span className="text-[10px] font-bold text-[#9C6B2E] flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              <input
                type="text"
                readOnly={isApproved}
                disabled={isApproved}
                value={docForm.pan_number}
                onChange={(e) => !isApproved && setDocForm((p) => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold uppercase ${
                  isApproved
                    ? 'border-[#E3DDD0] bg-[#FAF8F4]/80 text-[#5B5346] cursor-not-allowed select-text'
                    : 'border-[#E3DDD0] bg-[#FAF8F4] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                  Bank Account Number
                </label>
                {isApproved && (
                  <span className="text-[10px] font-bold text-[#9C6B2E] flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              <input
                type="text"
                readOnly={isApproved}
                disabled={isApproved}
                value={docForm.bank_account_number}
                onChange={(e) => !isApproved && setDocForm((p) => ({ ...p, bank_account_number: e.target.value }))}
                placeholder="Account Number"
                className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold ${
                  isApproved
                    ? 'border-[#E3DDD0] bg-[#FAF8F4]/80 text-[#5B5346] cursor-not-allowed select-text'
                    : 'border-[#E3DDD0] bg-[#FAF8F4] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                  Bank IFSC Code
                </label>
                {isApproved && (
                  <span className="text-[10px] font-bold text-[#9C6B2E] flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              <input
                type="text"
                readOnly={isApproved}
                disabled={isApproved}
                value={docForm.bank_ifsc}
                onChange={(e) => !isApproved && setDocForm((p) => ({ ...p, bank_ifsc: e.target.value.toUpperCase() }))}
                placeholder="IFSC Code"
                className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold uppercase ${
                  isApproved
                    ? 'border-[#E3DDD0] bg-[#FAF8F4]/80 text-[#5B5346] cursor-not-allowed select-text'
                    : 'border-[#E3DDD0] bg-[#FAF8F4] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20'
                }`}
              />
            </div>
          </div>

          {/* Document Uploads Grid */}
          <div className="pt-4 border-t border-[#E3DDD0]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                {isApproved ? 'Submitted Document Copies (Read-Only)' : 'Upload Document Copies (PDF, PNG, JPG)'}
              </p>
              {isApproved && (
                <span className="text-[10px] font-bold text-[#9C6B2E] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> All documents verified on record
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'aadhaar_front', label: 'Aadhaar (Front)' },
                { key: 'aadhaar_back', label: 'Aadhaar (Back)' },
                { key: 'pan_card', label: 'PAN Card Copy' },
                { key: 'bank_passbook', label: 'Bank Passbook / Cheque' },
                { key: 'other_document', label: 'Other Document' },
              ].map(({ key, label }) => {
                const docUrl = getDocumentUrl(key);
                const fileUrl = getDocumentFileUrl(docUrl);

                return (
                  <div key={key} className="rounded-2xl border border-[#E3DDD0] p-4 bg-[#FAF8F4] flex flex-col justify-between min-h-[96px]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-xs font-bold text-slate-700">{label}</label>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    {isApproved ? (
                      <div className="pt-1">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9C6B2E] hover:text-[#855923] hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View Document</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#8A8175] font-medium italic">
                            Document verified on record
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          onChange={(e) =>
                            setDocFiles((p) => ({ ...p, [key]: e.target.files?.[0] || null }))
                          }
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F1EDE4] file:text-[#9C6B2E] hover:file:bg-[#E3DDD0] cursor-pointer"
                        />
                        {docFiles[key] && (
                          <p className="text-[11px] text-[#9C6B2E] font-semibold mt-1 truncate">
                            ✓ {docFiles[key].name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            {isApproved ? (
              <div className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                <Lock className="h-4 w-4" />
                <span>Documents Approved & Locked</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={docSubmitting}
                className="rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-sm shadow-[#9C6B2E]/20 bg-[#9C6B2E] hover:bg-[#855923] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {docSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Uploading Documents...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Save & Update Documents
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffDocumentsTab;
