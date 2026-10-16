import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import { getAllCoursesApi, getCourseImageUrl } from '../../services/courses';

const CategorySection = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        setLoading(true);
        const courses = await getAllCoursesApi();
        if (Array.isArray(courses) && courses.length > 0) {
          // Group by course category
          const categoryMap = new Map();

          courses.forEach((c) => {
            if (c.category) {
              const catName = c.category.trim();
              const key = catName.toLowerCase();
              
              if (!categoryMap.has(key)) {
                let imgUrl = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80';
                if (c.image) {
                  imgUrl = getCourseImageUrl(c.image);
                }

                categoryMap.set(key, {
                  id: catName,
                  name: catName,
                  courseCount: 1,
                  shortDescription: `Comprehensive certification and diploma courses in ${catName}.`,
                  image: imgUrl
                });
              } else {
                const existing = categoryMap.get(key);
                existing.courseCount += 1;
              }
            }
          });

          setCategoriesList(Array.from(categoryMap.values()));
        } else {
          setCategoriesList([]);
        }
      } catch (err) {
        console.warn('Failed to fetch categories from API:', err);
        setCategoriesList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicCategories();
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge="Course Categories"
          title="Explore Our Core Career Disciplines"
          subtitle="Choose from specialized industry programs engineered to build practical, real-world skills and launch rewarding careers."
        />

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold text-slate-600">Loading categories...</p>
          </div>
        ) : categoriesList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-semibold text-sm">
            No course categories available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categoriesList.map((cat) => (
              <div
                key={cat.id || cat.name}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between group card-hover-lift"
              >
                <div>
                  {/* Category Image Header */}
                  <div className="relative h-44 rounded-2xl overflow-hidden mb-6 bg-slate-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors"></div>
                    
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 border border-slate-200">
                      {cat.courseCount} {cat.courseCount === 1 ? 'Course' : 'Courses'}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 group-hover:text-amber-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
                    {cat.shortDescription}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    to={`/courses?category=${encodeURIComponent(cat.name)}`}
                    className="inline-flex items-center justify-between w-full px-5 py-3 rounded-full bg-slate-900 hover:bg-amber-400 text-white hover:text-slate-950 font-bold text-sm border border-slate-900 hover:border-amber-400 transition-all duration-200 shadow-xs group-hover:shadow-md"
                  >
                    <span>View Courses</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default CategorySection;
