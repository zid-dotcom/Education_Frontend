import React, { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Circle,
  ClipboardCheck,
  Edit3,
  History,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getMyCoursesApi } from "../services/branchadmincourses";
import {
  createBranchStaffApi,
  deleteBranchStaffApi,
  getBranchStaffApi,
  getStaffAttendanceApi,
  markStaffAttendanceApi,
  updateBranchStaffApi,
  updateStaffAttendanceApi,
} from "../services/branchadminstaff";

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

const formatAttendanceDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`))
    : "All dates";

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
  const [deletingId, setDeletingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [attendanceDate, setAttendanceDate] = useState(getToday);
  const [attendance, setAttendance] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceStartDate, setAttendanceStartDate] = useState("");
  const [attendanceEndDate, setAttendanceEndDate] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState({
    total: 0,
    present: 0,
    half_day: 0,
    leave: 0,
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(null);
  const [attendanceDrafts, setAttendanceDrafts] = useState({});

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

  const loadAttendanceHistory = async () => {
    if (!token) return;
    try {
      setAttendanceLoading(true);
      const data = await getStaffAttendanceApi(token);
      setAttendanceHistory(
        Array.isArray(data?.attendance)
          ? data.attendance.filter((record) => record.status !== "Absent")
          : [],
      );
    } catch (err) {
      setError(err.message || "Failed to load attendance history.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadAttendance(attendanceDate);
    if (token) {
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
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save staff member.");
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

  const filteredAttendanceHistory = attendanceHistory.filter(
    (record) =>
      (!attendanceStartDate || record.date >= attendanceStartDate) &&
      (!attendanceEndDate || record.date <= attendanceEndDate),
  );

  const staffAttendanceTotals = staff.map((member) => {
    const records = filteredAttendanceHistory.filter(
      (record) => record.staff_id === member.id,
    );
    const present = records.filter(
      (record) => record.status === "Present",
    ).length;
    const halfDay = records.filter(
      (record) => record.status === "Half Day",
    ).length;
    const leave = records.filter((record) => record.status === "Leave").length;
    return {
      ...member,
      present,
      halfDay,
      leave,
      presentDays: present + halfDay * 0.5,
    };
  });

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
        <header
          className="flex flex-col gap-5 px-6 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10"
          style={{ borderBottom: "1px solid #e3ddd0" }}
        >
          <div>
            <h1
              className="text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              Staff management
            </h1>
            <p className="mt-2 max-w-md text-[0.95rem]" style={{ color: "#8a8175" }}>
              Create and manage staff accounts assigned to your branch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: "#17140f" }}>
                {user?.name || "Branch admin"}
              </p>
              <p className="text-xs" style={{ color: "#a39a8c" }}>
                Branch administrator
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10">
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
          <nav className="mb-8 flex gap-7" style={{ borderBottom: "1px solid #e3ddd0" }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "history") loadAttendanceHistory();
                  }}
                  className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${FOCUS_RING}`}
                  style={{ color: isActive ? "#17140f" : "#8a8175" }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
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
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <h2
                    className="text-xl"
                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                  >
                    Mark your branch team
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Recording attendance for{" "}
                    <span style={{ color: "#17140f", fontWeight: 500 }}>
                      {formatAttendanceDate(attendanceDate)}
                    </span>
                    .
                  </p>
                </div>
                <label
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: "1px solid #e3ddd0", color: "#5b5346" }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  <span className="sr-only">Attendance date</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    max={getToday()}
                    onChange={handleAttendanceDateChange}
                    className="bg-transparent outline-none"
                  />
                </label>
              </div>

              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div
                  className="grid grid-cols-3 divide-x"
                  style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4" }}
                >
                  {[
                    { label: "Present", value: attendanceSummary.present, color: "#5c7a5a" },
                    { label: "Half day", value: attendanceSummary.half_day, color: "#b0803a" },
                    { label: "Leave", value: attendanceSummary.leave, color: "#a24a3a" },
                  ].map((stat) => (
                    <div key={stat.label} className="px-6 py-5" style={{ borderColor: "#e3ddd0" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>{stat.label}</p>
                      <p className="mt-1 text-2xl" style={{ ...serif, fontWeight: 500, color: stat.color }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {attendanceLoading ? (
                  <div className="flex items-center gap-2 px-6 py-14 text-sm" style={{ color: "#8a8175" }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance…
                  </div>
                ) : staff.length === 0 ? (
                  <div className="px-6 py-14 text-center text-sm" style={{ color: "#8a8175" }}>
                    Create a staff account before marking attendance.
                  </div>
                ) : (
                  <div>
                    {staff.map((member, index) => {
                      const currentStatus = attendanceDrafts[member.id] || "Present";
                      const savedRecord = attendance.find(
                        (record) =>
                          record.staff_id === member.id &&
                          record.date === attendanceDate,
                      );
                      const meta = statusMeta(savedRecord?.status);
                      return (
                        <div
                          key={member.id}
                          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                          style={{ borderTop: index === 0 ? "none" : "1px solid #efe9dd" }}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                              style={{ background: "#f1ede4", color: "#7a531f" }}
                            >
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium" style={{ color: "#17140f" }}>
                                {member.name}
                              </p>
                              <p className="truncate text-xs" style={{ color: "#8a8175" }}>
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                              style={{ background: meta.bg, color: meta.text }}
                            >
                              <Circle className="h-2 w-2" fill={meta.dot} stroke="none" />
                              {savedRecord ? `Marked ${savedRecord.status}` : "Not marked"}
                            </span>

                            <div className="flex overflow-hidden rounded-lg" style={{ border: "1px solid #e3ddd0" }}>
                              {["Present", "Half Day", "Leave"].map((option, i) => {
                                const optionMeta = statusMeta(option);
                                const selected = currentStatus === option;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() =>
                                      setAttendanceDrafts((current) => ({
                                        ...current,
                                        [member.id]: option,
                                      }))
                                    }
                                    className={`px-3 py-2 text-xs font-medium transition-colors ${FOCUS_RING}`}
                                    style={{
                                      borderLeft: i === 0 ? "none" : "1px solid #e3ddd0",
                                      background: selected ? optionMeta.bg : "transparent",
                                      color: selected ? optionMeta.text : "#8a8175",
                                    }}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              disabled={attendanceSaving === member.id}
                              onClick={() => saveAttendance(member)}
                              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-50 ${FOCUS_RING}`}
                              style={{ background: "#17140f" }}
                            >
                              {attendanceSaving === member.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {savedRecord ? "Update" : "Save"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---- Attendance history ---- */}
          {activeTab === "history" && (
            <section className="space-y-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-xl" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    Staff attendance records
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    {filteredAttendanceHistory.length} record
                    {filteredAttendanceHistory.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-xs" style={{ color: "#8a8175" }}>
                    From
                    <input
                      type="date"
                      value={attendanceStartDate}
                      onChange={(event) => setAttendanceStartDate(event.target.value)}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs" style={{ color: "#8a8175" }}>
                    To
                    <input
                      type="date"
                      value={attendanceEndDate}
                      min={attendanceStartDate || undefined}
                      onChange={(event) => setAttendanceEndDate(event.target.value)}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </label>
                  {(attendanceStartDate || attendanceEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceStartDate("");
                        setAttendanceEndDate("");
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${FOCUS_RING}`}
                      style={{ color: "#9c6b2e" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white text-left text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e3ddd0", background: "#ffffff" }}>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Staff</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Present days</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Half days</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffAttendanceTotals.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center text-sm" style={{ color: "#a39a8c" }}>
                            No staff accounts found.
                          </td>
                        </tr>
                      ) : (
                        staffAttendanceTotals.map((member, index) => (
                          <tr key={member.id} style={{ borderTop: index === 0 ? "none" : "1px solid #efe9dd" }}>
                            <td className="px-6 py-4 font-medium" style={{ color: "#17140f" }}>
                              {member.name}
                            </td>
                            <td className="px-6 py-4 font-medium" style={{ color: "#39533a" }}>
                              {member.presentDays}
                            </td>
                            <td className="px-6 py-4 font-medium" style={{ color: "#7a531f" }}>
                              {member.halfDay}
                            </td>
                            <td className="px-6 py-4 font-medium" style={{ color: "#7c3324" }}>
                              {member.leave}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white text-left text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e3ddd0", background: "#ffffff" }}>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Staff</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Date</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Status</th>
                        <th className="px-6 py-3 text-xs font-medium" style={{ color: "#8a8175" }}>Marked at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-14 text-center text-sm" style={{ color: "#a39a8c" }}>
                            No attendance history found.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceHistory.map((record, index) => {
                          const meta = statusMeta(record.status);
                          return (
                            <tr key={record.id} style={{ borderTop: index === 0 ? "none" : "1px solid #efe9dd" }}>
                              <td className="px-6 py-4 font-medium" style={{ color: "#17140f" }}>
                                {record.staff_name ||
                                  staff.find((member) => member.id === record.staff_id)?.name ||
                                  `Staff #${staff.find((member) => member.id === record.staff_id)?.staff_code || record.staff_id}`}
                              </td>
                              <td className="px-6 py-4" style={{ color: "#8a8175" }}>
                                {formatAttendanceDate(record.date)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className="inline-flex items-center gap-2 text-sm font-medium"
                                  style={{ color: meta.text }}
                                >
                                  <Circle className="h-2 w-2" fill={meta.dot} stroke="none" />
                                  {record.status}
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
                          </div>
                          <span className="shrink-0 text-xs" style={{ color: "#a39a8c" }}>
                            #{member.staff_code || member.id}
                          </span>
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
                    <input
                      required={!editingStaff}
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={updateField}
                      className={`mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`}
                      style={inputStyle}
                    />
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
    </div>
  );
};

export default BranchAdminStaff;