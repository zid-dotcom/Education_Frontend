import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  Filter,
  IndianRupee,
  Loader2,
  Menu,
  Receipt,
  RefreshCw,
  Search,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import { getSuperAdminExpensesApi } from '../services/expenses';
import { getBranchesApi } from '../services/adminbranches';
import { getDefaultFromDate, getDefaultToDate } from '../utils/dateFilters';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('sa-expenses-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sa-expenses-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes sa-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sa-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sa-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.sa-rise  { opacity: 0; animation: sa-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
.sa-fade  { animation: sa-fade .35s ease both; }
.sa-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: sa-shimmer 1.4s linear infinite;
}
.sa-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.sa-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.2);
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .sa-rise, .sa-fade, .sa-skeleton { animation: none !important; opacity: 1 !important; }
  .sa-card { transition: none !important; }
  .sa-card:hover { transform: none; }
}
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatCurrency = (amount) => {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(numeric);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
};

const getTodayStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getDateDaysAgo = (days) => {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getMonthStartStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function SuperAdminExpenses() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Date filters
  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);
  const [activePreset, setActivePreset] = useState('month');
  const [dateError, setDateError] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch branches for dropdown filter
  useEffect(() => {
    if (!token) return;
    getBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.branches)
          ? data.branches
          : [];
        setBranches(list);
      })
      .catch((err) => {
        console.warn('Could not load branches:', err);
      });
  }, [token]);

  // Branch map for ID -> Name lookup
  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      const id = b.id ?? b.branch_id;
      if (id) {
        map[id] = b.name || b.branch_name || `Branch #${id}`;
      }
    });
    return map;
  }, [branches]);

  const extractList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.expenses)) return data.expenses;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.branch_expenses)) return data.branch_expenses;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.branches)) {
        return data.branches.flatMap((b) => b.expenses || b.records || []);
      }
      const vals = Object.values(data);
      if (vals.some((v) => Array.isArray(v))) {
        return vals.filter((v) => Array.isArray(v)).flat();
      }
    }
    return [];
  };

  // Load expenses from API
  const loadExpenses = useCallback(
    async (showFullLoader = false) => {
      if (!token) return;
      if (fromDate && toDate && fromDate > toDate) {
        setDateError('From date cannot be later than To date.');
        return;
      }
      setDateError('');
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);
      setError('');

      try {
        const filters = {};
        if (selectedBranchId && selectedBranchId !== 'all') {
          filters.branch_id = selectedBranchId;
        }
        if (fromDate) filters.from_date = fromDate;
        if (toDate) filters.to_date = toDate;

        const data = await getSuperAdminExpensesApi(filters, token);
        let list = extractList(data);

        // If global all-branches query returns empty and branches exist, query branches in parallel as fallback
        if (list.length === 0 && (!selectedBranchId || selectedBranchId === 'all') && branches.length > 0) {
          const branchResults = await Promise.allSettled(
            branches.map((b) => {
              const bId = b.id ?? b.branch_id;
              return getSuperAdminExpensesApi({ ...filters, branch_id: bId }, token);
            })
          );
          const combined = [];
          branchResults.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
              const bExpenses = extractList(res.value);
              const bId = branches[idx]?.id ?? branches[idx]?.branch_id;
              const bName = branches[idx]?.name || branches[idx]?.branch_name;
              bExpenses.forEach((item) => {
                combined.push({
                  ...item,
                  branch_id: item.branch_id || bId,
                  branch_name: item.branch_name || bName,
                });
              });
            }
          });
          if (combined.length > 0) {
            list = combined;
          }
        }

        setExpenses(list);
      } catch (err) {
        setError(err.message || 'Failed to load expenses report.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, selectedBranchId, fromDate, toDate, branches]
  );

  useEffect(() => {
    loadExpenses(true);
  }, [loadExpenses]);

  // Preset Filters
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const today = getTodayStr();

    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'week') {
      setFromDate(getDateDaysAgo(7));
      setToDate(today);
    } else {
      setFromDate(getDefaultFromDate());
      setToDate(getDefaultToDate());
    }
  };

  const handleCustomDateChange = (type, val) => {
    setActivePreset('custom');
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let list = expenses;

    // Client-side date filter safeguard
    if (fromDate || toDate) {
      list = list.filter((e) => {
        const rawDate = e.date || e.expense_date || e.created_at || e.timestamp || e.marked_at || '';
        const d = String(rawDate).slice(0, 10);
        if (!d) return true;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((e) => {
      const itemText = (e.item || e.title || e.name || '').toLowerCase();
      const costText = String(e.cost || e.amount || '');
      const branchName = (
        branchMap[e.branch_id] ||
        e.branch_name ||
        `Branch ${e.branch_id || ''}`
      ).toLowerCase();
      return itemText.includes(q) || costText.includes(q) || branchName.includes(q);
    });
  }, [expenses, fromDate, toDate, searchQuery, branchMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const count = filteredExpenses.length;
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.cost ?? e.amount) || 0), 0);
    const average = count > 0 ? total / count : 0;

    let highestAmount = 0;
    let highestItem = null;

    const branchTotals = {};
    filteredExpenses.forEach((e) => {
      const c = Number(e.cost ?? e.amount) || 0;
      if (c > highestAmount) {
        highestAmount = c;
        highestItem = e;
      }
      const bId = e.branch_id || 'unknown';
      branchTotals[bId] = (branchTotals[bId] || 0) + c;
    });

    const activeBranchesCount = Object.keys(branchTotals).length;

    return {
      count,
      total,
      average,
      highestAmount,
      highestItem,
      activeBranchesCount,
      branchTotals,
    };
  }, [filteredExpenses]);


  return (
    <div
      className="min-h-screen md:flex max-w-full overflow-x-hidden"
      style={{ ...sans, background: '#faf8f4', color: '#17140f' }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="expenses"
      />

      <main className="min-w-0 flex-1 max-w-full overflow-x-hidden">
        {/* Header */}
        <header
          className="sticky top-0 z-20 hidden md:flex h-[92px] items-center justify-between border-b px-6 backdrop-blur-md sm:px-10 shrink-0"
          style={{ borderColor: '#e3ddd0', background: '#faf8f4/95' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#9c6b2e' }}
              >
                Financial Control
              </p>
              <h1 className="text-2xl font-bold" style={serif}>
                Branch Expenses Report
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => loadExpenses(false)}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f1ede4] disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 text-[#9c6b2e] ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        {/* Content */}
        <div className="w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-10 space-y-7">
          {/* Error Banner */}
          {error && (
            <div
              className="sa-rise flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadExpenses(false)}
                className="font-bold underline hover:opacity-80 text-xs ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Metrics Overview Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Expenses */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Total Expenses</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#f8eae5', color: '#b24a3b' }}
                >
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums text-slate-900"
                style={serif}
              >
                {formatCurrency(metrics.total)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {selectedBranchId === 'all'
                  ? 'All branches combined'
                  : `${branchMap[selectedBranchId] || `Branch #${selectedBranchId}`}`}
              </p>
            </article>

            {/* Total Records */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e3ddd0',
                animationDelay: '60ms',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Total Records</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#f7efe0', color: '#b0803a' }}
                >
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums text-slate-900"
                style={serif}
              >
                {metrics.count}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">Recorded transactions</p>
            </article>

            {/* Active Branches */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e3ddd0',
                animationDelay: '120ms',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Reporting Branches</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#f0f3ea', color: '#5c7a5a' }}
                >
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums text-slate-900"
                style={serif}
              >
                {metrics.activeBranchesCount}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">Branches with recorded expenses</p>
            </article>

            {/* Highest Expense */}
            <article
              className="sa-card sa-rise rounded-2xl p-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e3ddd0',
                animationDelay: '180ms',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Highest Expenses</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#ede9fe', color: '#6d28d9' }}
                >
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums text-slate-900"
                style={serif}
              >
                {formatCurrency(metrics.highestAmount)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c] truncate">
                {metrics.highestItem?.item || 'Single highest entry'}
              </p>
            </article>
          </section>

          {/* Filters Bar */}
          <section
            className="sa-rise rounded-2xl p-4 sm:p-6"
            style={{
              background: '#ffffff',
              border: '1px solid #e3ddd0',
              animationDelay: '200ms',
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full min-w-0">
              {/* Branch Selector */}
              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 w-full sm:w-auto min-w-0">
                <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                  <label className="text-xs font-bold text-[#8a8175] uppercase tracking-wider shrink-0">
                    Branch:
                  </label>
                  <div className="relative flex-1 sm:flex-initial min-w-0 w-full sm:w-64 max-w-full">
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full min-w-0 appearance-none rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-3.5 pr-9 text-xs font-semibold text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e] truncate"
                    >
                      <option value="all">All Branches (Global)</option>
                      {branches.map((b) => {
                        const id = b.id ?? b.branch_id;
                        return (
                          <option key={id} value={String(id)}>
                            {b.name || b.branch_name || `Branch #${id}`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a39a8c]" />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap items-center gap-1.5 sm:pl-2 sm:border-l sm:border-[#e3ddd0]">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: '7 Days' },
                    { id: 'month', label: 'This Month' },
                  ].map((preset) => {
                    const isActive = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#17140f] text-[#f4b942] shadow-sm'
                            : 'border border-[#e3ddd0] bg-[#faf8f4] text-[#5b5346] hover:bg-[#f1ede4]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-[#8a8175] shrink-0">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    className="flex-1 sm:flex-initial rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-[#8a8175] shrink-0">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    className="flex-1 sm:flex-initial rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                  />
                </div>

                {(fromDate !== getDefaultFromDate() || toDate !== getDefaultToDate() || selectedBranchId !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranchId('all');
                      applyPreset('month');
                    }}
                    className="text-xs font-semibold text-[#9c6b2e] underline hover:opacity-80"
                  >
                    Reset all
                  </button>
                )}
              </div>
            </div>

            {/* Date error alert */}
            {dateError && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{dateError}</span>
              </p>
            )}

            {/* Real-time search */}
            <div className="mt-4 pt-4 border-t border-[#f1ede4]">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter expenses by item name, amount, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Expenses Table */}
          <section
            className="sa-rise rounded-2xl overflow-hidden shadow-sm"
            style={{
              background: '#ffffff',
              border: '1px solid #e3ddd0',
              animationDelay: '250ms',
            }}
          >
            <div className="flex items-center justify-between border-b border-[#e3ddd0] px-6 py-4 bg-[#fdfcfb]">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#9c6b2e]" />
                <h2 className="text-base font-bold text-slate-900" style={serif}>
                  Consolidated Expenses
                </h2>
                <span className="ml-2 rounded-full bg-[#f1ede4] px-2.5 py-0.5 text-[11px] font-bold text-[#8a8175]">
                  {filteredExpenses.length} entries
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="sa-skeleton h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7efe0] text-[#9c6b2e]">
                  <Receipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900" style={serif}>
                  No expenses found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#8a8175]">
                  {searchQuery || selectedBranchId !== 'all' || fromDate || toDate
                    ? 'No expense records matched the selected branch and date filters.'
                    : 'Branches have not recorded any expenses yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#f1ede4] bg-[#faf8f4] text-[#8a8175] uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-6">#</th>
                      <th className="py-3.5 px-6">Branch</th>
                      <th className="py-3.5 px-6">Item Description</th>
                      <th className="py-3.5 px-6">Cost</th>
                      <th className="py-3.5 px-6">Date Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ede4]">
                    {filteredExpenses.map((expense, idx) => {
                      const itemTitle =
                        expense.item || expense.title || expense.name || 'Unnamed expense';
                      const costAmount = Number(expense.cost ?? expense.amount) || 0;
                      const dateRecorded =
                        expense.created_at || expense.date || expense.expense_date;
                      const bId = expense.branch_id;
                      const branchName =
                        branchMap[bId] || expense.branch_name || (bId ? `Branch #${bId}` : 'Main Branch');

                      return (
                        <tr
                          key={expense.id || idx}
                          className="transition hover:bg-[#faf8f4]/60"
                        >
                          <td className="py-4 px-6 text-[#a39a8c] font-medium">{idx + 1}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4ebd9] px-2.5 py-1 text-xs font-semibold text-[#784e1b]">
                              <Building2 className="h-3 w-3" />
                              <span>{branchName}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f8eae5] text-[#b24a3b]">
                                <TrendingDown className="h-3.5 w-3.5" />
                              </span>
                              <span className="font-semibold text-slate-900">
                                {itemTitle}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-[#b24a3b] tabular-nums text-sm">
                              {formatCurrency(costAmount)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#5b5346]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#a39a8c]" />
                              <span>
                                {dateRecorded ? formatDateTime(dateRecorded) : '—'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
