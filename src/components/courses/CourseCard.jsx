import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BarChart, ArrowRight, CheckCircle2 } from 'lucide-react';


const CourseCard = ({ course, onApply }) => {
  if (!course) return null;

  const title = course.title || course.name || 'Untitled Course';
  const description = course.description || course.shortDescription || '';
  const duration = course.duration || 'Flexible';
  const level = course.level || 'All Levels';
  const category = course.category || 'Certification';
  const priceDisplay = course.price ? `₹${course.price}` : (course.fee || '₹0');
  
  // Format Image URL
  let imageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
  if (course.image) {
    if (course.image.startsWith('http://') || course.image.startsWith('https://') || course.image.startsWith('data:')) {
      imageUrl = course.image;
    } else {
      imageUrl = `http://localhost:8000/${course.image.replace(/\\/g, '/')}`;
    }
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col group card-hover-lift h-full">
      
      {/* CARD IMAGE CONTAINER */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* CARD CONTENT BODY */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Metadata badges (Duration & Level) */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2 font-medium">
            <span className="flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-600" /> {duration}
            </span>
            <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              <BarChart className="w-3.5 h-3.5 text-slate-500" /> {level}
            </span>
          </div>

          {/* Course Name */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
            <Link to={`/courses/${course.id}`}>
              {title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Skills Badges (only if dynamic skills present) */}
          {Array.isArray(course.skills) && course.skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {course.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-500" /> {skill}
                </span>
              ))}
              {course.skills.length > 3 && (
                <span className="text-[10px] font-semibold text-slate-400 self-center">
                  +{course.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Course Fee</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">{priceDisplay}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/courses/${course.id}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-full transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CourseCard;
