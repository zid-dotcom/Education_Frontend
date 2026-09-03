import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  to,
  href,
  onClick,
  variant = 'primary', // 'primary' | 'dark' | 'secondary' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  type = 'button',
  icon: Icon,
  iconPosition = 'right',
  disabled = false
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-amber-200 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-200/25 hover:shadow-lg border border-amber-300 font-semibold',
    dark: 'bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-950/20 hover:shadow-lg',
    secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-200/80',
    outline: 'bg-transparent hover:bg-white/10 text-current border-2 border-current shadow-xs'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5 font-semibold'
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const renderContent = () => (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`group ${combinedClasses}`}>
        {renderContent()}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`group ${combinedClasses}`}>
        {renderContent()}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`group ${combinedClasses}`}>
      {renderContent()}
    </button>
  );
};

export default Button;
