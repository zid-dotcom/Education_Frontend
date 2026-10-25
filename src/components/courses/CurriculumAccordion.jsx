import React, { useState } from 'react';
import { ChevronDown, CheckCircle, BookOpen } from 'lucide-react';

const CurriculumAccordion = ({ curriculum = [], studentView = false }) => {
  const [openModule, setOpenModule] = useState(0);

  if (!curriculum || curriculum.length === 0) return null;

  return (
    <div className="space-y-4">
      {curriculum.map((item, index) => {
        const isOpen = openModule === index;
        return (
          <div
            key={index}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              studentView
                ? isOpen
                  ? 'bg-[#FAF8F4] border-[#9C6B2E]/40 shadow-xs'
                  : 'bg-white border-[#E3DDD0] hover:border-[#9C6B2E]/30'
                : isOpen
                ? 'bg-amber-50/60 border-amber-300 shadow-md'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenModule(isOpen ? null : index)}
              className="w-full px-6 py-4.5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 font-extrabold text-xs rounded-full uppercase tracking-wider ${
                    studentView
                      ? 'bg-[#9C6B2E] text-white shadow-xs'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {item.module || `Module 0${index + 1}`}
                </span>
                <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                  {item.title}
                </h4>
              </div>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                  studentView
                    ? isOpen
                      ? 'rotate-180 bg-[#F1EDE4] text-[#9C6B2E]'
                      : 'bg-[#FAF8F4] text-[#8A8175]'
                    : isOpen
                    ? 'rotate-180 bg-amber-200 text-amber-900'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>

            {isOpen && item.topics && (
              <div
                className={`px-6 pb-6 pt-2 border-t ${
                  studentView ? 'border-[#E3DDD0]' : 'border-amber-200/50'
                }`}
              >
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Key Topics Covered:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {item.topics.map((topic, tIdx) => (
                    <div
                      key={tIdx}
                      className={`flex items-start gap-2.5 text-xs font-semibold text-slate-700 p-2.5 rounded-xl border ${
                        studentView
                          ? 'bg-white border-[#E3DDD0] shadow-2xs'
                          : 'bg-white/80 border-slate-100 text-sm'
                      }`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          studentView ? 'text-[#9C6B2E]' : 'text-amber-500'
                        }`}
                      />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CurriculumAccordion;
