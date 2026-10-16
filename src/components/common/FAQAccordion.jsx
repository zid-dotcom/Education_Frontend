import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQAccordion = ({ items = [] }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 w-full">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.id || index}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? 'bg-amber-50/50 border-amber-300 shadow-md shadow-amber-500/5'
                : 'bg-white border-slate-200/80 hover:border-amber-200 hover:bg-slate-50/50'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 focus:outline-none cursor-pointer"
            >
              <span className="flex items-center gap-3.5 font-bold text-base sm:text-lg text-slate-900">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isOpen ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  Q{index + 1}
                </span>
                {item.question}
              </span>
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isOpen ? 'rotate-180 bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'
              }`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>
            
            {isOpen && (
              <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-amber-200/40">
                <div className="pl-11">
                  {item.answer}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
