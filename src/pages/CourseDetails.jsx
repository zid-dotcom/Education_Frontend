import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, BarChart, ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import CurriculumAccordion from '../components/courses/CurriculumAccordion';
import CourseCard from '../components/courses/CourseCard';
import { getCourseByIdApi, getAllCoursesApi } from '../services/courses';
import { useAuth } from '../context/AuthContext';

const CourseDetails = ({ onOpenApplyModal }) => {
  const { courseId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        // First try to fetch from API if courseId is provided
        if (courseId && !isNaN(courseId)) {
          const apiCourse = await getCourseByIdApi(courseId);
          if (apiCourse) {
            setCourse(apiCourse);
          }
        }
        
        // Also fetch all courses for related section
        const allApiCourses = await getAllCoursesApi();
        if (Array.isArray(allApiCourses) && allApiCourses.length > 0) {
          setAllCourses(allApiCourses);
          // If course not set by numeric ID check, try finding in allApiCourses
          if (!course) {
            const foundInAll = allApiCourses.find((c) => String(c.id) === String(courseId));
            if (foundInAll) setCourse(foundInAll);
          }
        }
      } catch (err) {
        console.warn('API Course fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  if (loading) {
    return (
      <div className="py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-bold text-slate-600">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Course Not Found</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-md">
          The course you are looking for does not exist or may have been moved.
        </p>
        <Button to="/courses" variant="primary" size="md" className="mt-6" icon={ArrowLeft} iconPosition="left">
          Back to All Courses
        </Button>
      </div>
    );
  }

  // Normalized course properties from real database
  const title = course.title || course.name || 'Course Program';
  const shortDesc = course.shortDescription || course.description || '';
  const fullDesc = course.fullDescription || course.description || shortDesc;
  const priceDisplay = course.price ? `₹${course.price}` : (course.fee || '₹0');
  const category = course.category || 'Certification';
  const duration = course.duration || 'Flexible';
  const level = course.level || 'All Levels';
  
  let imageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
  if (course.image) {
    if (course.image.startsWith('http://') || course.image.startsWith('https://') || course.image.startsWith('data:')) {
      imageUrl = course.image;
    } else {
      imageUrl = `http://localhost:8000/${course.image.replace(/\\/g, '/')}`;
    }
  }

  // Related courses
  const relatedCourses = allCourses
    .filter((c) => String(c.id) !== String(course.id))
    .slice(0, 3);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          message: 'Please log in to your student account to apply for courses and submit inquiries.',
          targetCourse: title
        }
      });
      return;
    }
    if (onOpenApplyModal) {
      onOpenApplyModal(title);
    }
  };

  return (
    <div className="bg-white">
      
      {/* BREADCRUMB & HERO BANNER */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-100/70 via-amber-50/40 to-white border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 hover:text-amber-950 mb-6 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 bg-slate-950 text-white font-extrabold text-xs rounded-full uppercase tracking-wider">
                  {category}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {title}
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                {shortDesc}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 bg-amber-100/90 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-700" /> Duration: {duration}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl">
                  <BarChart className="w-4 h-4 text-slate-500" /> Level: {level}
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MAIN CONTENT & SIDEBAR ENROLMENT CARD */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT MAIN DETAILS */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Course Overview */}
              <div>
                <h3 className="text-2xl font-extrabold text-slate-950 mb-4 pb-2 border-b border-amber-200">
                  Course Overview & Description
                </h3>
                <p className="text-slate-700 text-base leading-relaxed font-normal">
                  {fullDesc}
                </p>
              </div>

              {/* Skills Acquired (Only rendered if dynamic skills are present in DB) */}
              {Array.isArray(course.skills) && course.skills.length > 0 && (
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-950 mb-4 pb-2 border-b border-amber-200">
                    Key Skills You Will Acquire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 text-slate-900 text-sm font-semibold">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                          ✓
                        </div>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Module Curriculum Accordion */}
              {course.curriculum && (
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-950 mb-2">
                    Detailed Course Curriculum
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Click on any module below to inspect topics covered.</p>
                  <CurriculumAccordion curriculum={course.curriculum} />
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR ENROLMENT CARD */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-6">
                
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Total Program Fee</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-950 mt-1">
                    {priceDisplay}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-medium text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900">{duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Skill Level:</span>
                    <span className="font-bold text-slate-900">{level}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="w-full py-4 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Apply For Admission</span>
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  ⚡ Immediate seat confirmation upon application review.
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RELATED COURSES */}
      {relatedCourses.length > 0 && (
        <section className="py-16 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-extrabold text-slate-950 mb-8">
              Explore Other Related Courses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses.map((rCourse) => (
                <CourseCard key={rCourse.id} course={rCourse} onApply={onOpenApplyModal} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default CourseDetails;
