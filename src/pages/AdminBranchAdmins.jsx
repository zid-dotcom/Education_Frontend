import React, { useEffect, useState } from 'react';
import { Bell, Building2, ChevronDown, Edit3, Eye, EyeOff, GraduationCap, KeyRound, Loader2, LogOut, Mail, MapPin, Menu, Phone, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { createBranchAdminApi, deleteBranchAdminApi, getBranchAdminsApi, getBranchesApi, getStoredBranches, storeBranches, updateBranchAdminApi } from '../services/adminbranches';

const EMPTY_ADMIN = { branch_id: '', password: '', name: '', email: '', phone: '' };

export default function AdminBranchAdmins() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY_ADMIN);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getBranchesApi(token).then((data) => { setBranches(storeBranches(data)); }).catch(() => setBranches(getStoredBranches())),
      getBranchAdminsApi(token).then(setAdmins).catch((err) => setError(err.message || 'Failed to load branch admins.')),
    ]).finally(() => setLoading(false));
  }, [token]);

  const branchName = (id) => branches.find((branch) => String(branch.id) === String(id))?.name || 'Unassigned branch';
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters long.');
    try {
      setSaving(true);
      const payload = {
        branch_id: Number(form.branch_id),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      const saved = editing ? await updateBranchAdminApi(editing.id, payload, token) : await createBranchAdminApi(payload, token);
      setAdmins((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setForm({ ...EMPTY_ADMIN, branch_id: form.branch_id });
      setEditing(null);
      setMessage(`${saved.name} ${editing ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to save branch admin.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (admin) => {
    setEditing(admin);
    setForm({
      branch_id: String(admin.branch_id),
      password: '',
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (admin) => {
    if (!window.confirm(`Delete ${admin.name}? This cannot be undone.`)) return;
    try {
      setDeleting(admin.id);
      await deleteBranchAdminApi(admin.id, token);
      setAdmins((current) => current.filter((item) => item.id !== admin.id));
      setMessage(`${admin.name} deleted successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to delete branch admin.');
    } finally {
      setDeleting(null);
    }
  };

  const input = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400';

  return (
    <div className="admin-branch-admins-page min-h-screen bg-slate-50 text-slate-900 md:flex">
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="branch-admins"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Super admin management</p>
              <h1 className="mt-1 text-xl font-black">Branch Admins</h1>
              <p className="mt-1 text-sm text-slate-500">Manage login access for every branch.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-extrabold text-slate-900">{user?.name || 'Admin'}</p>
                <p className="text-[10px] font-semibold text-slate-500">Super Administrator</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-black text-amber-400">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-7 sm:px-8 lg:py-10">
          {(error || message) && (
            <div className={`rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
              {error || message}
            </div>
          )}

          <form onSubmit={submit} className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: '#e3ddd0' }}>
            <div className="mb-6 flex items-center gap-4 border-b pb-5" style={{ borderColor: '#f1ede4' }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: '#faf8f4', color: '#9c6b2e' }}>
                {editing ? <Edit3 /> : <UserPlus />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#8a8175' }}>Branch access</p>
                <h2 className="mt-1 text-xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>
                  {editing ? 'Edit branch admin' : 'Create branch admin'}
                </h2>
              </div>
            </div>

            <fieldset disabled={!branches.length || saving} className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-extrabold uppercase tracking-wider">
                Branch
                <span className="relative mt-2 block">
                  <select name="branch_id" required value={form.branch_id} onChange={change} className={`${input} admin-branch-select appearance-none pr-11`}>
                    <option value="" disabled>Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} {branch.location ? `- ${branch.location}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </span>
              </label>

              <label className="text-xs font-extrabold uppercase tracking-wider">
                Name
                <input name="name" required value={form.name} onChange={change} className={`${input} mt-2`} placeholder="Branch administrator" />
              </label>

              <label className="text-xs font-extrabold uppercase tracking-wider">
                Email
                <input name="email" type="email" required value={form.email} onChange={change} className={`${input} mt-2`} placeholder="admin@example.com" />
              </label>

              <label className="text-xs font-extrabold uppercase tracking-wider">
                Phone
                <input name="phone" required value={form.phone} onChange={change} className={`${input} mt-2`} placeholder="9876543210" />
              </label>

              <label className="text-xs font-extrabold uppercase tracking-wider sm:col-span-2">
                {editing ? 'New password' : 'Password'}
                <span className="relative mt-2 block">
                  <input
                    name="password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={change}
                    className={`${input} pr-12`}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </span>
              </label>
            </fieldset>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={!branches.length || saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider disabled:opacity-50 transition hover:bg-black"
                style={{ background: '#17140f', color: '#f4b942' }}
              >
                {saving ? <Loader2 className="animate-spin" /> : editing ? <Edit3 /> : <UserPlus />}
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Branch Admin'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setForm(EMPTY_ADMIN); }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: '#e3ddd0' }}>
            <div className="mb-5 flex items-center justify-between border-b pb-5" style={{ borderColor: '#f1ede4' }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#8a8175' }}>Access directory</p>
                <h2 className="mt-1 text-xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>
                  Branch admins ({admins.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  getBranchAdminsApi(token).then(setAdmins).catch((err) => setError(err.message)).finally(() => setLoading(false));
                }}
                className="rounded-xl p-2 transition hover:bg-[#faf8f4]"
                style={{ color: '#8a8175' }}
                aria-label="Refresh branch admins"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-sm font-semibold" style={{ color: '#8a8175' }}>
                <Loader2 className="mr-2 inline animate-spin" />Loading branch admins...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {admins.map((admin) => (
                  <article key={admin.id} className="rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold" style={{ color: '#17140f' }}>{admin.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8a8175' }}>{admin.role || 'Branch admin'}</p>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[10px] font-black uppercase" style={{ background: admin.status === 'Active' ? '#ecfdf5' : '#fef2f2', color: admin.status === 'Active' ? '#065f46' : '#991b1b' }}>
                        {admin.status || 'Active'}
                      </span>
                    </div>
                    <div className="mt-5 space-y-2 text-xs font-semibold" style={{ color: '#5b5346' }}>
                      <p><KeyRound className="mr-2 inline h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />Admin ID: {admin.branch_admin_id}</p>
                      <p><MapPin className="mr-2 inline h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />{branchName(admin.branch_id)}</p>
                      <p><Mail className="mr-2 inline h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />{admin.email}</p>
                      <p><Phone className="mr-2 inline h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />{admin.phone}</p>
                    </div>
                    <div className="mt-5 flex gap-2 border-t pt-4" style={{ borderColor: '#f1ede4' }}>
                      <button type="button" onClick={() => edit(admin)} className="flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition hover:bg-[#faf8f4]" style={{ borderColor: '#e3ddd0', color: '#17140f' }}>
                        <Edit3 className="mr-1 inline h-3.5 w-3.5" />Edit
                      </button>
                      <button type="button" onClick={() => remove(admin)} disabled={deleting !== null} className="rounded-xl border px-3 py-2 transition hover:bg-[#fef2f2]" style={{ borderColor: '#fecaca', color: '#dc2626', background: '#ffffff' }} aria-label={`Delete ${admin.name}`}>
                        {deleting === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
