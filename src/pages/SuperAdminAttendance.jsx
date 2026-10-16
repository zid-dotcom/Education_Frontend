import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, ChevronDown, Clock, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminAttendanceBranchesApi,
  getSuperAdminBranchStaffAttendanceApi,
  getSuperAdminBranchAdminAttendanceApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const StatusBadge = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const style = s === 'present'
    ? { background: '#ecfdf5', color: '#065f46' }
    : s === 'absent'
      ? { background: '#fef2f2', color: '#991b1b' }
      : { background: '#faf8f4', color: '#0369a1' };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={style}>
      {s === 'present' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
      {status || 'Unknown'}
    </span>
  );
};

const AttendanceTable = ({ records, emptyMsg, defaultRole }) => (
  records.length === 0 ? (
    <div className="rounded-2xl px-5 py-12 text-center text-sm" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#a39a8c' }}>{emptyMsg}</div>
  ) : (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#faf8f4', borderBottom: '1px solid #e3ddd0' }}>
              {['Name', 'Role', 'Date', 'Check-In', 'Check-Out', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#a39a8c' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id ?? i} className="transition hover:bg-sky-50" style={{ borderBottom: '1px solid #f1ede4' }}>
                <td className="px-5 py-3 font-medium">{r.name || r.staff_name || r.branch_admin_name || r.admin_name || '—'}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#a39a8c' }}>{r.role || r.position || defaultRole || '—'}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#5b5346' }}>{r.date || r.attendance_date || '—'}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#5b5346' }}>{r.check_in || r.time_in || (r.marked_at ? new Date(r.marked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—')}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#5b5346' }}>{r.check_out || r.time_out || (r.marked_out ? new Date(r.marked_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—')}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
);

const TABS = [
  { id: 'staff', label: 'Staff Attendance' },
  { id: 'admins', label: 'Branch Admins' },
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

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminAttendanceBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.branches ?? []);
        setBranches(list);
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

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="attendance" />

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>Attendance</h1>
          </div>
          <button
            onClick={() => {
              if (fromDate && toDate && fromDate > toDate) {
                setDateError('From Date cannot be later than To Date.');
                return;
              }
              loadData(selectedBranchId, fromDate, toDate);
            }}
            className="rounded-lg p-2 hover:bg-[#f1ede4]"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
          </button>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div className="rounded-xl px-4 py-4 text-sm font-medium flex items-center justify-between" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  if (fromDate && toDate && fromDate > toDate) return;
                  loadData(selectedBranchId, fromDate, toDate);
                }}
                className="underline font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {dateError && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{dateError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9c6b2e' }} /></div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium" style={{ color: '#5b5346' }}>Branch:</label>
                <div className="relative">
                  <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="appearance-none rounded-xl border pl-4 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: '#e3ddd0', background: '#ffffff', color: '#17140f' }}>
                    <option value="" disabled>Please select a branch</option>
                    {branches.map(b => <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>{b.name || b.branch_name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#a39a8c' }} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>From Date:</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: dateError ? '#ef4444' : '#e3ddd0', background: '#ffffff', color: '#17140f' }} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: '#5b5346' }}>To Date:</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                    className="rounded-xl border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: dateError ? '#ef4444' : '#e3ddd0', background: '#ffffff', color: '#17140f' }} />
                </div>
              </div>

              <div className="flex gap-1 border-b" style={{ borderColor: '#e3ddd0' }}>
                {TABS.map(({ id, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className="relative px-4 py-3 text-sm font-medium transition"
                      style={{ color: isActive ? '#17140f' : '#a39a8c' }}>
                      {label}
                      {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full" style={{ background: '#9c6b2e' }} />}
                    </button>
                  );
                })}
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9c6b2e' }} /></div>
              ) : !selectedBranchId ? (
                <div className="rounded-2xl px-5 py-14 text-center text-sm font-medium mt-6" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#5b5346' }}>
                  Please select a branch from the dropdown above to view its attendance data.
                </div>
              ) : (
                activeTab === 'staff'
                  ? <AttendanceTable records={staffRecords} emptyMsg="No staff attendance records." defaultRole="Staff" />
                  : <AttendanceTable records={adminRecords} emptyMsg="No branch admin attendance records." defaultRole="Branch Admin" />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminAttendance;
