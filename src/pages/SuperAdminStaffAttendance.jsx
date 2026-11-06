import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  Users,
  AlertCircle,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from '../components/common/NavLogoutButton';
import AttendanceSummaryCards from '../components/common/AttendanceSummaryCards';
import AttendanceStatusBadge from '../components/common/AttendanceStatusBadge';
import { getDefaultFromDate, getDefaultToDate } from '../utils/dateFilters';
import {
  getSuperAdminAttendanceBranchesApi,
  getSuperAdminBranchStaffAttendanceApi,
} from '../services/superadmin';
import { getSuperAdminBranchHolidaysApi } from '../services/holidays';
import AttendanceHolidaysCard from '../components/common/AttendanceHolidaysCard';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const getTodayStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const TABS = [
  { id: 'staff', label: 'Staff Attendance', icon: Users },
  { id: 'holidays', label: 'Branch Holidays', icon: CalendarDays },
];

const formatDate = (date) => {
  if (!date) return '—';
  try {
    const dStr = String(date).slice(0, 10);
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(y, m - 1, d));
      }
    }
    return String(date);
  } catch (e) {
    return String(date);
  }
};

const formatTime = (timeStr, fallbackTimestamp) => {
  if (timeStr && timeStr !== '—') return timeStr;
  if (!fallbackTimestamp) return '—';
  try {
    const d = new Date(fallbackTimestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '—';
  }
};

const SuperAdminStaffAttendance = () => {
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
  const [branchHolidays, setBranchHolidays] = useState([]);
  const [staffSummary, setStaffSummary] = useState(null);
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
        const list = Array.isArray(data) ? data : data?.branches ?? [];
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

    const requestId = ++activeRequestIdRef.current;

    Promise.allSettled([
      getSuperAdminBranchStaffAttendanceApi(branchId, token, { fromDate: from, toDate: to }),
      getSuperAdminBranchHolidaysApi(branchId, token, { date_from: from, date_to: to }),
    ])
      .then(([staffRes, holidayRes]) => {
        if (requestId !== activeRequestIdRef.current) return;

        let staffList = [];
        if (staffRes.status === 'fulfilled') {
          if (Array.isArray(staffRes.value)) staffList = staffRes.value;
          else if (Array.isArray(staffRes.value?.attendance)) staffList = staffRes.value.attendance;
          else if (Array.isArray(staffRes.value?.records)) staffList = staffRes.value.records;
        }

        let holidaysList = [];
        if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.holidays)) {
          holidaysList = staffRes.value.holidays;
        } else if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.branch_holidays)) {
          holidaysList = staffRes.value.branch_holidays;
        } else if (holidayRes.status === 'fulfilled') {
          if (Array.isArray(holidayRes.value)) holidaysList = holidayRes.value;
          else if (Array.isArray(holidayRes.value?.holidays)) holidaysList = holidayRes.value.holidays;
        }

        if (from || to) {
          holidaysList = holidaysList.filter((h) => {
            const hd = String(h.date || h.holiday_date || "").slice(0, 10);
            if (!hd) return true;
            if (from && hd < from) return false;
            if (to && hd > to) return false;
            return true;
          });
        }

        let summary = null;
        if (
          staffRes.status === 'fulfilled' &&
          staffRes.value &&
          typeof staffRes.value === 'object' &&
          !Array.isArray(staffRes.value)
        ) {
          const val = staffRes.value;
          summary = {
            total: Number(val.total !== undefined ? val.total : staffList.length),
            total_holidays:
              val.total_holidays !== undefined ? Number(val.total_holidays) : holidaysList.length,
            total_working_days:
              val.total_working_days !== undefined ? Number(val.total_working_days) : 0,
          };
        }

        setStaffRecords(staffList);
        setBranchHolidays(holidaysList);
        setStaffSummary(summary);
      })
      .catch((e) => setError(e.message))
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

  const selectedBranch = branches.find(
    (b) => String(b.id ?? b.branch_id) === String(selectedBranchId)
  );

  const summary = useMemo(() => {
    return {
      total: staffSummary?.total ?? staffRecords.length,
      total_working_days: staffSummary?.total_working_days ?? 0,
      total_holidays: staffSummary?.total_holidays ?? branchHolidays.length,
    };
  }, [staffSummary, staffRecords, branchHolidays]);

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
        activePage="staff-attendance"
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-screen w-full">
        {/* Top Header (desktop only - mobile uses SuperAdminSidebar top bar) */}
        <header
          className="sticky top-0 z-20 hidden md:flex items-center justify-between border-b px-6 py-5 sm:px-10 bg-white"
          style={{ borderColor: '#e3ddd0' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#9c6b2e]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9c6b2e]">
                Super Admin Portal
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900" style={serif}>
              Staff Attendance
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (fromDate && toDate && fromDate > toDate) {
                  setDateError('From Date cannot be later than To Date.');
                  return;
                }
                if (selectedBranchId) loadData(selectedBranchId, fromDate, toDate);
              }}
              disabled={dataLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded8cb] bg-[#faf8f4] px-3 py-2 text-xs font-bold text-[#9c6b2e] shadow-2xs hover:bg-[#f3ede1] transition cursor-pointer disabled:opacity-50"
              title="Refresh attendance records"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${dataLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="w-full px-3 sm:px-8 py-5 sm:py-8 lg:px-10 space-y-5 sm:space-y-7 min-w-0 max-w-full overflow-hidden sa-rise">
          {error && (
            <div
              className="rounded-2xl p-4 sm:p-4.5 text-sm font-medium flex items-center justify-between shadow-xs"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  if (selectedBranchId) loadData(selectedBranchId, fromDate, toDate);
                }}
                className="underline font-bold text-xs hover:text-red-950 transition cursor-pointer ml-3"
              >
                Retry
              </button>
            </div>
          )}

          {dateError && (
            <div
              className="rounded-2xl p-4 text-sm font-medium flex items-center gap-2.5 shadow-xs"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span>{dateError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-[#9c6b2e]" />
              <p className="text-xs font-semibold text-slate-500">Loading staff attendance directory...</p>
            </div>
          ) : (
            <>
              {/* Directory Filter Card */}
              <div
                className="rounded-2xl border bg-white p-4 sm:p-6 shadow-xs"
                style={{ borderColor: '#e3ddd0' }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9c6b2e]">
                        Staff Attendance Directory
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1" style={serif}>
                      {selectedBranch ? `${selectedBranch.name || selectedBranch.branch_name} Staff Attendance` : 'Staff Attendance Directory'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Audit and inspect staff attendance records and duty statuses for the selected period.
                    </p>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                    {/* Branch Select */}
                    <div className="relative w-full sm:w-56 min-w-0">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full appearance-none rounded-xl border bg-white pl-9 pr-9 py-2 text-xs sm:text-sm font-medium text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 cursor-pointer"
                        style={{ borderColor: '#e3ddd0' }}
                      >
                        <option value="" disabled>Select Branch</option>
                        {branches.map((b) => (
                          <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                            {b.name || b.branch_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                      {/* From Date */}
                      <div className="flex-1 sm:flex-initial flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 shadow-2xs" style={{ borderColor: '#e3ddd0' }}>
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">From:</span>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full border-none bg-transparent p-0 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none cursor-pointer"
                        />
                      </div>

                      {/* To Date */}
                      <div className="flex-1 sm:flex-initial flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 shadow-2xs" style={{ borderColor: '#e3ddd0' }}>
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">To:</span>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full border-none bg-transparent p-0 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none cursor-pointer"
                        />
                      </div>

                      {/* Mobile Refresh Button */}
                      <button
                        onClick={() => {
                          if (selectedBranchId) loadData(selectedBranchId, fromDate, toDate);
                        }}
                        disabled={dataLoading}
                        className="md:hidden inline-flex items-center justify-center rounded-xl border p-2 text-slate-700 bg-white hover:bg-[#f5efe4] transition shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
                        style={{ borderColor: '#e3ddd0' }}
                        title="Refresh records"
                      >
                        <RefreshCw className={`h-4 w-4 text-[#9c6b2e] ${dataLoading ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Reset Button */}
                      {(fromDate !== getDefaultFromDate() || toDate !== getDefaultToDate()) && (
                        <button
                          onClick={() => {
                            setFromDate(getDefaultFromDate());
                            setToDate(getDefaultToDate());
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#ded8cb] bg-white px-2.5 py-1.5 text-xs font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer shadow-2xs shrink-0"
                          title="Reset date filters to default month range"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              {activeTab !== 'holidays' && (
                <AttendanceSummaryCards
                  total={summary.total}
                  totalWorkingDays={summary.total_working_days}
                  totalHolidays={summary.total_holidays}
                  loading={dataLoading}
                  totalLabel="Total Staff Records"
                />
              )}

              {/* Navigation Tabs */}
              <div
                className="flex items-center gap-2 sm:gap-4 border-b pb-0.5 overflow-x-auto no-scrollbar scroll-smooth w-full"
                style={{ borderColor: '#e3ddd0' }}
              >
                {TABS.map(({ id, label, icon: TabIcon }) => {
                  const isActive = activeTab === id;
                  const count = id === 'staff' ? staffRecords.length : branchHolidays.length;

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

              {/* Table or Empty State */}
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e]" />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading {activeTab === 'staff' ? 'staff attendance' : 'branch holiday'} records...
                  </p>
                </div>
              ) : !selectedBranchId ? (
                <div className="rounded-2xl border border-[#e3ddd0] bg-white p-14 text-center shadow-xs">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No branch selected</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Please select a branch from the dropdown above to view its staff attendance and holiday data.
                  </p>
                </div>
              ) : activeTab === 'staff' ? (
                <div className="space-y-5">
                  <AttendanceHolidaysCard
                    holidays={branchHolidays}
                    title={`${selectedBranch?.name || selectedBranch?.branch_name || 'Branch'} Declared Holidays in Selected Period`}
                  />

                  {staffRecords.length === 0 ? (
                    <div className="rounded-2xl border border-[#e3ddd0] bg-white p-14 text-center shadow-xs">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No staff attendance records found</p>
                      <p className="mt-1 text-xs text-slate-500">
                        No staff attendance records have been marked for this branch within the chosen date range.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="overflow-hidden rounded-2xl bg-white shadow-xs"
                      style={{ border: '1px solid #e3ddd0' }}
                    >
                      {/* Table Header Strip */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-4 sm:px-6 py-3.5 sm:py-4.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-[#9c6b2e]" />
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight" style={serif}>
                              {selectedBranch?.name || selectedBranch?.branch_name || 'Branch'} Staff Attendance Log
                            </h3>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Chronological audit log of recorded duty statuses
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-[#1e6b37]" />
                          {staffRecords.length} {staffRecords.length === 1 ? 'Record' : 'Records'}
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
                            {staffRecords.map((r, i) => {
                              const personName =
                                r.staff_name || r.name || r.user_name || 'Staff Member';
                              const initials = personName
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase();
                              const dateVal = r.date || r.attendance_date || r.marked_at;
                              const checkInVal = formatTime(r.check_in || r.time_in, r.marked_at);
                              const checkOutVal = formatTime(r.check_out || r.time_out, r.marked_out);

                              return (
                                <tr key={r.id ?? i} className="hover:bg-[#fcfbf9] transition-colors">
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
                                      {r.role || r.position || 'Staff'}
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
                  )}
                </div>
              ) : (
                /* Tab: Branch Holidays */
                <div
                  className="overflow-hidden rounded-2xl bg-white shadow-xs"
                  style={{ border: '1px solid #e3ddd0' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-4 sm:px-6 py-3.5 sm:py-4.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#9c6b2e]" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight" style={serif}>
                          {selectedBranch?.name || selectedBranch?.branch_name || 'Branch'} Declared Holidays
                        </h3>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Official scheduled branch holidays and calendar closures
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
                      {branchHolidays.length} {branchHolidays.length === 1 ? 'Holiday' : 'Holidays'}
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

                            let weekday = '—';
                            try {
                              weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(
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
                                    <span>{h.reason || 'Declared Holiday'}</span>
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminStaffAttendance;

