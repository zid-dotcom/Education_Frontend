import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStaffModalBlur } from '../../../utils/useStaffModalBlur';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const StaffStudyMaterialModal = ({
  isOpen,
  onClose,
  activeCourseObj,
  materialForm,
  setMaterialForm,
  materialMsg,
  setMaterialMsg,
  materialSubmitting,
  handleUploadMaterial,
}) => {
  useStaffModalBlur(isOpen);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Check PDF type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      if (setMaterialMsg) {
        setMaterialMsg({ type: 'error', text: 'Please select a valid PDF file.' });
      }
      return;
    }

    // Check size <= 10MB
    if (file.size > MAX_FILE_SIZE) {
      if (setMaterialMsg) {
        setMaterialMsg({
          type: 'error',
          text: `File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        });
      }
      return;
    }

    if (setMaterialMsg) setMaterialMsg({ type: '', text: '' });
    setMaterialForm((prev) => ({ ...prev, file }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sa-fade">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-xl max-h-[90vh] overflow-y-auto flex-col rounded-3xl bg-white shadow-2xl border border-[#E3DDD0] sa-rise">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3DDD0] px-6 py-5 bg-[#FAF8F4]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Upload Study Material
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeCourseObj?.title || 'Selected Course'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUploadMaterial} className="p-6 space-y-4">
          {materialMsg?.text && (
            <div
              className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
                materialMsg.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-[#E3DDD0] bg-[#F1EDE4] text-[#9C6B2E]'
              }`}
            >
              {materialMsg.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9C6B2E]" />
              )}
              <span>{materialMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Material Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 4 - Advanced Candlestick Patterns"
              value={materialForm.title}
              onChange={(e) =>
                setMaterialForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#9C6B2E] focus:outline-none focus:ring-1 focus:ring-[#9C6B2E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary or instructions about this material..."
              value={materialForm.description}
              onChange={(e) =>
                setMaterialForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#9C6B2E] focus:outline-none focus:ring-1 focus:ring-[#9C6B2E]"
            />
          </div>

          {/* PDF File Upload Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              PDF Document <span className="text-rose-500">*</span>{' '}
              <span className="text-[11px] font-normal text-slate-400">(Required PDF, max 10 MB)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-[#9C6B2E] bg-[#FAF8F4]'
                  : materialForm.file
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-[#E3DDD0] bg-[#FAF8F4]/50 hover:bg-[#FAF8F4] hover:border-[#9C6B2E]/50'
              }`}
            >
              {materialForm.file ? (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                    {materialForm.file.name}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {formatFileSize(materialForm.file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialForm((prev) => ({ ...prev, file: null }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-3 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove and choose another file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center mb-2">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Click to browse or drag & drop PDF here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts PDF files only up to 10 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={materialSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={materialSubmitting || !materialForm.file || !materialForm.title?.trim()}
              className="rounded-xl bg-[#9C6B2E] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#855923] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {materialSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StaffStudyMaterialModal;
