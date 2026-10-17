import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Megaphone,
  Plus,
  Folder,
  ChevronRight,
  Building2,
} from 'lucide-react';
import logoImage from '../../assets/logo.png';

export const STAFF_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard', folder: 'Overview' },
  { id: 'courses', label: 'My Courses & Students', icon: BookOpen, path: '/staff/courses', folder: 'Academics' },
  { id: 'assignments', label: 'Assignments', icon: FileText, path: '/staff/assignments', folder: 'Academics' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/staff/announcements', folder: 'Communication' },
  { id: 'documents', label: 'Staff Documents', icon: ShieldCheck, path: '/staff/documents', folder: 'Identity' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/staff/profile', folder: 'Account' },
];

const StaffSidebar = ({
  user,
  logout,
  sidebarOpen,
  setSidebarOpen,
  activeTab = 'dashboard',
  setActiveTab,
  onOpenNewAssignment,
}) => {
  const closeSidebar = () => setSidebarOpen(false);

  const selectTab = (tabId) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    }
    closeSidebar();
  };

  const handleLogout = () => {
    logout({ redirectTo: '/staff-login' });
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          aria-label="Close navigation"
        />
      )}

      {/* Two-Tier Left Sidebar (Green Gradient Rail + White Nav Panel) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-300 md:static md:translate-x-0 h-full overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Tier 1: Narrow Green Gradient Icon Rail */}
        <aside className="w-16 sm:w-[72px] shrink-0 bg-gradient-to-b from-[#10B981] via-[#059669] to-[#047857] flex flex-col items-center py-6 justify-between shadow-md md:rounded-l-3xl h-full overflow-y-auto no-scrollbar">
          {/* Top Brand & Action Section */}
          <div className="flex flex-col items-center w-full">
            {/* Logo Mark Area (Keep logo in green space as requested) */}
            <div className="h-10 flex items-center justify-center mb-5">
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-sm p-2 flex items-center justify-center shadow-xs">
                <img src={logoImage} alt="Aurum FX" className="h-full w-full object-contain brightness-0 invert" />
              </div>
            </div>

            {/* Quick Action Button matching "+ New Assignment" */}
            <div className="h-10 flex items-center justify-center mb-6">
              <button
                type="button"
                onClick={() => {
                  if (typeof onOpenNewAssignment === 'function') {
                    onOpenNewAssignment();
                  } else {
                    selectTab('assignments');
                  }
                }}
                title="New Assignment"
                className="h-10 w-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
              </button>
            </div>

            {/* Navigation Header Spacer (matches "NAVIGATION" label height in Tier 2) */}
            <div className="h-5 mb-1.5" />

            {/* Nav Icon List (Matching Row-for-Row with Tier 2) */}
            <div className="flex flex-col items-center space-y-1.5 w-full px-2">
              {STAFF_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    title={item.label}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-700 shadow-md scale-105'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="h-10 w-10 rounded-xl text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </aside>

        {/* Tier 2: White Secondary Navigation Panel */}
        <aside className="w-56 sm:w-60 shrink-0 bg-white border-r border-slate-100 flex flex-col py-6 px-4 justify-between shadow-xs h-full overflow-y-auto custom-staff-scrollbar">
          <div className="w-full">
            {/* Brand Text Area (Logo image removed as requested) */}
            <div className="h-10 flex items-center justify-between px-2 mb-5">
              <div>
                <p className="text-base font-black text-slate-800 tracking-tight leading-none">
                  Aurum FX
                </p>
                <p className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase mt-1">
                  Staff Portal
                </p>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* "+ New Assignment" Button (matching Tier 1 height & margin) */}
            <div className="h-10 flex items-center mb-6">
              <button
                type="button"
                onClick={() => {
                  if (typeof onOpenNewAssignment === 'function') {
                    onOpenNewAssignment();
                  } else {
                    selectTab('assignments');
                  }
                }}
                className="w-full h-10 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-sm shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md"
              >
                <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="h-3 w-3 stroke-[3]" />
                </div>
                <span>New Assignment</span>
              </button>
            </div>

            {/* Navigation Header Label */}
            <div className="h-5 flex items-center mb-1.5 px-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Navigation
              </p>
            </div>

            {/* Navigation Menu Items List (Matched row-by-row with Tier 1) */}
            <div className="space-y-1.5">
              {STAFF_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch & Account Card at Bottom */}
          <div className="pt-4 border-t border-slate-100 px-1">
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.branch_name || 'Main Branch'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.branch_location || user?.location || 'Aurum FX Education'}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default StaffSidebar;
