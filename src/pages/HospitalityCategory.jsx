import React, { useState, useEffect } from 'react';
import { Hotel, CheckCircle, Award, Compass, Utensils, Loader2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import CourseGrid from '../components/courses/CourseGrid';
import CTASection from '../components/sections/CTASection';
import { getAllCoursesApi } from '../services/courses';

const HospitalityCategory = ({ onOpenApplyModal }) => {
  const [hospitalityCourses, setHospitalityCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultSkills = ["Front Office Operations", "Food & Beverage Service", "Housekeeping Management", "Tourism & Travel Ops", "Guest Relations", "Event Management"];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await getAllCoursesApi();
        if (Array.isArray(data)) {
          const filtered = data.filter((c) => {
            const cat = (c.category || c.categoryId || '').toLowerCase();
            return cat.includes('hospitality') || cat.includes('hotel') || cat.includes('tourism');
          });
          setHospitalityCourses(filtered);
        }
      } catch (err) {
        console.warn('Failed to fetch hospitality courses:', err);
        setHospitalityCourses([]);
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
                <Hotel className="w-4 h-4 text-slate-950" />
                <span>Hospitality Management Institute</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 leading-tight">
                Hospitality Management Institute
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                A professional training ground focused on hotel administration, front-office operations, food and beverage management, customer service excellence, and global hospitality standards.
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
                  src="/images/hospitality-category.jpg"
                  alt="Hospitality Department"
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
            badge="Hospitality Diplomas"
            title="Available Hotel & Tourism Programs"
            subtitle="Explore our specialized diploma and certificate courses in Hotel Management, Food & Beverage Service, Front Office PMS, and Tourism Operations."
          />

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Loading hospitality courses...</p>
            </div>
          ) : (
            <CourseGrid courses={hospitalityCourses} onApply={onOpenApplyModal} />
          )}
        </div>
      </section>

      {/* PRACTICAL LABS & INTERNSHIP SCOPE */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="5-Star Exposure"
            title="Guaranteed 6-Month Hotel Internship"
            subtitle="Our 2-Year Diploma in Hotel Management includes guaranteed paid industrial training in premier 5-star hotel chains."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                <Hotel className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-950">Front Office Opera PMS Lab</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Train on Opera PMS property management software used by leading international hotels worldwide.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-950">F&B Fine Dining Suite</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Master silver service, table setups, mixology bar techniques, and banquet event coordination.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-950">Global Tourism & Travel</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn flight GDS reservation tools, customized tour package costing, and visa documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <CTASection onOpenApplyModal={onOpenApplyModal} />

    </div>
  );
};

export default HospitalityCategory;
