import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Menu,
  ShieldCheck,
  UserPlus,
  UserRoundSearch,
  Users,
  Activity,
  Receipt,
  Star,
  X,
} from "lucide-react";
import { getBranchUnreadMessageCountApi } from "../../services/branchadminmessages";
import {
  getMyBranchSidebarNavigationApi,
  normalizeNavSettings,
} from "../../services/sidebarnavigation";
import {
  getBranchAdminPendingPurchasesApi,
  getBranchAdminPurchasesApi,
} from "../../services/branchadminpurchases";
import { getBranchAdminPendingInstallmentPaymentsApi } from "../../services/branchadminenrollments";

/* Same display-font pairing used across the branch admin pages
   (Fraunces headings, Inter body). No-op if already injected. */
const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const SIDEBAR_CSS = `
.ba-sidebar-nav::-webkit-scrollbar,
.branch-admin-sidebar::-webkit-scrollbar,
.branch-admin-sidebar *::-webkit-scrollbar {
  display: none !important;
  width: 0px !important;
  height: 0px !important;
  background: transparent !important;
}
.ba-sidebar-nav,
.branch-admin-sidebar,
.branch-admin-sidebar * {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", backendKey: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/branch-admin/dashboard" },
    ],
  },
  {
    label: "Courses",
    items: [
      { id: "courses", backendKey: "courses", label: "Courses", icon: BookOpen, path: "/branch-admin/courses" },
      { id: "course-enrollments", backendKey: "course_enrolments", label: "Course enrollments", icon: UserRoundSearch, path: "/branch-admin/course-enrollments" },
      { id: "purchases", backendKey: "course_approvals", label: "Course approvals", icon: CheckCircle2, path: "/branch-admin/purchases" },
      { id: "reviews", backendKey: "course_reviews", label: "Course reviews", icon: Star, path: "/branch-admin/reviews" },
    ],
  },
  {
    label: "Students",
    items: [
      { id: "registration", backendKey: "register_student", label: "Register student", icon: UserPlus, path: "/branch-admin/student-registration" },
      { id: "enrollments", backendKey: "view_students", label: "View students", icon: Users, path: "/branch-admin/enrollments" },
      { id: "fees-due", backendKey: "fees_due_students", label: "Fees due students", icon: IndianRupee, path: "/branch-admin/fees-due" },
      { id: "enquiries", backendKey: "enquiries", label: "Enquiries", icon: MessageCircle, path: "/branch-admin/enquiries" },
    ],
  },
  {
    label: "Staff",
    items: [
      { id: "staff", backendKey: "staff", label: "Staff", icon: UserPlus, path: "/branch-admin/staff" },
      { id: "all-staff", backendKey: "all_staff", label: "All staffs", icon: Users, path: "/branch-admin/all-staff" },
      { id: "staff-verification", backendKey: "staff_verification", label: "Staff verification", icon: ShieldCheck, path: "/branch-admin/staff-verification" },
      { id: "staff-monitoring", backendKey: "staff_monitoring", label: "Staff monitoring", icon: Activity, path: "/branch-admin/staff-monitoring" },
      { id: "attendance", backendKey: "my_attendance", label: "My attendance", icon: CalendarCheck, path: "/branch-admin/attendance" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "fees", backendKey: "student_fees", label: "Branch Revenue", icon: IndianRupee, path: "/branch-admin/profit" },
      { id: "receipts", label: "Student Receipts", icon: Receipt, path: "/branch-admin/receipts" },
      { id: "expenses", label: "Branch expenses", icon: IndianRupee, path: "/branch-admin/expenses" },
    ],
  },
  {
    label: "Communication",
    items: [
      { id: "announcements", backendKey: "announcements", label: "Announcements", icon: Bell, path: "/branch-admin/announcements" },
      { id: "messages", backendKey: "messages", label: "Messages", icon: MessageCircle, path: "/branch-admin/messages" },
    ],
  },
];

const BranchAdminSidebar = ({
  user,
  navigate,
  logout,
  sidebarOpen,
  setSidebarOpen,
  openCreate,
  activePage = "courses",
}) => {
  useDisplayFonts();
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = React.useState(0);
  const [navSettings, setNavSettings] = React.useState(() => {
    try {
      const cached = localStorage.getItem("branchAdminNavSettings");
      return cached ? normalizeNavSettings(JSON.parse(cached)) : null;
    } catch {
      return null;
    }
  });

  // Fetch navigation settings for the branch admin
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadNavSettings = async () => {
      try {
        const data = await getMyBranchSidebarNavigationApi(token);
        const normalized = normalizeNavSettings(data);
        if (isMounted) {
          setNavSettings(normalized);
          localStorage.setItem("branchAdminNavSettings", JSON.stringify(normalized));
        }
      } catch (err) {
        console.warn("Could not load branch sidebar navigation:", err);
      }
    };

    loadNavSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    const loadUnreadMessages = async () => {
      if (!token || activePage === "messages") return;
      try {
        const data = await getBranchUnreadMessageCountApi(token);
        if (isMounted) setUnreadMessageCount(Number(data?.unread_count) || 0);
      } catch {
        if (isMounted) setUnreadMessageCount(0);
      }
    };

    loadUnreadMessages();
    const refreshTimer = window.setInterval(loadUnreadMessages, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [activePage]);

  // Fetch pending course approvals count for sidebar badge
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadPendingApprovals = async () => {
      try {
        const [pendingPurchasesRes, allPurchasesRes, pendingPaymentsRes] =
          await Promise.allSettled([
            getBranchAdminPendingPurchasesApi(token),
            getBranchAdminPurchasesApi(token),
            getBranchAdminPendingInstallmentPaymentsApi(token),
          ]);

        let count = 0;

        // 1. Dedicated pending course purchases/admissions endpoint
        if (pendingPurchasesRes.status === "fulfilled") {
          const val = pendingPurchasesRes.value;
          const list = Array.isArray(val)
            ? val
            : Array.isArray(val?.pending)
            ? val.pending
            : Array.isArray(val?.purchases)
            ? val.purchases
            : Array.isArray(val?.enrollments)
            ? val.enrollments
            : Array.isArray(val?.data)
            ? val.data
            : [];
          count = list.length;
        }

        // 2. If direct endpoint returned 0, check purchases history for pending branch approval
        if (count === 0 && allPurchasesRes.status === "fulfilled") {
          const val = allPurchasesRes.value;
          const list = Array.isArray(val)
            ? val
            : Array.isArray(val?.purchases)
            ? val.purchases
            : Array.isArray(val?.enrollments)
            ? val.enrollments
            : Array.isArray(val?.data)
            ? val.data
            : [];
          count = list.filter((p) => {
            const cs = String(p.course_status || p.status || "").toLowerCase();
            const ba = String(p.branch_approval_status || "").toLowerCase();
            const sa = String(p.super_admin_approval_status || "").toLowerCase();
            return (
              cs === "pending" ||
              cs === "applied" ||
              ba === "pending" ||
              (!cs && sa === "pending")
            );
          }).length;
        }

        // 3. Fallback to pending online installment payments if purchases pending is 0
        if (count === 0 && pendingPaymentsRes.status === "fulfilled") {
          const val = pendingPaymentsRes.value;
          const list = Array.isArray(val)
            ? val
            : Array.isArray(val?.pending)
            ? val.pending
            : Array.isArray(val?.payments)
            ? val.payments
            : Array.isArray(val?.data)
            ? val.data
            : [];
          count = list.length;
        }

        if (isMounted) setPendingApprovalCount(count);
      } catch {
        if (isMounted) setPendingApprovalCount(0);
      }
    };

    loadPendingApprovals();
    const refreshTimer = window.setInterval(loadPendingApprovals, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [activePage]);

  const routerNavigate = useNavigate();
  const effectiveNavigate = typeof navigate === "function" ? navigate : routerNavigate;

  const closeSidebar = () => setSidebarOpen(false);
  const goTo = (path) => {
    if (path === "/branch-admin/messages") setUnreadMessageCount(0);
    closeSidebar();
    if (typeof effectiveNavigate === "function") {
      effectiveNavigate(path);
    }
  };
  const handleLogout = () => {
    if (typeof logout === "function") {
      logout({ redirectTo: "/branch-admin-login" });
    }
  };

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  const Brand = () => (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: "#17140f", color: "#f4b942" }}
      >
        <GraduationCap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg leading-none" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
          Aurum FX
        </p>
        <p className="mt-1 text-xs" style={{ color: "#a39a8c" }}>
          Academy
        </p>
      </div>
    </div>
  );

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="branch-admin-overlay fixed inset-0 z-30 backdrop-blur-sm md:hidden"
          style={{ background: "rgba(23,20,15,.55)" }}
          aria-label="Close branch navigation"
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={`branch-admin-sidebar fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          ...sans,
          background: "#faf8f4",
          borderRight: "1px solid #e3ddd0",
          boxShadow: sidebarOpen ? "0 30px 80px -30px rgba(23,20,15,.5)" : "none",
        }}
      >
        <style>{SIDEBAR_CSS}</style>
        <div
          className="flex h-[92px] items-center justify-between px-6 shrink-0"
          style={{ borderBottom: "1px solid #e3ddd0" }}
        >
          <Brand />
          <button
            type="button"
            onClick={closeSidebar}
            className={`rounded-lg p-1.5 transition-colors hover:bg-[#f1ede4] md:hidden ${FOCUS_RING}`}
            style={{ color: "#17140f", border: "1px solid #e3ddd0", background: "#ffffff" }}
            aria-label="Close branch navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="ba-sidebar-nav no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          aria-label="Branch navigation"
        >
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!navSettings) return true;
              const backendKey = item.backendKey;
              const frontendId = item.id;
              const val = navSettings[backendKey] !== undefined ? navSettings[backendKey] : navSettings[frontendId];
              if (val === false || val === 'false' || val === 0 || val === '0' || val === 'off') {
                return false;
              }
              if (navSettings[frontendId] === false || navSettings[frontendId] === 'false') {
                return false;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 pb-2 text-xs" style={{ color: "#a39a8c" }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(({ id, label, icon: Icon, path }) => {
                    const isActive = activePage === id;
                    const showUnreadCount = id === "messages" && unreadMessageCount > 0;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => goTo(path)}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          isActive ? "font-medium" : "hover:bg-[#f1ede4]"
                        } ${FOCUS_RING}`}
                        style={{
                          background: isActive ? "#f7efe0" : undefined,
                          color: isActive ? "#17140f" : "#5b5346",
                        }}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                            style={{ background: "#9c6b2e" }}
                          />
                        )}
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: isActive ? "#9c6b2e" : "#a39a8c" }}
                        />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {showUnreadCount && (
                          <span
                            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                            style={{ background: "#5c7a5a", color: "#ffffff" }}
                            aria-label={`${unreadMessageCount} unread messages`}
                          >
                            {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                          </span>
                        )}
                        {id === "purchases" && pendingApprovalCount > 0 && (
                          <span
                            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                            style={{ background: "#9c6b2e", color: "#ffffff" }}
                            aria-label={`${pendingApprovalCount} pending course approvals`}
                          >
                            {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ---- Account ---- */}
        <div className="p-4 shrink-0 mt-auto" style={{ borderTop: "1px solid #e3ddd0" }}>
          <div className="flex items-center gap-3 px-1">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: "#17140f" }}>
                {user?.name || "Branch admin"}
              </p>
              <p className="truncate text-xs" style={{ color: "#a39a8c" }}>
                {user?.email || "Branch account"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors hover:bg-[#f8eae5] ${FOCUS_RING}`}
            style={{ color: "#a24a3a", border: "1px solid #eccec4", background: "#ffffff" }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default BranchAdminSidebar;