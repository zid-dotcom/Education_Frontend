import React from 'react';

const SectionHeading = ({
  badge,
  title,
  subtitle,
  align = 'center', // 'left' | 'center' | 'right'
  className = '',
  titleClassName = ''
}) => {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto'
  };

  return (
    <div className={`flex flex-col max-w-3xl mb-12 sm:mb-16 ${alignmentClasses[align]} ${className}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100/90 text-amber-900 border border-amber-300/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          {badge}
        </div>
      )}
      {title && (
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight ${titleClassName}`}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-3.5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
