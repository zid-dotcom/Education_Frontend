import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BarChart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getCourseImageUrl } from '../../services/courses';

const cardThemes = {
  digital: {
    border: 'border-[#d9e8df] hover:border-[#9fc5b2]',
    image: 'bg-[#edf6ef]',
    badge: 'bg-[#edf6ef] text-[#47735a] border-[#d9e8df]',
    icon: 'bg-[#e3f1e6] text-[#47735a]',
    action: 'bg-[#e3f1e6] text-[#355f47] hover:bg-[#d1e8d6]',
  },
  fashion: {
    border: 'border-[#f0d8ce] hover:border-[#dca995]',
    image: 'bg-[#fff0e9]',
    badge: 'bg-[#fff0e9] text-[#9a5f4b] border-[#f0d8ce]',
    icon: 'bg-[#ffe5da] text-[#a5624b]',
    action: 'bg-[#ffe5da] text-[#8d4d39] hover:bg-[#f8d5c7]',
  },
  hospitality: {
    border: 'border-[#eadfca] hover:border-[#d5bc8d]',
    image: 'bg-[#fff8e8]',
    badge: 'bg-[#fff8e8] text-[#8d6c2d] border-[#eadfca]',
    icon: 'bg-[#fff0c9] text-[#96712a]',
    action: 'bg-[#fff0c9] text-[#7f5c1d] hover:bg-[#ffe6a2]',
  },
  default: {
    border: 'border-[#e8ddd0] hover:border-[#cdbba5]',
    image: 'bg-[#f8f1e9]',
    badge: 'bg-[#f8f1e9] text-[#796553] border-[#e8ddd0]',
    icon: 'bg-[#f2e7db] text-[#876d58]',
    action: 'bg-[#f2e7db] text-[#6f5947] hover:bg-[#e8dacb]',
  },
};


const CourseCard = ({ course, onApply, linkPrefix = '/courses' }) => {
  if (!course) return null;

  const title = course.title || course.name || 'Untitled Course';
  const description = course.description || course.shortDescription || '';
  const duration = course.duration || 'Flexible';
  const level = course.level || 'All Levels';
  const category = course.category || 'Certification';
  const priceDisplay = course.price ? `₹${course.price}` : (course.fee || '₹0');
  const categoryKey = category.toLowerCase();
  const theme = categoryKey.includes('digital') || categoryKey.includes('computer') || categoryKey.includes('software')
    ? cardThemes.digital
    : categoryKey.includes('fashion') || categoryKey.includes('design')
      ? cardThemes.fashion
      : categoryKey.includes('hospital') || categoryKey.includes('hotel') || categoryKey.includes('tourism')
        ? cardThemes.hospitality
        : cardThemes.default;
  
  let imageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
  if (course.image) {
    imageUrl = getCourseImageUrl(course.image);
  }

  const isStudentView = linkPrefix?.startsWith('/student-dashboard');

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 flex flex-col group h-full ${
        isStudentView
          ? 'bg-white rounded-2xl border border-purple-100/90 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:border-purple-300 hover:shadow-md'
          : 'bg-[#fffdf8] rounded-[1.75rem] border-[2px] border-[#e7bf6c] shadow-[0_12px_28px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-amber-500'
      }`}
    >
      <style>{`
        @keyframes cardPop {
          0% { opacity: 0; transform: translateY(18px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      
      {/* CARD IMAGE CONTAINER */}
      <div
        className={`relative h-48 sm:h-52 overflow-hidden border-b ${
          isStudentView ? 'border-purple-100/70 bg-[#FAF8FE]' : `border-[#f2e9d6] ${theme.image}`
        }`}
      >
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-50"></div>
      </div>

      {/* CARD CONTENT BODY */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Metadata badges (Duration & Level) */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 mb-2 font-medium">
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold ${
                isStudentView
                  ? 'bg-[#F5F2FC] text-purple-700 border-purple-200/70'
                  : `${theme.badge}`
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isStudentView ? 'text-purple-600' : 'text-amber-700'}`} /> {duration}
            </span>
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold ${
                isStudentView
                  ? 'bg-[#F5F2FC] text-purple-700 border-purple-200/70'
                  : `border-transparent ${theme.badge}`
              }`}
            >
              <BarChart className={`w-3.5 h-3.5 ${isStudentView ? 'text-purple-600' : 'text-amber-700'}`} /> {level}
            </span>
          </div>

          {/* Course Name */}
          <h3
            className={`text-base sm:text-lg font-extrabold text-slate-900 transition-colors line-clamp-1 ${
              isStudentView ? 'group-hover:text-[#7C3AED]' : 'group-hover:text-amber-700'
            }`}
          >
            <Link to={`${linkPrefix}/${course.id}`}>
              {title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Skills Badges (only if dynamic skills present) */}
          {Array.isArray(course.skills) && course.skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {course.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isStudentView
                      ? 'bg-purple-50 text-purple-800 border border-purple-100'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3 h-3 ${isStudentView ? 'text-purple-600' : 'text-amber-500'}`}
                  />{' '}
                  {skill}
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
        <div
          className={`pt-4 border-t flex items-center justify-between gap-2 ${
            isStudentView ? 'border-purple-100/80' : 'border-[#f2e9d6]'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Course Fee</span>
            <span className="text-base sm:text-lg font-black text-slate-900">{priceDisplay}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`${linkPrefix}/${course.id}`}
              className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                isStudentView
                  ? 'rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                  : `rounded-full ${theme.action}`
              }`}
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
