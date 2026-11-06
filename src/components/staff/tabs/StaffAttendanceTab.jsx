import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  ClipboardList,
  Loader2,
  RefreshCw,
  RotateCcw,
  Building2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AttendanceSummaryCards from '../../common/AttendanceSummaryCards';
import AttendanceStatusBadge, { normalizeAttendanceStatus } from '../../common/AttendanceStatusBadge';
import AttendanceHolidaysCard from '../../common/AttendanceHolidaysCard';
import { getMyStaffAttendanceApi } from '../../../services/staff';
import { getDefaultFromDate, getDefaultToDate } from '../../../utils/dateFilters';

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date, opts) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...opts,
    }).format(new Date(`${date}T00:00:00`));
  } catch (e) {
    return date;
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

const StaffAttendanceTab = ({ user, profileData, token, branchName }) => {
  // Auto-fill default range: from 1st of current month to today (e.g. 01-11-2026 to 06-11-2026)
  const [startDate, setStartDate] = useState(getDefaultFromDate);
  const [endDate, setEndDate] = useState(getDefaultToDate);
  const activeRequestIdRef = useRef(0);

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [backendSummary, setBackendSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('log'); // 'log' | 'holidays'

  const staffName = profileData?.name || user?.name || 'Staff Member';

  const loadData = async () => {
    if (!token) return;
    const dFrom = startDate;
    const dTo = endDate;
    if (dFrom && dTo && dFrom > dTo) {
      // Guard against invalid date ordering so backend error 'date_from must not be after date_to' never triggers
      return;
    }

    const requestId = ++activeRequestIdRef.current;
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (dFrom) params.date_from = dFrom;
      if (dTo) params.date_to = dTo;

      const val = await getMyStaffAttendanceApi(token, params);
      if (requestId !== activeRequestIdRef.current) return;

      let list = Array.isArray(val)
        ? val
        : Array.isArray(val?.attendance)
        ? val.attendance
        : Array.isArray(val?.records)
        ? val.records
        : [];

      if (dFrom || dTo) {
        list = list.filter((r) => {
          const d = String(r.date || r.attendance_date || r.marked_at || '').slice(0, 10);
          if (!d) return true;
          if (dFrom && d < dFrom) return false;
          if (dTo && d > dTo) return false;
          return true;
        });
      }

      setAttendanceRecords(list);

      // Extract branch holidays directly from staff attendance response (avoids 403 on admin-only /holidays)
      let hList = Array.isArray(val?.holidays)
        ? val.holidays
        : Array.isArray(val?.branch_holidays)
        ? val.branch_holidays
        : [];

      if (dFrom || dTo) {
        hList = hList.filter((h) => {
          const d = String(h.date || h.holiday_date || '').slice(0, 10);
          if (!d) return true;
          if (dFrom && d < dFrom) return false;
          if (dTo && d > dTo) return false;
          return true;
        });
      }

      setHolidays(hList);

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        setBackendSummary({
          total: val.total !== undefined ? Number(val.total) : undefined,
          present: val.present !== undefined ? Number(val.present) : undefined,
          half_day: val.half_day !== undefined ? Number(val.half_day) : undefined,
          absent: val.absent !== undefined ? Number(val.absent) : undefined,
          leave: val.leave !== undefined ? Number(val.leave) : undefined,
          total_holidays: val.total_holidays !== undefined ? Number(val.total_holidays) : (hList.length || undefined),
          total_working_days: val.total_working_days !== undefined ? Number(val.total_working_days) : undefined,
        });
      }
    } catch (err) {
      if (requestId === activeRequestIdRef.current) {
        setError(err.message || 'Failed to load attendance records.');
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) return;
    loadData();
  }, [token, startDate, endDate]);

  const summary = useMemo(() => {
    const computed = attendanceRecords.reduce(
      (acc, r) => {
        const s = normalizeAttendanceStatus(r.status);
        acc.total += 1;
        if (s === 'present') acc.present += 1;
        else if (s === 'half_day') acc.half_day += 1;
        else if (s === 'absent') acc.absent += 1;
        else if (s === 'leave') acc.leave += 1;
        return acc;
      },
      { total: 0, present: 0, half_day: 0, absent: 0, leave: 0 }
    );
    return {
      total: backendSummary?.total ?? computed.total,
      present: backendSummary?.present ?? computed.present,
      half_day: backendSummary?.half_day ?? computed.half_day,
      absent: backendSummary?.absent ?? computed.absent,
      leave: backendSummary?.leave ?? computed.leave,
      total_working_days: backendSummary?.total_working_days ?? 0,
      total_holidays: backendSummary?.total_holidays ?? holidays.length,
    };
  }, [attendanceRecords, backendSummary, holidays]);

  const todayStr = getToday();

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar Header */}
      <div className="rounded-2xl border border-[#e3ddd0] bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#9c6b2e]" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9c6b2e]">
              Staff Attendance Portal
            </span>
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-['Fraunces',serif]">
            My Attendance & Duty Log
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Review your presence records, working days, and branch holidays for {branchName ? `${branchName} branch` : 'your assigned branch'}.
          </p>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#faf8f4] border border-[#e8e2d5] p-2 rounded-xl self-start lg:self-auto shadow-2xs">
          {/* From Date */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                setError('');
                if (val && endDate && val > endDate) {
                  setEndDate(val);
                }
              }}
              className="rounded-lg border border-[#ded8cb] bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                const val = e.target.value;
                setEndDate(val);
                setError('');
                if (val && startDate && val < startDate) {
                  setStartDate(val);
                }
              }}
              className="rounded-lg border border-[#ded8cb] bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#9c6b2e] focus:outline-none"
            />
          </div>

          {(startDate !== getDefaultFromDate() || endDate !== getDefaultToDate()) && (
            <button
              type="button"
              onClick={() => {
                setStartDate(getDefaultFromDate());
                setEndDate(getDefaultToDate());
                setError('');
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#ded8cb] px-2.5 py-1 text-xs font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer"
              title="Reset date filters to default month range"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setError('');
              loadData();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#9c6b2e] hover:bg-white transition cursor-pointer"
            title="Reload attendance records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="underline text-xs font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Summary Cards */}
      <AttendanceSummaryCards
        total={summary.total}
        present={summary.present}
        halfDay={summary.half_day}
        absent={summary.absent}
        leave={summary.leave}
        totalWorkingDays={summary.total_working_days}
        totalHolidays={summary.total_holidays}
        loading={loading}
        totalLabel="Recorded Days"
      />

      {/* Standard Sub Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-[#e3ddd0] pb-0.5">
        {[
          { id: 'log', label: 'Attendance History', icon: ClipboardList, count: attendanceRecords.length },
          { id: 'holidays', label: 'Branch Holidays', icon: CalendarDays, count: holidays.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className="relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition cursor-pointer select-none"
              style={{ color: isActive ? '#17140f' : '#8a8175' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isActive ? 'bg-[#17140f] text-[#f4b942]' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
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

      {/* Sub Tab Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e]" />
          <p className="text-xs font-semibold text-slate-500">Loading your attendance records...</p>
        </div>
      ) : activeSubTab === 'log' ? (
        <div className="space-y-5">
          <AttendanceHolidaysCard
            holidays={holidays}
            title="Branch Declared Holidays in Selected Period"
          />

          <div className="overflow-hidden rounded-2xl bg-white shadow-xs border border-[#e3ddd0]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#9c6b2e]" />
                  <h3 className="text-base font-bold text-slate-900 tracking-tight font-['Fraunces',serif]">
                    Personal Attendance History
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Detailed record of marked daily attendances for {staffName}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#1e6b37]" />
                {attendanceRecords.length} {attendanceRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="p-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No attendance entries recorded</p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  No attendance logs found for {startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} to ${formatDate(endDate)}`}.
                </p>
                {(startDate !== getDefaultFromDate() || endDate !== getDefaultToDate()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(getDefaultFromDate());
                      setEndDate(getDefaultToDate());
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#ded8cb] bg-white px-3.5 py-2 text-xs font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Date Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Day
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
                    {attendanceRecords.map((r, i) => {
                      const dateVal = r.date || r.attendance_date;
                      const checkInVal = formatTime(r.check_in || r.time_in, r.marked_at);
                      const checkOutVal = formatTime(r.check_out || r.time_out, r.marked_out);

                      let weekday = '—';
                      if (dateVal) {
                        try {
                          weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(
                            new Date(`${dateVal}T00:00:00`)
                          );
                        } catch {}
                      }

                      return (
                        <tr key={r.id ?? i} className="hover:bg-[#fcfbf9] transition-colors">
                          <td className="px-6 py-4.5 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#9c6b2e] shrink-0" />
                              <span>{formatDate(dateVal)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">
                            {weekday}
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
            )}
          </div>
        </div>
      ) : (
        /* Sub Tab: Holidays */
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs border border-[#e3ddd0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d5] bg-[#faf8f4] px-6 py-4.5">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#9c6b2e]" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-['Fraunces',serif]">
                  Branch Holidays & Closures
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Official holidays declared by branch administration
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-[#e3ddd0] px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#9c6b2e]" />
              {holidays.length} {holidays.length === 1 ? 'Holiday' : 'Holidays'}
            </span>
          </div>

          {holidays.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eee2] text-[#9c6b2e] mb-3">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No holidays declared for this period</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No official holidays match your filter range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e8e2d5] bg-[#fbf9f5]">
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Date
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
                  {holidays.map((h, i) => {
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
                        <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">{weekday}</td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf5ec] text-[#9c6b2e] border border-[#ebd8b6] font-bold text-xs">
                            <CalendarDays className="h-3 w-3 shrink-0" />
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
    </div>
  );
};

export default StaffAttendanceTab;
