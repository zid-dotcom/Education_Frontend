import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  X,
  FolderDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserAnnouncementsApi } from '../../services/userannouncements';
import { getStudentAssignmentsApi } from '../../services/studentassignments';
import { getStudentUnreadCountApi } from '../../services/studentStaffMessages';

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
  const [messagesCount, setMessagesCount] = useState(null);

  const displayName = user?.name || 'Student';
  const displayEmail = user?.email || 'Email not available';
  const closeSidebar = () => setIsSidebarOpen(false);

  const isCatalogActive = location.pathname.startsWith('/student-dashboard/courses');
  const isInstitutionAnnouncementsActive = location.pathname.startsWith('/student-dashboard/institution-announcements');
  const isAnnouncementsActive = !isInstitutionAnnouncementsActive && location.pathname.startsWith('/student-dashboard/announcements');
  const isEnquiriesActive = location.pathname.startsWith('/student-dashboard/enquiries');
  const isAssignmentsActive = location.pathname.startsWith('/student-dashboard/assignments');
  const isStudyMaterialsActive = location.pathname.startsWith('/student-dashboard/study-materials');
  const isMessagesActive = location.pathname.startsWith('/student-dashboard/messages');
  const isDashboardActive =
    !isCatalogActive && !isInstitutionAnnouncementsActive && !isAnnouncementsActive && !isEnquiriesActive && !isAssignmentsActive && !isMessagesActive && !isStudyMaterialsActive;

  const pageTitle = isMessagesActive
    ? 'Faculty Messages'
    : isAssignmentsActive
    ? 'Assignments'
    : isStudyMaterialsActive
    ? 'Study Materials'
    : isCatalogActive
    ? 'Browse Courses'
    : isInstitutionAnnouncementsActive
    ? 'Institution Announcements'
    : isAnnouncementsActive
    ? 'Course Announcements'
    : isEnquiriesActive
    ? 'Enquiries'
    : 'Dashboard';

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      if (!token) return;
      try {
        const [announcementsData, assignmentsData, messagesData] = await Promise.allSettled([
          getUserAnnouncementsApi(token),
          getStudentAssignmentsApi(token),
          getStudentUnreadCountApi(token),
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

          if (messagesData.status === 'fulfilled') {
            const mVal = messagesData.value;
            const mCount =
              typeof mVal === 'number'
                ? mVal
                : typeof mVal?.unread_count === 'number'
                ? mVal.unread_count
                : typeof mVal?.count === 'number'
                ? mVal.count
                : 0;
            setMessagesCount(mCount);
          } else {
            setMessagesCount(null);
          }
        }
      } catch {
        if (isMounted) {
          setAnnouncementCount(null);
          setAssignmentCount(null);
          setMessagesCount(null);
        }
      }
    };

    fetchCounts();
    const countInterval = setInterval(fetchCounts, 12000);
    return () => {
      isMounted = false;
      clearInterval(countInterval);
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen max-h-screen w-full bg-white flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased selection:bg-amber-200 selection:text-amber-900 overflow-hidden">
      <style>{`
        .custom-student-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 107, 46, 0.2);
          border-radius: 9999px;
        }
        .custom-student-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 107, 46, 0.4);
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 1. Warm Light Sidebar (Fitted fully, structure preserved) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 xl:w-64 shrink-0 flex-col bg-[#FAF8F4] border-r border-[#E3DDD0] p-5 text-[#17140F] shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:h-full lg:max-h-full lg:overflow-y-auto lg:shadow-none student-portal-sidebar student-portal-sidebar-aside ${
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17140F] text-[#F4B942] border border-[#E3DDD0] shadow-sm transition group-hover:scale-105">
                <GraduationCap className="h-6 w-6 text-[#F4B942] drop-shadow-xs" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#17140F] leading-tight truncate">
                  AurumFx
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E] truncate">
                  Student Portal
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-xl p-2 text-[#5B5346] hover:bg-[#F1EDE4] lg:hidden"
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
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 ${isDashboardActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
              <span>Dashboard</span>
            </Link>

            {/* Assignments */}
            <Link
              to="/student-dashboard/assignments"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isAssignmentsActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <ClipboardList className={`h-4 w-4 ${isAssignmentsActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
                <span>Assignments</span>
              </span>
              {assignmentCount !== null && assignmentCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isAssignmentsActive ? 'bg-[#E8DFC8] text-[#9C6B2E]' : 'bg-[#EAE4D9] text-[#5B5346]'
                }`}>
                  {assignmentCount}
                </span>
              )}
            </Link>

            {/* Study Materials */}
            <Link
              to="/student-dashboard/study-materials"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isStudyMaterialsActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <FolderDown className={`h-4 w-4 ${isStudyMaterialsActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
              <span>Study Materials</span>
            </Link>

            {/* Browse Courses */}
            <Link
              to="/student-dashboard/courses"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isCatalogActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <BookOpen className={`h-4 w-4 ${isCatalogActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
              <span>Browse courses</span>
            </Link>

            {/* Course Announcements */}
            <Link
              to="/student-dashboard/announcements"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isAnnouncementsActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <Megaphone className={`h-4 w-4 ${isAnnouncementsActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
                <span>Course Announcements</span>
              </span>
            </Link>

            {/* Institution Announcements */}
            <Link
              to="/student-dashboard/institution-announcements"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isInstitutionAnnouncementsActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <Building2 className={`h-4 w-4 ${isInstitutionAnnouncementsActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
                <span>Institution Notices</span>
              </span>
              {announcementCount !== null && announcementCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isInstitutionAnnouncementsActive ? 'bg-[#E8DFC8] text-[#9C6B2E]' : 'bg-[#EAE4D9] text-[#5B5346]'
                }`}>
                  {announcementCount}
                </span>
              )}
            </Link>

            {/* Faculty Messages */}
            <Link
              to="/student-dashboard/messages"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs transition ${
                isMessagesActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <MessageCircle className={`h-4 w-4 ${isMessagesActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
                <span>Messages</span>
              </span>
              {messagesCount !== null && messagesCount > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black animate-pulse bg-rose-500 text-white">
                  {messagesCount}
                </span>
              )}
            </Link>

            {/* Enquiries */}
            <Link
              to="/student-dashboard/enquiries"
              onClick={closeSidebar}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs transition ${
                isEnquiriesActive
                  ? 'bg-[#F1EDE4] font-bold text-[#17140F] shadow-xs border border-[#E3DDD0]/80'
                  : 'font-semibold text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <MessageSquare className={`h-4 w-4 ${isEnquiriesActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'}`} />
              <span>Enquiries</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-2 border-t border-[#E3DDD0] pt-5">
            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#5B5346] transition hover:bg-[#F1EDE4] hover:text-[#17140F]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#5B5346] transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent"
            >
              <LogOut className="h-4 w-4 text-[#8A8175]" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* 2. Main Dashboard Content Column */}
        <div className="min-w-0 flex-1 flex flex-col h-full max-h-full min-h-0 bg-white p-4 sm:p-5 lg:p-6 overflow-hidden student-portal-content">
          {/* Top Header */}
          <header className="flex items-center justify-between gap-4 pb-4 border-b border-[#E3DDD0] mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl bg-[#FAF8F4] border border-[#E3DDD0] p-2 text-[#17140F] hover:bg-[#F1EDE4] transition lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Student Portal
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {pageTitle}
                </h2>
              </div>
            </div>

            {/* Profile & Notification Widget */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/student-dashboard/messages"
                className="relative rounded-full bg-[#FAF8F4] border border-[#E3DDD0] p-2.5 text-slate-600 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition"
                aria-label="View messages"
                title="Faculty Messages"
              >
                <MessageCircle className="h-4 w-4" />
                {messagesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>

              <Link
                to="/student-dashboard/announcements"
                className="relative rounded-full bg-[#FAF8F4] border border-[#E3DDD0] p-2.5 text-slate-600 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition"
                aria-label="View announcements"
                title="Announcements"
              >
                <Bell className="h-4 w-4" />
                {announcementCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140F] text-[#F4B942] font-extrabold text-sm shadow-sm ring-2 ring-[#E3DDD0]">
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
  );
};

export default StudentLayout;
