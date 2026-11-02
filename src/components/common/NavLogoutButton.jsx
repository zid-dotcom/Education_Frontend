import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Reusable top-right navbar Logout button designed for
 * Student, Staff, Super Admin, and Branch Admin portals.
 */
const NavLogoutButton = ({
  redirectTo,
  label = 'Logout',
  className = '',
  buttonStyle = {},
  iconClassName = 'h-4 w-4 text-slate-500 group-hover:text-rose-600 transition-colors',
  showTextAlways = false,
  onLogoutClick,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof onLogoutClick === 'function') {
      onLogoutClick();
      return;
    }

    // Determine fallback target redirect if not provided
    let target = redirectTo;
    if (!target) {
      if (user?.role === 'super_admin' || user?.role === 'admin') {
        target = '/super-admin/login';
      } else if (user?.role === 'branch_admin') {
        target = '/branch-admin-login';
      } else if (user?.role === 'staff') {
        target = '/staff-login';
      } else {
        target = '/login';
      }
    }

    if (typeof logout === 'function') {
      logout({ redirectTo: target });
    } else {
      navigate(target, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`group flex items-center gap-1.5 rounded-xl border border-[#E3DDD0] bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer shadow-2xs shrink-0 select-none ${className}`}
      style={buttonStyle}
      title={label}
      aria-label={label}
    >
      <LogOut className={iconClassName} />
      <span className={showTextAlways ? 'inline' : 'hidden sm:inline'}>
        {label}
      </span>
    </button>
  );
};

export default NavLogoutButton;
