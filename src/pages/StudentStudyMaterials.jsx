import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  Download,
  FileText,
  Clock,
  Calendar,
  User,
  GraduationCap,
  Layers,
  ChevronDown,
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
import studyMaterialImage from '../assets/studymaterial.png';

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
    <div className="w-full pb-8 space-y-6 opacity-0 animate-[pageFadeIn_0.4s_ease-out_forwards]">
      <style>{`
        @keyframes pageFadeIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between min-h-[190px] sm:min-h-[210px] md:min-h-[210px]">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-xl lg:max-w-2xl space-y-2.5 z-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <FolderDown className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Academic Resources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Study Materials & Notes
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              Access and download verified course PDFs, lecture presentations, and reference guides provided by your faculty.
            </p>
            <div className="pt-1 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchMaterials(selectedCourseId)}
                title="Refresh materials"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] hover:bg-[#F1EDE4] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Materials</span>
              </button>
            </div>
          </div>

          {/* Right study materials illustration */}
          <div className="w-full md:w-auto flex justify-end items-end md:self-stretch shrink-0 select-none overflow-hidden pr-0">
            <div className="w-full sm:w-[460px] md:w-[480px] lg:w-[540px] xl:w-[600px] h-[190px] sm:h-[220px] md:h-full flex items-end justify-center md:justify-end">
              <img
                src={studyMaterialImage}
                alt="Study materials and notes"
                className="w-full h-full object-contain object-center md:w-[92%] md:h-[92%] md:object-right-bottom block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Standalone Stats Cards (Matching Reference Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Total Materials */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-[#ECDDC6] shadow-xs flex items-center gap-5">
          <div className="absolute right-0 bottom-0 w-36 h-full bg-gradient-to-l from-[#FAF1DF]/50 to-transparent pointer-events-none rounded-r-3xl" />
          <div className="h-14 w-14 rounded-2xl bg-[#FAF1DF] border border-[#ECDDC6] flex items-center justify-center text-[#9C6B2E] shrink-0 shadow-2xs">
            <Layers className="h-7 w-7 text-[#9C6B2E]" />
          </div>
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175] block">
              TOTAL MATERIALS
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-[#D97706] leading-none my-1 block">
              {materials.length}
            </span>
            <span className="text-xs text-[#6B6252] font-medium block">
              Available study resources
            </span>
          </div>
        </div>

        {/* Card 2: Enrolled Courses */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-[#ECDDC6] shadow-xs flex items-center gap-5">
          <div className="absolute right-0 bottom-0 w-36 h-full bg-gradient-to-l from-[#FAF1DF]/50 to-transparent pointer-events-none rounded-r-3xl" />
          <div className="h-14 w-14 rounded-2xl bg-[#FAF1DF] border border-[#ECDDC6] flex items-center justify-center text-[#9C6B2E] shrink-0 shadow-2xs">
            <GraduationCap className="h-7 w-7 text-[#9C6B2E]" />
          </div>
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175] block">
              ENROLLED COURSES
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-[#17140F] leading-none my-1 block">
              {enrolledCourses.length}
            </span>
            <span className="text-xs text-[#6B6252] font-medium block">
              Your active courses
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

      {/* 3. Controls: Course Filter Dropdown & Search (Matching Reference Layout) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#ECDDC6] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Course Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-700">
            <Filter className="h-4 w-4 text-[#9C6B2E]" />
            <label htmlFor="student-course-select" className="cursor-pointer">
              Course Filter:
            </label>
          </div>

          <div className="relative w-full sm:w-auto min-w-[240px] sm:min-w-[280px]">
            <select
              id="student-course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-full border border-[#ECDDC6] pl-4 pr-10 py-2 font-semibold text-xs bg-[#FAF8F4] text-[#17140F] focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition cursor-pointer appearance-none"
            >
              <option value="ALL">All Approved Courses</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Search Field */}
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#ECDDC6] pl-9 pr-4 py-2 text-xs bg-[#FAF8F4] text-[#17140F] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 transition"
            />
          </div>
        </div>
      </div>

      {/* 4. Study Materials Content */}
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
        <div className="bg-white rounded-3xl p-12 border border-[#ECDDC6] text-center shadow-xs">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECDDC6] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      <FileText className="h-3 w-3" />
                      PDF Document
                    </span>
                    {fileSize && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {fileSize}
                      </span>
                    )}
                  </div>

                  {/* Course Tag */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9C6B2E] mb-2 truncate">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{courseTitle}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-[#17140F] line-clamp-2 leading-snug group-hover:text-[#9C6B2E] transition-colors">
                    {title}
                  </h3>

                  {/* Description */}
                  {description ? (
                    <p className="text-xs text-[#6B6252] mt-1.5 line-clamp-3 leading-relaxed">
                      {description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400 mt-1.5">
                      No additional description provided.
                    </p>
                  )}
                </div>

                {/* Footer Card */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-[#6B6252]">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{uploaderName}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(uploadDate)}</span>
                    </span>
                  </div>

                  {/* Download PDF Action Button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white bg-[#9C6B2E] hover:bg-[#855923] shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
