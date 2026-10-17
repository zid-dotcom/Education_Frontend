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

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on resize to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 relative transition-all duration-300 bg-white ${
        isScrolled
          ? 'shadow-xs py-3 border-b border-slate-200/80'
          : 'py-4 sm:py-5 border-b border-slate-100'
      }`}
    >
      <div className="w-full px-3 sm:px-5 lg:px-7 relative z-50 bg-white">
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

      {/* FULL-SCREEN MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col h-[100dvh] w-full md:hidden overflow-y-auto animate-in fade-in duration-200">
          {/* TOP BAR */}
          <div className="w-full px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 group"
            >
              <img src={logoImage} alt="AurumFX Logo" className="h-11 w-11 object-contain transition-transform group-hover:scale-105" />
              <span className="flex items-baseline whitespace-nowrap font-black tracking-tight" aria-label="Aurum FX Academy">
                <span className="text-2xl text-amber-500">Aurum</span>
                <span className="text-2xl text-slate-400">FX</span>
                <span className="ml-2 border-l border-slate-300 pl-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-950">Academy</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl text-slate-900 bg-amber-100/80 hover:bg-amber-200 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close mobile menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* MENU NAVIGATION LIST */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            <nav className="flex flex-col">
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-4 text-base font-bold border-b border-slate-100 transition-colors flex items-center justify-between ${
                    isActive ? 'text-amber-500 font-extrabold' : 'text-slate-900 hover:text-amber-500'
                  }`
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/courses"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-4 text-base font-bold border-b border-slate-100 transition-colors flex items-center justify-between ${
                    isActive ? 'text-amber-500 font-extrabold' : 'text-slate-900 hover:text-amber-500'
                  }`
                }
              >
                Courses
              </NavLink>

              <NavLink
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-4 text-base font-bold border-b border-slate-100 transition-colors flex items-center justify-between ${
                    isActive ? 'text-amber-500 font-extrabold' : 'text-slate-900 hover:text-amber-500'
                  }`
                }
              >
                About Us
              </NavLink>

              <NavLink
                to="/admissions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-4 text-base font-bold border-b border-slate-100 transition-colors flex items-center justify-between ${
                    isActive ? 'text-amber-500 font-extrabold' : 'text-slate-900 hover:text-amber-500'
                  }`
                }
              >
                Admissions
              </NavLink>

              <NavLink
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-4 text-base font-bold border-b border-slate-100 transition-colors flex items-center justify-between ${
                    isActive ? 'text-amber-500 font-extrabold' : 'text-slate-900 hover:text-amber-500'
                  }`
                }
              >
                Contact Us
              </NavLink>
            </nav>

            {/* BOTTOM ACTIONS / AUTH */}
            <div className="px-6 py-6 border-t border-slate-100 mt-auto bg-white space-y-3">
              {isAuthenticated ? (
                <div className="space-y-3">
                  {user?.role === 'staff' && (
                    <Link
                      to="/staff/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-xl text-sm font-bold text-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      <span>Open Staff Portal</span>
                    </Link>
                  )}
                  {user?.role !== 'staff' && !['admin', 'super_admin'].includes(user?.role) && (
                    <Link
                      to="/student-dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-xl text-sm font-bold text-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      <span>Open Student Dashboard</span>
                    </Link>
                  )}
                  {['admin', 'super_admin'].includes(user?.role) && (
                    <Link
                      to="/admin/announcements"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1C1917] hover:bg-slate-800 text-[#F5B718] rounded-xl text-sm font-extrabold uppercase tracking-wider transition-colors"
                    >
                      <span>Admin Portal ({user?.name || 'Admin'})</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-sm hover:shadow flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <span>Get Started</span>
                    <span className="text-slate-950 font-bold">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
