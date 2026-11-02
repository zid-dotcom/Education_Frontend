import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import CourseGrid from '../courses/CourseGrid';
import BranchCourseSelector from '../courses/BranchCourseSelector';
import Button from '../common/Button';
import { getAllCoursesApi } from '../../services/courses';
import { getPublicBranchesWithCoursesApi } from '../../services/branches';
import hero2Image from '../../assets/hero2.png';

const FeaturedCourses = ({ onApply }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCoursesAndBranches = async () => {
      try {
        setLoading(true);
        const [branchesRes, coursesRes] = await Promise.allSettled([
          getPublicBranchesWithCoursesApi(),
          getAllCoursesApi(),
        ]);

        if (!isMounted) return;

        let fetchedBranches = [];
        if (branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value)) {
          fetchedBranches = branchesRes.value;
          setBranches(fetchedBranches);
          if (fetchedBranches.length > 0) {
            setSelectedBranchId(String(fetchedBranches[0].id));
          }
        }

        if (coursesRes.status === 'fulfilled') {
          const apiCourses = coursesRes.value;
          if (Array.isArray(apiCourses)) {
            setAllCourses(apiCourses);
          } else if (apiCourses && Array.isArray(apiCourses.data)) {
            setAllCourses(apiCourses.data);
          } else if (apiCourses && Array.isArray(apiCourses.courses)) {
            setAllCourses(apiCourses.courses);
          }
        }
      } catch (err) {
        console.warn('Could not fetch courses or branches for FeaturedSection:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCoursesAndBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedBranch = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  const branchCourses = selectedBranch
    ? (selectedBranch.courses || [])
    : (!selectedBranchId ? allCourses : []);

  // Dynamically extract unique categories from current branch courses
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    const source = branchCourses.length > 0 ? branchCourses : allCourses;
    source.forEach((c) => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return Array.from(set);
  }, [branchCourses, allCourses]);

  const filteredCourses = useMemo(() => {
    if (filterCategory === 'all') return branchCourses;
    return branchCourses.filter((c) => {
      const catStr = (c.category || c.categoryId || '').toLowerCase().trim();
      return catStr === filterCategory.toLowerCase().trim();
    });
  }, [branchCourses, filterCategory]);

  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="relative left-1/2 -mt-16 mb-12 w-screen -translate-x-1/2 overflow-hidden border-y border-amber-100 shadow-lg shadow-amber-900/10 sm:-mt-20">
          <img
            src={hero2Image}
            alt="Students preparing for career-focused courses"
            className="block h-72 w-full object-cover object-[center_72%] sm:h-[28rem] sm:object-cover sm:object-center lg:h-[34rem]"
          />
        </div>
        
        <SectionHeading
          badge="Popular Programs"
          title="Featured Career Courses"
          subtitle="Explore our top-rated industry certification and diploma programs designed for high-demand employment."
        />

        {/* Branch Filter Selector (Matching Courses Page) */}
        {branches.length > 0 && (
          <div className="w-full max-w-5xl mx-auto mb-10">
            <BranchCourseSelector
              branches={branches}
              selectedBranchId={selectedBranchId}
              onBranchChange={(newBranchId) => {
                setSelectedBranchId(newBranchId);
                setFilterCategory('all');
              }}
            />
          </div>
        )}

        {/* Filter Pills derived dynamically from real courses */}
        {uniqueCategories.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs border border-slate-900 font-extrabold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              All Top Picks
            </button>
            {uniqueCategories.map((catName) => (
              <button
                key={catName}
                type="button"
                onClick={() => setFilterCategory(catName)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === catName
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-900 font-extrabold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        )}

        {/* Course Grid */}
        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold text-slate-600">Loading featured courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <CourseGrid courses={filteredCourses} onApply={onApply} />
        ) : (
          <div className="rounded-2xl border border-[#eadfca] bg-[#fffdf8] px-6 py-12 text-center text-sm text-slate-500">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-[#d9b77b]" />
            <p className="font-semibold text-slate-700">No courses currently listed for this branch</p>
            <p className="mt-1">Please select another branch or explore our full catalog.</p>
          </div>
        )}

        {/* Bottom See All Button */}
        <div className="mt-12 text-center">
          <Button
            to="/courses"
            variant="dark"
            size="lg"
            icon={ArrowRight}
          >
            View All Courses
          </Button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedCourses;
