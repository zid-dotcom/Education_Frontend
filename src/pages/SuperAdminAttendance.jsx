import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import AttendanceSummaryCards from '../components/common/AttendanceSummaryCards';
import AttendanceStatusBadge, { normalizeAttendanceStatus } from '../components/common/AttendanceStatusBadge';
import {
  getSuperAdminAttendanceBranchesApi,
  getSuperAdminBranchStaffAttendanceApi,
  getSuperAdminBranchAdminAttendanceApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const formatDate = (date) => {
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

const formatTime = (timeStr, fallbackTimestamp) => {
  if (timeStr && timeStr !== "—") return timeStr;
  if (!fallbackTimestamp) return "—";
  try {
    const d = new Date(fallbackTimestamp);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "—";
  }
};

const AttendanceTable = ({ records = [], emptyMsg = "No attendance records found.", defaultRole = "Staff", title = "Attendance Directory" }) => {
  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

  if (records.length === 0) {
    return (
      <div
        className="rounded-2xl border border-[#e3ddd0] bg-white p-14 text-center shadow-xs"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
          <ClipboardList className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">{emptyMsg}</p>
        <p className="mt-1 text-xs text-slate-500">
          Try selecting a different date range or verifying that attendance has been marked.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-xs"
      style={{ border: "1px solid #e3ddd0" }}
    >
      {/* Table Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#9c6b2e]" />
            <h3
              className="text-base font-bold text-slate-900 tracking-tight"
              style={serif}
            >
              {title}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Chronological audit log of recorded duty statuses
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#1e6b37]" />
          {records.length} {records.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Name
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Role
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Date
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Check-In
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Check-Out
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ede4]">
            {records.map((r, i) => {
              const personName =
                r.name || r.staff_name || r.branch_admin_name || r.admin_name || "—";
              const initials = personName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const dateVal = r.date || r.attendance_date;
              const checkInVal = formatTime(r.check_in || r.time_in, r.marked_at);
              const checkOutVal = formatTime(r.check_out || r.time_out, r.marked_out);

              return (
                <tr
                  key={r.id ?? i}
                  className="hover:bg-[#fcfbf9] transition-colors"
                >
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5efe4] text-xs font-extrabold text-[#9c6b2e] border border-[#e8dfd0] shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">
                          {personName}
                        </div>
                        {r.staff_code && (
                          <div className="text-xs font-medium text-slate-400">
                            #{r.staff_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-medium text-slate-600 text-xs">
                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                      {r.role || r.position || defaultRole || "Staff"}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 font-semibold text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(dateVal)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{checkInVal}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{checkOutVal}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    <AttendanceStatusBadge status={r.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TABS = [
  { id: 'staff', label: 'Staff Attendance', icon: Users },
  { id: 'admins', label: 'Branch Admins', icon: UserCheck },
];

const SuperAdminAttendance = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [activeTab, setActiveTab] = useState('staff');
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [dateError, setDateError] = useState('');
  const [staffRecords, setStaffRecords] = useState([]);
  const [adminRecords, setAdminRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminAttendanceBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.branches ?? []);
        setBranches(list);
        if (list.length > 0 && !selectedBranchId) {
          setSelectedBranchId(String(list[0].id ?? list[0].branch_id));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadData = (branchId, from, to) => {
    if (!token || !branchId) return;
    if (from && to && from > to) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    setDataLoading(true);
    setError('');
    Promise.allSettled([
      getSuperAdminBranchStaffAttendanceApi(branchId, token, { fromDate: from, toDate: to }),
      getSuperAdminBranchAdminAttendanceApi(branchId, token, { fromDate: from, toDate: to }),
    ]).then(([staffRes, adminRes]) => {
      const extractRecords = (res) => {
        if (res.status === 'fulfilled') {
          if (Array.isArray(res.value)) return res.value;
          if (res.value?.attendance && Array.isArray(res.value.attendance)) return res.value.attendance;
          if (res.value?.records && Array.isArray(res.value.records)) return res.value.records;
        }
        return [];
      };

      setStaffRecords(extractRecords(staffRes));
      setAdminRecords(extractRecords(adminRes));
    }).catch(e => setError(e.message))
      .finally(() => setDataLoading(false));
  };

  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('From Date cannot be later than To Date.');
      return;
    }
    setDateError('');
    if (selectedBranchId) {
      loadData(selectedBranchId, fromDate, toDate);
    }
  }, [selectedBranchId, fromDate, toDate, token]);

  // Current active records based on tab
  const currentRecords = activeTab === 'staff' ? staffRecords : adminRecords;

  // Dynamic 5-Card metrics for Super Admin Attendance
  const currentSummary = useMemo(() => {
    return currentRecords.reduce(
      (acc, r) => {
        const s = normalizeAttendanceStatus(r.status);
        acc.total += 1;
        if (s === "present") acc.present += 1;
        else if (s === "half_day") acc.half_day += 1;
        else if (s === "absent") acc.absent += 1;
        else if (s === "leave") acc.leave += 1;
        return acc;
      },
      { total: 0, present: 0, half_day: 0, absent: 0, leave: 0 }
    );
  }, [currentRecords]);

  const selectedBranch = branches.find(
    (b) => String(b.id ?? b.branch_id) === String(selectedBranchId)
  );

  return (
    <div
      className="min-h-screen md:flex"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="attendance"
      />

      <main className="min-w-0 flex-1">
        {/* Top Header */}
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#9c6b2e]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9c6b2e]">
                Super Admin Portal
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900" style={serif}>
              Branch Attendance
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (fromDate && toDate && fromDate > toDate) {
                  setDateError('From Date cannot be later than To Date.');
                  return;
                }
                loadData(selectedBranchId, fromDate, toDate);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded8cb] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f3ede1] transition cursor-pointer"
              title="Refresh attendance records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-7">
          {error && (
            <div
              className="rounded-xl px-4 py-3.5 text-sm font-medium flex items-center justify-between shadow-2xs"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  if (fromDate && toDate && fromDate > toDate) return;
                  loadData(selectedBranchId, fromDate, toDate);
                }}
                className="underline font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {dateError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{dateError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-[#9c6b2e]" />
              <p className="text-xs font-semibold text-slate-500">Loading branch directory...</p>
            </div>
          ) : (
            <>
              {/* Filter & Controls Card */}
              <div className="rounded-2xl border border-[#e3ddd0] bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[#9c6b2e]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9c6b2e]">
                      Attendance Directory
                    </span>
                  </div>
                  <h2
                    className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    style={serif}
                  >
                    {selectedBranch ? `${selectedBranch.name || selectedBranch.branch_name} Attendance` : 'Select a Branch'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Audit and inspect staff and branch admin attendance records for the selected period.
                  </p>
                </div>

                {/* Branch and Date Selector */}
                <div className="flex flex-wrap items-center gap-3 bg-[#faf8f4] border border-[#e8e2d5] p-2.5 rounded-xl self-start lg:self-auto">
                  {/* Branch Select */}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#9c6b2e] shrink-0" />
                    <div className="relative">
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="appearance-none rounded-lg border border-[#ded8cb] bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>Please select a branch</option>
                        {branches.map((b) => (
                          <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                            {b.name || b.branch_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* From Date */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="text-slate-400 font-medium">From:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                    />
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="text-slate-400 font-medium">To:</span>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(e) => setToDate(e.target.value)}
                      className="rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Five Dynamic Summary Cards */}
              <AttendanceSummaryCards
                total={currentSummary.total}
                present={currentSummary.present}
                halfDay={currentSummary.half_day}
                absent={currentSummary.absent}
                leave={currentSummary.leave}
                loading={dataLoading}
                totalLabel={activeTab === 'staff' ? "Total Staff Records" : "Total Admin Records"}
              />

              {/* Navigation Tabs */}
              <div
                className="flex gap-2 sm:gap-4 border-b pb-0.5"
                style={{ borderColor: '#e3ddd0' }}
              >
                {TABS.map(({ id, label, icon: TabIcon }) => {
                  const isActive = activeTab === id;
                  const count = id === 'staff' ? staffRecords.length : adminRecords.length;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition cursor-pointer select-none"
                      style={{ color: isActive ? '#17140f' : '#8a8175' }}
                    >
                      <TabIcon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-[#17140f] text-[#f4b942]'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                      {isActive && (
                        <span
                          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                          style={{ background: '#9c6b2e' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content Table / Empty States */}
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e]" />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading {activeTab === 'staff' ? 'staff' : 'branch admin'} records...
                  </p>
                </div>
              ) : !selectedBranchId ? (
                <div
                  className="rounded-2xl border border-[#e3ddd0] bg-white p-14 text-center shadow-xs"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    No branch selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Please select a branch from the dropdown above to view its attendance data.
                  </p>
                </div>
              ) : (
                activeTab === 'staff' ? (
                  <AttendanceTable
                    records={staffRecords}
                    emptyMsg="No staff attendance records for this period."
                    defaultRole="Staff"
                    title={`${selectedBranch?.name || 'Branch'} Staff Attendance Log`}
                  />
                ) : (
                  <AttendanceTable
                    records={adminRecords}
                    emptyMsg="No branch admin attendance records for this period."
                    defaultRole="Branch Admin"
                    title={`${selectedBranch?.name || 'Branch'} Administrator Attendance Log`}
                  />
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminAttendance;
