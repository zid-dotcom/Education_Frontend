import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Search, GraduationCap } from 'lucide-react';
import CourseCard from '../components/courses/CourseCard';
import BranchCourseSelector from '../components/courses/BranchCourseSelector';
import { getPublicBranchesWithCoursesApi } from '../services/branches';

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
    <div className="w-full max-w-6xl mx-auto pb-10 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header Banner */}
      <header className="rounded-2xl border border-[#E3DDD0] bg-white p-6 sm:p-8 shadow-[0_8px_25px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EDE4] px-3 py-1 text-[11px] font-bold text-[#9C6B2E] border border-[#E3DDD0]">
              <BookOpen className="h-3 w-3 text-[#9C6B2E]" />
              <span>Academic Programs & Courses</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Find your next course
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Explore programs open for enrollment and step into a course to review its curriculum, fee, and next steps.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1EDE4] text-[#9C6B2E]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {totalCourses}
              </div>
              <div className="text-xs font-semibold text-slate-400">Courses open for enrollment</div>
            </div>
          </div>
        </div>
      </header>

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