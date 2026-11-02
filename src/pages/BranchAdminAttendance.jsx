import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Circle,
  Loader2,
  Menu,
  Save,
  Clock,
  CheckCircle2,
} from "lucide-react";
import AttendanceCalendarMatrix from "../components/common/AttendanceCalendarMatrix";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
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

const formatDate = (date, opts) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...opts,
      }).format(new Date(`${date}T00:00:00`))
    : "Selected date";

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

  const filteredSummary = useMemo(() => filteredAttendance.reduce((summary, record) => {
    const status = normalizeStatus(record.status);
    return {
      ...summary,
      total: summary.total + 1,
      present: summary.present + (status === "present" ? 1 : 0),
      half_day: summary.half_day + (status === "half_day" ? 1 : 0),
      leave: summary.leave + (status === "leave" ? 1 : 0),
    };
  }, { total: 0, present: 0, half_day: 0, leave: 0 }), [filteredAttendance]);

  const visibleSummary = startDate || endDate ? filteredSummary : attendanceSummary;

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
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
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
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                My Attendance
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 style={{ ...serif, fontWeight: 500, color: "#17140f" }} className="text-xl sm:text-2xl font-bold">
                    Attendance History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {filteredAttendance.length} record{filteredAttendance.length === 1 ? "" : "s"} found
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-500 font-semibold">
                    From
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="rounded-lg px-3 py-2 text-sm bg-white"
                      style={{ border: "1px solid #e3ddd0", color: "#1c1a17" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500 font-semibold">
                    To
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="rounded-lg px-3 py-2 text-sm bg-white"
                      style={{ border: "1px solid #e3ddd0", color: "#1c1a17" }}
                    />
                  </label>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:underline"
                      style={{ color: "#9c6b2e" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-xs" style={{ border: "1px solid #e3ddd0" }}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4" }}>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Date</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Marked at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#efe9dd]">
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-16 text-center text-slate-400">
                            <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#9c6b2e]" />
                          </td>
                        </tr>
                      ) : filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-16 text-center text-sm text-slate-500">
                            No attendance records in this range yet.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((record) => {
                          const status = statusFor(record.status);
                          return (
                            <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                                  style={{ background: status.bg, color: status.text }}
                                >
                                  <Circle className="h-2 w-2" fill={status.dot} stroke="none" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                {record.marked_at
                                  ? new Date(record.marked_at).toLocaleString("en-IN")
                                  : "—"}
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