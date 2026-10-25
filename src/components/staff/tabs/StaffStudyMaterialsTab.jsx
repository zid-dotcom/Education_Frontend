import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Loader2,
  FileText,
  Clock,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  User,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

const formatCardDateTime = (dateVal) => {
  if (!dateVal) return 'Recently uploaded';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
};

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getUploaderName = (item) => {
  if (!item) return 'Faculty';
  const uploader = item.uploaded_by || item.uploader || item.staff;
  if (uploader && typeof uploader === 'object') {
    return (
      uploader.staff_name ||
      uploader.name ||
      uploader.full_name ||
      uploader.email ||
      (uploader.staff_id ? `Staff #${uploader.staff_id}` : 'Faculty')
    );
  }
  if (typeof item.uploader_name === 'string' && item.uploader_name) {
    return item.uploader_name;
  }
  if (typeof item.staff_name === 'string' && item.staff_name) {
    return item.staff_name;
  }
  if (typeof item.uploaded_by === 'string' && item.uploaded_by) {
    return item.uploaded_by;
  }
  return 'Faculty';
};

const StaffStudyMaterialsTab = ({
  assignedCourses = [],
  selectedCourseId,
  setSelectedCourseId,
  materials = [],
  materialsLoading = false,
  onOpenUploadModal,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeCourse = useMemo(() => {
    return assignedCourses.find(
      (c) => String(c.id || c.course_id) === String(selectedCourseId)
    );
  }, [assignedCourses, selectedCourseId]);

  const filteredMaterials = useMemo(() => {
    if (!Array.isArray(materials)) return [];
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const desc = String(item.description || '').toLowerCase();
      const uploader = getUploaderName(item).toLowerCase();
      return title.includes(q) || desc.includes(q) || uploader.includes(q);
    });
  }, [materials, searchQuery]);

  const handleDownload = (material) => {
    const downloadUrl =
      material.download_url ||
      material.download_link ||
      material.file_url ||
      material.url ||
      material.file;

    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      alert('Download URL is not available for this material.');
    }
  };

  return (
    <div className="space-y-6 sa-fade">
      {/* Top Header Card: Course Selector, Search & Action Button */}
      <div className="bg-white rounded-3xl p-5 border border-[#E3DDD0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          {/* Course Selector */}
          <div className="w-full sm:w-auto min-w-[220px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175] block mb-1">
              Assigned Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2 font-bold text-xs bg-[#FAF8F4] text-[#17140F] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer"
            >
              {assignedCourses.length === 0 ? (
                <option value="">No Assigned Courses</option>
              ) : (
                assignedCourses.map((c) => {
                  const id = c.id || c.course_id;
                  return (
                    <option key={id} value={id}>
                      {c.title}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64 pt-0 sm:pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#E3DDD0] pl-10 pr-4 py-2 text-xs bg-[#FAF8F4] text-[#17140F] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh materials"
              className="p-2.5 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] text-[#5B5346] hover:bg-[#F1EDE4] transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${materialsLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenUploadModal}
            disabled={!selectedCourseId}
            className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#9C6B2E]/20 bg-[#9C6B2E] hover:bg-[#855923] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Study Material</span>
          </button>
        </div>
      </div>

      {/* Materials List Grid */}
      {materialsLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
          <p className="text-xs font-bold text-slate-500">Loading course study materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#E3DDD0] text-center shadow-xs">
          <div className="h-16 w-16 rounded-2xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-[#9C6B2E]" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Study Materials Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {searchQuery
              ? `No study materials match your search "${searchQuery}".`
              : activeCourse
              ? `No study materials have been uploaded for ${activeCourse.title} yet. Share course notes, guides, and PDF reference files with your students.`
              : 'Select a course to view or upload study materials.'}
          </p>
          {selectedCourseId && !searchQuery && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#9C6B2E] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#855923] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Upload First Study Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((item, idx) => {
            const materialId = item.id || item.material_id || idx;
            const uploaderName = getUploaderName(item);
            const uploadDate = item.created_at || item.uploaded_at || item.date;
            const downloadUrl =
              item.download_url ||
              item.download_link ||
              item.file_url ||
              item.url ||
              item.file;
            const fileSize = formatBytes(item.file_size || item.size);

            return (
              <div
                key={materialId}
                className="bg-white rounded-3xl p-5 border border-[#E3DDD0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badge: PDF Tag & Size */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      <FileText className="h-3.5 w-3.5" />
                      PDF Document
                    </span>
                    {fileSize && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {fileSize}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-[#9C6B2E] transition-colors">
                    {item.title}
                  </h4>

                  {/* Description */}
                  {item.description ? (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400 mt-2">
                      No additional description provided.
                    </p>
                  )}
                </div>

                {/* Footer: Uploader, Date & Download Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{uploaderName}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatCardDateTime(uploadDate)}</span>
                    </span>
                  </div>

                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-[#9C6B2E] bg-[#FAF8F4] border border-[#E3DDD0] hover:bg-[#F1EDE4] transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download / View PDF</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-[#9C6B2E] bg-[#FAF8F4] border border-[#E3DDD0] hover:bg-[#F1EDE4] transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffStudyMaterialsTab;
