import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  History,
  Loader2,
  Menu,
  RotateCcw,
  Save,
  XCircle,
  Send,
  AlertCircle,
  Sparkles,
  Building2,
  Filter,
} from "lucide-react";
import AttendanceCalendarMatrix from "../components/common/AttendanceCalendarMatrix";
import AttendanceSummaryCards from "../components/common/AttendanceSummaryCards";
import AttendanceStatusBadge, { normalizeAttendanceStatus } from "../components/common/AttendanceStatusBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getBranchAdminAttendanceApi,
  markBranchAdminAttendanceApi,
  updateBranchAdminAttendanceApi,
} from "../services/branchadminattendance";
import {
  createHolidayApi,
  getHolidaysApi,
} from "../services/holidays";
import { getDefaultFromDate, getDefaultToDate } from "../utils/dateFilters";

/* Load a serif display face for headings + a clean sans for everything else. */
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

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date, opts) => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...opts,
    }).format(new Date(`${date}T00:00:00`));
  } catch (e) {
    return date;
  }
};

const formatTimestamp = (timestamp) => {
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

const statusOptions = [
  { value: "present", label: "Present", dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  { value: "half_day", label: "Half day", dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  { value: "leave", label: "Leave", dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
];

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/[-\s]/g, "_");
const statusFor = (status) =>
  statusOptions.find((option) => option.value === normalizeStatus(status)) ||
  statusOptions[0];

const BranchAdminAttendance = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [attendance, setAttendance] = useState([]);
  const [historyAttendance, setHistoryAttendance] = useState([]);
  const [calendarAttendance, setCalendarAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0, half_day: 0, leave: 0 });
  const [draftStatus, setDraftStatus] = useState("present");
  const [startDate, setStartDate] = useState(getDefaultFromDate);
  const [endDate, setEndDate] = useState(getDefaultToDate);
  const activeHistoryRequestIdRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");

  // Post Holiday state
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: getToday(), reason: "" });
  const [holidayStartDate, setHolidayStartDate] = useState(getDefaultFromDate);
  const [holidayEndDate, setHolidayEndDate] = useState(getDefaultToDate);
  const activeHolidayRequestIdRef = useRef(0);
  const [holidayError, setHolidayError] = useState("");
  const [holidaySuccess, setHolidaySuccess] = useState("");

  const handleMatrixSaveStatus = async (personId, dateStr, newStatus, existingRecord) => {
    if (!token) return;
    const today = getToday();
    if (dateStr !== today) {
      setError("Attendance can only be marked or updated for today. Past dates cannot be modified.");
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
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const existing =
        existingRecord ||
        calendarAttendance.find(
          (r) => String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
        ) ||
        historyAttendance.find(
          (r) => String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
        );

      let savedRecord;
      if (newStatus === null) {
        if (existing) {
          await updateBranchAdminAttendanceApi(existing.id, { status: "absent" }, token);
          savedRecord = { ...existing, status: "Absent" };
        }
      } else if (existing) {
        await updateBranchAdminAttendanceApi(existing.id, { status: newStatus }, token);
        savedRecord = { ...existing, status: newStatus };
      } else {
        const res = await markBranchAdminAttendanceApi(
          { date: dateStr, status: newStatus },
          token
        );
        savedRecord = res?.attendance || {
          id: Date.now(),
          date: dateStr,
          status: newStatus,
        };
      }

      if (savedRecord) {
        setCalendarAttendance((prev) => {
          const idx = prev.findIndex(
            (r) => String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...savedRecord };
            return next;
          }
          return [...prev, savedRecord];
        });
        setHistoryAttendance((prev) => {
          const idx = prev.findIndex(
            (r) => String(r.date || r.attendance_date || "").slice(0, 10) === String(dateStr).slice(0, 10)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...savedRecord };
            return next;
          }
          return [...prev, savedRecord];
        });
      }
      setSuccess(`Your attendance for ${formatDate(dateStr)} was saved as ${newStatus || "Absent"}.`);
      await loadAttendance(selectedDate);
    } catch (err) {
      setError(err.message || "Failed to save attendance.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const loadAttendance = async (date = "") => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchAdminAttendanceApi(token, date);
      const records = Array.isArray(data?.attendance) ? data.attendance : [];
      setAttendance(records);
      setAttendanceSummary({
        total: Number(data?.total || records.length),
        present: Number(data?.present || 0),
        half_day: Number(data?.half_day || 0),
        absent: Number(data?.absent || 0),
        leave: Number(data?.leave || 0),
        total_holidays: data?.total_holidays !== undefined ? Number(data.total_holidays) : undefined,
        total_working_days: data?.total_working_days !== undefined ? Number(data.total_working_days) : undefined,
      });
      const selectedRecord = records.find((record) => record.date === date);
      if (selectedRecord)
        setDraftStatus(normalizeStatus(selectedRecord.status));
      else setDraftStatus("present");
    } catch (err) {
      setError(err.message || "Failed to load your attendance.");
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarAttendance = async (monthOrParams) => {
    if (!token) return;
    try {
      const data = await getBranchAdminAttendanceApi(token, monthOrParams);
      const records = Array.isArray(data?.attendance) ? data.attendance : [];
      setCalendarAttendance(records);
    } catch (err) {
      console.error("Failed to load admin calendar attendance:", err);
    }
  };

  const handleCalendarMonthChange = (newDate) => {
    if (!token || !newDate) return;
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    loadCalendarAttendance(`${y}-${m}`);
  };

  const loadHistory = async (params = {}) => {
    if (!token) return;
    const queryParams = { ...params };
    const dFrom = queryParams.date_from || startDate;
    const dTo = queryParams.date_to || endDate;
    if (dFrom && dTo && dFrom > dTo) {
      // Guard against invalid date ordering so backend error 'date_from must not be after date_to' never triggers
      return;
    }
    if (dFrom) queryParams.date_from = dFrom;
    if (dTo) queryParams.date_to = dTo;

    const requestId = ++activeHistoryRequestIdRef.current;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchAdminAttendanceApi(token, queryParams);
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
      setHistoryAttendance(records);
      if (data?.total_holidays !== undefined || data?.total_working_days !== undefined) {
        setAttendanceSummary((prev) => ({
          ...prev,
          total_holidays: data?.total_holidays !== undefined ? Number(data.total_holidays) : prev.total_holidays,
          total_working_days: data?.total_working_days !== undefined ? Number(data.total_working_days) : prev.total_working_days,
        }));
      }
    } catch (err) {
      if (requestId === activeHistoryRequestIdRef.current) {
        setError(err.message || "Failed to load attendance history.");
      }
    } finally {
      if (requestId === activeHistoryRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const loadHolidays = async () => {
    if (!token) return;
    const dFrom = holidayStartDate;
    const dTo = holidayEndDate;
    if (dFrom && dTo && dFrom > dTo) {
      // Guard against invalid date ordering so backend error 'date_from must not be after date_to' never triggers
      return;
    }
    const requestId = ++activeHolidayRequestIdRef.current;
    try {
      setHolidaysLoading(true);
      setHolidayError("");
      const params = {};
      if (dFrom) params.date_from = dFrom;
      if (dTo) params.date_to = dTo;
      const data = await getHolidaysApi(token, params);
      if (requestId !== activeHolidayRequestIdRef.current) return;
      let list = Array.isArray(data)
        ? data
        : Array.isArray(data?.holidays)
        ? data.holidays
        : [];
      if (dFrom || dTo) {
        list = list.filter((h) => {
          const d = String(h.date || h.holiday_date || "").slice(0, 10);
          if (!d) return true;
          if (dFrom && d < dFrom) return false;
          if (dTo && d > dTo) return false;
          return true;
        });
      }
      setHolidays(list);
    } catch (err) {
      if (requestId === activeHolidayRequestIdRef.current) {
        setHolidayError(err.message || "Failed to load holidays.");
      }
    } finally {
      if (requestId === activeHolidayRequestIdRef.current) {
        setHolidaysLoading(false);
      }
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!holidayForm.date) {
      setHolidayError("Please select a date for the holiday.");
      return;
    }
    if (!holidayForm.reason.trim()) {
      setHolidayError("Please provide a reason or occasion for the holiday.");
      return;
    }

    try {
      setHolidaySubmitting(true);
      setHolidayError("");
      setHolidaySuccess("");
      await createHolidayApi(
        {
          date: holidayForm.date,
          reason: holidayForm.reason.trim(),
        },
        token
      );
      setHolidaySuccess(
        `Holiday on ${formatDate(holidayForm.date)} ("${holidayForm.reason.trim()}") posted successfully.`
      );
      setHolidayForm({ date: getToday(), reason: "" });
      await loadHolidays();
    } catch (err) {
      setHolidayError(err.message || "Failed to create holiday.");
    } finally {
      setHolidaySubmitting(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
    loadCalendarAttendance();
  }, [token, selectedDate]);

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) return;
    loadHistory();
  }, [token, startDate, endDate]);

  useEffect(() => {
    loadHolidays();
  }, [token]);

  useEffect(() => {
    if (activeTab === "post_holiday") {
      if (holidayStartDate && holidayEndDate && holidayStartDate > holidayEndDate) return;
      loadHolidays();
    }
  }, [token, activeTab, holidayStartDate, holidayEndDate]);

  const selectedRecord = attendance.find(
    (record) => record.date === selectedDate,
  );
  const filteredAttendance = useMemo(
    () =>
      historyAttendance.filter(
        (record) =>
          (!startDate || record.date >= startDate) &&
          (!endDate || record.date <= endDate),
      ),
    [historyAttendance, startDate, endDate],
  );

  const filteredSummary = useMemo(() => {
    return filteredAttendance.reduce(
      (summary, record) => {
        const status = normalizeAttendanceStatus(record.status);
        summary.total += 1;
        if (status === "present") summary.present += 1;
        else if (status === "half_day") summary.half_day += 1;
        else if (status === "absent") summary.absent += 1;
        else if (status === "leave") summary.leave += 1;
        return summary;
      },
      { total: 0, present: 0, half_day: 0, absent: 0, leave: 0 }
    );
  }, [filteredAttendance]);

  const visibleSummary = useMemo(() => {
    if (filteredAttendance.length > 0 || startDate || endDate) {
      return {
        ...filteredSummary,
        total_holidays: attendanceSummary.total_holidays !== undefined ? attendanceSummary.total_holidays : holidays.length,
        total_working_days: attendanceSummary.total_working_days !== undefined ? attendanceSummary.total_working_days : 0,
      };
    }
    return {
      total: attendanceSummary.total || 0,
      present: attendanceSummary.present || 0,
      half_day: attendanceSummary.half_day || 0,
      absent: attendanceSummary.absent || 0,
      leave: attendanceSummary.leave || 0,
      total_holidays: attendanceSummary.total_holidays !== undefined ? attendanceSummary.total_holidays : holidays.length,
      total_working_days: attendanceSummary.total_working_days !== undefined ? attendanceSummary.total_working_days : 0,
    };
  }, [filteredAttendance, startDate, endDate, filteredSummary, attendanceSummary, holidays]);

  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
  const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
  const todayStr = getToday();

  return (
    <div
      className="branch-attendance-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="attendance"
      />
      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-20 flex min-h-[68px] sm:h-[92px] items-center justify-between gap-2 border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-3.5 sm:px-6 lg:px-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                My Attendance
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {(user?.name || "B").charAt(0).toUpperCase()}
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        <section className="w-full space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}
          {success && !error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              {success}
            </div>
          )}

          {/* ---- Tabs Navigation ---- */}
          <nav
            className="flex gap-4 sm:gap-7 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5"
            style={{ borderBottom: "1px solid #e3ddd0" }}
          >
            {[
              { id: "attendance", label: "Mark attendance", icon: CalendarDays },
              { id: "history", label: "Attendance history", icon: Clock },
              { id: "post_holiday", label: "Post holiday", icon: CalendarCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "attendance") loadCalendarAttendance();
                    if (tab.id === "history") loadHistory();
                    if (tab.id === "post_holiday") loadHolidays();
                  }}
                  className="relative flex shrink-0 items-center gap-2 pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
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

          {/* ---- Tab 1: Mark Attendance ---- */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                  style={{ ...serif, fontWeight: 600, color: "#17140f" }}
                >
                  Administrator Attendance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mark and inspect your daily attendance in calendar format.
                </p>
              </div>

              <AttendanceCalendarMatrix
                people={[
                  {
                    id: user?.id || "me",
                    name: user?.name || "Branch Administrator",
                    role: "Branch Admin",
                    avatar: (user?.name || "B").charAt(0).toUpperCase(),
                    isCurrentUser: true,
                  },
                ]}
                records={calendarAttendance}
                attendanceRecords={calendarAttendance}
                onSaveStatus={handleMatrixSaveStatus}
                isSinglePerson={true}
                initialDate={selectedDate}
                onMonthChange={handleCalendarMonthChange}
                holidays={holidays}
                title="Branch Admin Calendar"
                subtitle="Live monthly grid of your personal presence and duty logs"
              />
            </div>
          )}

          {/* ---- Tab 2: Attendance History ---- */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Header with Title + Date Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    style={{ ...serif, fontWeight: 600, color: "#17140f" }}
                  >
                    Attendance History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your complete historical duty records and attendance statistics.
                  </p>
                </div>

                {/* Date Filters Control */}
                <div className="flex flex-wrap items-center gap-3 bg-[#faf8f4] border border-[#e8e2d5] p-2.5 rounded-xl self-start lg:self-auto">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">From:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => {
                          const val = event.target.value;
                          setStartDate(val);
                          setError("");
                          if (endDate && val && val > endDate) {
                            setEndDate(val);
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
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => {
                          const val = event.target.value;
                          setEndDate(val);
                          setError("");
                          if (startDate && val && val < startDate) {
                            setStartDate(val);
                          }
                        }}
                        className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </label>
                  </div>
                  {(startDate !== getDefaultFromDate() || endDate !== getDefaultToDate()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate(getDefaultFromDate());
                        setEndDate(getDefaultToDate());
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
                total={visibleSummary.total}
                present={visibleSummary.present}
                halfDay={visibleSummary.half_day}
                absent={visibleSummary.absent}
                leave={visibleSummary.leave}
                totalWorkingDays={visibleSummary.total_working_days}
                totalHolidays={visibleSummary.total_holidays}
                loading={loading}
                totalLabel="Total Records"
              />

              {/* B. Personal Attendance History Table */}
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
                        Personal Attendance Log
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Chronological history of your daily duty clock-in and attendance records
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#1e6b37]" />
                    {filteredAttendance.length}{" "}
                    {filteredAttendance.length === 1 ? "Record" : "Records"}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
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
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-14 text-center text-slate-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#9c6b2e]" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Loading attendance history...
                            </p>
                          </td>
                        </tr>
                      ) : filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                              <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                              No attendance records in this range
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {startDate || endDate
                                ? "No logs match the selected date range. Try clearing or expanding your dates."
                                : "No personal attendance entries have been recorded yet."}
                            </p>
                            {(startDate || endDate) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStartDate("");
                                  setEndDate("");
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f6f2e9] cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-[#fcfbf9] transition-colors"
                          >
                            <td className="px-6 py-4.5 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                <span>{formatDate(record.date)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5">
                              <AttendanceStatusBadge status={record.status} />
                            </td>
                            <td className="px-6 py-4.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>{formatTimestamp(record.marked_at)}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ---- Tab 3: Post Holiday ---- */}
          {activeTab === "post_holiday" && (
            <div className="space-y-8">
              {holidayError && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                  style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{holidayError}</span>
                </div>
              )}
              {holidaySuccess && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                  style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{holidaySuccess}</span>
                </div>
              )}

              {/* Top Card: Post Branch Holiday Form */}
              <div
                className="overflow-hidden rounded-2xl bg-white shadow-xs border border-[#e3ddd0]"
              >
                <div className="border-b border-[#e8e2d5] bg-gradient-to-r from-[#faf6ee] via-[#fdf9f2] to-[#faf1df] px-6 py-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white border border-[#ecd8b5] text-[#9c6b2e] flex items-center justify-center shadow-2xs">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2
                        className="text-lg sm:text-xl font-bold tracking-tight text-slate-900"
                        style={serif}
                      >
                        Post Branch Holiday
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Declare an official institutional holiday for this branch. Staff and administrators will see this on their attendance calendars.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateHoliday} className="p-6 sm:p-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Holiday Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Holiday Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={holidayForm.date}
                          onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
                          required
                          className="w-full rounded-xl border border-[#ded8cb] bg-[#faf8f4] px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:bg-white focus:border-[#9c6b2e] focus:outline-none transition"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Selected: <span className="font-semibold text-slate-700">{formatDate(holidayForm.date)}</span>
                      </p>
                    </div>

                    {/* Holiday Reason */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Occasion / Reason <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={holidayForm.reason}
                        onChange={(e) => setHolidayForm((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g. Gandhi Jayanti, Diwali, Annual Day..."
                        required
                        className="w-full rounded-xl border border-[#ded8cb] bg-[#faf8f4] px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:bg-white focus:border-[#9c6b2e] focus:outline-none transition placeholder:text-slate-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Specify the festival, public celebration, or declared holiday reason.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-[#f1ede4]">
                    <button
                      type="submit"
                      disabled={holidaySubmitting || !holidayForm.date || !holidayForm.reason.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#9c6b2e] hover:bg-[#855923] text-white px-5 py-2.5 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {holidaySubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Posting holiday...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Post Holiday</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Card: Branch Holidays Directory */}
              <div
                className="overflow-hidden rounded-2xl bg-white shadow-xs border border-[#e3ddd0]"
              >
                {/* Directory Header with Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#9c6b2e]" />
                      <h3 className="text-base font-bold text-slate-900 tracking-tight" style={serif}>
                        Branch Holidays Directory
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Official scheduled branch holidays and observances
                    </p>
                  </div>

                  {/* Filters: Date Range */}
                  <div className="flex flex-wrap items-center gap-2.5 bg-white border border-[#e8e2d5] p-2 rounded-xl self-start lg:self-auto shadow-2xs">
                    {/* From Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">From:</span>
                      <input
                        type="date"
                        value={holidayStartDate}
                        max={holidayEndDate || undefined}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHolidayStartDate(val);
                          setHolidayError("");
                          if (val && holidayEndDate && val > holidayEndDate) {
                            setHolidayEndDate(val);
                          }
                        }}
                        className="rounded-lg border border-[#ded8cb] bg-[#faf8f4] px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </div>

                    {/* To Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">To:</span>
                      <input
                        type="date"
                        value={holidayEndDate}
                        min={holidayStartDate || undefined}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHolidayEndDate(val);
                          setHolidayError("");
                          if (val && holidayStartDate && val < holidayStartDate) {
                            setHolidayStartDate(val);
                          }
                        }}
                        className="rounded-lg border border-[#ded8cb] bg-[#faf8f4] px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </div>

                    {(holidayStartDate !== getDefaultFromDate() || holidayEndDate !== getDefaultToDate()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setHolidayStartDate(getDefaultFromDate());
                          setHolidayEndDate(getDefaultToDate());
                          setHolidayError("");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#faf8f4] border border-[#ded8cb] px-2 py-1 text-xs font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer"
                        title="Reset date filters to default month range"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setHolidayError("");
                        loadHolidays();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#9c6b2e] hover:bg-[#faf8f4] transition cursor-pointer"
                      title="Reload holidays"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${holidaysLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Holidays Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Date
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Day
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Reason / Occasion
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede4]">
                      {holidaysLoading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center text-slate-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#9c6b2e]" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Loading branch holidays...
                            </p>
                          </td>
                        </tr>
                      ) : holidays.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                              <CalendarCheck className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                              No holidays found
                            </p>
                            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                              No official holidays match your filter. You can publish a new holiday using the form above.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        holidays.map((h, idx) => {
                          const hDate = h.date || h.holiday_date;
                          const isUpcoming = hDate > todayStr;
                          const isToday = hDate === todayStr;

                          let weekday = "—";
                          try {
                            weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(
                              new Date(`${hDate}T00:00:00`)
                            );
                          } catch {}

                          return (
                            <tr key={h.id || idx} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="px-6 py-4.5 font-bold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-[#9c6b2e] shrink-0" />
                                  <span>{formatDate(hDate)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">
                                {weekday}
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf5ec] text-[#9c6b2e] border border-[#ebd8b6] font-bold text-xs">
                                  <span>{h.reason || "Declared Holiday"}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4.5 whitespace-nowrap">
                                {isToday ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-extrabold animate-pulse">
                                    Today
                                  </span>
                                ) : isUpcoming ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold">
                                    Upcoming
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium">
                                    Past
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BranchAdminAttendance;
