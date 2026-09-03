import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo.png"
              alt="Aurumfx Logo"
              className="h-9 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-700 hover:text-slate-950'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-700 hover:text-slate-950'
                }`
              }
            >
              Courses
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-700 hover:text-slate-950'
                }`
              }
            >
              About us
            </NavLink>

            <NavLink
              to="/admissions"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-700 hover:text-slate-950'
                }`
              }
            >
              Admissions
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-700 hover:text-slate-950'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* RIGHT CTA BUTTON (Updated to Login / User Badge) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-3.5 py-1.5 bg-[#1C1917] text-[#F5B718] hover:bg-slate-800 text-xs font-extrabold uppercase rounded-full border border-amber-400/40 shadow-sm transition-all"
                  >
                    Admin Portal
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-200/60 rounded-full border border-amber-300 text-xs font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F5B718] flex items-center justify-center font-extrabold text-[10px]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name || 'User'}</span>
                </div>
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
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#1C1917] hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              >
                <span>Login</span>
                <span className="text-[#F5B718] font-bold">&rarr;</span>
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
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-sm font-bold text-slate-800">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Hello, {user?.name || 'User'}</span>
                </div>
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
                className="w-full py-3 bg-[#18181B] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Login</span>
                <span className="text-[#F5B718] font-bold">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
