import React, { useEffect, useState } from 'react';
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
  Folder,
  ChevronRight,
  Building2,
  MessageSquare,
  FolderDown,
} from 'lucide-react';
import logoImage from '../../assets/logo.png';
import { getStaffUnreadCountApi } from '../../services/studentStaffMessages';
import { getStaffSuperAdminUnreadCountApi } from '../../services/staffSuperAdminMessages';

export const STAFF_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard', folder: 'Overview' },
  { id: 'courses', label: 'My Courses & Students', icon: BookOpen, path: '/staff/courses', folder: 'Academics' },
  { id: 'assignments', label: 'Assignments', icon: FileText, path: '/staff/assignments', folder: 'Academics' },
  { id: 'study_materials', label: 'Study Materials', icon: FolderDown, path: '/staff/study-materials', folder: 'Academics' },
  { id: 'messages', label: 'Student Messages', icon: MessageSquare, path: '/staff/messages', folder: 'Communication' },
  { id: 'super_admin_messages', label: 'Super Admin Messages', icon: ShieldCheck, path: '/staff/super-admin-messages', folder: 'Communication' },
  { id: 'announcements', label: 'Course Announcements', icon: Megaphone, path: '/staff/announcements', folder: 'Communication' },
  { id: 'institution_announcements', label: 'Institution Announcements', icon: Building2, path: '/staff/institution-announcements', folder: 'Communication' },
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
  token,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [superAdminUnreadCount, setSuperAdminUnreadCount] = useState(0);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('staffToken');
    if (!authToken) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const [studentUnread, saUnread] = await Promise.allSettled([
          getStaffUnreadCountApi(authToken),
          getStaffSuperAdminUnreadCountApi(authToken),
        ]);

        if (isMounted) {
          if (studentUnread.status === 'fulfilled') {
            const data = studentUnread.value;
            const count =
              typeof data === 'number'
                ? data
                : typeof data?.unread_count === 'number'
                ? data.unread_count
                : typeof data?.count === 'number'
                ? data.count
                : 0;
            setUnreadCount(count);
          }

          if (saUnread.status === 'fulfilled') {
            const sData = saUnread.value;
            const sCount =
              typeof sData === 'number'
                ? sData
                : typeof sData?.unread_count === 'number'
                ? sData.unread_count
                : typeof sData?.count === 'number'
                ? sData.count
                : 0;
            setSuperAdminUnreadCount(sCount);
          }
        }
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);

    const onUpdated = () => fetchUnread();
    window.addEventListener('staff-messages-updated', onUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('staff-messages-updated', onUpdated);
    };
  }, [token]);

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

      {/* Left Sidebar (Warm Light Nav Panel) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-300 md:static md:translate-x-0 h-full overflow-hidden staff-portal-sidebar ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <aside className="w-60 sm:w-64 shrink-0 bg-[#FAF8F4] border-r border-[#E3DDD0] flex flex-col py-6 px-4 justify-between shadow-xs h-full overflow-y-auto custom-staff-scrollbar staff-portal-sidebar-aside">
          <div className="w-full">
            {/* Brand Logo & Text Area */}
            <div className="h-10 flex items-center justify-between px-1 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs border border-[#E3DDD0] shrink-0">
                  <img src={logoImage} alt="Aurum FX" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-base font-black text-[#17140F] tracking-tight leading-none">
                    Aurum FX
                  </p>
                  <p className="text-[10px] font-bold text-[#9C6B2E] tracking-wider uppercase mt-1">
                    Staff Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Header Label */}
            <div className="h-5 flex items-center mb-1.5 px-2 mt-7">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A8175]">
                Navigation
              </p>
            </div>

            {/* Navigation Menu Items List */}
            <div className="space-y-1.5">
              {STAFF_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isMessages = item.id === 'messages';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#F1EDE4] text-[#17140F] shadow-2xs font-bold border border-[#E3DDD0]/80'
                        : 'text-[#5B5346] hover:bg-[#F1EDE4] hover:text-[#17140F]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-[#9C6B2E]' : 'text-[#8A8175]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isMessages && unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                        {unreadCount}
                      </span>
                    ) : item.id === 'super_admin_messages' && superAdminUnreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#9C6B2E] text-white font-extrabold text-[10px] animate-pulse">
                        {superAdminUnreadCount}
                      </span>
                    ) : isActive ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#9C6B2E]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch & Account Card + Logout Button at Bottom */}
          <div className="pt-4 border-t border-[#E3DDD0] px-1 flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-[#E3DDD0] flex items-center gap-2.5 shadow-2xs min-w-0 flex-1">
              <div className="h-8 w-8 rounded-lg bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E3DDD0]">
                <Building2 className="h-4 w-4 text-[#9C6B2E]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#17140F] truncate" title={user?.branch_name || 'Main Branch'}>
                  {user?.branch_name || 'Main Branch'}
                </p>
                <p className="text-[10px] text-[#8A8175] truncate">
                  {user?.branch_location || user?.location || 'Aurum FX Education'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="h-10 w-10 shrink-0 rounded-xl bg-white border border-[#E3DDD0] text-[#6B6255] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

export default StaffSidebar;
