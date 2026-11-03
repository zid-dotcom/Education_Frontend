import React, { useEffect, useMemo, useState } from "react";
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

/* Load a serif display face for headings + a clean sans for everything
   else. Falls back gracefully to system fonts if the network request
   can't complete, so nothing breaks if this runs offline. */
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
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0, half_day: 0, leave: 0 });
  const [draftStatus, setDraftStatus] = useState("present");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");

  const handleMatrixSaveStatus = async (personId, dateStr, newStatus, existingRecord) => {
    if (!token) return;
    const today = getToday();
    if (dateStr !== today) {
      setError("Attendance can only be marked or updated for today. Past dates cannot be modified.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (newStatus === null) {
        if (existingRecord) {
          await updateBranchAdminAttendanceApi(existingRecord.id, { status: "absent" }, token);
          setHistoryAttendance((prev) =>
            prev.map((r) => (r.id === existingRecord.id ? { ...r, status: "Absent" } : r))
          );
        }
        return;
      }

      if (existingRecord) {
        await updateBranchAdminAttendanceApi(existingRecord.id, { status: newStatus }, token);
        setHistoryAttendance((prev) =>
          prev.map((r) => (r.id === existingRecord.id ? { ...r, status: newStatus } : r))
        );
      } else {
        const res = await markBranchAdminAttendanceApi(
          { date: dateStr, status: newStatus },
          token
        );
        const newRecord = res?.attendance || {
          id: Date.now(),
          date: dateStr,
          status: newStatus,
        };
        setHistoryAttendance((prev) => [...prev, newRecord]);
      }
      setSuccess(`Your attendance for ${formatDate(dateStr)} was saved as ${newStatus}.`);
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

  const loadHistory = async () => {
    if (!token) return;
    try {
      const data = await getBranchAdminAttendanceApi(token);
      setHistoryAttendance(Array.isArray(data?.attendance) ? data.attendance : []);
    } catch (err) {
      setError(err.message || "Failed to load attendance history.");
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [token, selectedDate]);

  useEffect(() => {
    loadHistory();
  }, [token]);

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
      return filteredSummary;
    }
    return {
      total: attendanceSummary.total || 0,
      present: attendanceSummary.present || 0,
      half_day: attendanceSummary.half_day || 0,
      absent: attendanceSummary.absent || 0,
      leave: attendanceSummary.leave || 0,
    };
  }, [filteredAttendance, startDate, endDate, filteredSummary, attendanceSummary]);

  const saveAttendance = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (selectedRecord) {
        await updateBranchAdminAttendanceApi(
          selectedRecord.id,
          { status: draftStatus },
          token,
        );
      } else {
        await markBranchAdminAttendanceApi(
          { date: selectedDate, status: draftStatus },
          token,
        );
      }
      await loadAttendance(selectedDate);
      await loadHistory();
      setSuccess(`Your attendance for ${formatDate(selectedDate)} was saved.`);
    } catch (err) {
      setError(err.message || "Failed to save your attendance.");
    } finally {
      setSaving(false);
    }
  };

  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
  const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
  const activeStatus = statusFor(draftStatus);

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
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "history") loadHistory();
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
                    id: user?.id || "admin",
                    name: user?.name || user?.full_name || "Branch Administrator",
                    email: user?.email || "",
                    role: user?.branch_name || "Branch Administrator",
                  },
                ]}
                records={historyAttendance}
                onSaveStatus={handleMatrixSaveStatus}
                title="My Attendance"
                subtitle="Personal monthly attendance register"
                isSinglePerson={true}
                fullWidth={true}
                savingKey={saving ? "admin" : null}
              />
            </div>
          )}

          {/* ---- Tab 2: Attendance History ---- */}
          {activeTab === "history" && (
            <div className="space-y-7">
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
                    Personal Attendance History
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Administrator daily attendance activity records and status audit log.
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
                        onChange={(event) => setStartDate(event.target.value)}
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
                        onChange={(event) => setEndDate(event.target.value)}
                        className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </label>
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#ded8cb] px-2.5 py-1.5 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f3ede1] transition-colors cursor-pointer"
                      title="Clear date filters"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* A. Five Dynamic Summary Cards */}
              <AttendanceSummaryCards
                total={visibleSummary.total}
                present={visibleSummary.present}
                halfDay={visibleSummary.half_day}
                absent={visibleSummary.absent}
                leave={visibleSummary.leave}
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
        </section>
      </main>
    </div>
  );
};

export default BranchAdminAttendance;