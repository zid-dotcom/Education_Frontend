import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import branchAdminImage from '../assets/branchadmin.png';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const BranchAdminLogin = () => {
  const { branchAdminLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const noticeMsg = location.state?.message;

  const [form, setForm] = useState({ branch_admin_id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-redirect if already authenticated as branch admin
  useEffect(() => {
    if (user?.role === 'branch_admin') {
      navigate('/branch-admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.branch_admin_id.trim() || !form.password) {
      setError('Enter your Branch Admin ID and password to continue.');
      return;
    }

    try {
      setLoading(true);
      await branchAdminLogin(form.branch_admin_id.trim(), form.password);
      // Navigate immediately — no setTimeout delay needed
      navigate('/branch-admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Branch admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />
      <main className="login-page min-h-[calc(100vh-92px)] flex flex-1 flex-col lg:flex-row bg-white relative overflow-hidden">
        {/* Form: on mobile on top (order-1), on desktop on right (lg:order-2) */}
        <div className="order-1 lg:order-2 w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
          <div className="max-w-md w-full lg:max-w-lg">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Branch Administrator Portal</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Aurum FX Academy</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Sign in to your branch</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Enter the credentials provided by your super administrator.</p>
              </div>
              {noticeMsg && !error && !success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 animate-in fade-in duration-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  <span>{noticeMsg}</span>
                </div>
              )}
              {(error || success) && (
                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                  {error || success}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Branch Admin ID
                  <span className="relative mt-2 block">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="branch_admin_id"
                      type="text"
                      autoComplete="username"
                      required
                      value={form.branch_admin_id}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                      placeholder="e.g. X1FBXD"
                    />
                  </span>
                </label>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Password
                  <span className="relative mt-2 block">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-semibold outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 text-amber-400" />}
                  {loading ? 'Signing in...' : 'Sign in to branch portal'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Image: on mobile on down side (order-2) with increased size; on desktop on left (lg:order-1) */}
        <div className="order-2 lg:order-1 flex w-full lg:w-[55%] relative bg-white items-center justify-center pt-2 pb-8 px-4 sm:px-6 lg:p-0">
          <img
            src={branchAdminImage}
            alt="Aurum FX branch administration"
            className="w-full max-w-[360px] sm:max-w-md md:max-w-lg lg:max-w-none h-60 sm:h-72 md:h-80 lg:h-full lg:w-full object-contain object-center lg:pl-8 lg:scale-105"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BranchAdminLogin;
