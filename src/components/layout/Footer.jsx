import React from 'react';
import { Link } from 'react-router-dom';
import { instituteInfo } from '../../data/instituteInfo';
import logoImage from '../../assets/logo.png';

const Footer = ({ onOpenApplyModal }) => {
  return (
    <footer className="bg-[#18181B] text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          
          {/* COLUMN 1: BRAND INFO */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logoImage} alt="Aurum FX logo" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
              <span className="flex items-baseline whitespace-nowrap font-black tracking-tight" aria-label="Aurum FX Academy">
                <span className="text-2xl text-amber-400 sm:text-3xl">Aurum</span>
                <span className="text-2xl text-slate-300 sm:text-3xl">FX</span>
                <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-xs">Academy</span>
              </span>
            </Link>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {instituteInfo.shortDescription}
            </p>

            {/* Social Icons (Reference Style Round Buttons) */}
            <div className="pt-2 flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#FBBF24] hover:text-slate-950 flex items-center justify-center transition-all duration-200 text-slate-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" aria-label="X Twitter" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#FBBF24] hover:text-slate-950 flex items-center justify-center transition-all duration-200 text-slate-300">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="TikTok" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#FBBF24] hover:text-slate-950 flex items-center justify-center transition-all duration-200 text-slate-300">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525 9.007a3.86 3.86 0 0 1 0-7.72 3.86 3.86 0 0 1 3.86 3.86h-2.146a1.714 1.714 0 1 0-1.714 1.714v2.146zm-5.146 1.714a6.006 6.006 0 0 0 6.006 6.006V14.58a3.86 3.86 0 1 1-3.86-3.86h-2.146z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#FBBF24] hover:text-slate-950 flex items-center justify-center transition-all duration-200 text-slate-300">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: NAVIGASI */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li>
                <Link to="/" className="hover:text-[#FBBF24] transition-colors">Home page</Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#FBBF24] transition-colors">Courses</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FBBF24] transition-colors">About us</Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#FBBF24] transition-colors">Fashion Designing</Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#FBBF24] transition-colors">Computer Diploma</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FBBF24] transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: HELP */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Help
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li>
                <Link to="/admissions" className="hover:text-[#FBBF24] transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FBBF24] transition-colors">Help Center</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FBBF24] transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FBBF24] transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: PARTNER */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Partner
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li>Decoding</li>
              <li>Google Career</li>
              <li>AWS educate</li>
              <li>Edu</li>
              <li>Coursera</li>
              <li>RevoU</li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT BAR (Matching Reference) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="font-medium text-slate-300 font-semibold">
            {instituteInfo.tagline}
          </div>
          <div>
            Copyright © 2026 AurumFX. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
