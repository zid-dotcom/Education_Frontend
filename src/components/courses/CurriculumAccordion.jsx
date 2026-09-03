import React, { useState } from 'react';
import { ChevronDown, CheckCircle, BookOpen } from 'lucide-react';

const CurriculumAccordion = ({ curriculum = [] }) => {
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
              isOpen
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
                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-extrabold text-xs rounded-full uppercase tracking-wider">
                  {item.module || `Module 0${index + 1}`}
                </span>
                <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                  {item.title}
                </h4>
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                isOpen ? 'rotate-180 bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'
              }`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>

            {isOpen && item.topics && (
              <div className="px-6 pb-6 pt-2 border-t border-amber-200/50">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Key Topics Covered:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {item.topics.map((topic, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2.5 text-sm text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
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
