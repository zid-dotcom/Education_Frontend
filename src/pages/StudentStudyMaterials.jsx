import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  Download,
  FileText,
  Clock,
  User,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FolderDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentAllStudyMaterialsApi,
  getStudentCourseStudyMaterialsApi,
  downloadStudentStudyMaterialApi,
} from '../services/studymaterials';
import { getMyEnrollmentsApi } from '../services/enrollments';

const useStudyMaterialsFonts = () => {
  useEffect(() => {
    const id = 'student-study-materials-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Recently uploaded';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
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

const StudentStudyMaterials = () => {
  useStudyMaterialsFonts();
  const { token, user } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState({ type: '', text: '' });

  // 1. Fetch Student Approved Courses for filtering
  useEffect(() => {
    if (!token) return;
    getMyEnrollmentsApi(token)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.enrollments)
          ? data.enrollments
          : [];

        const coursesMap = new Map();
        list.forEach((item) => {
          const cId = item.course_id ?? item.course?.id ?? item.course?.course_id;
          const cTitle =
            item.course_title ??
            item.course?.title ??
            item.course_name ??
            item.course?.name ??
            `Course #${cId}`;

          if (cId && !coursesMap.has(String(cId))) {
            coursesMap.set(String(cId), { id: cId, title: cTitle });
          }
        });
        setEnrolledCourses(Array.from(coursesMap.values()));
      })
      .catch((err) => {
        console.warn('Could not load student enrollments:', err);
      });
  }, [token]);

  // 2. Fetch Study Materials: All or by Course
  const fetchMaterials = async (courseId = selectedCourseId) => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      let data;
      if (courseId === 'ALL') {
        data = await getStudentAllStudyMaterialsApi(token);
      } else {
        data = await getStudentCourseStudyMaterialsApi(courseId, token);
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.materials)
        ? data.materials
        : Array.isArray(data?.study_materials)
        ? data.study_materials
        : [];

      setMaterials(list);
    } catch (err) {
      console.warn('Error fetching study materials:', err);
      setError(err.message || 'Failed to load study materials.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials(selectedCourseId);
  }, [token, selectedCourseId]);

  // Filtered materials by search term
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const desc = String(item.description || '').toLowerCase();
      const course = String(
        item.course_title ||
        item.course_name ||
        item.course?.title ||
        ''
      ).toLowerCase();
      const uploader = getUploaderName(item).toLowerCase();
      return (
        title.includes(q) ||
        desc.includes(q) ||
        course.includes(q) ||
        uploader.includes(q)
      );
    });
  }, [materials, searchQuery]);

  // Handle Download PDF
  const handleDownload = async (item) => {
    const materialId = item.id || item.material_id;
    if (!materialId) {
      // If direct URL is present on the item
      const directUrl = item.download_url || item.download_link || item.file_url || item.url || item.file;
      if (directUrl) {
        window.open(directUrl, '_blank');
        return;
      }
      setDownloadNotice({ type: 'error', text: 'Material ID not found for download.' });
      return;
    }

    try {
      setDownloadingId(materialId);
      setDownloadNotice({ type: '', text: '' });
      const safeFileName = `${(item.title || 'study-material').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      await downloadStudentStudyMaterialApi(materialId, token, safeFileName);
      setDownloadNotice({
        type: 'success',
        text: `Downloaded "${item.title || 'Study Material'}" successfully!`,
      });
      setTimeout(() => setDownloadNotice({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: If item has direct URL, try opening it
      const directUrl = item.download_url || item.download_link || item.file_url || item.url || item.file;
      if (directUrl) {
        window.open(directUrl, '_blank');
      } else {
        setDownloadNotice({
          type: 'error',
          text: err.message || 'Failed to download study material PDF.',
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#FAF8F4] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Banner (Warm Light Theme) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#FAF8F4] via-[#F5EFE6] to-[#FAF8F4] border border-[#E3DDD0] p-6 sm:p-8 text-[#17140F] shadow-sm">
        {/* Background Decorative Glow Accents */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#9C6B2E]/5 blur-2xl" />
        <div className="pointer-events-none absolute right-40 bottom-0 h-40 w-40 rounded-full bg-[#F4B942]/10 blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1 text-xs font-bold text-[#9C6B2E] border border-[#E3DDD0] shadow-2xs mb-1">
              <FolderDown className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Academic Resources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17140F] font-['Fraunces',serif]">
              Study Materials & Notes
            </h1>
            <p className="text-xs sm:text-sm text-[#5B5346] font-normal leading-relaxed">
              Access and download verified course PDFs, lecture presentations, and reference guides provided by your faculty.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => fetchMaterials(selectedCourseId)}
              title="Refresh materials"
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#17140F] hover:bg-[#F1EDE4] transition border border-[#E3DDD0] shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 pt-5 border-t border-[#E3DDD0] grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3.5 border border-[#E3DDD0] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8175] block">Total Materials</span>
            <span className="text-lg font-extrabold text-[#9C6B2E]">{materials.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-3.5 border border-[#E3DDD0] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8175] block">Enrolled Courses</span>
            <span className="text-lg font-extrabold text-[#17140F]">{enrolledCourses.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-3.5 border border-[#E3DDD0] shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8175] block">File Type</span>
            <span className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              Verified PDF Guides
            </span>
          </div>
        </div>
      </div>

      {/* Download Status Toast / Alert */}
      {downloadNotice.text && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center justify-between shadow-sm border ${
            downloadNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {downloadNotice.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{downloadNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotice({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-700 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Controls: Course Filter Dropdown & Search */}
      <div className="bg-white rounded-3xl p-5 border border-[#E3DDD0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Course Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-[#9C6B2E]" />
            <label htmlFor="student-course-select" className="text-xs font-bold text-slate-700 cursor-pointer">
              Course Filter:
            </label>
          </div>

          <div className="w-full sm:w-auto min-w-[260px]">
            <select
              id="student-course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-2xl border border-[#E3DDD0] px-4 py-2.5 font-bold text-xs bg-[#FAF8F4] text-[#17140F] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition cursor-pointer"
            >
              <option value="ALL">All Approved Courses</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#E3DDD0] pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F4] text-[#17140F] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition"
            />
          </div>
        </div>
      </div>

      {/* 3. Study Materials Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
          <p className="text-xs font-bold text-slate-500">Loading study materials...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-10 border border-rose-200 text-center shadow-xs">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Error Loading Materials</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => fetchMaterials(selectedCourseId)}
            className="mt-4 rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white hover:bg-[#855923] cursor-pointer"
          >
            Try Again
          </button>
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
              : selectedCourseId !== 'ALL'
              ? 'No study materials have been uploaded for this course yet. Check back soon or contact your faculty.'
              : 'There are currently no study materials available for your enrolled courses.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((item, idx) => {
            const materialId = item.id || item.material_id || idx;
            const title = item.title || 'Untitled Material';
            const description = item.description;
            const courseTitle =
              item.course_title ||
              item.course_name ||
              item.course?.title ||
              (enrolledCourses.find((c) => String(c.id) === String(item.course_id))?.title) ||
              'Course Material';
            const uploaderName = getUploaderName(item);
            const uploadDate = item.created_at || item.uploaded_at || item.date;
            const fileSize = formatBytes(item.file_size || item.size);
            const isDownloading = downloadingId === materialId;

            return (
              <div
                key={materialId}
                className="bg-white rounded-3xl p-5 border border-[#E3DDD0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
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

                  {/* Course Tag */}
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#9C6B2E] mb-2 truncate">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{courseTitle}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-[#9C6B2E] transition-colors">
                    {title}
                  </h3>

                  {/* Description */}
                  {description ? (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400 mt-2">
                      No additional description provided.
                    </p>
                  )}
                </div>

                {/* Footer Card */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{uploaderName}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(uploadDate)}</span>
                    </span>
                  </div>

                  {/* Download PDF Action Button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs font-bold text-white bg-[#9C6B2E] hover:bg-[#855923] shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Downloading PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentStudyMaterials;
