import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Calculator,
  HelpCircle,
  IndianRupee,
  Info,
  Loader2,
  Menu,
  Percent,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getSuperAdminGstSettingsApi,
  updateSuperAdminGstSettingsApi,
  calculateGstBreakdown,
} from '../services/gst';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('sa-gst-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sa-gst-fonts';
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
.sa-rise { opacity: 0; animation: sa-rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
.sa-card { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.sa-card:hover {
  border-color: #d9cdb5;
  box-shadow: 0 10px 30px -18px rgba(23,20,15,.2);
}
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const SuperAdminGstSettings = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Loaded server settings
  const [currentSettings, setCurrentSettings] = useState({
    cgst_percent: 9,
    sgst_percent: 9,
    total_gst_percent: 18,
  });

  // Form values
  const [cgstInput, setCgstInput] = useState('9');
  const [sgstInput, setSgstInput] = useState('9');

  // Interactive calculator sample base price
  const [sampleBasePrice, setSampleBasePrice] = useState('20000');

  const loadSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await getSuperAdminGstSettingsApi(token);
      if (data) {
        setCurrentSettings(data);
        setCgstInput(String(data.cgst_percent ?? 9));
        setSgstInput(String(data.sgst_percent ?? 9));
      }
    } catch (err) {
      setError(err.message || 'Failed to load GST settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [token]);

  // Live simulation breakdown on sample base price
  const sampleBreakdown = calculateGstBreakdown(
    sampleBasePrice,
    Number(cgstInput) || 0,
    Number(sgstInput) || 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cgstVal = Number(cgstInput);
    const sgstVal = Number(sgstInput);

    if (Number.isNaN(cgstVal) || cgstVal < 0 || cgstVal > 100) {
      setError('CGST percentage must be a number between 0 and 100.');
      return;
    }

    if (Number.isNaN(sgstVal) || sgstVal < 0 || sgstVal > 100) {
      setError('SGST percentage must be a number between 0 and 100.');
      return;
    }

    try {
      setSaving(true);
      const res = await updateSuperAdminGstSettingsApi(
        {
          cgst_percent: cgstVal,
          sgst_percent: sgstVal,
        },
        token
      );

      setCurrentSettings(res);
      setCgstInput(String(res.cgst_percent));
      setSgstInput(String(res.sgst_percent));
      setSuccess(`GST settings successfully updated to ${res.total_gst_percent}% (CGST ${res.cgst_percent}% + SGST ${res.sgst_percent}%).`);
    } catch (err) {
      setError(err.message || 'Failed to update GST settings.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (cgst, sgst) => {
    setCgstInput(String(cgst));
    setSgstInput(String(sgst));
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen md:flex" style={{ ...sans, background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>

      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="gst-settings"
      />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-20 hidden md:flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
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
                Finance &amp; Tax Management
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                GST Settings
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3ddd0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#f0ebe1] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] font-semibold text-slate-400">Head Administrator</p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: '#17140f', color: '#f4b942' }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8 sm:px-10">
          {/* Notifications */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl p-4 text-sm font-medium"
              style={{ background: '#f8eae5', color: '#7c3324', border: '1px solid #eccec4' }}
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[#c25438]" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl p-4 text-sm font-medium"
              style={{ background: '#eef2ea', color: '#39533a', border: '1px solid #d3e0cd' }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-[#39533a]" />
              <div className="flex-1">{success}</div>
            </div>
          )}

          {/* Active Rates Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 sa-rise" style={{ animationDelay: '50ms' }}>
            <div
              className="rounded-2xl p-6 sa-card"
              style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Central GST</span>
                <span className="inline-flex items-center rounded-md bg-[#f7efe0] px-2 py-0.5 text-[11px] font-semibold text-[#8a6d43]">
                  CGST
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900" style={serif}>
                  {loading ? '—' : `${currentSettings.cgst_percent}%`}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Applied to all taxable course registrations
              </p>
            </div>

            <div
              className="rounded-2xl p-6 sa-card"
              style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">State GST</span>
                <span className="inline-flex items-center rounded-md bg-[#f7efe0] px-2 py-0.5 text-[11px] font-semibold text-[#8a6d43]">
                  SGST
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900" style={serif}>
                  {loading ? '—' : `${currentSettings.sgst_percent}%`}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                State component for intra-state services
              </p>
            </div>

            <div
              className="rounded-2xl p-6 sa-card"
              style={{ background: '#fcfaf6', border: '2px solid #e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a8175]">Total Combined GST</span>
                <span className="inline-flex items-center rounded-md bg-[#eef2ea] px-2 py-0.5 text-[11px] font-semibold text-[#39533a]">
                  Active Rate
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#7a531f]" style={serif}>
                  {loading ? '—' : `${currentSettings.total_gst_percent}%`}
                </span>
                <span className="text-xs font-semibold text-slate-400">Total Tax</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                CGST ({currentSettings.cgst_percent}%) + SGST ({currentSettings.sgst_percent}%)
              </p>
            </div>
          </section>

          {/* Main Form and Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start sa-rise" style={{ animationDelay: '100ms' }}>
            {/* Left: Settings Edit Form */}
            <div className="lg:col-span-7 space-y-6">
              <div
                className="overflow-hidden rounded-2xl p-6 sm:p-8"
                style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: '#f7efe0', color: '#9c6b2e' }}
                  >
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900" style={serif}>
                      Update GST Rates
                    </h2>
                    <p className="text-xs text-slate-500">
                      Changes apply to all future course creations and updates across all branches.
                    </p>
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div className="mb-6 rounded-xl p-3.5 bg-[#faf8f4] border border-[#efe9dd]">
                  <span className="text-xs font-semibold text-[#8a8175] block mb-2">
                    Common Rate Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset(9, 9)}
                      className="rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f7efe0] hover:text-[#7a531f] transition"
                    >
                      18% Standard (9% CGST + 9% SGST)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(6, 6)}
                      className="rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f7efe0] hover:text-[#7a531f] transition"
                    >
                      12% Reduced (6% + 6%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(2.5, 2.5)}
                      className="rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f7efe0] hover:text-[#7a531f] transition"
                    >
                      5% Concession (2.5% + 2.5%)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(0, 0)}
                      className="rounded-lg border border-[#e3ddd0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f7efe0] hover:text-[#7a531f] transition"
                    >
                      0% Exempt (0% + 0%)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        CGST Rate (%) *
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          value={cgstInput}
                          onChange={(e) => {
                            setCgstInput(e.target.value);
                            setError('');
                          }}
                          className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-2 focus:ring-[#9c6b2e]/20"
                          placeholder="9"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        Central Goods and Services Tax
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        SGST Rate (%) *
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          value={sgstInput}
                          onChange={(e) => {
                            setSgstInput(e.target.value);
                            setError('');
                          }}
                          className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#9c6b2e] focus:bg-white focus:ring-2 focus:ring-[#9c6b2e]/20"
                          placeholder="9"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        State Goods and Services Tax
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 bg-[#fcfaf6] border border-[#ead9bc] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#8a6d43]">Resulting Combined GST Rate</p>
                      <p className="text-xl font-extrabold text-[#7a531f] mt-0.5">
                        {((Number(cgstInput) || 0) + (Number(sgstInput) || 0)).toFixed(2)}%
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 max-w-[200px] text-right">
                      Calculated automatically on course base fees
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#30291f] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: '#17140f' }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#f4b942]" />
                        <span>Saving GST Settings…</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 text-[#f4b942]" />
                        <span>Save &amp; Apply GST Rates</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Informational Card */}
              <div
                className="rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
              >
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-[#9c6b2e]" /> How Course GST Works
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#9c6b2e]">•</span>
                    <span><strong>Tax-Inclusive Course Pricing:</strong> When creating or editing courses in Super Admin or Branch Admin, the <code>price</code> field represents the final GST-inclusive fee (e.g. ₹20,000).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#9c6b2e]">•</span>
                    <span><strong>Automated Tax Breakdown:</strong> Base tuition (excluding tax) and GST (CGST + SGST) are automatically computed from the total fee (e.g. ₹20,000 includes ₹16,949.15 base + ₹3,050.85 GST).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#9c6b2e]">•</span>
                    <span><strong>Installment Schedules:</strong> When a course has installment terms, all term amounts combined must match the <strong>final course fee (₹20,000)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#9c6b2e]">•</span>
                    <span><strong>Student Receipts:</strong> The transparent breakdown of Base Price, CGST, and SGST is displayed to students and on payment receipts.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Live Interactive Simulator */}
            <div className="lg:col-span-5 space-y-6">
              <div
                className="rounded-2xl p-6 sm:p-7"
                style={{ background: '#ffffff', border: '1px solid #e3ddd0' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: '#f7efe0', color: '#9c6b2e' }}
                  >
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900" style={serif}>
                      Live Pricing Simulator
                    </h3>
                    <p className="text-xs text-slate-500">Test how rates affect a course price</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Sample Course Fee (Incl. GST) (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={sampleBasePrice}
                        onChange={(e) => setSampleBasePrice(e.target.value)}
                        className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] pl-8 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-[#9c6b2e]"
                        placeholder="30000"
                      />
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="rounded-xl border border-[#efe9dd] overflow-hidden">
                    <dl className="divide-y divide-[#efe9dd] text-xs">
                      <div className="flex justify-between p-3 bg-white">
                        <dt className="text-slate-600 font-medium">Course Fee (Excl. GST)</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatCurrency(sampleBreakdown.basePrice)}
                        </dd>
                      </div>
                      <div className="flex justify-between p-3 bg-[#faf8f4]">
                        <dt className="text-slate-600 font-medium">
                          CGST ({sampleBreakdown.cgstPercent}%)
                        </dt>
                        <dd className="font-semibold text-[#8a6d43]">
                          + {formatCurrency(sampleBreakdown.cgstAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between p-3 bg-[#faf8f4]">
                        <dt className="text-slate-600 font-medium">
                          SGST ({sampleBreakdown.sgstPercent}%)
                        </dt>
                        <dd className="font-semibold text-[#8a6d43]">
                          + {formatCurrency(sampleBreakdown.sgstAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between p-3 bg-[#f7efe0]">
                        <dt className="text-[#7a531f] font-semibold">
                          Total Tax ({sampleBreakdown.totalGstPercent}%)
                        </dt>
                        <dd className="font-bold text-[#7a531f]">
                          {formatCurrency(sampleBreakdown.totalGstAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between p-3.5 bg-[#fcfaf6] border-t-2 border-[#ead9bc]">
                        <dt className="text-sm font-extrabold text-slate-900">
                          Final Fee (GST-inclusive)
                        </dt>
                        <dd className="text-base font-extrabold text-[#7a531f]">
                          {formatCurrency(sampleBreakdown.totalAmount)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl p-3 bg-[#f1ede4] text-[11px] text-[#7a531f] flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Students will be charged {formatCurrency(sampleBreakdown.totalAmount)}. Installment schedules for this course must equal this total.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminGstSettings;

