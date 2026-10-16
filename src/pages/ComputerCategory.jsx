import React, { useState, useEffect } from 'react';
import { Laptop, CheckCircle, Code, Terminal, Cpu, Loader2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import CourseGrid from '../components/courses/CourseGrid';
import CTASection from '../components/sections/CTASection';
import { getAllCoursesApi } from '../services/courses';

const ComputerCategory = ({ onOpenApplyModal }) => {
  const [computerCourses, setComputerCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultSkills = ["Web Development", "Graphic Design", "Python & Java", "Digital Marketing & SEO", "Office Automation", "UI/UX Design"];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await getAllCoursesApi();
        if (Array.isArray(data)) {
          const filtered = data.filter((c) => {
            const cat = (c.category || c.categoryId || '').toLowerCase();
            return cat.includes('computer') || cat.includes('tech') || cat.includes('dca');
          });
          setComputerCourses(filtered);
        }
      } catch (err) {
        console.warn('Failed to fetch computer courses:', err);
        setComputerCourses([]);
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
                <Laptop className="w-4 h-4 text-slate-950" />
                <span>Computer Training Institute</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 leading-tight">
                Computer Training Institute
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                A technology-driven wing delivering practical training in software applications, coding, digital literacy, web development, and IT tools needed for today’s digital workforce.
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
                  src="/images/computer-category.jpg"
                  alt="Computer Lab Department"
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
            badge="Tech Programs"
            title="Available Computer & Technology Diplomas"
            subtitle="Explore our career-oriented computer diploma courses covering DCA, Full Stack React, UI/UX Design, Python, and Digital Marketing."
          />

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Loading computer courses...</p>
            </div>
          ) : (
            <CourseGrid courses={computerCourses} onApply={onOpenApplyModal} />
          )}
        </div>
      </section>

      {/* TOOLS & SOFTWARE TAUGHT */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Tech Stack"
            title="Industry Software & Tools You Will Master"
            subtitle="Get hands-on fluency with the exact software stack used by professional developers, designers, and accountants."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['React.js & JavaScript ES6', 'Figma UI Prototyping', 'Adobe Photoshop & Illustrator', 'Python & MySQL', 'Tally Prime with GST', 'Google Ads & SEO Tools', 'VS Code & Git', 'MS Office Automation'].map((tool, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">{tool}</span>
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

export default ComputerCategory;
