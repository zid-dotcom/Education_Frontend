import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Edit3, Loader2, Maximize2, Plus, RefreshCw, Trash2, X, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminAnnouncementBranchesApi,
  getSuperAdminBranchAnnouncementsApi,
  createSuperAdminBranchAnnouncementApi,
  updateSuperAdminBranchAnnouncementApi,
  deleteSuperAdminBranchAnnouncementApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .2s ease both; }
`;

const EMPTY_FORM = { title: '', message: '', image: null };

const SuperAdminAnnouncements = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annLoading, setAnnLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminAnnouncementBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.branches ?? data?.data ?? []);
        setBranches(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadAnnouncements = async (branchId, branchList = branches) => {
    if (!token) return;
    setAnnLoading(true);
    setError('');

    if (branchId === 'all') {
      if (!branchList || branchList.length === 0) {
        setAnnouncements([]);
        setAnnLoading(false);
        return;
      }
      try {
        const results = await Promise.allSettled(
          branchList.map((b) => {
            const bId = b.id ?? b.branch_id;
            const bName = b.name || b.branch_name || '';
            return getSuperAdminBranchAnnouncementsApi(bId, token).then((data) => {
              const list = Array.isArray(data) ? data : (data?.announcements ?? data?.data ?? []);
              return list.map((a) => ({
                ...a,
                branch_id: a.branch_id || bId,
                branch_name: a.branch_name || bName,
              }));
            });
          })
        );
        const combined = [];
        results.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            combined.push(...res.value);
          }
        });
        setAnnouncements(combined);
      } catch (err) {
        setError(err.message || 'Failed to load announcements.');
      } finally {
        setAnnLoading(false);
      }
      return;
    }

    if (!branchId) {
      setAnnouncements([]);
      setAnnLoading(false);
      return;
    }

    const bObj = branchList.find((b) => String(b.id ?? b.branch_id) === String(branchId));
    const bName = bObj?.name || bObj?.branch_name || '';
    getSuperAdminBranchAnnouncementsApi(branchId, token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.announcements ?? data?.data ?? []);
        setAnnouncements(list.map((a) => ({
          ...a,
          branch_id: a.branch_id || branchId,
          branch_name: a.branch_name || bName,
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setAnnLoading(false));
  };

  useEffect(() => {
    if (!loading && branches.length > 0) {
      loadAnnouncements(selectedBranchId, branches);
    }
  }, [selectedBranchId, branches, loading, token]);

  const openCreate = () => {
    setEditingAnn(null);
    setForm({ ...EMPTY_FORM, branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id ?? '') });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (ann) => {
    setEditingAnn(ann);
    setForm({
      title: ann.title || '',
      message: ann.message || ann.content || '',
      image: null,
      branch_id: ann.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id ?? ''))
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closeForm = () => { setShowForm(false); setEditingAnn(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branch_id) {
      setError('Please select a branch.');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('message', form.message);
      if (form.image) {
        formData.append('image', form.image);
      }

      if (editingAnn) {
        await updateSuperAdminBranchAnnouncementApi(form.branch_id, editingAnn.id, formData, token);
        setSuccess('Announcement updated.');
      } else {
        await createSuperAdminBranchAnnouncementApi(form.branch_id, formData, token);
        setSuccess('Announcement created.');
      }
      closeForm();
      loadAnnouncements(selectedBranchId, branches);
    } catch (err) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ann) => {
    if (!window.confirm(`Delete "${ann.title}"?`)) return;
    const branchIdForDelete = ann.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : null);
    if (!branchIdForDelete) {
      setError('Could not identify branch for this announcement.');
      return;
    }
    setDeletingId(ann.id); setError(''); setSuccess('');
    try {
      await deleteSuperAdminBranchAnnouncementApi(branchIdForDelete, ann.id, token);
      setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
      setSuccess('Announcement deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = 'w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]';
  const inputStyle = { borderColor: '#e3ddd0', background: '#faf8f4', color: '#17140f' };

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="branch-announcements" />

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>Announcements</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadAnnouncements(selectedBranchId, branches)} className="rounded-lg p-2 hover:bg-[#f1ede4]" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${annLoading ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: '#9c6b2e' }}>
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>}
          {success && <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9c6b2e' }} /></div>
          ) : (
            <>
              {/* Branch selector */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium" style={{ color: '#5b5346' }}>Branch:</label>
                <div className="relative">
                  <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="appearance-none rounded-xl border pl-4 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    style={{ borderColor: '#e3ddd0', background: '#ffffff', color: '#17140f' }}>
                    <option value="all">All Branches</option>
                    {branches.map(b => <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>{b.name || b.branch_name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#a39a8c' }} />
                </div>
                <span className="text-sm" style={{ color: '#a39a8c' }}>{announcements.length} announcements {selectedBranchId === 'all' ? 'across All Branches' : ''}</span>
              </div>

              {/* Form modal */}
              {showForm && (
                <div className="sa-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(14,26,43,.5)', backdropFilter: 'blur(4px)' }}>
                  <div className="sa-rise w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ background: '#ffffff', border: '1px solid #e3ddd0', boxShadow: '0 20px 60px rgba(14,26,43,.2)' }}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg" style={{ color: '#17140f' }}>{editingAnn ? 'Edit Announcement' : 'New Announcement'}</h2>
                      <button onClick={closeForm} className="rounded-lg p-1.5 hover:bg-[#f1ede4]"><X className="h-4 w-4" style={{ color: '#a39a8c' }} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b5346' }}>Branch</label>
                        <div className="relative">
                          <select required value={form.branch_id || ''} onChange={(e) => setForm(p => ({ ...p, branch_id: e.target.value }))} className={`${inputClass} appearance-none`} style={inputStyle}>
                            <option value="" disabled>Select a branch</option>
                            {branches.map(b => <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>{b.name || b.branch_name}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#a39a8c' }} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b5346' }}>Title</label>
                        <input required value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Announcement title" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b5346' }}>Message</label>
                        <textarea required rows={4} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Announcement message..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#5b5346' }}>Image (Optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setForm(p => ({ ...p, image: e.target.files[0] }))} className={inputClass} style={inputStyle} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background: '#9c6b2e' }}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingAnn ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          {saving ? 'Saving…' : editingAnn ? 'Save Changes' : 'Create'}
                        </button>
                        <button type="button" onClick={closeForm} className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: '#faf8f4', color: '#5b5346', border: '1px solid #e3ddd0' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Announcements list */}
              {annLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9c6b2e' }} /></div>
              ) : !selectedBranchId ? (
                <div className="rounded-2xl px-5 py-14 text-center text-sm font-medium" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#5b5346' }}>
                  Please select a branch from the dropdown above to view its announcements.
                </div>
              ) : announcements.length === 0 ? (
                <div className="rounded-2xl px-5 py-14 text-center text-sm" style={{ background: '#ffffff', border: '1px solid #e3ddd0', color: '#a39a8c' }}>
                  {selectedBranchId === 'all' ? 'No announcements found across branches.' : 'No announcements for this branch. Click "New" to create one.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, idx) => (
                    <article key={ann.id} className="sa-rise rounded-2xl p-5"
                      style={{ animationDelay: `${idx * 30}ms`, background: '#ffffff', border: '1px solid #e3ddd0', boxShadow: '0 2px 8px rgba(14,26,43,.05)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: '#f1ede4' }}>
                            <Bell className="h-4 w-4" style={{ color: '#9c6b2e' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm" style={{ color: '#17140f' }}>{ann.title}</h3>
                              {ann.branch_name && (
                                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {ann.branch_name}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: '#5b5346' }}>{ann.message || ann.content}</p>
                            {ann.image && (
                              <div className="mt-3 relative group overflow-hidden rounded-xl border border-slate-200/90 bg-[#faf8f4] p-2 flex items-center justify-center">
                                <img
                                  src={ann.image.startsWith('http') ? ann.image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.image.startsWith('/') ? '' : '/'}${ann.image}`}
                                  alt="Announcement attachment"
                                  className="max-h-72 w-auto max-w-full rounded-lg object-contain cursor-pointer transition hover:scale-[1.01]"
                                  onClick={() => setViewingImage({
                                    url: ann.image.startsWith('http') ? ann.image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.image.startsWith('/') ? '' : '/'}${ann.image}`,
                                    title: ann.title
                                  })}
                                />
                                <button
                                  type="button"
                                  onClick={() => setViewingImage({
                                    url: ann.image.startsWith('http') ? ann.image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.image.startsWith('/') ? '' : '/'}${ann.image}`,
                                    title: ann.title
                                  })}
                                  className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur-xs transition hover:bg-black/90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <Maximize2 className="h-3.5 w-3.5" /> Full size
                                </button>
                              </div>
                            )}
                            {ann.created_at && <p className="mt-2 text-[10px]" style={{ color: '#a39a8c' }}>{new Date(ann.created_at).toLocaleDateString('en-IN')}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button onClick={() => openEdit(ann)} className="rounded-lg p-1.5 hover:bg-[#f1ede4]" title="Edit">
                            <Edit3 className="h-4 w-4" style={{ color: '#9c6b2e' }} />
                          </button>
                          <button onClick={() => handleDelete(ann)} disabled={deletingId !== null} className="rounded-lg p-1.5 hover:bg-rose-100 disabled:opacity-60" title="Delete">
                            {deletingId === ann.id ? <Loader2 className="h-4 w-4 animate-spin text-rose-400" /> : <Trash2 className="h-4 w-4 text-rose-400" />}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Lightbox Modal to view full-size image */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3 bg-[#faf8f4]">
              <h3 className="text-sm font-bold text-slate-800 truncate pr-4">{viewingImage.title || 'Announcement Image'}</h3>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-slate-900/5 overflow-auto max-h-[80vh]">
              <img
                src={viewingImage.url}
                alt={viewingImage.title || 'Announcement Image'}
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAnnouncements;
