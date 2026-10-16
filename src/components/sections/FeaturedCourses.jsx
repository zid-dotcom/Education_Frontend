import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import CourseGrid from '../courses/CourseGrid';
import Button from '../common/Button';
import { getAllCoursesApi } from '../../services/courses';
import hero2Image from '../../assets/hero2.png';

const FeaturedCourses = ({ onApply }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiCourses = async () => {
      try {
        setLoading(true);
        const apiCourses = await getAllCoursesApi();
        if (Array.isArray(apiCourses)) {
          setAllCourses(apiCourses);
        } else if (apiCourses && Array.isArray(apiCourses.data)) {
          setAllCourses(apiCourses.data);
        } else if (apiCourses && Array.isArray(apiCourses.courses)) {
          setAllCourses(apiCourses.courses);
        } else {
           console.warn('API did not return an array of courses', apiCourses);
           setAllCourses([]);
        }
      } catch (err) {
        console.warn('Could not fetch courses for FeaturedSection:', err);
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApiCourses();
  }, []);

  // Dynamically extract unique categories from loaded courses
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    allCourses.forEach((c) => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return Array.from(set);
  }, [allCourses]);

  const filteredCourses = allCourses.filter((c) => {
    if (filterCategory === 'all') return true;
    const catStr = (c.category || c.categoryId || '').toLowerCase().trim();
    return catStr === filterCategory.toLowerCase().trim();
  });

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

        {/* Filter Pills derived dynamically from real courses */}
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

        {/* Course Grid */}
        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold text-slate-600">Loading featured courses...</p>
          </div>
        ) : (
          <CourseGrid courses={filteredCourses} onApply={onApply} />
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
