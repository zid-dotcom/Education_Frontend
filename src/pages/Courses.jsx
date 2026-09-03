import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading';
import SearchBar from '../components/common/SearchBar';
import CourseGrid from '../components/courses/CourseGrid';
import { BookOpen, Loader2 } from 'lucide-react';
import { getAllCoursesApi } from '../services/courses';

const Courses = ({ onOpenApplyModal }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    const fetchApiCourses = async () => {
      try {
        setLoading(true);
        const apiCourses = await getAllCoursesApi();
        if (Array.isArray(apiCourses)) {
          setAllCourses(apiCourses);
        }
      } catch (err) {
        console.warn('Could not fetch courses from backend API:', err);
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApiCourses();
  }, []);

  // Dynamically derive category pills from real courses
  const dynamicCategories = useMemo(() => {
    const map = new Map();
    allCourses.forEach((c) => {
      if (c.category && c.category.trim()) {
        const catName = c.category.trim();
        const key = catName.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { id: catName, name: catName });
        }
      }
    });
    return Array.from(map.values());
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((c) => {
      // Category check
      const courseCat = (c.category || c.categoryId || '').toLowerCase().trim();
      const matchesCategory =
        selectedCategory === 'all' ||
        courseCat === selectedCategory.toLowerCase().trim();
      
      // Search check
      const query = searchQuery.toLowerCase().trim();
      const titleStr = c.title || c.name || '';
      const descStr = c.description || c.shortDescription || '';
      
      const matchesSearch =
        !query ||
        titleStr.toLowerCase().includes(query) ||
        descStr.toLowerCase().includes(query) ||
        (c.category && c.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [allCourses, searchQuery, selectedCategory]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSearchParams({});
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* PAGE HEADER BANNER */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-100/60 via-amber-50/30 to-white border-b border-amber-200/60 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-300 mb-4">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Academic Programs</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Explore Professional Career Courses
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Browse our comprehensive industry certification & diploma courses.
          </p>
        </div>
      </section>

      {/* MAIN COURSES SECTION WITH SEARCH & FILTER */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search & Category Filter Controls */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategoryChange}
            categories={dynamicCategories}
          />

          {/* Results Info Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div className="text-sm font-extrabold text-slate-900">
              Showing <span className="text-amber-600 font-black">{filteredCourses.length}</span> {filteredCourses.length === 1 ? 'Course' : 'Courses'}
            </div>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Loading course catalog...</p>
            </div>
          ) : (
            /* Course Cards Grid */
            <CourseGrid
              courses={filteredCourses}
              onApply={(courseName) => onOpenApplyModal && onOpenApplyModal(courseName)}
            />
          )}

        </div>
      </section>

    </div>
  );
};

export default Courses;
