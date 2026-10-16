import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, Upload, Loader2 } from 'lucide-react';

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
  return (
    <div className="space-y-6 sa-fade">
      {/* Document Status Overview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Verification & Documents</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Submit your government identification (Aadhaar, PAN) and banking records for payroll verification by
            the administration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold border ${
              profileData?.is_verified || String(profileData?.verification_status).toLowerCase() === 'approved'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : String(profileData?.verification_status).toLowerCase() === 'rejected'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        {docMsg.text && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-xs font-semibold flex items-center gap-3 ${
              docMsg.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {docMsg.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span>{docMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateDocuments} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={docForm.aadhaar_number}
                onChange={(e) => setDocForm((p) => ({ ...p, aadhaar_number: e.target.value }))}
                placeholder="12-digit Aadhaar Number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                PAN Card Number
              </label>
              <input
                type="text"
                value={docForm.pan_number}
                onChange={(e) => setDocForm((p) => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Bank Account Number
              </label>
              <input
                type="text"
                value={docForm.bank_account_number}
                onChange={(e) => setDocForm((p) => ({ ...p, bank_account_number: e.target.value }))}
                placeholder="Account Number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Bank IFSC Code
              </label>
              <input
                type="text"
                value={docForm.bank_ifsc}
                onChange={(e) => setDocForm((p) => ({ ...p, bank_ifsc: e.target.value.toUpperCase() }))}
                placeholder="IFSC Code"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>
          </div>

          {/* File Uploads Grid */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Upload Document Copies (PDF, PNG, JPG)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'aadhaar_front', label: 'Aadhaar (Front)' },
                { key: 'aadhaar_back', label: 'Aadhaar (Back)' },
                { key: 'pan_card', label: 'PAN Card Copy' },
                { key: 'bank_passbook', label: 'Bank Passbook / Cheque' },
                { key: 'other_document', label: 'Other Document' },
              ].map(({ key, label }) => (
                <div key={key} className="rounded-2xl border border-slate-100 p-4 bg-slate-50/60">
                  <label className="block text-xs font-bold text-slate-700 mb-2">{label}</label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setDocFiles((p) => ({ ...p, [key]: e.target.files?.[0] || null }))
                    }
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {docFiles[key] && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                      ✓ {docFiles[key].name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={docSubmitting}
              className="rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffDocumentsTab;
