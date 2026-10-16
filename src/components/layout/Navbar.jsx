import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/logo.png';

const Navbar = ({ onOpenApplyModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs py-3 border-b border-slate-200/80'
          : 'bg-white py-4 sm:py-5 border-b border-slate-100'
      }`}
    >
      <div className="w-full px-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" className="ml-2 sm:ml-10 flex items-center gap-3 group">
            <img src={logoImage} alt="" className="h-11 w-11 object-contain transition-transform group-hover:scale-105 sm:h-14 sm:w-14" />
            <span className="flex items-baseline whitespace-nowrap font-black tracking-tight transition-transform group-hover:scale-105" aria-label="Aurum FX Academy">
              <span className="text-2xl text-amber-500 sm:text-3xl">Aurum</span>
              <span className="text-2xl text-slate-400 sm:text-3xl">FX</span>
              <span className="ml-2 border-l border-slate-300 pl-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-950 sm:text-sm">Academy</span>
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4 ml-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-slate-700 hover:bg-amber-50 hover:text-slate-950'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-slate-700 hover:bg-amber-50 hover:text-slate-950'
                }`
              }
            >
              Courses
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-slate-700 hover:bg-amber-50 hover:text-slate-950'
                }`
              }
            >
              About us
            </NavLink>

            <NavLink
              to="/admissions"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-slate-700 hover:bg-amber-50 hover:text-slate-950'
                }`
              }
            >
              Admissions
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all ${
                  isActive ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-slate-700 hover:bg-amber-50 hover:text-slate-950'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* RIGHT CTA BUTTON */}
          <div className="hidden md:flex shrink-0 items-center gap-3 ml-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {['admin', 'super_admin'].includes(user?.role) && (
                  <Link
                    to="/admin/announcements"
                    className="px-3.5 py-1.5 bg-[#1C1917] text-[#F5B718] hover:bg-slate-800 text-xs font-extrabold uppercase rounded-full border border-amber-400/40 shadow-sm transition-all"
                  >
                    Admin Portal
                  </Link>
                )}
                {user?.role === 'staff' && (
                  <Link
                    to="/staff/dashboard"
                    className="px-3.5 py-1.5 bg-[#17140f] text-[#f4b942] hover:bg-slate-800 text-xs font-extrabold uppercase rounded-full border border-amber-400/40 shadow-sm transition-all"
                  >
                    Staff Portal
                  </Link>
                )}
                {user?.role === 'staff' ? (
                  <Link
                    to="/staff/dashboard"
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-200/60 rounded-full border border-amber-300 text-xs font-bold text-slate-900 hover:bg-amber-300 transition-colors"
                    title="Open staff portal"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F5B718] flex items-center justify-center font-extrabold text-[10px]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.name || 'Staff'}</span>
                  </Link>
                ) : !['admin', 'super_admin'].includes(user?.role) ? (
                  <Link
                    to="/student-dashboard"
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-200/60 rounded-full border border-amber-300 text-xs font-bold text-slate-900 hover:bg-amber-300 transition-colors"
                    title="Open student dashboard"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F5B718] flex items-center justify-center font-extrabold text-[10px]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.name || 'User'}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-200/60 rounded-full border border-amber-300 text-xs font-bold text-slate-900">
                    <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F5B718] flex items-center justify-center font-extrabold text-[10px]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.name || 'User'}</span>
                  </div>
                )}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              >
                <span>Get Started</span>
                <span className="text-slate-950 font-bold">&rarr;</span>
              </Link>
            )}
          </div>

          {/* MOBILE HAMBURGER TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-900 bg-amber-200/80 hover:bg-amber-300 transition-colors focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU FLYOUT */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-amber-200 shadow-2xl animate-in slide-in-from-top duration-200 px-4 pt-3 pb-6 space-y-3 mt-2">
          <div className="flex flex-col space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Courses
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              About Us
            </NavLink>

            <NavLink
              to="/admissions"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Admissions
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Contact Us
            </NavLink>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                {user?.role === 'staff' && (
                  <Link
                    to="/staff/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-sm font-bold text-slate-800"
                  >
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Open Staff Portal</span>
                  </Link>
                )}
                {user?.role !== 'staff' && !['admin', 'super_admin'].includes(user?.role) && (
                  <Link
                    to="/student-dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-sm font-bold text-slate-800"
                  >
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Open Student Dashboard</span>
                  </Link>
                )}
                {['admin', 'super_admin'].includes(user?.role) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-sm font-bold text-slate-800">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Hello, {user?.name || 'User'}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 bg-amber-300 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Get Started</span>
                <span className="text-slate-950 font-bold">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
