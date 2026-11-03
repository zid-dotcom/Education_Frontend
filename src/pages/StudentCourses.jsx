import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Search, GraduationCap } from 'lucide-react';
import CourseCard from '../components/courses/CourseCard';
import BranchCourseSelector from '../components/courses/BranchCourseSelector';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { CoursesBannerIllustration } from '../components/common/StudentBannerIllustrations';

// Loads the display + body typefaces once, if they aren't already on the page.
const useCatalogFonts = () => {
  useEffect(() => {
    const id = 'catalog-font-link';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const StudentCourses = () => {
  useCatalogFonts();

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getPublicBranchesWithCoursesApi()
      .then((data) => {
        if (isMounted) {
          const availableBranches = Array.isArray(data) ? data : [];
          setBranches(availableBranches);
          if (availableBranches.length > 0) {
            setSelectedBranchId(String(availableBranches[0].id));
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to load courses.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const selectedBranch = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  const courses = selectedBranch?.courses || [];
  const categories = useMemo(() => ['all'], []);
  const totalCourses = useMemo(
    () => branches.reduce((sum, branch) => sum + (branch.courses?.length || 0), 0),
    [branches]
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      const searchableText = `${course.title || ''} ${course.description || ''} ${course.category || ''}`.toLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div className="w-full pb-10 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Hero Banner Matching System Style */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between min-h-[190px] sm:min-h-[210px] md:min-h-[230px]">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-xl lg:max-w-2xl space-y-2.5 z-10 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <BookOpen className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Academic Programs & Courses</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Find your next course
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              Explore programs open for enrollment and step into a course to review its curriculum, fee, and next steps.
            </p>
            {totalCourses > 0 && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-[#17140F]">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{totalCourses} Courses open for enrollment</span>
                </span>
              </div>
            )}
          </div>

          {/* Right SVG Illustration - Fitted flush to top, bottom and right */}
          <div className="w-full md:w-auto flex justify-end items-end md:self-stretch shrink-0 select-none overflow-hidden pr-0">
            <div className="w-full sm:w-[460px] md:w-[480px] lg:w-[540px] xl:w-[600px] h-[190px] sm:h-[220px] md:h-full flex items-end justify-end">
              <CoursesBannerIllustration className="w-full h-full block" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Choose Branch Selector */}
      <section className="w-full">
        <BranchCourseSelector
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          theme="student"
        />
      </section>

      {/* 3. Search and Categories Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {categories.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                  selectedCategory === category
                    ? 'bg-[#9C6B2E] text-white shadow-xs'
                    : 'bg-white text-[#5B5346] border border-[#E3DDD0] hover:bg-[#FAF8F4]'
                }`}
              >
                {category === 'all' ? 'All courses' : category}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-500">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course available' : 'courses available'}
          </div>
        )}

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C6B2E]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-full border border-[#E3DDD0] bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-[#8A8175] outline-none transition focus:border-[#9C6B2E] focus:bg-white focus:ring-2 focus:ring-[#9C6B2E]/20 shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
          />
        </div>
      </section>

      {/* 4. Course Catalog Grid */}
      <main className="w-full">
        {loading && (
          <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] py-20 text-center">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#9C6B2E]" />
            <p className="text-xs font-bold text-slate-600">Loading course catalog…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        {!loading && !error && !selectedBranch && (
          <div className="rounded-2xl border border-dashed border-[#E3DDD0] bg-[#FAF8F4] px-6 py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[#8A8175]" />
            <h2 className="mt-4 text-base font-extrabold text-slate-800">
              Select a branch first
            </h2>
            <p className="mt-1 text-xs text-slate-500">Choose your branch above to see available courses.</p>
          </div>
        )}

        {!loading && !error && selectedBranch && filteredCourses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E3DDD0] bg-[#FAF8F4] px-6 py-16 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-[#8A8175]" />
            <h2 className="mt-4 text-base font-extrabold text-slate-800">
              No matching courses
            </h2>
            <p className="mt-1 text-xs text-slate-500">Try another search term or category.</p>
          </div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center justify-items-center">
            {filteredCourses.map((course) => (
              <div key={course.id} className="w-full max-w-sm flex justify-center">
                <CourseCard course={course} linkPrefix="/student-dashboard/courses" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentCourses;