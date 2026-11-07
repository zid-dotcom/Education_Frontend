import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, CheckCircle, BookOpen } from 'lucide-react';

const CurriculumAccordion = ({ curriculum = [], studentView = false }) => {
  const [openModule, setOpenModule] = useState(0);

  if (!curriculum || curriculum.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {curriculum.map((item, index) => {
        const isOpen = openModule === index;
        const topicCount = Array.isArray(item.topics) ? item.topics.length : 0;

        return (
          <div
            key={index}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              studentView
                ? isOpen
                  ? 'bg-[#FAF8F4] border-[#9C6B2E]/50 shadow-sm ring-1 ring-[#9C6B2E]/15'
                  : 'bg-white border-[#E3DDD0] hover:border-[#9C6B2E]/40 hover:bg-[#FAF8F4]/30 shadow-2xs'
                : isOpen
                ? 'bg-amber-50/60 border-amber-300 shadow-md'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenModule(isOpen ? null : index)}
              className={`w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none transition-colors ${
                studentView && isOpen ? 'bg-[#FAF8F4]' : ''
              }`}
            >
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 min-w-0">
                <span
                  className={`px-3 py-1 font-bold text-xs rounded-xl uppercase tracking-wider shrink-0 ${
                    studentView
                      ? isOpen
                        ? 'bg-[#17140F] text-[#F4B942] shadow-xs'
                        : 'bg-[#FAF8F4] text-[#9C6B2E] border border-[#ECD8B5]'
                      : 'bg-amber-400 text-slate-950 font-extrabold rounded-full'
                  }`}
                >
                  {item.module || `Module 0${index + 1}`}
                </span>
                <h4
                  className={`font-bold text-sm sm:text-base truncate sm:whitespace-normal ${
                    studentView ? 'text-[#17140F]' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {studentView && topicCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A8175] bg-white border border-[#E3DDD0] px-2.5 py-0.5 rounded-full">
                    {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
                  </span>
                )}
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    studentView
                      ? isOpen
                        ? 'rotate-180 bg-[#9C6B2E] text-white shadow-xs'
                        : 'bg-[#FAF8F4] border border-[#E3DDD0] text-[#8A8175]'
                      : isOpen
                      ? 'rotate-180 bg-amber-200 text-amber-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </button>

            {isOpen && item.topics && (
              <div
                className={`px-5 sm:px-6 pb-6 pt-3 border-t ${
                  studentView ? 'border-[#E3DDD0] bg-white/70' : 'border-amber-200/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className={`text-[11px] uppercase font-bold tracking-wider ${
                      studentView ? 'text-[#9C6B2E]' : 'text-slate-400'
                    }`}
                  >
                    Core Learning Topics:
                  </p>
                  {studentView && topicCount > 0 && (
                    <span className="sm:hidden text-[10px] font-semibold text-[#8A8175]">
                      {topicCount} topics
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {item.topics.map((topic, tIdx) => (
                    <div
                      key={tIdx}
                      className={`flex items-start gap-2.5 text-xs font-semibold p-3 rounded-xl border transition-colors ${
                        studentView
                          ? 'bg-white border-[#E3DDD0] text-[#17140F] shadow-2xs hover:border-[#9C6B2E]/40'
                          : 'bg-white/80 border-slate-100 text-slate-700 text-sm'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          studentView ? 'text-[#9C6B2E]' : 'text-amber-500'
                        }`}
                      />
                      <span className="leading-relaxed">{topic}</span>
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
