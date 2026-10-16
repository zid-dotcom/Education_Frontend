import React, { useState, useEffect } from 'react';
import { Scissors, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import CourseGrid from '../components/courses/CourseGrid';
import CTASection from '../components/sections/CTASection';
import { getAllCoursesApi } from '../services/courses';

const FashionCategory = ({ onOpenApplyModal }) => {
  const [fashionCourses, setFashionCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultSkills = ["Fashion Illustration", "Pattern Making", "Apparel Construction", "Textile Science", "Garment Styling", "Trend Forecasting"];
  const defaultCareerPaths = ["Fashion Designer", "Apparel Merchandiser", "Pattern Maker", "Fashion Stylist", "Textile Designer", "Fashion Entrepreneur"];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await getAllCoursesApi();
        if (Array.isArray(data)) {
          const filtered = data.filter((c) => {
            const cat = (c.category || c.categoryId || '').toLowerCase();
            return cat.includes('fashion') || cat.includes('garment') || cat.includes('textile');
          });
          setFashionCourses(filtered);
        }
      } catch (err) {
        console.warn('Failed to fetch fashion courses:', err);
        setFashionCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="bg-white">
      
      {/* CATEGORY HERO BANNER */}
      <section className="relative py-16 sm:py-24 bg-amber-50/70 overflow-hidden border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300">
                <Scissors className="w-4 h-4 text-slate-950" />
                <span>Fashion Designing Institute</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 leading-tight">
                Fashion Designing Institute
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                A creative hub designed to foster innovation, garment construction techniques, textile design, and contemporary trend analysis, preparing students for the dynamic global fashion industry.
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {defaultSkills.map((skill, idx) => (
                  <span key={idx} className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 shadow-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                <img
                  src="/images/fashion-category.jpg"
                  alt="Fashion Designing Department"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COURSES OFFERED GRID */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Fashion Programs"
            title="Available Fashion & Garment Courses"
            subtitle="Explore our specialized diploma and certificate programs in Fashion Illustration, Pattern Making, Garment Construction, and Styling."
          />

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Loading fashion courses...</p>
            </div>
          ) : (
            <CourseGrid courses={fashionCourses} onApply={onOpenApplyModal} />
          )}
        </div>
      </section>

      {/* CAREER OUTCOMES SECTION */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Career Pathways"
            title="Where Can Your Fashion Diploma Take You?"
            subtitle="Our graduates launch successful boutique labels or work with leading garment exporters, couture brands, and fashion media houses."
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {defaultCareerPaths.map((career, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-amber-200 text-center shadow-xs hover:border-amber-400 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 text-amber-800 font-bold">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">{career}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <CTASection onOpenApplyModal={onOpenApplyModal} />

    </div>
  );
};

export default FashionCategory;
