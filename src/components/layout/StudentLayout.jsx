import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserAnnouncementsApi } from '../../services/userannouncements';
import { getStudentAssignmentsApi } from '../../services/studentassignments';

// Load modern Plus Jakarta Sans + Inter + Fraunces fonts
const useStudentLayoutFonts = () => {
  useEffect(() => {
    const id = 'student-portal-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';
    document.head.appendChild(link);
  }, []);
};

const StudentLayout = () => {
  useStudentLayoutFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(null);
  const [assignmentCount, setAssignmentCount] = useState(null);

  const displayName = user?.name || 'Student';
  const displayEmail = user?.email || 'Email not available';
  const closeSidebar = () => setIsSidebarOpen(false);

  const isCatalogActive = location.pathname.startsWith('/student-dashboard/courses');
  const isAnnouncementsActive = location.pathname.startsWith('/student-dashboard/announcements');
  const isEnquiriesActive = location.pathname.startsWith('/student-dashboard/enquiries');
  const isAssignmentsActive = location.pathname.startsWith('/student-dashboard/assignments');
  const isDashboardActive =
    !isCatalogActive && !isAnnouncementsActive && !isEnquiriesActive && !isAssignmentsActive;

  const pageTitle = isAssignmentsActive
    ? 'Assignments'
    : isCatalogActive
    ? 'Browse Courses'
    : isAnnouncementsActive
    ? 'Announcements'
    : isEnquiriesActive
    ? 'Enquiries'
    : 'Dashboard';

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      if (!token) return;
      try {
        const [announcementsData, assignmentsData] = await Promise.allSettled([
          getUserAnnouncementsApi(token),
          getStudentAssignmentsApi(token),
        ]);

        if (isMounted) {
          if (announcementsData.status === 'fulfilled') {
            const data = announcementsData.value;
            setAnnouncementCount(Array.isArray(data) ? data.length : 0);
          } else {
            setAnnouncementCount(null);
          }

          if (assignmentsData.status === 'fulfilled') {
            const data = assignmentsData.value;
            const count =
              typeof data?.total_assignments === 'number'
                ? data.total_assignments
                : Array.isArray(data?.assignments)
                ? data.assignments.length
                : Array.isArray(data)
                ? data.length
                : 0;
            setAssignmentCount(count);
          } else {
            setAssignmentCount(null);
          }
        }
      } catch {
        if (isMounted) {
          setAnnouncementCount(null);
          setAssignmentCount(null);
        }
      }
    };

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#EDE7F6] p-2 sm:p-2.5 lg:p-3 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900 overflow-hidden">
      <style>{`
        .custom-student-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.2);
          border-radius: 9999px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.4);
        }
      `}</style>

      {/* Main White Rounded Dashboard Shell (Matching Dashboard Theme) */}
      <div className="w-full flex-1 bg-white rounded-[1.75rem] sm:rounded-[2.25rem] lg:rounded-[2.5rem] shadow-[0_15px_45px_-10px_rgba(110,80,200,0.12)] p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 lg:gap-5 border border-purple-100/70 relative h-full max-h-full min-h-0 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* 1. Purple Gradient Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-60 xl:w-64 shrink-0 flex-col rounded-[2rem] bg-gradient-to-b from-[#8E53F0] via-[#7B3FE4] to-[#6525C5] p-5 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:h-full lg:max-h-full lg:overflow-y-auto lg:shadow-xl lg:shadow-purple-600/15 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Top Logo / Graduation Icon Box */}
          <div className="flex items-center justify-between">
            <Link
              to="/student-dashboard"
              onClick={closeSidebar}
              className="group flex items-center gap-3 min-w-0"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-inner transition group-hover:scale-105 group-hover:bg-white/25">
                <GraduationCap className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight truncate">
                  AurumFx
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 truncate">
                  Student Portal
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-2 flex-1">
            {/* Dashboard */}
            <Link
              to="/student-dashboard"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isDashboardActive
                  ? 'bg-white font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10'
                  : 'font-semibold text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 ${isDashboardActive ? 'text-[#7B3FE4]' : 'text-white/80'}`} />
              <span>Dashboard</span>
            </Link>

            {/* Assignments */}
            <Link
              to="/student-dashboard/assignments"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isAssignmentsActive
                  ? 'bg-white font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10'
                  : 'font-semibold text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <ClipboardList className={`h-4 w-4 ${isAssignmentsActive ? 'text-[#7B3FE4]' : 'text-white/80'}`} />
                <span>Assignments</span>
              </span>
              {assignmentCount !== null && assignmentCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isAssignmentsActive ? 'bg-purple-100 text-[#7B3FE4]' : 'bg-white/25 text-white'
                }`}>
                  {assignmentCount}
                </span>
              )}
            </Link>

            {/* Browse Courses */}
            <Link
              to="/student-dashboard/courses"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isCatalogActive
                  ? 'bg-white font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10'
                  : 'font-semibold text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen className={`h-4 w-4 ${isCatalogActive ? 'text-[#7B3FE4]' : 'text-white/80'}`} />
              <span>Browse courses</span>
            </Link>

            {/* Announcements */}
            <Link
              to="/student-dashboard/announcements"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isAnnouncementsActive
                  ? 'bg-white font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10'
                  : 'font-semibold text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <Bell className={`h-4 w-4 ${isAnnouncementsActive ? 'text-[#7B3FE4]' : 'text-white/80'}`} />
                <span>Announcements</span>
              </span>
              {announcementCount !== null && announcementCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isAnnouncementsActive ? 'bg-purple-100 text-[#7B3FE4]' : 'bg-white/25 text-white'
                }`}>
                  {announcementCount}
                </span>
              )}
            </Link>

            {/* Enquiries */}
            <Link
              to="/student-dashboard/enquiries"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isEnquiriesActive
                  ? 'bg-white font-bold text-[#7B3FE4] shadow-md shadow-purple-900/10'
                  : 'font-semibold text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageCircle className={`h-4 w-4 ${isEnquiriesActive ? 'text-[#7B3FE4]' : 'text-white/80'}`} />
              <span>Enquiries</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-2 border-t border-white/15 pt-5">
            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-white/80" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* 2. Main Dashboard Content Column */}
        <div className="min-w-0 flex-1 flex flex-col h-full max-h-full min-h-0 overflow-hidden">
          {/* Top Header */}
          <header className="flex items-center justify-between gap-4 pb-4 border-b border-purple-100/70 mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl bg-purple-50 p-2 text-purple-700 hover:bg-purple-100 transition lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Student Portal
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {pageTitle}
                </h2>
              </div>
            </div>

            {/* Profile & Notification Widget */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/student-dashboard/announcements"
                className="relative rounded-full bg-[#F5F2FC] p-2.5 text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition"
                aria-label="View announcements"
              >
                <Bell className="h-4 w-4" />
                {announcementCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white font-extrabold text-sm shadow-md ring-2 ring-purple-100">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Enrolled Student
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Child Page Route Content */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 custom-student-scrollbar">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
