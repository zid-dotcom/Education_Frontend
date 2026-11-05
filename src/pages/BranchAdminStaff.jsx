import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Edit3,
  History,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Activity,
  Eye,
  EyeOff,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import Toast from "../components/common/Toast";
import AttendanceCalendarMatrix from "../components/common/AttendanceCalendarMatrix";
import AttendanceSummaryCards from "../components/common/AttendanceSummaryCards";
import AttendanceStatusBadge, { normalizeAttendanceStatus } from "../components/common/AttendanceStatusBadge";
import { getMyCoursesApi } from "../services/branchadmincourses";
import {
  createBranchStaffApi,
  deleteBranchStaffApi,
  getBranchStaffApi,
  getStaffAttendanceApi,
  markStaffAttendanceApi,
  updateBranchStaffApi,
  updateBranchAdminStaffStatusApi,
  updateStaffAttendanceApi,
} from "../services/branchadminstaff";
import { getHolidaysApi } from "../services/holidays";
import { getDefaultFromDate, getDefaultToDate } from "../utils/dateFilters";

/* Same display-font pairing used on the attendance page: Fraunces for
   headings, Inter for everything else. No-op if already injected. */
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

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  course_id: "",
  address: "",
  salary: "",
};

const FIELD_LABELS = { name: "Full name", email: "Email", phone: "Phone" };

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatAttendanceDate = (date) => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch (e) {
    return date;
  }
};

const formatAttendanceTimestamp = (timestamp) => {
  if (!timestamp) return "—";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "—";
  }
};

const STATUS_META = {
  Present: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  "Half Day": { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  Leave: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
};
const statusMeta = (status) =>
  STATUS_META[status] || { dot: "#a39a8c", text: "#8a8175", bg: "#f1ede4" };

const formatPhone = (phone) => {
  const value = String(phone || "").trim();
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 11 && digits.startsWith("0"))
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return value || "Not provided";
};

const TABS = [
  { id: "attendance", label: "Mark attendance", icon: ClipboardCheck },
  { id: "history", label: "Attendance history", icon: History },
  { id: "staff", label: "Staff accounts", icon: UserCheck },
];

const inputStyle = {
  border: "1px solid #e3ddd0",
  color: "#1c1a17",
  background: "#ffffff",
};

const BranchAdminStaff = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [attendanceDate, setAttendanceDate] = useState(getToday);
  const [attendance, setAttendance] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [calendarAttendance, setCalendarAttendance] = useState([]);
  const [backendHistorySummary, setBackendHistorySummary] = useState(null);
  const [attendanceStartDate, setAttendanceStartDate] = useState(getDefaultFromDate);
  const [attendanceEndDate, setAttendanceEndDate] = useState(getDefaultToDate);
  const activeHistoryRequestIdRef = useRef(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    total: 0,
    present: 0,
    half_day: 0,
    leave: 0,
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(null);
  const [attendanceDrafts, setAttendanceDrafts] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [attendanceViewMode, setAttendanceViewMode] = useState("calendar");
  const [holidays, setHolidays] = useState([]);

  const handleMatrixSaveStatus = async (staffId, dateStr, newStatus, existingRecord) => {
    if (!token) return;
    const today = getToday();
    if (dateStr !== today) {
      setError("Staff attendance can only be marked or updated for today. Past dates cannot be modified.");
      return;
    }
    const holidayMatch = holidays.find((h) => {
      const hd = String(h.date || h.holiday_date || "").slice(0, 10);
      return hd === dateStr;
    });
    if (holidayMatch) {
      setError(`Cannot mark or update attendance on a declared branch holiday ("${holidayMatch.reason || 'Holiday'}"). Attendance is closed.`);
      return;
    }
    const member = staff.find((s) => String(s.id) === String(staffId));
    const memberName = member ? member.name : "Staff";
    const cellKey = `${String(staffId)}_${dateStr}`;
    setAttendanceSaving(cellKey);
    setError("");

    try {
      const existing =
        existingRecord ||
        calendarAttendance.find(
          (r) =>
            String(r.staff_id) === String(staffId) &&
            String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
        ) ||
        attendanceHistory.find(
          (r) =>
            String(r.staff_id) === String(staffId) &&
            String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
        );

      let savedRecord;
      if (newStatus === null) {
        if (existing) {
          await updateStaffAttendanceApi(existing.id, { status: "Absent" }, token);
          savedRecord = { ...existing, status: "Absent" };
        }
      } else if (existing) {
        await updateStaffAttendanceApi(existing.id, { status: newStatus }, token);
        savedRecord = { ...existing, status: newStatus };
      } else {
        const res = await markStaffAttendanceApi(
          { staff_id: staffId, date: dateStr, status: newStatus },
          token
        );
        savedRecord = res?.attendance || {
          id: Date.now(),
          staff_id: staffId,
          date: dateStr,
          status: newStatus,
        };
      }

      if (savedRecord) {
        setCalendarAttendance((prev) => {
          const idx = prev.findIndex(
            (r) =>
              String(r.staff_id) === String(staffId) &&
              String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...savedRecord };
            return next;
          }
          return [...prev, savedRecord];
        });
        setAttendanceHistory((prev) => {
          const idx = prev.findIndex(
            (r) =>
              String(r.staff_id) === String(staffId) &&
              String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...savedRecord };
            return next;
          }
          return [...prev, savedRecord];
        });
      }
      setSuccess(`${memberName}'s attendance for ${dateStr} saved as ${newStatus || "Absent"}.`);
    } catch (err) {
      setError(err.message || "Failed to save staff attendance.");
      throw err;
    } finally {
      setAttendanceSaving(null);
    }
  };

  const loadStaff = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchStaffApi(token);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load branch staff.");
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarAttendance = async (monthOrParams) => {
    if (!token) return;
    try {
      const data = await getStaffAttendanceApi(token, monthOrParams);
      const records = Array.isArray(data?.attendance) ? data.attendance : [];
      setCalendarAttendance(records);
    } catch (err) {
      console.error("Failed to load staff calendar attendance:", err);
    }
  };

  const handleCalendarMonthChange = (newDate) => {
    if (!token || !newDate) return;
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    loadCalendarAttendance(`${y}-${m}`);
  };

  const loadAttendance = async (date = "") => {
    if (!token) return;
    try {
      setAttendanceLoading(true);
      const data = await getStaffAttendanceApi(token, date);
      const records = Array.isArray(data?.attendance)
        ? data.attendance.filter((record) => record.status !== "Absent")
        : [];
      setAttendance(records);
      setAttendanceSummary({
        total: Number(data?.total || records.length),
        present: Number(data?.present || 0),
        half_day: Number(data?.half_day || 0),
        leave: Number(data?.leave || 0),
      });
      setAttendanceDrafts(
        records.reduce(
          (drafts, record) => ({ ...drafts, [record.staff_id]: record.status }),
          {},
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to load staff attendance.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadAttendanceHistory = async (params = {}) => {
    if (!token) return;
    const queryParams = { ...params };
    const dFrom = queryParams.date_from || attendanceStartDate;
    const dTo = queryParams.date_to || attendanceEndDate;
    if (dFrom && dTo && dFrom > dTo) {
      // Guard against invalid date ordering so backend error 'date_from must not be after date_to' never triggers
      return;
    }
    if (dFrom) queryParams.date_from = dFrom;
    if (dTo) queryParams.date_to = dTo;

    const requestId = ++activeHistoryRequestIdRef.current;
    try {
      setAttendanceLoading(true);
      setError("");
      const data = await getStaffAttendanceApi(token, queryParams);
      if (requestId !== activeHistoryRequestIdRef.current) return;

      let records = Array.isArray(data?.attendance) ? data.attendance : [];
      if (dFrom || dTo) {
        records = records.filter((r) => {
          const d = String(r.date || r.attendance_date || r.marked_at || "").slice(0, 10);
          if (!d) return true;
          if (dFrom && d < dFrom) return false;
          if (dTo && d > dTo) return false;
          return true;
        });
      }
      setAttendanceHistory(records);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setBackendHistorySummary({
          total: data.total !== undefined ? Number(data.total) : undefined,
          present: data.present !== undefined ? Number(data.present) : undefined,
          half_day: data.half_day !== undefined ? Number(data.half_day) : undefined,
          absent: data.absent !== undefined ? Number(data.absent) : undefined,
          leave: data.leave !== undefined ? Number(data.leave) : undefined,
          total_holidays: data.total_holidays !== undefined ? Number(data.total_holidays) : undefined,
          total_working_days: data.total_working_days !== undefined ? Number(data.total_working_days) : undefined,
        });
      }
    } catch (err) {
      if (requestId === activeHistoryRequestIdRef.current) {
        setError(err.message || "Failed to load attendance history.");
      }
    } finally {
      if (requestId === activeHistoryRequestIdRef.current) {
        setAttendanceLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      if (attendanceStartDate && attendanceEndDate && attendanceStartDate > attendanceEndDate) return;
      loadAttendanceHistory();
    }
  }, [token, activeTab, attendanceStartDate, attendanceEndDate]);

  useEffect(() => {
    loadStaff();
    loadAttendance(attendanceDate);
    loadCalendarAttendance();
    loadAttendanceHistory();
    if (token) {
      getHolidaysApi(token)
        .then((data) => {
          const list = Array.isArray(data) ? data : Array.isArray(data?.holidays) ? data.holidays : [];
          setHolidays(list);
        })
        .catch(() => {});
      getMyCoursesApi(token)
        .then((data) => setCourses(Array.isArray(data) ? data : []))
        .catch((err) => setError(err.message || "Failed to load courses."));
    }
  }, [token]);

  const handleAttendanceDateChange = async (event) => {
    const date = event.target.value;
    setAttendanceDate(date);
    await loadAttendance(date);
  };

  const saveAttendance = async (member) => {
    const status = attendanceDrafts[member.id] || "Present";
    if (!token) return;
    try {
      setAttendanceSaving(member.id);
      setError("");
      const existing = attendance.find(
        (record) =>
          record.staff_id === member.id && record.date === attendanceDate,
      );
      const payload = { staff_id: member.id, date: attendanceDate, status };
      if (existing) {
        await updateStaffAttendanceApi(existing.id, payload, token);
      } else {
        await markStaffAttendanceApi(payload, token);
      }
      await loadAttendance(attendanceDate);
      setSuccess(`${member.name}'s attendance saved.`);
    } catch (err) {
      setError(err.message || "Failed to save staff attendance.");
    } finally {
      setAttendanceSaving(null);
    }
  };

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingStaff(null);
    setShowPassword(false);
  };

  const openCreate = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const openEdit = (member) => {
    setEditingStaff(member);
    setForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      phone: member.phone || "",
      course_id: member.course_id || "",
      address: member.address || "",
      salary: member.salary ?? "",
    });
    setError("");
    setSuccess("");
  };

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (!editingStaff && !form.password.trim()) {
        setError("A password is required when creating staff.");
        setToast({
          type: "warning",
          title: "Password Required",
          message: "A password is required when creating staff.",
        });
        return;
      }
      if (form.salary === "" || Number(form.salary) < 0) {
        setError("A valid salary is required for staff.");
        return;
      }
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        course_id: Number(form.course_id),
        address: form.address.trim(),
        salary: Number(form.salary || 0),
      };
      if (form.password.trim()) payload.password = form.password;
      const saved = editingStaff
        ? await updateBranchStaffApi(editingStaff.id, payload, token)
        : await createBranchStaffApi(
            { ...payload, password: form.password },
            token,
          );
      setStaff((current) =>
        editingStaff
          ? current.map((member) => (member.id === saved.id ? saved : member))
          : [saved, ...current],
      );
      setSuccess(
        `${saved.name} ${editingStaff ? "updated" : "created"} successfully.`,
      );
      setToast({
        type: "success",
        title: editingStaff ? "Staff Account Updated" : "Staff Registered Successfully",
        message: `${saved.name} was successfully ${editingStaff ? "updated" : "registered with active branch access"}.`,
      });
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save staff member.");
      setToast({
        type: "error",
        title: editingStaff ? "Update Failed" : "Registration Failed",
        message: err.message || "Failed to save staff member.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (member) => {
    if (!window.confirm(`Delete ${member.name}? This cannot be undone.`))
      return;
    try {
      setDeletingId(member.id);
      setError("");
      await deleteBranchStaffApi(member.id, token);
      setStaff((current) => current.filter((item) => item.id !== member.id));
      if (editingStaff?.id === member.id) resetForm();
      setSuccess(`${member.name} deleted successfully.`);
    } catch (err) {
      setError(err.message || "Failed to delete staff member.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStaffStatus = async (member, targetStatus) => {
    const staffId = member.id ?? member.staff_id ?? member.user_id;
    if (!staffId || !token) return;
    const normalizedStatus = String(targetStatus).toLowerCase() === 'active' ? 'Active' : 'Inactive';
    try {
      setStatusUpdatingId(staffId);
      setError("");
      await updateBranchAdminStaffStatusApi(staffId, normalizedStatus, token);
      setStaff((current) =>
        current.map((item) =>
          (item.id === member.id || item.staff_id === member.id || item.user_id === member.id)
            ? { ...item, status: normalizedStatus, is_active: normalizedStatus === 'Active' }
            : item
        )
      );
      setSuccess(`${member.name}'s status changed to ${normalizedStatus} successfully.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || "Failed to update staff status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredAttendanceHistory = useMemo(() => {
    return attendanceHistory.filter(
      (record) =>
        (!attendanceStartDate || record.date >= attendanceStartDate) &&
        (!attendanceEndDate || record.date <= attendanceEndDate),
    );
  }, [attendanceHistory, attendanceStartDate, attendanceEndDate]);

  // Dynamic summary metrics for Staff Management Attendance History including working days and holidays
  const historySummary = useMemo(() => {
    const computed = filteredAttendanceHistory.reduce(
      (acc, record) => {
        const s = normalizeAttendanceStatus(record.status);
        acc.total += 1;
        if (s === "present") acc.present += 1;
        else if (s === "half_day") acc.half_day += 1;
        else if (s === "absent") acc.absent += 1;
        else if (s === "leave") acc.leave += 1;
        return acc;
      },
      { total: 0, present: 0, half_day: 0, absent: 0, leave: 0 }
    );
    return {
      total: backendHistorySummary?.total ?? computed.total,
      present: backendHistorySummary?.present ?? computed.present,
      half_day: backendHistorySummary?.half_day ?? computed.half_day,
      absent: backendHistorySummary?.absent ?? computed.absent,
      leave: backendHistorySummary?.leave ?? computed.leave,
      total_working_days: backendHistorySummary?.total_working_days ?? 0,
      total_holidays: backendHistorySummary?.total_holidays ?? holidays.length,
    };
  }, [filteredAttendanceHistory, backendHistorySummary, holidays]);

  const staffAttendanceTotals = useMemo(() => {
    return staff.map((member) => {
      const records = filteredAttendanceHistory.filter(
        (record) => String(record.staff_id) === String(member.id),
      );
      const present = records.filter(
        (record) => normalizeAttendanceStatus(record.status) === "present",
      ).length;
      const halfDay = records.filter(
        (record) => normalizeAttendanceStatus(record.status) === "half_day",
      ).length;
      const leave = records.filter(
        (record) => normalizeAttendanceStatus(record.status) === "leave",
      ).length;
      const absent = records.filter(
        (record) => normalizeAttendanceStatus(record.status) === "absent",
      ).length;
      return {
        ...member,
        present,
        halfDay,
        leave,
        absent,
        presentDays: present + halfDay * 0.5,
      };
    });
  }, [staff, filteredAttendanceHistory]);

  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
  const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

  return (
    <div
      className="branch-staff-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={openCreate}
        activePage="staff"
      />
      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-20 flex min-h-[68px] sm:h-[92px] items-center justify-between gap-2 border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-3.5 sm:px-6 lg:px-10 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                Staff Management
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              to="/branch-admin/staff-monitoring"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition hover:bg-[#f1ede4] border border-[#e3ddd0] text-[#17140f] bg-white shadow-2xs"
            >
              <Activity className="h-4 w-4 text-[#9c6b2e]" />
              <span>Staff Monitoring</span>
            </Link>
            <div className="hidden text-right md:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        <div className="w-full px-6 py-8 sm:px-10">
          {error && (
            <div
              className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}
          {!error && success && (
            <div
              className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              {success}
            </div>
          )}

          {/* ---- Tabs ---- */}
          <nav
            className="mb-8 flex gap-4 sm:gap-7 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5"
            style={{ borderBottom: "1px solid #e3ddd0" }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "attendance") loadCalendarAttendance();
                    if (tab.id === "history") loadAttendanceHistory();
                  }}
                  className={`relative flex shrink-0 items-center gap-2 pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${FOCUS_RING}`}
                  style={{ color: isActive ? "#17140f" : "#8a8175" }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                      style={{ background: "#9c6b2e" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ---- Mark attendance ---- */}
          {activeTab === "attendance" && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    style={{ ...serif, fontWeight: 600, color: "#17140f" }}
                  >
                    Branch Staff Attendance
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track and mark your branch team's monthly attendance in interactive calendar format.
                  </p>
                </div>
              </div>

              <AttendanceCalendarMatrix
                people={staff}
                records={calendarAttendance}
                attendanceRecords={calendarAttendance}
                onSaveStatus={handleMatrixSaveStatus}
                title="Branch Staff"
                subtitle={`${staff.length} staff accounts`}
                savingKey={attendanceSaving}
                isStaffPage={true}
                onMonthChange={handleCalendarMonthChange}
                holidays={holidays}
              />
        </section>
      )}

          {/* ---- Attendance history ---- */}
          {activeTab === "history" && (
            <section className="space-y-7">
              {/* Filter & Page Title Header */}
              <div className="rounded-2xl border border-[#e3ddd0] bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[#9c6b2e]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9c6b2e]">
                      Branch Portal Attendance
                    </span>
                  </div>
                  <h2
                    className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    style={serif}
                  >
                    Staff Attendance History
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Showing aggregated staff statistics and complete chronological activity log.
                  </p>
                </div>

                {/* Date Filters Control */}
                <div className="flex flex-wrap items-center gap-3 bg-[#faf8f4] border border-[#e8e2d5] p-2.5 rounded-xl self-start lg:self-auto">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">From:</span>
                      <input
                        type="date"
                        value={attendanceStartDate}
                        onChange={(event) => {
                          const val = event.target.value;
                          setAttendanceStartDate(val);
                          setError("");
                          if (attendanceEndDate && val && val > attendanceEndDate) {
                            setAttendanceEndDate(val);
                          }
                        }}
                        className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">To:</span>
                      <input
                        type="date"
                        value={attendanceEndDate}
                        min={attendanceStartDate || undefined}
                        onChange={(event) => {
                          const val = event.target.value;
                          setAttendanceEndDate(val);
                          setError("");
                          if (attendanceStartDate && val && val < attendanceStartDate) {
                            setAttendanceStartDate(val);
                          }
                        }}
                        className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </label>
                  </div>
                  {(attendanceStartDate !== getDefaultFromDate() || attendanceEndDate !== getDefaultToDate()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceStartDate(getDefaultFromDate());
                        setAttendanceEndDate(getDefaultToDate());
                        setError("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#ded8cb] px-2.5 py-1.5 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f3ede1] transition-colors cursor-pointer"
                      title="Reset date filters to default month range"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* A. Dynamic Summary Cards including Working Days & Holidays */}
              <AttendanceSummaryCards
                total={historySummary.total}
                present={historySummary.present}
                halfDay={historySummary.half_day}
                absent={historySummary.absent}
                leave={historySummary.leave}
                totalWorkingDays={historySummary.total_working_days}
                totalHolidays={historySummary.total_holidays}
                loading={attendanceLoading}
                totalLabel="Total Records"
              />

              {/* B. Staff Attendance Records – Summary Table */}
              <div
                className="overflow-hidden rounded-2xl bg-white shadow-xs"
                style={{ border: "1px solid #e3ddd0" }}
              >
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#9c6b2e]" />
                      <h3
                        className="text-base font-bold text-slate-900 tracking-tight"
                        style={serif}
                      >
                        Staff Attendance Records
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Aggregated breakdown of present days, half days, and leave per staff member
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
                    {staffAttendanceTotals.length}{" "}
                    {staffAttendanceTotals.length === 1 ? "Staff Account" : "Staff Accounts"}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Staff
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Present Days
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                          Half Days
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-800">
                          Leave
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede4]">
                      {attendanceLoading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#9c6b2e]" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Loading staff attendance...
                            </p>
                          </td>
                        </tr>
                      ) : staffAttendanceTotals.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                              <Users className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">No staff accounts found</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Add staff accounts under the Staff Accounts tab to track attendance.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        staffAttendanceTotals.map((member) => {
                          const initials = (member.name || "S")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                          return (
                            <tr
                              key={member.id}
                              className="hover:bg-[#fcfbf9] transition-colors"
                            >
                              <td className="px-6 py-4.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5efe4] text-xs font-extrabold text-[#9c6b2e] border border-[#e8dfd0] shadow-2xs">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 leading-tight">
                                      {member.name}
                                    </div>
                                    <div className="text-xs font-medium text-slate-400">
                                      #{member.staff_code || member.id}
                                      {member.email ? ` • ${member.email}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7ec] border border-[#a9e6bf] px-3 py-1 text-xs font-extrabold text-[#1e6b37] shadow-2xs">
                                  <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                                  {member.presentDays}{" "}
                                  {member.presentDays === 1 ? "day" : "days"}
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7e6] border border-[#fde096] px-3 py-1 text-xs font-extrabold text-[#b45309] shadow-2xs">
                                  <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  {member.halfDay}{" "}
                                  {member.halfDay === 1 ? "day" : "days"}
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2fe] border border-[#b9cbfd] px-3 py-1 text-xs font-extrabold text-[#3730a3] shadow-2xs">
                                  <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  {member.leave}{" "}
                                  {member.leave === 1 ? "day" : "days"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* C. Detailed Attendance History Table */}
              <div
                className="overflow-hidden rounded-2xl bg-white shadow-xs"
                style={{ border: "1px solid #e3ddd0" }}
              >
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#9c6b2e]" />
                      <h3
                        className="text-base font-bold text-slate-900 tracking-tight"
                        style={serif}
                      >
                        Detailed Attendance History
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Chronological audit log of all marked staff attendances
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#1e6b37]" />
                    {filteredAttendanceHistory.length}{" "}
                    {filteredAttendanceHistory.length === 1 ? "Record" : "Records"}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Staff
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Date
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Marked At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede4]">
                      {attendanceLoading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center text-slate-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#9c6b2e]" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Loading attendance logs...
                            </p>
                          </td>
                        </tr>
                      ) : filteredAttendanceHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                              <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                              No attendance records found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {attendanceStartDate || attendanceEndDate
                                ? "No logs match the selected date range. Try clearing or expanding the date filter."
                                : "No staff attendance has been recorded yet."}
                            </p>
                            {(attendanceStartDate || attendanceEndDate) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAttendanceStartDate("");
                                  setAttendanceEndDate("");
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f6f2e9] cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceHistory.map((record) => {
                          const memberObj = staff.find(
                            (m) => String(m.id) === String(record.staff_id)
                          );
                          const staffName =
                            record.staff_name ||
                            memberObj?.name ||
                            `Staff #${memberObj?.staff_code || record.staff_id}`;
                          const initials = staffName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                          return (
                            <tr
                              key={record.id}
                              className="hover:bg-[#fcfbf9] transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5efe4] text-[11px] font-extrabold text-[#9c6b2e] border border-[#e8dfd0]">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 leading-tight">
                                      {staffName}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400">
                                      #{memberObj?.staff_code || record.staff_id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>{formatAttendanceDate(record.date)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <AttendanceStatusBadge status={record.status} />
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {formatAttendanceTimestamp(record.marked_at)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ---- Staff accounts ---- */}
          {activeTab === "staff" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section
                className="rounded-2xl p-6 sm:p-7"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div
                  className="mb-5 flex items-center justify-between pb-5"
                  style={{ borderBottom: "1px solid #e3ddd0" }}
                >
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Staff accounts
                  </h2>
                  <span className="text-sm" style={{ color: "#a39a8c" }}>{staff.length}</span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "#8a8175" }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
                  </div>
                ) : staff.length === 0 ? (
                  <div
                    className="rounded-xl px-5 py-12 text-center"
                    style={{ border: "1px dashed #dfc9a9" }}
                  >
                    <UserPlus className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
                    <p className="mt-3 text-sm" style={{ color: "#8a8175" }}>
                      No staff accounts yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <article
                        key={member.id}
                        className="rounded-xl p-4"
                        style={{ border: "1px solid #e3ddd0" }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                              {member.name}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#5b5346" }}>
                              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <a
                              href={member.phone ? `tel:${member.phone}` : undefined}
                              className={`mt-1.5 flex items-center gap-2 text-sm ${FOCUS_RING}`}
                              style={{ color: "#5b5346" }}
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              <span>{formatPhone(member.phone)}</span>
                            </a>
                            <div className="mt-3 flex items-start gap-2">
                              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#a39a8c" }} />
                              <div className="min-w-0">
                                <p className="text-xs" style={{ color: "#a39a8c" }}>Course</p>
                                <p className="mt-0.5 break-words text-sm font-medium" style={{ color: "#17140f" }}>
                                  {member.course_name || "Not assigned"}
                                </p>
                              </div>
                            </div>
                            {member.address && (
                              <p className="mt-3 text-xs" style={{ color: "#a39a8c" }}>
                                {member.address}
                              </p>
                            )}
                            {member.salary !== undefined && member.salary !== null && member.salary !== "" && (
                              <div className="mt-2.5 flex items-center gap-2">
                                <IndianRupee className="h-3.5 w-3.5 shrink-0" style={{ color: "#5c7a5a" }} />
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold" style={{ color: "#5c7a5a" }}>
                                    Salary: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(member.salary) || 0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 text-xs" style={{ color: "#a39a8c" }}>
                            #{member.staff_code || member.id}
                          </span>
                        </div>
                        <div
                          className="mt-3.5 flex items-center justify-between pt-2.5"
                          style={{ borderTop: "1px dashed #efe9dd" }}
                        >
                          {(() => {
                            const staffId = member.id ?? member.staff_id ?? member.user_id;
                            const currentStatus = String(member.status || (member.is_active === false ? "inactive" : "active")).toLowerCase();
                            const isActive = currentStatus === "active";
                            const isUpdating = statusUpdatingId === staffId;
                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleToggleStaffStatus(member, isActive ? "Inactive" : "Active")}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isActive ? "bg-emerald-600" : "bg-stone-300"
                                  } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                                  title={`Click to set ${isActive ? "Inactive" : "Active"}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                      isActive ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  >
                                    {isUpdating && (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin text-stone-500" />
                                    )}
                                  </span>
                                </button>
                                <span className={`text-xs font-semibold ${isActive ? "text-emerald-700" : "text-stone-500"}`}>
                                  {isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <div
                          className="mt-4 flex gap-4 pt-3"
                          style={{ borderTop: "1px solid #efe9dd" }}
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(member)}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
                            style={{ color: "#9c6b2e" }}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStaff(member)}
                            disabled={deletingId === member.id}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-60 ${FOCUS_RING}`}
                            style={{ color: "#a24a3a" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === member.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section
                className="h-fit rounded-2xl p-6 sm:p-7"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div
                  className="mb-5 flex items-center justify-between pb-5"
                  style={{ borderBottom: "1px solid #e3ddd0" }}
                >
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    {editingStaff ? "Update staff" : "Create staff"}
                  </h2>
                  {editingStaff ? (
                    <button
                      type="button"
                      onClick={openCreate}
                      className={`rounded-lg p-1.5 ${FOCUS_RING}`}
                      style={{ color: "#a39a8c" }}
                      aria-label="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <Plus className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  )}
                </div>
                <form onSubmit={submit} className="space-y-4">
                  {["name", "email", "phone"].map((field) => (
                    <label key={field} className="block text-sm" style={{ color: "#5b5346" }}>
                      {FIELD_LABELS[field]}
                      <input
                        required
                        name={field}
                        type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                        value={form[field]}
                        onChange={updateField}
                        className={`mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                        style={inputStyle}
                      />
                    </label>
                  ))}
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Password {editingStaff ? "(optional)" : ""}
                    <div className="relative mt-1">
                      <input
                        required={!editingStaff}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={updateField}
                        className={`w-full rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                        style={inputStyle}
                        placeholder={editingStaff ? "Leave blank to keep current password" : "Enter staff password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-[#f1ede4] cursor-pointer ${FOCUS_RING}`}
                        style={{ color: "#8a8175" }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Assigned course
                    <select
                      required
                      name="course_id"
                      value={form.course_id}
                      onChange={updateField}
                      className={`mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                      style={inputStyle}
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Monthly salary
                    <input
                      required
                      name="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salary}
                      onChange={updateField}
                      className={`mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                      style={inputStyle}
                    />
                  </label>
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Address
                    <textarea
                      name="address"
                      rows="3"
                      value={form.address}
                      onChange={updateField}
                      className={`mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                      style={inputStyle}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${FOCUS_RING}`}
                    style={{ background: "#17140f" }}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingStaff ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {saving ? "Saving…" : editingStaff ? "Update staff" : "Create staff"}
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default BranchAdminStaff;