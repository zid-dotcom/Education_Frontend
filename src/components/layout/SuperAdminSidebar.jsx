import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  KeyRound,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  ShoppingCart,
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  SlidersHorizontal,
  AlertCircle,
  TrendingUp,
  Activity,
  Megaphone,
  X,
} from 'lucide-react';
import { getSuperAdminUnreadMessagesCountApi } from '../../services/superadmin';
import { getSuperAdminStaffUnreadCountApi } from '../../services/staffSuperAdminMessages';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('sa-sidebar-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sa-sidebar-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40';

const SIDEBAR_CSS = `
.sa-sidebar-nav::-webkit-scrollbar {
  display: none !important;
  width: 0px !important;
  height: 0px !important;
  background: transparent !important;
}
.sa-sidebar-nav {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
      { id: 'branch-overview', label: 'Branch Overview', icon: TrendingUp, path: '/super-admin/branch-overview' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'branches', label: 'Branches', icon: Building2, path: '/admin/branches' },
      { id: 'branch-admins', label: 'Branch Admins', icon: Users, path: '/admin/branch-admins' },
      { id: 'navigation-settings', label: 'Branch Navigation', icon: SlidersHorizontal, path: '/super-admin/navigation-settings' },
      { id: 'courses', label: 'Courses', icon: BookOpen, path: '/super-admin/courses' },
      { id: 'staff', label: 'Staff', icon: UserPlus, path: '/super-admin/staff' },
      { id: 'staff-verification', label: 'Staff Verification', icon: ShieldCheck, path: '/super-admin/staff-verification' },
      { id: 'staff-monitoring', label: 'Staff Monitoring', icon: Activity, path: '/super-admin/staff-monitoring' },
      { id: 'students', label: 'All Students', icon: Users, path: '/super-admin/students' },
      { id: 'enrollments', label: 'Course Enrollments', icon: GraduationCap, path: '/super-admin/enrollments' },
      { id: 'purchases', label: 'Purchase Approval', icon: ShoppingCart, path: '/super-admin/purchases' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'profit', label: 'Branch Profit', icon: IndianRupee, path: '/super-admin/profit' },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/super-admin/attendance' },
      { id: 'due-students', label: 'Due Students', icon: AlertCircle, path: '/super-admin/due-students' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'global-announcements', label: 'Global Announcements', icon: Bell, path: '/admin/announcements' },
      { id: 'branch-announcements', label: 'Branch Announcements', icon: Megaphone, path: '/super-admin/announcements' },
      { id: 'messages', label: 'Branch Admin Messages', icon: MessageSquare, path: '/super-admin/messages' },
      { id: 'staff-messages', label: 'Staff Messages', icon: Users, path: '/super-admin/staff-messages' },
      { id: 'enquiries', label: 'Enquiries', icon: MessageCircle, path: '/super-admin/enquiries' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'change-password', label: 'Change Password', icon: KeyRound, path: '/admin/change-password' },
    ],
  },
];

const SuperAdminSidebar = ({
  user,
  navigate,
  logout,
  sidebarOpen,
  setSidebarOpen,
  activePage = 'dashboard',
}) => {
  useDisplayFonts();
  const [unreadCount, setUnreadCount] = useState(0);
  const [staffUnreadCount, setStaffUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');

    const loadUnread = async () => {
      if (!token) return;
      try {
        const [baData, staffData] = await Promise.allSettled([
          getSuperAdminUnreadMessagesCountApi(token),
          getSuperAdminStaffUnreadCountApi(token),
        ]);

        if (isMounted && baData.status === 'fulfilled') {
          const data = baData.value;
          let total = 0;
          if (Array.isArray(data?.conversations)) {
            total = data.conversations.reduce(
              (acc, c) => acc + (Number(c?.unread_count) || 0),
              0
            );
          } else if (typeof data?.unread_count === 'number') {
            total = data.unread_count;
          } else if (typeof data?.total_unread_count === 'number') {
            total = data.total_unread_count;
          } else if (typeof data?.count === 'number') {
            total = data.count;
          } else if (typeof data === 'number') {
            total = data;
          }
          setUnreadCount(Number(total) || 0);
        }

        if (isMounted && staffData.status === 'fulfilled') {
          const s = staffData.value;
          const sCount =
            typeof s === 'number'
              ? s
              : typeof s?.unread_count === 'number'
              ? s.unread_count
              : typeof s?.count === 'number'
              ? s.count
              : 0;
          setStaffUnreadCount(Number(sCount) || 0);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
          setStaffUnreadCount(0);
        }
      }
    };

    loadUnread();
    const timer = setInterval(loadUnread, 20000);

    const onMessagesUpdated = () => {
      loadUnread();
    };
    window.addEventListener('messages-updated', onMessagesUpdated);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('messages-updated', onMessagesUpdated);
    };
  }, []);

  const routerNavigate = useNavigate();
  const effectiveNavigate = typeof navigate === 'function' ? navigate : routerNavigate;

  const closeSidebar = () => setSidebarOpen(false);
  const goTo = (path) => {
    closeSidebar();
    if (typeof effectiveNavigate === 'function') {
      effectiveNavigate(path);
    }
  };
  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout({ redirectTo: '/super-admin/login' });
    }
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen, setSidebarOpen]);

  const Brand = () => (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: '#17140f', color: '#f4b942' }}
      >
        <GraduationCap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg leading-none" style={{ ...serif, fontWeight: 500, color: '#17140f' }}>
          Aurum FX
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>
          Super Admin
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-start gap-3 px-4 py-3 md:hidden"
        style={{ ...sans, background: '#faf8f4', borderBottom: '1px solid #e3ddd0' }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className={`rounded-lg p-2 transition-colors hover:bg-[#f1ede4] ${FOCUS_RING}`}
          style={{ color: '#17140f', border: '1px solid #e3ddd0', background: '#ffffff' }}
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Brand />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 backdrop-blur-sm md:hidden"
          style={{ background: 'rgba(14,26,43,.55)' }}
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:max-h-screen md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          ...sans,
          background: '#faf8f4',
          borderRight: '1px solid #e3ddd0',
          boxShadow: sidebarOpen ? '0 30px 80px -30px rgba(14,26,43,.5)' : 'none',
        }}
      >
        <div className="px-6 pb-5 pt-8 shrink-0" style={{ borderBottom: '1px solid #e3ddd0' }}>
          <Brand />
        </div>

        <nav
          className="sa-sidebar-nav flex-1 min-h-0 space-y-5 overflow-y-auto px-3 py-5"
          aria-label="Super Admin navigation"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a39a8c' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon, path }) => {
                  const isActive = activePage === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => goTo(path)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive ? 'font-medium' : 'hover:bg-[#f1ede4]'
                      } ${FOCUS_RING}`}
                      style={{
                        background: isActive ? '#f1ede4' : undefined,
                        color: isActive ? '#17140f' : '#5b5346',
                      }}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                          style={{ background: '#9c6b2e' }}
                        />
                      )}
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: isActive ? '#9c6b2e' : '#a39a8c' }}
                      />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {id === 'messages' && unreadCount > 0 && (
                        <span
                          className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-xs"
                          style={{ background: '#0284c7' }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {id === 'staff-messages' && staffUnreadCount > 0 && (
                        <span
                          className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-xs"
                          style={{ background: '#9c6b2e' }}
                        >
                          {staffUnreadCount > 99 ? '99+' : staffUnreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account footer */}
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid #e3ddd0' }}>
          <div className="flex items-center gap-3 px-1">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#17140f', color: '#f4b942' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: '#17140f' }}>
                {user?.name || 'Super admin'}
              </p>
              <p className="truncate text-xs" style={{ color: '#a39a8c' }}>
                {user?.email || 'Admin account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-rose-100 ${FOCUS_RING}`}
            style={{ color: '#be123c', border: '1px solid #fecdd3', background: '#fff1f2' }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
