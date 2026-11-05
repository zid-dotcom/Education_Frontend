import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Filter,
  IndianRupee,
  Loader2,
  Menu,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BranchAdminSidebar from '../components/layout/BranchAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  createBranchAdminExpenseApi,
  getBranchAdminExpensesApi,
} from '../services/branchadminexpenses';
import { getDefaultFromDate, getDefaultToDate } from '../utils/dateFilters';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('ba-expenses-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ba-expenses-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes ba-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ba-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ba-pop {
  from { opacity: 0; transform: translateY(16px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ba-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes ba-toast {
  from { opacity: 0; transform: translateY(-6px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ba-rise  { opacity: 0; animation: ba-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .35s ease both; }
.ba-pop   { animation: ba-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-toast { animation: ba-toast .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-skeleton {
  background: linear-gradient(90deg, #f1ede4 25%, #f8f5ee 37%, #f1ede4 63%);
  background-size: 800px 100%;
  animation: ba-shimmer 1.4s linear infinite;
}
.ba-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.ba-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.2);
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-pop, .ba-toast, .ba-skeleton { animation: none !important; opacity: 1 !important; }
  .ba-card { transition: none !important; }
  .ba-card:hover { transform: none; }
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

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
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

export default function BranchAdminExpenses() {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Date filters
  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);
  const [activePreset, setActivePreset] = useState('month');
  const [dateError, setDateError] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formItem, setFormItem] = useState('');
  const [formCost, setFormCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
        if (fromDate) filters.from_date = fromDate;
        if (toDate) filters.to_date = toDate;

        const data = await getBranchAdminExpensesApi(filters, token);

        // Normalize response whether it returns an array or an object
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.expenses)
          ? data.expenses
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setExpenses(list);
      } catch (err) {
        setError(err.message || 'Failed to load branch expenses.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, fromDate, toDate]
  );

  useEffect(() => {
    loadExpenses(true);
  }, [loadExpenses]);

  // Handle Quick Date Presets
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

  // Filtered expenses based on date range and search query
  const filteredExpenses = useMemo(() => {
    let list = expenses;

    if (fromDate || toDate) {
      list = list.filter((e) => {
        const rawDate = e.date || e.expense_date || e.created_at || e.timestamp || '';
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
      return itemText.includes(q) || costText.includes(q);
    });
  }, [expenses, fromDate, toDate, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const count = filteredExpenses.length;
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.cost ?? e.amount) || 0), 0);
    const average = count > 0 ? total / count : 0;
    const highest = filteredExpenses.reduce(
      (max, e) => Math.max(max, Number(e.cost ?? e.amount) || 0),
      0
    );
    return { count, total, average, highest };
  }, [filteredExpenses]);

  // Handle Create Expense Submission
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedItem = formItem.trim();
    const numCost = parseFloat(formCost);

    if (!trimmedItem) {
      setFormError('Please enter an expense item description.');
      return;
    }
    if (trimmedItem.length > 255) {
      setFormError('Item description must be under 255 characters.');
      return;
    }
    if (isNaN(numCost) || numCost < 0.01) {
      setFormError('Cost must be a valid amount of at least ₹0.01.');
      return;
    }

    setSubmitting(true);
    try {
      await createBranchAdminExpenseApi(
        { item: trimmedItem, cost: numCost },
        token
      );
      setSuccessMessage(`Expense "${trimmedItem}" of ${formatCurrency(numCost)} recorded successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setFormItem('');
      setFormCost('');
      setIsModalOpen(false);
      // Reload expenses list
      loadExpenses(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="branch-expenses-page min-h-screen md:flex"
      style={{ ...sans, background: '#faf8f4', color: '#1c1a17' }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={() => setIsModalOpen(true)}
        activePage="expenses"
      />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-20 flex min-h-[68px] sm:h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-3.5 sm:px-6 lg:px-10 backdrop-blur-md shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e] block truncate">
                Branch Operations
              </span>
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                Branch Expenses
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
              style={{ background: '#17140f' }}
            >
              <Plus className="h-4 w-4 text-[#f4b942] shrink-0" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden text-xs">Add</span>
            </button>

            <button
              type="button"
              onClick={() => loadExpenses(false)}
              disabled={refreshing}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] disabled:opacity-60 shrink-0"
              title="Refresh expenses"
            >
              <RefreshCw
                className={`h-4 w-4 text-[#9c6b2e] ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>

            <div className="hidden text-right sm:block pl-2 border-l border-[#e3ddd0]">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || 'Branch Admin'}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || 'Branch Portal'}
              </p>
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto w-full max-w-6xl space-y-7 px-6 py-8 sm:px-10">
          {/* Success Banner */}
          {successMessage && (
            <div
              role="status"
              className="ba-toast flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium shadow-sm"
              style={{
                background: '#eef6ee',
                color: '#276727',
                border: '1px solid #c7e6c7',
              }}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#276727]" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-[#276727] hover:opacity-70 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="ba-toast flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium"
              style={{
                background: '#f8eae5',
                color: '#7c3324',
                border: '1px solid #eccec4',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-[#7c3324]" />
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

          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Expenses */}
            <article
              className="ba-card ba-rise rounded-2xl p-5"
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
                {activePreset === 'all'
                  ? 'All recorded expenses'
                  : `Filtered period (${metrics.count} entries)`}
              </p>
            </article>

            {/* Total Records */}
            <article
              className="ba-card ba-rise rounded-2xl p-5"
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
              <p className="mt-1 text-[11px] text-[#a39a8c]">
                {metrics.count === 1 ? '1 expense record' : `${metrics.count} total records`}
              </p>
            </article>

            {/* Average Expense */}
            <article
              className="ba-card ba-rise rounded-2xl p-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e3ddd0',
                animationDelay: '120ms',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Average Expense</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#f0f3ea', color: '#5c7a5a' }}
                >
                  <IndianRupee className="h-4 w-4" />
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums text-slate-900"
                style={serif}
              >
                {formatCurrency(metrics.average)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">Per transaction average</p>
            </article>

            {/* Highest Expense */}
            <article
              className="ba-card ba-rise rounded-2xl p-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e3ddd0',
                animationDelay: '180ms',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Highest Expense</span>
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
                {formatCurrency(metrics.highest)}
              </p>
              <p className="mt-1 text-[11px] text-[#a39a8c]">Peak single expenditure</p>
            </article>
          </section>

          {/* Filter Bar & Controls */}
          <section
            className="ba-rise rounded-2xl p-5 sm:p-6"
            style={{
              background: '#ffffff',
              border: '1px solid #e3ddd0',
              animationDelay: '200ms',
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Presets and Search */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#8a8175] uppercase tracking-wider mr-1">
                  Filter:
                </span>
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                ].map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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

              {/* Custom Date Pickers */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#8a8175]">From:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => handleCustomDateChange('from', e.target.value)}
                      className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#8a8175]">To:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => handleCustomDateChange('to', e.target.value)}
                      className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-1 focus:ring-[#9c6b2e]"
                    />
                  </div>
                </div>

                {(fromDate !== getDefaultFromDate() || toDate !== getDefaultToDate()) && (
                  <button
                    type="button"
                    onClick={() => applyPreset('month')}
                    className="text-xs font-semibold text-[#9c6b2e] underline hover:opacity-80"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Date validation alert */}
            {dateError && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{dateError}</span>
              </p>
            )}

            {/* Real-time search bar */}
            <div className="mt-4 pt-4 border-t border-[#f1ede4]">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expenses by item or amount..."
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

          {/* Expenses List / Table */}
          <section
            className="ba-rise rounded-2xl overflow-hidden shadow-sm"
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
                  Expense Log
                </h2>
                <span className="ml-2 rounded-full bg-[#f1ede4] px-2.5 py-0.5 text-[11px] font-bold text-[#8a8175]">
                  {filteredExpenses.length} items
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="ba-skeleton h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7efe0] text-[#9c6b2e]">
                  <Receipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900" style={serif}>
                  {searchQuery ? 'No matching expenses' : 'No expenses recorded yet'}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#8a8175]">
                  {searchQuery
                    ? `No expenses matched "${searchQuery}". Try modifying your search or date filter.`
                    : 'Start recording your daily branch expenditures to keep track of operations.'}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17140f] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#f4b942]" />
                    <span>Record First Expense</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#f1ede4] bg-[#faf8f4] text-[#8a8175] uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-6">#</th>
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

                      return (
                        <tr
                          key={expense.id || idx}
                          className="transition hover:bg-[#faf8f4]/60"
                        >
                          <td className="py-4 px-6 text-[#a39a8c] font-medium">{idx + 1}</td>
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
                                {dateRecorded ? formatDateTime(dateRecorded) : 'Today'}
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

      {/* Create Expense Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#17140f]/60 backdrop-blur-sm transition-opacity"
            onClick={() => !submitting && setIsModalOpen(false)}
          />

          {/* Modal Card */}
          <div
            className="ba-pop relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl"
            style={{
              background: '#ffffff',
              border: '1px solid #e3ddd0',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#f1ede4]">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: '#f8eae5', color: '#b24a3b' }}
                >
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900" style={serif}>
                    Add Branch Expense
                  </h3>
                  <p className="text-xs text-[#8a8175]">
                    Record a new expenditure for your branch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-[#f1ede4] hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="mt-5 space-y-4">
              {/* Item Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Item Description <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder="e.g. Office stationery, High-speed Internet, Classroom AC repair"
                    value={formItem}
                    onChange={(e) => setFormItem(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-3 px-4 text-xs font-medium text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-2 focus:ring-[#9c6b2e]/20 disabled:opacity-50"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#a39a8c]">
                  Detailed name or reason for the expense (1-255 characters).
                </p>
              </div>

              {/* Cost Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cost / Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9c6b2e]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-3 pl-9 pr-4 text-xs font-bold text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-2 focus:ring-[#9c6b2e]/20 disabled:opacity-50 tabular-nums"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#a39a8c]">
                  Exact expenditure amount in Indian Rupees (min ₹0.01).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#f1ede4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-[#f1ede4] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#17140f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#f4b942]" />
                      <span>Saving Expense...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-[#f4b942]" />
                      <span>Save Expense</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
