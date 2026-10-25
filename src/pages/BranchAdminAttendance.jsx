import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Circle,
  Loader2,
  Menu,
  Save,
} from "lucide-react";
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

        <section className="mx-auto w-full max-w-6xl space-y-10 px-6 py-9 sm:px-10">
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

          {/* ---- Focal card: mark / update attendance ---- */}
          <section
            className="overflow-hidden rounded-2xl"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
          >
            <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <span
                  aria-hidden="true"
                  className="mt-1 hidden h-16 w-1 shrink-0 rounded-full sm:block"
                  style={{ background: "#9c6b2e" }}
                />
                <div>
                  <p className="text-sm" style={{ color: "#8a8175" }}>
                    {formatDate(selectedDate, { weekday: "long" })}
                  </p>
                  <p
                    className="mt-1 text-[1.6rem] leading-tight sm:text-[1.85rem]"
                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                  >
                    {formatDate(selectedDate)}
                  </p>
                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                    style={{ background: activeStatus.bg, color: activeStatus.text }}
                  >
                    <Circle className="h-2 w-2" fill={activeStatus.dot} stroke="none" />
                    {selectedRecord ? `Marked ${activeStatus.label}` : "Not marked yet"}
                  </div>
                  {selectedRecord?.marked_at && (
                    <p className="mt-2 text-xs" style={{ color: "#a39a8c" }}>
                      Last updated{" "}
                      {new Date(selectedRecord.marked_at).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: "1px solid #e3ddd0", color: "#5b5346" }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  <span className="sr-only">Attendance date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    max={getToday()}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="bg-transparent outline-none"
                  />
                </label>

                <div className="flex overflow-hidden rounded-lg" style={{ border: "1px solid #e3ddd0" }}>
                  {statusOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftStatus(option.value)}
                      className="px-3.5 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        borderLeft: index === 0 ? "none" : "1px solid #e3ddd0",
                        background: draftStatus === option.value ? option.bg : "transparent",
                        color: draftStatus === option.value ? option.text : "#8a8175",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={saving || loading}
                  className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: "#17140f" }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {selectedRecord ? "Update" : "Save"}
                </button>
              </div>
            </div>

            {/* ---- Summary strip ---- */}
            <div
              className="grid grid-cols-3 divide-x"
              style={{ borderTop: "1px solid #e3ddd0", background: "#faf8f4" }}
            >
              {[
                { label: "Present", value: visibleSummary.present, color: "#5c7a5a" },
                { label: "Half day", value: visibleSummary.half_day, color: "#b0803a" },
                { label: "Leave", value: visibleSummary.leave, color: "#a24a3a" },
              ].map((stat) => (
                <div key={stat.label} className="px-6 py-5" style={{ borderColor: "#e3ddd0" }}>
                  <p className="text-xs" style={{ color: "#a39a8c" }}>
                    {stat.label}
                    {(startDate || endDate) && " · filtered"}
                  </p>
                  <p
                    className="mt-1 text-2xl"
                    style={{ ...serif, fontWeight: 500, color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ---- History ---- */}
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 style={{ ...serif, fontWeight: 500, color: "#17140f" }} className="text-xl">
                  Attendance history
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                  {filteredAttendance.length} record{filteredAttendance.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs" style={{ color: "#8a8175" }}>
                  From
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{ border: "1px solid #e3ddd0", color: "#1c1a17" }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs" style={{ color: "#8a8175" }}>
                  To
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="rounded-lg px-3 py-2 text-sm"
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
                    className="rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ color: "#9c6b2e" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid #e3ddd0" }}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4" }}>
                      <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Date</th>
                      <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Status</th>
                      <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Marked at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-16 text-center" style={{ color: "#a39a8c" }}>
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    ) : filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-16 text-center text-sm" style={{ color: "#a39a8c" }}>
                          No attendance records in this range yet.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record, index) => {
                        const status = statusFor(record.status);
                        const isActive = record.date === selectedDate;
                        return (
                          <tr
                            key={record.id}
                            onClick={() => {
                              setSelectedDate(record.date);
                              setDraftStatus(normalizeStatus(record.status));
                            }}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderTop: index === 0 ? "none" : "1px solid #efe9dd",
                              background: isActive ? "#f7f1e4" : "transparent",
                              boxShadow: isActive ? "inset 3px 0 0 #9c6b2e" : "inset 3px 0 0 transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = "#faf8f4";
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td className="px-6 py-4 font-medium" style={{ color: "#1c1a17" }}>
                              {formatDate(record.date)}
                              {isActive && (
                                <span className="ml-2 text-xs font-normal" style={{ color: "#9c6b2e" }}>
                                  selected
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="inline-flex items-center gap-2 text-sm font-medium"
                                style={{ color: status.text }}
                              >
                                <Circle className="h-2 w-2" fill={status.dot} stroke="none" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs" style={{ color: "#a39a8c" }}>
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
          </section>
        </section>
      </main>
    </div>
  );
};

export default BranchAdminAttendance;