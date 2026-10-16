import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Compass,
  Info,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getBranchesApi } from '../services/adminbranches';
import {
  getBranchSidebarNavigationApi,
  updateBranchSidebarNavigationApi,
  extractNavLinks,
} from '../services/sidebarnavigation';
import {
  BRANCH_NAV_CONFIG,
  CANONICAL_BACKEND_KEYS,
  getDefaultNavSettings,
  normalizeNavSettings,
  sanitizeNavLinksForBackend,
} from '../constants/branchNavigation';

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const SuperAdminBranchNavigation = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    return localStorage.getItem('superAdminNavSelectedBranchId') || '';
  });
  const [navSettings, setNavSettings] = useState(() => getDefaultNavSettings());
  const [savedSettings, setSavedSettings] = useState(() => getDefaultNavSettings());

  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch branches on mount
  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        setError('');
        const branchList = await getBranchesApi(token);
        const validBranches = Array.isArray(branchList) ? branchList : [];
        if (!isMounted) return;
        setBranches(validBranches);
        if (validBranches.length > 0) {
          setSelectedBranchId((prev) => {
            const exists = validBranches.some((b) => String(b.id) === String(prev));
            const activeId = exists ? String(prev) : String(validBranches[0].id);
            localStorage.setItem('superAdminNavSelectedBranchId', activeId);
            return activeId;
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch branches.');
        }
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    };

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch settings whenever selectedBranchId changes
  const fetchBranchNavSettings = async (branchId) => {
    if (!token || !branchId) return;

    try {
      setLoadingSettings(true);
      setError('');
      const data = await getBranchSidebarNavigationApi(branchId, token);
      const normalized = normalizeNavSettings(data);

      setNavSettings(normalized);
      setSavedSettings(normalized);
    } catch (err) {
      setError(err.message || 'Failed to fetch navigation settings for branch.');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchNavSettings(selectedBranchId);
    }
  }, [selectedBranchId, token]);

  const selectedBranch = useMemo(() => {
    return branches.find((b) => String(b.id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  // Check if there are unsaved changes
  const isDirty = useMemo(() => {
    return CANONICAL_BACKEND_KEYS.some((key) => navSettings[key] !== savedSettings[key]);
  }, [navSettings, savedSettings]);

  // Count active items
  const activeCount = useMemo(() => {
    return CANONICAL_BACKEND_KEYS.filter((key) => navSettings[key] !== false).length;
  }, [navSettings]);

  const handleToggle = (backendKey) => {
    setNavSettings((prev) => ({
      ...prev,
      [backendKey]: prev[backendKey] === false ? true : false,
    }));
  };

  const handleEnableAll = () => {
    const allEnabled = {};
    CANONICAL_BACKEND_KEYS.forEach((key) => {
      allEnabled[key] = true;
    });
    setNavSettings(allEnabled);
  };

  const handleDisableAll = () => {
    const allDisabled = {};
    CANONICAL_BACKEND_KEYS.forEach((key) => {
      allDisabled[key] = false;
    });
    setNavSettings(allDisabled);
  };

  const handleReset = () => {
    setNavSettings({ ...savedSettings });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!token || !selectedBranchId) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // 1. Send all 14 canonical keys in PUT request
      const payload = sanitizeNavLinksForBackend(navSettings);
      await updateBranchSidebarNavigationApi(selectedBranchId, payload, token);

      // 2. Fetch the saved settings using the existing Super Admin GET API
      const freshData = await getBranchSidebarNavigationApi(selectedBranchId, token);
      const updated = normalizeNavSettings(freshData);

      // 3. Update the UI based on the GET response
      setSavedSettings(updated);
      setNavSettings(updated);
      setSuccess(`Sidebar navigation settings for "${selectedBranch?.name || `Branch #${selectedBranchId}`}" updated successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to save navigation settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex" style={sans}>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
        activePage="navigation-settings"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-2xs sm:px-8">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9c6b2e]">
              Branch Access Control
            </p>
            <h1 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl" style={serif}>
              Branch Navigation Settings
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-xs font-extrabold text-slate-900">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] font-semibold text-slate-500">
                Super Administrator
              </span>
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-[#f4b942]">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-5 py-7 sm:px-8 lg:py-9">
          {/* Notifications */}
          {(error || success) && (
            <div
              className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition ${
                error
                  ? 'border-rose-300 bg-rose-50 text-rose-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {error ? (
                  <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                )}
                <span>{error || success}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                }}
                className="rounded-lg p-1 text-slate-500 hover:bg-black/5"
                aria-label="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Branch Selector Bar */}
          <section
            className="rounded-[2rem] border bg-white p-6 shadow-sm sm:p-7"
            style={{ borderColor: '#e3ddd0' }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Branch Selector */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: '#faf8f4', color: '#9c6b2e', border: '1px solid #e3ddd0' }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <label
                      htmlFor="branch-select"
                      className="text-[10px] font-black uppercase tracking-[0.18em]"
                      style={{ color: '#8a8175' }}
                    >
                      Target Branch
                    </label>
                    <h2
                      className="mt-0.5 text-xl font-bold"
                      style={{ color: '#17140f', ...serif }}
                    >
                      Select Branch to Configure
                    </h2>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 sm:flex-nowrap">
                  <div className="relative w-full max-w-md">
                    <select
                      id="branch-select"
                      value={selectedBranchId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBranchId(val);
                        localStorage.setItem('superAdminNavSelectedBranchId', val);
                      }}
                      disabled={loadingBranches || branches.length === 0}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-2 focus:ring-[#9c6b2e]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {branches.length === 0 && (
                        <option value="">
                          {loadingBranches ? 'Loading branches...' : 'No branches found'}
                        </option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.location || `ID #${b.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedBranchId) fetchBranchNavSettings(selectedBranchId);
                    }}
                    disabled={loadingSettings || !selectedBranchId}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    title="Reload current branch settings"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loadingSettings ? 'animate-spin text-[#9c6b2e]' : ''}`}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t pt-5 lg:border-t-0 lg:pt-0">
                <div className="mr-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold sm:flex" style={{ background: '#faf8f4', color: '#5b5346' }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: isDirty ? '#f59e0b' : '#10b981' }} />
                  {isDirty ? (
                    <span className="text-amber-700">Unsaved changes</span>
                  ) : (
                    <span>All changes saved</span>
                  )}
                  <span className="ml-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-slate-500 border border-slate-200">
                    {activeCount} / {CANONICAL_BACKEND_KEYS.length} enabled
                  </span>
                </div>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={handleEnableAll}
                    disabled={loadingSettings}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-initial"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableAll}
                    disabled={loadingSettings}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-initial"
                  >
                    Disable All
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loadingSettings || !selectedBranchId}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    style={{ background: '#17140f', color: '#f4b942' }}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#f4b942]" />
                    ) : (
                      <Save className="h-4 w-4 text-[#f4b942]" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Branch info pill if branch selected */}
            {selectedBranch && (
              <div
                className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border p-4 text-xs font-medium"
                style={{ background: '#faf8f4', borderColor: '#f1ede4' }}
              >
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#9c6b2e]">
                    #{selectedBranch.id}
                  </span>
                  <span>{selectedBranch.name}</span>
                </div>
                {selectedBranch.location && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-[#9c6b2e]" />
                    {selectedBranch.location}
                  </span>
                )}
                {selectedBranch.phone && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-[#9c6b2e]" />
                    {selectedBranch.phone}
                  </span>
                )}
                <div className="ml-auto text-[11px] font-semibold text-slate-500">
                  Branch Admin for this branch will only see items toggled ON below.
                </div>
              </div>
            )}
          </section>

          {/* Navigation Items by Group */}
          {loadingSettings ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border bg-white py-16 text-sm font-semibold text-slate-500" style={{ borderColor: '#e3ddd0' }}>
              <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e]" />
              <p>Loading navigation settings for {selectedBranch?.name || 'branch'}...</p>
            </div>
          ) : branches.length === 0 && !loadingBranches ? (
            <div className="rounded-3xl border bg-white p-12 text-center" style={{ borderColor: '#e3ddd0' }}>
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900" style={serif}>
                No Branches Found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                You must create at least one branch before configuring navigation menus.
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin/branches')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                style={{ background: '#17140f' }}
              >
                Go to Branches Management
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {BRANCH_NAV_CONFIG.map((group) => {
                const groupItems = group.items;
                const groupActiveCount = groupItems.filter((i) => navSettings[i.backendKey] !== false).length;

                return (
                  <section
                    key={group.group}
                    className="overflow-hidden rounded-3xl border bg-white shadow-sm transition"
                    style={{ borderColor: '#e3ddd0' }}
                  >
                    {/* Group Header */}
                    <div
                      className="flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                      style={{ background: '#faf8f4', borderColor: '#f1ede4' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-lg font-bold"
                            style={{ color: '#17140f', ...serif }}
                          >
                            {group.group}
                          </h3>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={{
                              background: groupActiveCount > 0 ? '#ecfdf5' : '#f1f5f9',
                              color: groupActiveCount > 0 ? '#065f46' : '#64748b',
                            }}
                          >
                            {groupActiveCount} / {groupItems.length} active
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {group.description}
                        </p>
                      </div>

                      {/* Quick Group Action */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNavSettings((prev) => {
                              const updated = { ...prev };
                              groupItems.forEach((i) => {
                                updated[i.backendKey] = true;
                              });
                              return updated;
                            });
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition hover:bg-white cursor-pointer ${
                            groupActiveCount > 0
                              ? 'text-[#9c6b2e]'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Enable Group
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNavSettings((prev) => {
                              const updated = { ...prev };
                              groupItems.forEach((i) => {
                                updated[i.backendKey] = false;
                              });
                              return updated;
                            });
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition hover:bg-white cursor-pointer ${
                            groupActiveCount === 0
                              ? 'text-[#9c6b2e]'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Disable Group
                        </button>
                      </div>
                    </div>

                    {/* Group Items Grid */}
                    <div className="grid divide-y divide-slate-100 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:divide-y-0 lg:gap-4 lg:p-6">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const isEnabled = navSettings[item.backendKey] !== false;

                        return (
                          <div
                            key={item.backendKey}
                            onClick={() => handleToggle(item.backendKey)}
                            className={`group relative flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition hover:shadow-md ${
                              isEnabled
                                ? 'border-[#e3ddd0] bg-white hover:border-[#9c6b2e]/60'
                                : 'border-slate-200 bg-slate-50/70 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 pr-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                  isEnabled
                                    ? 'bg-[#faf8f4] text-[#9c6b2e]'
                                    : 'bg-slate-200/80 text-slate-500'
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 group-hover:text-[#9c6b2e]">
                                    {item.label}
                                  </h4>
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                      isEnabled
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {isEnabled ? 'Visible' : 'Hidden'}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch */}
                            <div className="pt-1">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isEnabled}
                                aria-label={`Toggle visibility of ${item.label}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(item.backendKey);
                                }}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 ${
                                  isEnabled ? 'bg-[#9c6b2e]' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}


        </main>
      </div>
    </div>
  );
};

export default SuperAdminBranchNavigation;
