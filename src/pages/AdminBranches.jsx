import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, CheckCircle2, Edit3, GraduationCap, KeyRound, Loader2, LogOut, Mail, MapPin, Menu, Phone, RefreshCw, ShieldAlert, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { createBranchApi, deleteBranchApi, getBranchesApi, getStoredBranches, removeStoredBranch, storeBranch, storeBranches, updateBranchApi } from '../services/adminbranches';

const EMPTY_BRANCH = { name: '', location: '', phone: '', email: '' };

const AdminBranches = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY_BRANCH);
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBranches = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const data = await getBranchesApi(token);
      setBranches(storeBranches(data));
    } catch (err) {
      const cachedBranches = getStoredBranches();
      setBranches(cachedBranches);
      setError(cachedBranches.length ? `${err.message} Showing cached branches.` : err.message || 'Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [token]);

  const handleLogout = () => {
    logout({ redirectTo: '/super-admin/login' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const branchData = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
      const savedBranch = editingBranch
        ? await updateBranchApi(editingBranch.id, branchData, token)
        : await createBranchApi(branchData, token);
      setBranches(storeBranch(savedBranch));
      setForm(EMPTY_BRANCH);
      setEditingBranch(null);
      setSuccess(editingBranch ? `${savedBranch.name} branch updated successfully.` : `${savedBranch.name} branch created successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (branch) => {
    setError('');
    setSuccess('');
    setEditingBranch(branch);
    setForm({ name: branch.name || '', location: branch.location || '', phone: branch.phone || '', email: branch.email || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingBranch(null);
    setForm(EMPTY_BRANCH);
  };

  const handleDelete = async (branch) => {
    if (!token || !window.confirm(`Delete ${branch.name}? This cannot be undone.`)) return;

    try {
      setDeletingId(branch.id);
      setError('');
      setSuccess('');
      await deleteBranchApi(branch.id, token);
      setBranches(removeStoredBranch(branch.id));
      if (editingBranch?.id === branch.id) cancelEditing();
      setSuccess(`${branch.name} branch deleted successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to delete branch.');
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400';

  return (
    <div className="admin-branches-page min-h-screen bg-slate-50 text-slate-900 md:flex">
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
        activePage="branches"
      />
      <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-2xs sm:px-8"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">Super admin management</p><h1 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">Branches</h1></div><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-extrabold text-slate-900">{user?.name || 'Administrator'}</span><span className="block text-[10px] font-semibold text-slate-500">Super Administrator</span></span><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-cyan-300">{user?.name?.charAt(0).toUpperCase() || 'A'}</div></div></header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-5 py-7 sm:px-8 lg:py-9">{(error || success) && <div className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}><div className="flex items-center gap-3">{error ? <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}<span>{error || success}</span></div><button type="button" onClick={() => { setError(''); setSuccess(''); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,620px)_minmax(220px,1fr)]"><form onSubmit={handleSubmit} className="rounded-[2rem] border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: '#e3ddd0' }}><div className="mb-6 flex items-center gap-4 border-b pb-5" style={{ borderColor: '#f1ede4' }}><div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: '#faf8f4', color: '#9c6b2e' }}>{editingBranch ? <Edit3 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}</div><div><p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: '#8a8175' }}>Branch locations</p><h2 className="mt-1 text-xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>{editingBranch ? 'Edit branch' : 'Create a branch'}</h2></div></div><div className="space-y-4"><div><label htmlFor="branch-name" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Branch name</label><input id="branch-name" name="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Aurumfx Mumbai" /></div><div><label htmlFor="branch-location" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Location</label><input id="branch-location" name="location" required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={inputClass} placeholder="Andheri West" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="branch-phone" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Phone</label><input id="branch-phone" name="phone" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} placeholder="9876543210" /></div><div><label htmlFor="branch-email" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Email</label><input id="branch-email" name="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} placeholder="branch@example.com" /></div></div></div><div className="mt-6 flex gap-3"><button type="submit" disabled={submitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60" style={{ background: '#17140f', color: '#f4b942' }}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingBranch ? <Edit3 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}{submitting ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}</button>{editingBranch && <button type="button" onClick={cancelEditing} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50">Cancel</button>}</div></form><aside className="rounded-[2rem] p-6 shadow-sm sm:p-7" style={{ background: '#faf8f4', border: '1px solid #e3ddd0' }}><div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: '#ffffff', color: '#9c6b2e', border: '1px solid #e3ddd0' }}><Users className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>Next step</h3><p className="mt-2 text-sm leading-relaxed" style={{ color: '#8a8175' }}>After creating a branch, open Branch Admins to assign login access to that location.</p><button type="button" onClick={() => navigate('/admin/branch-admins')} className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider transition hover:opacity-80" style={{ color: '#9c6b2e' }}>Create branch admin <Users className="h-4 w-4" /></button></aside></div>
          <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: '#e3ddd0' }}><div className="mb-5 flex items-center justify-between border-b pb-5" style={{ borderColor: '#f1ede4' }}><div><p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#8a8175' }}>Available locations</p><h2 className="mt-1 text-xl font-bold" style={{ color: '#17140f', fontFamily: "'Fraunces', serif" }}>Branches ({branches.length})</h2></div><button type="button" onClick={fetchBranches} disabled={loading} className="rounded-xl p-2 transition hover:bg-[#faf8f4] disabled:opacity-50" style={{ color: '#8a8175' }} aria-label="Refresh branches"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button></div>{loading ? <div className="flex items-center gap-2 py-8 text-sm font-semibold" style={{ color: '#8a8175' }}><Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9c6b2e' }} /> Loading branches...</div> : branches.length === 0 ? <p className="text-sm font-semibold" style={{ color: '#8a8175' }}>No branches created yet.</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{branches.map((branch) => { const isInactive = String(branch.status || '').toLowerCase() === 'inactive' || branch.is_active === false; return <article key={branch.id} className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#8a8175' }}>Branch #{branch.id}</p><h3 className="mt-1 font-bold" style={{ color: '#17140f' }}>{branch.name}</h3></div><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase`} style={{ background: isInactive ? '#fef2f2' : '#ecfdf5', color: isInactive ? '#991b1b' : '#065f46' }}>{isInactive ? 'Inactive' : branch.status || 'Active'}</span></div><div className="mt-4 space-y-2 text-xs font-semibold" style={{ color: '#5b5346' }}><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />{branch.location}</p><p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" style={{ color: '#9c6b2e' }} />{branch.phone}</p><p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" style={{ color: '#9c6b2e' }} />{branch.email}</p></div><div className="mt-5 flex gap-2 border-t pt-4" style={{ borderColor: '#f1ede4' }}><button type="button" onClick={() => startEditing(branch)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition hover:bg-[#faf8f4]" style={{ borderColor: '#e3ddd0', color: '#17140f' }}><Edit3 className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => handleDelete(branch)} disabled={deletingId !== null} className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-bold transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: '#fecaca', color: '#dc2626', background: '#ffffff' }} aria-label={`Delete ${branch.name}`}>{deletingId === branch.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button></div></article>; })}</div>}</section>
        </main>
      </div>
    </div>
  );
};

export default AdminBranches;
