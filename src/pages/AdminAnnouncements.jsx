import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit3,
  GraduationCap,
  Building2,
  KeyRound,
  Loader2,
  LogOut,
  Maximize2,
  Menu,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCourseImageUrl } from '../services/courses';
import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementsApi,
  updateAnnouncementApi,
} from '../services/adminannouncements';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';

const EMPTY_FORM = { title: '', message: '', audience: 'all' };

const AdminAnnouncements = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const fetchAnnouncements = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const data = await getAnnouncementsApi(token);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setPreviewImage('');
    setEditingAnnouncement(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('message', form.message.trim());
      formData.append('audience', form.audience || 'all');
      if (imageFile) formData.append('image', imageFile);

      if (editingAnnouncement) {
        await updateAnnouncementApi(editingAnnouncement.id, formData, token);
        setSuccess('Announcement updated successfully.');
      } else {
        await createAnnouncementApi(formData, token);
        setSuccess('Announcement created successfully.');
      }

      resetForm();
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (announcement) => {
    setError('');
    setSuccess('');
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title || '',
      message: announcement.message || '',
      audience: announcement.audience || 'all',
    });
    setImageFile(null);
    setPreviewImage(announcement.image ? getCourseImageUrl(announcement.image) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (announcementId) => {
    if (!token || !window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      setDeletingId(announcementId);
      setError('');
      setSuccess('');
      await deleteAnnouncementApi(announcementId, token);
      setAnnouncements((current) => current.filter((announcement) => announcement.id !== announcementId));
      setSuccess('Announcement deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout({ redirectTo: '/super-admin/login' });
  };

  return (
    <div className="min-h-screen md:flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#faf8f4', color: '#17140f' }}>
      <SuperAdminSidebar user={user} navigate={navigate} logout={logout} sidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} activePage="global-announcements" />

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b px-6 py-5 sm:px-10" style={{ borderColor: '#e3ddd0', background: '#ffffff' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b2e' }}>Super Admin</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>Global Announcements</h1>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
        {(error || success) && (
          <div className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
            <div className="flex items-center gap-3">{error ? <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}<span>{error || success}</span></div>
            <button type="button" onClick={() => { setError(''); setSuccess(''); }} aria-label="Dismiss message"><X className="h-4 w-4" /></button>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="order-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 lg:order-1">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Published notices</p><h2 className="mt-1 text-xl font-black text-slate-950">All announcements ({announcements.length})</h2></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><Bell className="h-5 w-5" /></div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /><p className="text-sm font-semibold">Loading announcements...</p></div>
            ) : announcements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-lg font-black text-slate-900">No announcements yet</h2><p className="mt-1 text-sm font-medium text-slate-500">Create the first notice for your portal.</p></div>
            ) : (
              <div className="space-y-5">
                {announcements.map((announcement) => (
                  <article key={announcement.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-md">
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Notice Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-slate-950">{announcement.title}</h3>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            <span>{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('en-IN') : 'Date unavailable'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 border border-amber-200">
                            {announcement.audience === 'branch_admin'
                              ? 'Branch admins'
                              : announcement.audience === 'students'
                              ? 'Students'
                              : announcement.audience === 'staff'
                              ? 'Staff'
                              : 'Everyone'}
                          </span>
                          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-900">#{announcement.id}</span>
                        </div>
                      </div>

                      {/* Notice Message */}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{announcement.message}</p>

                      {/* Notice Full Image Display */}
                      {announcement.image && (
                        <div className="relative group overflow-hidden rounded-xl border border-slate-200/90 bg-[#faf8f4] p-2 flex items-center justify-center min-h-[180px]">
                          <img
                            src={getCourseImageUrl(announcement.image)}
                            alt={announcement.title}
                            className="max-h-96 w-auto max-w-full rounded-lg object-contain cursor-pointer transition hover:scale-[1.01]"
                            onClick={() => setViewingImage({ url: getCourseImageUrl(announcement.image), title: announcement.title })}
                          />
                          <button
                            type="button"
                            onClick={() => setViewingImage({ url: getCourseImageUrl(announcement.image), title: announcement.title })}
                            className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur-xs transition hover:bg-black/90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Maximize2 className="h-3.5 w-3.5" /> Full size
                          </button>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(announcement)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-900"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(announcement.id)}
                            disabled={deletingId !== null}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === announcement.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                          </button>
                        </div>
                        {announcement.image && (
                          <button
                            type="button"
                            onClick={() => setViewingImage({ url: getCourseImageUrl(announcement.image), title: announcement.title })}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
                          >
                            <Maximize2 className="h-3 w-3" /> View image
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="order-1 rounded-3xl border border-amber-200 bg-white p-6 shadow-xs sm:p-7 lg:order-2 lg:sticky lg:top-24">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">{editingAnnouncement ? 'Edit notice' : 'New notice'}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{editingAnnouncement ? 'Update announcement' : 'Create announcement'}</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">{editingAnnouncement ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="announcement-audience" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Target Audience</label>
                <div className="relative">
                  <select
                    id="announcement-audience"
                    value={form.audience || 'all'}
                    onChange={(event) => setForm({ ...form, audience: event.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="all">Everyone</option>
                    <option value="students">Students</option>
                    <option value="staff">Staff</option>
                    <option value="branch_admin">Branch admins</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="announcement-title" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Title</label>
                <input id="announcement-title" type="text" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. New batch admissions open" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label htmlFor="announcement-message" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Message</label>
                <textarea id="announcement-message" required rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Write the announcement details..." className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label htmlFor="announcement-image" className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Image <span className="font-medium normal-case text-slate-400">(optional)</span>
                </label>
                <input id="announcement-image" type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-amber-900 hover:file:bg-amber-200" />
                {previewImage && (
                  <div className="mt-3 relative rounded-xl border border-slate-200 bg-[#faf8f4] p-2 flex items-center justify-center">
                    <img src={previewImage} alt="Announcement preview" className="max-h-48 w-auto max-w-full rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setPreviewImage(''); }}
                      className="absolute top-2 right-2 rounded-lg bg-black/60 p-1 text-white hover:bg-black/80 transition"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              {editingAnnouncement && <button type="button" onClick={resetForm} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100">Cancel</button>}
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> : editingAnnouncement ? <Edit3 className="h-4 w-4 text-amber-400" /> : <Plus className="h-4 w-4 text-amber-400" />}
                {submitting ? 'Saving...' : editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </section>
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

export default AdminAnnouncements;
