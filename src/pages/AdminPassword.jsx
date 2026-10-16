import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { changeAdminPasswordApi } from '../services/adminpassword';

const AdminPassword = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = () => {
    logout({ redirectTo: '/super-admin/login' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await changeAdminPasswordApi(
        { current_password: currentPassword, new_password: newPassword },
        token
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Admin password changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to change admin password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordField = (label, value, setValue, visible, setVisible, id) => (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
        activePage="change-password"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-2xs sm:px-8">
          <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">Account security</p><h1 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">Change Password</h1></div>
          <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-extrabold text-slate-900">{user?.name || 'Administrator'}</span><span className="block text-[10px] font-semibold text-slate-500">Administrator</span></span><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-amber-400">{user?.name?.charAt(0).toUpperCase() || 'A'}</div></div>
        </header>

        <main className="flex w-full max-w-6xl flex-1 flex-col px-5 py-7 sm:px-8 lg:py-12">
          {(error || success) && (
            <div className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
              <div className="flex items-center gap-3">{error ? <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}<span>{error || success}</span></div>
              <button type="button" onClick={() => { setError(''); setSuccess(''); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,620px)_minmax(220px,1fr)]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-amber-200 bg-white p-6 shadow-lg shadow-amber-950/5 sm:p-8">
            <div className="mb-7 flex items-start gap-4 border-b border-slate-100 pb-6"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><KeyRound className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Secure your account</p><h2 className="mt-1 text-xl font-black text-slate-950">Update admin password</h2><p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">Enter your current password and choose a new password for the admin account.</p></div></div>
            <div className="space-y-5">
              {passwordField('Current password', currentPassword, setCurrentPassword, showCurrentPassword, setShowCurrentPassword, 'current-password')}
              {passwordField('New password', newPassword, setNewPassword, showNewPassword, setShowNewPassword, 'new-password')}
              {passwordField('Confirm new password', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'confirm-password')}
            </div>
            <div className="mt-7 flex justify-end border-t border-slate-100 pt-5"><button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"><KeyRound className="h-4 w-4 text-amber-400" />{isSubmitting ? 'Updating...' : 'Change Password'}</button></div>
          </form>

          <aside className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg shadow-slate-950/10 sm:p-7">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[18px] border-amber-400/20" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950"><ShieldCheck className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-black">Keep your account secure</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">A strong password helps protect announcements and admin access.</p>
              <ul className="mt-6 space-y-4 text-sm font-semibold text-slate-200">
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />Use at least 6 characters.</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />Avoid passwords used on other accounts.</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />Never share your admin password.</li>
              </ul>
            </div>
          </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPassword;
