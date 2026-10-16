import React, { useState, useEffect, useRef } from 'react';
import CourseGrid from '../components/courses/CourseGrid';
import { BookOpen, Loader2 } from 'lucide-react';
import BranchCourseSelector from '../components/courses/BranchCourseSelector';
import { getPublicBranchesWithCoursesApi } from '../services/branches';

// Reveals its children with a fade-up once scrolled into view
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`cr-reveal ${inView ? 'cr-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

const Courses = ({ onOpenApplyModal }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApiCourses = async () => {
      try {
        setLoading(true);
        const apiBranches = await getPublicBranchesWithCoursesApi();
        if (Array.isArray(apiBranches)) {
          setBranches(apiBranches);
          if (apiBranches.length > 0) {
            setSelectedBranchId(String(apiBranches[0].id));
          }
        }
      } catch (err) {
        console.warn('Could not fetch branches and courses from backend API:', err);
        setError(err.message || 'Unable to load branches and courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchApiCourses();
  }, []);

  const selectedBranch = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  const branchCourses = selectedBranch?.courses || [];

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .cr-serif { font-family: 'Fraunces', serif; }
        .cr-sans { font-family: 'Inter', sans-serif; }

        .cr-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cr-reveal.cr-in { opacity: 1; transform: translateY(0); }

        @keyframes cr-spin {
          to { transform: rotate(360deg); }
        }
        .cr-spin { animation: cr-spin 0.9s linear infinite; }
      `}</style>

      {/* PAGE HEADER */}
      <section className="pt-16 pb-6 sm:pt-24 sm:pb-8 bg-white text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-amber-100/50 blur-3xl" />
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="cr-sans text-sm font-semibold text-amber-700 tracking-wide">Academic programs</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h1 className="cr-serif text-4xl sm:text-6xl leading-[1.08] text-[#1C1917]">
            Explore <span className="italic text-amber-700">career-focused</span> courses
          </h1>
          <p className="cr-sans mt-5 text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Browse our full catalog of industry certification and diploma programs.
          </p>
        </Reveal>
      </section>

      {/* MAIN COURSES SECTION */}
      <section className="py-4 sm:py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-8 sm:px-6 sm:pt-4 sm:pb-10 lg:px-8 lg:pt-5">

          {/* Results Info Bar */}
          <div className="cr-sans flex items-center justify-between mb-8 pb-5 border-b border-stone-200">
            <div className="text-sm font-semibold text-[#1C1917]">
              {selectedBranch ? <>Showing <span className="text-amber-700 font-bold">{branchCourses.length}</span> {branchCourses.length === 1 ? 'course' : 'courses'} at {selectedBranch.name}</> : 'Select a branch to browse courses'}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="cr-spin w-7 h-7 text-amber-500" strokeWidth={2} />
              <p className="cr-sans text-sm font-medium text-stone-500">Loading course catalog…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>
          ) : (
            <>
              <BranchCourseSelector branches={branches} selectedBranchId={selectedBranchId} onBranchChange={setSelectedBranchId} />
              <div className="mt-6">
                {selectedBranch ? (
                  <CourseGrid
                    courses={branchCourses}
                    onApply={(courseName) => onOpenApplyModal && onOpenApplyModal(courseName)}
                  />
                ) : (
                  <div className="rounded-2xl border border-[#eadfca] bg-[#fffdf8] px-6 py-12 text-center text-sm text-slate-500"><BookOpen className="mx-auto mb-3 h-8 w-8 text-[#d9b77b]" /><p className="font-semibold text-slate-700">Choose a branch to view its courses</p><p className="mt-1">Your branch catalogue will appear here.</p></div>
                )}
              </div>
            </>
          )}

        </div>
      </section>

    </div>
  );
};

export default Courses;