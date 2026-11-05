import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
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
  Sparkles,
  History,
  ArrowRight,
  Search,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import AttendanceSummaryCards from '../components/common/AttendanceSummaryCards';
import AttendanceStatusBadge, { normalizeAttendanceStatus } from '../components/common/AttendanceStatusBadge';
import { getDefaultFromDate, getDefaultToDate } from '../utils/dateFilters';
import {
  getSuperAdminAttendanceBranchesApi,
  getSuperAdminBranchStaffAttendanceApi,
  getSuperAdminBranchAdminAttendanceApi,
  getSuperAdminAttendanceAdjustmentsApi,
} from '../services/superadmin';
import {
  getSuperAdminBranchHolidaysApi,
} from '../services/holidays';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const getTodayStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return "—";
  try {
    const dStr = String(date).slice(0, 10);
    const parts = dStr.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Intl.DateTimeFormat("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(y, m - 1, d));
      }
    }
    return String(date);
  } catch (e) {
    return String(date);
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

const formatTimestamp = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch (e) {
    return String(ts);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-4 sm:px-6 py-3.5 sm:py-4.5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#9c6b2e]" />
            <h3
              className="text-sm sm:text-base font-bold text-slate-900 tracking-tight"
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
      <div className="overflow-x-auto custom-staff-scrollbar w-full">
        <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
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
                r.staff_name || r.name || r.branch_admin_name || r.admin_name || r.user_name || "—";
              const initials = personName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const dateVal = r.date || r.attendance_date || r.changed_at || r.marked_at;
              const checkInVal = r.previous_status
                ? `Prev: ${r.previous_status}`
                : formatTime(r.check_in || r.time_in, r.marked_at);
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

const AttendanceAdjustmentsTable = ({
  adjustments = [],
  emptyMsg = "No attendance records found for this period.",
  title = "Branch Attendance Records",
}) => {
  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

  if (adjustments.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e3ddd0] bg-white p-14 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
          <ClipboardList className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">{emptyMsg}</p>
        <p className="mt-1 text-xs text-slate-500">
          No attendance adjustment records were found for the selected branch and date range.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-4 sm:px-6 py-3.5 sm:py-4.5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#9c6b2e]" />
            <h3
              className="text-sm sm:text-base font-bold text-slate-900 tracking-tight"
              style={serif}
            >
              {title}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Chronological audit log of recorded duty adjustments
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
          {adjustments.length} {adjustments.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-staff-scrollbar w-full">
        <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
          <thead>
            <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Name
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Role
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Attendance Date
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Previous Status
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Adjusted Status
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Adjusted By
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Adjusted At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ede4]">
            {adjustments.map((r, i) => {
              const personName =
                r.staff_name || r.name || r.branch_admin_name || r.admin_name || r.user_name || "—";
              const initials = personName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const dateVal = r.attendance_date || r.date || r.for_date;
              const prevStatus = r.previous_status || r.old_status || r.from_status;
              const newStatus = r.new_status || r.status || r.to_status || r.adjusted_status;
              const changedBy = r.changed_by || r.adjusted_by || r.updated_by || "Admin";
              const changedAt = r.changed_at || r.adjusted_at || r.created_at;

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
                      {r.role || (r.staff_id ? "Staff" : "Branch Admin")}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 font-semibold text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(dateVal)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    {prevStatus ? (
                      <AttendanceStatusBadge status={prevStatus} />
                    ) : (
                      <span className="text-slate-400 font-medium">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <AttendanceStatusBadge status={newStatus} />
                  </td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#faf8f4] border border-[#e3ddd0]">
                      {changedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatTimestamp(changedAt)}</span>
                    </div>
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
  { id: 'admins', label: 'Branch Admins Attendance', icon: UserCheck },
  { id: 'holidays', label: 'Branch Holidays', icon: CalendarDays },
  { id: 'records', label: 'Attendance Records', icon: ClipboardList },
];

const SuperAdminAttendance = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [activeTab, setActiveTab] = useState('staff');
  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);
  const [dateError, setDateError] = useState('');
  const [staffRecords, setStaffRecords] = useState([]);
  const [adminRecords, setAdminRecords] = useState([]);
  const [attendanceAdjustments, setAttendanceAdjustments] = useState([]);
  const [branchHolidays, setBranchHolidays] = useState([]);
  const [staffSummary, setStaffSummary] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  const activeRequestIdRef = useRef(0);
  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
  const todayStr = getTodayStr();

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

    // Increment request ID to guard against out-of-order async race conditions
    const requestId = ++activeRequestIdRef.current;

    Promise.allSettled([
      getSuperAdminBranchStaffAttendanceApi(branchId, token, { fromDate: from, toDate: to }),
      getSuperAdminBranchAdminAttendanceApi(branchId, token, { fromDate: from, toDate: to }),
      getSuperAdminBranchHolidaysApi(branchId, token, { date_from: from, date_to: to }),
      getSuperAdminAttendanceAdjustmentsApi(token, {
        branch_id: branchId,
        date_from: from,
        date_to: to,
      }),
    ]).then(([staffRes, adminRes, holidayRes, adjustmentsRes]) => {
      // If a newer request was dispatched while this was in flight, ignore stale response
      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      const extractRecords = (res) => {
        let list = [];
        if (res.status === 'fulfilled') {
          if (Array.isArray(res.value)) list = res.value;
          else if (res.value?.attendance && Array.isArray(res.value.attendance)) list = res.value.attendance;
          else if (res.value?.records && Array.isArray(res.value.records)) list = res.value.records;
        }
        // Strict date boundary safeguard: ensure only records within [from, to] are kept
        if (from || to) {
          list = list.filter((r) => {
            const d = String(r.date || r.attendance_date || r.marked_at || "").slice(0, 10);
            if (!d) return true;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          });
        }
        return list;
      };

      const extractAdjustments = (res) => {
        let list = [];
        if (res.status === 'fulfilled' && res.value) {
          const val = res.value;
          if (Array.isArray(val)) list = val;
          else if (Array.isArray(val.adjustments)) list = val.adjustments;
          else if (Array.isArray(val.records)) list = val.records;
          else if (Array.isArray(val.data)) list = val.data;
          else if (val.data && Array.isArray(val.data.adjustments)) list = val.data.adjustments;
          else if (Array.isArray(val.attendance)) list = val.attendance;
        }
        return list;
      };

      const extractHolidays = (res) => {
        let list = [];
        if (res.status === 'fulfilled') {
          if (Array.isArray(res.value)) list = res.value;
          else if (res.value?.holidays && Array.isArray(res.value.holidays)) list = res.value.holidays;
        }
        if (from || to) {
          list = list.filter((h) => {
            const hd = String(h.date || h.holiday_date || "").slice(0, 10);
            if (!hd) return true;
            if (from && hd < from) return false;
            if (to && hd > to) return false;
            return true;
          });
        }
        return list;
      };

      const extractSummary = (res, records) => {
        if (res.status === 'fulfilled' && res.value && typeof res.value === 'object' && !Array.isArray(res.value)) {
          const val = res.value;
          return {
            total: Number(val.total !== undefined ? val.total : records.length),
            present: Number(val.present || 0),
            half_day: Number(val.half_day || 0),
            absent: Number(val.absent || 0),
            leave: Number(val.leave || 0),
            total_holidays: val.total_holidays !== undefined ? Number(val.total_holidays) : undefined,
            total_working_days: val.total_working_days !== undefined ? Number(val.total_working_days) : undefined,
          };
        }
        return null;
      };

      const staffList = extractRecords(staffRes);
      const adminList = extractRecords(adminRes);
      const holidaysList = extractHolidays(holidayRes);
      const adjList = extractAdjustments(adjustmentsRes);

      setStaffRecords(staffList);
      setAdminRecords(adminList);
      setBranchHolidays(holidaysList);
      setAttendanceAdjustments(adjList);
      setStaffSummary(extractSummary(staffRes, staffList));
      setAdminSummary(extractSummary(adminRes, adminList));
    }).catch(e => setError(e.message))
      .finally(() => {
        if (requestId === activeRequestIdRef.current) {
          setDataLoading(false);
        }
      });
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
  const currentRecords = activeTab === 'staff' ? staffRecords : activeTab === 'admins' ? adminRecords : attendanceAdjustments;

  // Dynamic summary metrics using backend-returned totals & working days/holidays with fallback calculation
  const currentSummary = useMemo(() => {
    const backendSummary = activeTab === 'staff' ? staffSummary : activeTab === 'admins' ? adminSummary : null;
    const currentList = activeTab === 'staff' ? staffRecords : activeTab === 'admins' ? adminRecords : attendanceAdjustments;

    const computed = currentList.reduce(
      (acc, r) => {
        const s = normalizeAttendanceStatus(r.new_status || r.status);
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
      total: backendSummary?.total ?? (activeTab === 'records' ? attendanceAdjustments.length : computed.total),
      present: backendSummary?.present ?? computed.present,
      half_day: backendSummary?.half_day ?? computed.half_day,
      absent: backendSummary?.absent ?? computed.absent,
      leave: backendSummary?.leave ?? computed.leave,
      total_working_days: backendSummary?.total_working_days !== undefined ? backendSummary.total_working_days : (staffSummary?.total_working_days ?? 0),
      total_holidays: backendSummary?.total_holidays !== undefined ? backendSummary.total_holidays : branchHolidays.length,
    };
  }, [activeTab, staffSummary, adminSummary, staffRecords, adminRecords, attendanceAdjustments, branchHolidays]);

  const selectedBranch = branches.find(
    (b) => String(b.id ?? b.branch_id) === String(selectedBranchId)
  );

  return (
    <div
      className="min-h-screen md:flex max-w-full"
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

      <main className="min-w-0 flex-1 max-w-full overflow-x-hidden">
        {/* Top Header */}
        <header
          className="hidden md:flex items-center justify-between border-b px-6 py-5 sm:px-10"
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

        <div className="w-full px-3 sm:px-8 py-5 sm:py-8 lg:px-10 space-y-5 sm:space-y-7 min-w-0 max-w-full overflow-hidden">
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
                    Audit and inspect staff, administrator, and declared holiday records for the selected period.
                  </p>
                </div>

                {/* Branch and Date Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#faf8f4] border border-[#e8e2d5] p-2.5 rounded-xl w-full sm:w-auto max-w-full min-w-0 shadow-2xs">
                  {/* Branch Select */}
                  <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                    <Building2 className="h-4 w-4 text-[#9c6b2e] shrink-0" />
                    <div className="relative flex-1 sm:flex-initial min-w-0 w-full sm:w-56 max-w-full">
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full max-w-full truncate appearance-none rounded-lg border border-[#ded8cb] bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none cursor-pointer"
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

                  <div className="hidden sm:block h-5 w-px bg-[#e8e2d5]" />

                  {/* Date Range: Responsive on mobile, side-by-side on desktop */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0">
                    {/* From Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 min-w-0">
                      <span className="text-slate-400 font-medium shrink-0">From:</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFromDate(val);
                          if (toDate && val && val > toDate) {
                            setToDate(val);
                          }
                        }}
                        className="w-full sm:w-auto min-w-0 rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </div>

                    {/* To Date */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 min-w-0">
                      <span className="text-slate-400 font-medium shrink-0">To:</span>
                      <input
                        type="date"
                        value={toDate}
                        min={fromDate || undefined}
                        onChange={(e) => {
                          const val = e.target.value;
                          setToDate(val);
                          if (fromDate && val && val < fromDate) {
                            setFromDate(val);
                          }
                        }}
                        className="w-full sm:w-auto min-w-0 rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
                      />
                    </div>

                    {(fromDate !== getDefaultFromDate() || toDate !== getDefaultToDate()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFromDate(getDefaultFromDate());
                          setToDate(getDefaultToDate());
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer shadow-2xs"
                        title="Reset date filters to default month range"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Summary Cards for Staff / Admin attendance including Working Days & Holidays */}
              {activeTab !== 'holidays' && (
                <AttendanceSummaryCards
                  total={currentSummary.total}
                  present={currentSummary.present}
                  halfDay={currentSummary.half_day}
                  absent={currentSummary.absent}
                  leave={currentSummary.leave}
                  totalWorkingDays={currentSummary.total_working_days}
                  totalHolidays={currentSummary.total_holidays}
                  loading={dataLoading}
                  totalLabel={
                    activeTab === 'staff'
                      ? "Total Staff Records"
                      : activeTab === 'admins'
                      ? "Total Admin Records"
                      : "Total Attendance Records"
                  }
                />
              )}

              {/* Navigation Tabs */}
              <div
                className="flex items-center gap-2 sm:gap-4 border-b pb-0.5 overflow-x-auto no-scrollbar scroll-smooth w-full"
                style={{ borderColor: '#e3ddd0' }}
              >
                {TABS.map(({ id, label, icon: TabIcon }) => {
                  const isActive = activeTab === id;
                  const count =
                    id === 'staff'
                      ? staffRecords.length
                      : id === 'admins'
                      ? adminRecords.length
                      : id === 'holidays'
                      ? branchHolidays.length
                      : attendanceAdjustments.length;

                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="relative flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition cursor-pointer select-none whitespace-nowrap shrink-0"
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
                    Loading {activeTab === 'staff' ? 'staff' : activeTab === 'admins' ? 'branch admin' : activeTab === 'holidays' ? 'branch holiday' : 'attendance adjustment'} records...
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
                    Please select a branch from the dropdown above to view its attendance and holiday data.
                  </p>
                </div>
              ) : activeTab === 'staff' ? (
                <AttendanceTable
                  records={staffRecords}
                  emptyMsg="No staff attendance records for this period."
                  defaultRole="Staff"
                  title={`${selectedBranch?.name || 'Branch'} Staff Attendance Log`}
                />
              ) : activeTab === 'admins' ? (
                <AttendanceTable
                  records={adminRecords}
                  emptyMsg="No branch admin attendance records for this period."
                  defaultRole="Branch Admin"
                  title={`${selectedBranch?.name || 'Branch'} Administrator Attendance Log`}
                />
              ) : activeTab === 'holidays' ? (
                /* Tab 3: Branch Holidays */
                <div
                  className="overflow-hidden rounded-2xl bg-white shadow-xs"
                  style={{ border: "1px solid #e3ddd0" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-4 sm:px-6 py-3.5 sm:py-4.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#9c6b2e]" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight" style={serif}>
                          {selectedBranch?.name || 'Branch'} Declared Holidays
                        </h3>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Official scheduled branch holidays and calendar closures
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
                      {branchHolidays.length} {branchHolidays.length === 1 ? "Holiday" : "Holidays"}
                    </span>
                  </div>

                  {branchHolidays.length === 0 ? (
                    <div className="p-10 sm:p-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                        <CalendarCheck className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        No holidays declared for this period
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                        No holidays are recorded for this branch within the chosen date range.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-staff-scrollbar w-full">
                      <table className="w-full text-left text-xs sm:text-sm min-w-[520px]">
                        <thead>
                          <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                              Holiday Date
                            </th>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                              Day
                            </th>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                              Occasion / Reason
                            </th>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1ede4]">
                          {branchHolidays.map((h, i) => {
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
                              <tr key={h.id ?? i} className="hover:bg-[#fcfbf9] transition-colors">
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
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 4: Attendance Records (from GET /super-admin/attendance/adjustments) */
                <AttendanceAdjustmentsTable
                  adjustments={attendanceAdjustments}
                  emptyMsg="No attendance records found for this period."
                  title={`${selectedBranch?.name || 'Branch'} Attendance Records`}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminAttendance;
