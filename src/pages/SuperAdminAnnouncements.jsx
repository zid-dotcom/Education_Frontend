import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  Edit3,
  Loader2,
  MapPin,
  Maximize2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminAnnouncementBranchesApi,
  getSuperAdminAllAnnouncementsApi,
  createSuperAdminBranchAnnouncementApi,
  updateSuperAdminBranchAnnouncementApi,
  deleteSuperAdminBranchAnnouncementApi,
} from '../services/superadmin';
import { getSuperAdminMonitoringBranchesApi } from '../services/staffMonitoring';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .2s ease both; }
`;

// Helper: Format date & time for 'Posted on'
export const formatPostedDateTime = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return String(dateStr);
  }
};

const EMPTY_FORM = { title: '', message: '', image: null, branch_id: '', audience: 'all' };

const SuperAdminAnnouncements = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewingImage, setViewingImage] = useState(null);

  // Load branches from branches APIs
  const loadBranches = async () => {
    if (!token) return;
    try {
      setLoadingBranches(true);
      let list = [];
      try {
        const data = await getSuperAdminAnnouncementBranchesApi(token);
        list = Array.isArray(data) ? data : (data?.branches || data?.data || []);
      } catch {
        // Fallback to staff-monitoring branches API
        try {
          const fb = await getSuperAdminMonitoringBranchesApi(token);
          list = Array.isArray(fb) ? fb : (fb?.branches || fb?.data || []);
        } catch {}
      }

      if (list.length > 0) {
        setBranches((prev) => {
          const merged = [...list];
          prev.forEach((p) => {
            const exists = merged.some(
              (m) => String(m.id ?? m.branch_id) === String(p.id ?? p.branch_id) ||
                     (m.name && p.name && m.name.toLowerCase().trim() === p.name.toLowerCase().trim())
            );
            if (!exists) merged.push(p);
          });
          return merged;
        });
      }
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load Announcements: GET /super-admin/announcements/all or /super-admin/announcements/all?branch_id=2
  const loadAnnouncements = async (branchId = selectedBranchId) => {
    if (!token) return;
    setAnnLoading(true);
    setError('');

    try {
      const queryBranchId = branchId === 'all' ? undefined : branchId;
      const data = await getSuperAdminAllAnnouncementsApi(queryBranchId, token);
      const list = Array.isArray(data) ? data : (data?.announcements || data?.data || data?.items || []);

      setAnnouncements(list);

      // Discover branches directly from announcements returned by API
      const discovered = [];
      list.forEach((a) => {
        const bId = a.branch_id || a.branch?.id;
        const bName = a.branch_name || a.branch?.name || (typeof a.branch === 'string' ? a.branch : null);
        const bLoc = a.location || a.branch_location || a.branch?.location;
        if (bId || bName) {
          discovered.push({ id: bId ?? bName, name: bName || `Branch #${bId}`, location: bLoc || '' });
        }
      });

      if (discovered.length > 0) {
        setBranches((prev) => {
          const merged = [...prev];
          discovered.forEach((d) => {
            const exists = merged.some(
              (m) => String(m.id ?? m.branch_id) === String(d.id) ||
                     (m.name && d.name && m.name.toLowerCase().trim() === d.name.toLowerCase().trim())
            );
            if (!exists) merged.push(d);
          });
          return merged;
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load branch announcements.');
      setAnnouncements([]);
    } finally {
      setAnnLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [token]);

  useEffect(() => {
    loadAnnouncements(selectedBranchId);
  }, [selectedBranchId, token]);

  const handleBranchChange = (newBranchId) => {
    setSelectedBranchId(newBranchId);
  };

  // Client-side branch filter safeguard
  const branchFilteredAnnouncements = useMemo(() => {
    if (selectedBranchId === 'all') return announcements;

    const branchObj = branches.find(
      (b) => String(b.id ?? b.branch_id) === String(selectedBranchId) ||
             String(b.name).toLowerCase().trim() === String(selectedBranchId).toLowerCase().trim()
    );
    const targetId = branchObj ? String(branchObj.id ?? branchObj.branch_id) : String(selectedBranchId);
    const targetName = branchObj ? String(branchObj.name || '').toLowerCase().trim() : String(selectedBranchId).toLowerCase().trim();

    return announcements.filter((a) => {
      const aBranchId = a.branch_id !== undefined && a.branch_id !== null ? String(a.branch_id) : '';
      const aBranchName = String(a.branch_name || a.branch?.name || (typeof a.branch === 'string' ? a.branch : '')).toLowerCase().trim();

      if (aBranchId && aBranchId === targetId) return true;
      if (targetName && aBranchName && (aBranchName === targetName || aBranchName.includes(targetName) || targetName.includes(aBranchName))) {
        return true;
      }
      return false;
    });
  }, [announcements, selectedBranchId, branches]);

  // Client-side search
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return branchFilteredAnnouncements;
    const q = searchQuery.toLowerCase().trim();
    return branchFilteredAnnouncements.filter((a) => {
      const title = String(a.title || '').toLowerCase();
      const message = String(a.message || a.content || '').toLowerCase();
      const branchName = String(a.branch_name || a.branch?.name || '').toLowerCase();
      const location = String(a.location || a.branch_location || a.branch?.location || '').toLowerCase();
      const course = String(a.course_name || a.course_title || '').toLowerCase();

      return (
        title.includes(q) ||
        message.includes(q) ||
        branchName.includes(q) ||
        location.includes(q) ||
        course.includes(q)
      );
    });
  }, [branchFilteredAnnouncements, searchQuery]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = branchFilteredAnnouncements.length;
    const distinctBranches = new Set(
      branchFilteredAnnouncements
        .map((a) => a.branch_name || a.branch?.name || a.branch_id)
        .filter(Boolean)
    ).size;
    const latest = branchFilteredAnnouncements[0]?.created_at
      ? formatPostedDateTime(branchFilteredAnnouncements[0].created_at)
      : '—';
    return { total, distinctBranches, latest };
  }, [branchFilteredAnnouncements]);

  // Form Handlers
  const openCreate = () => {
    setEditingAnn(null);
    setForm({
      ...EMPTY_FORM,
      branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id ?? ''),
      audience: 'all',
    });
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
      branch_id: ann.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id ?? '')),
      audience: ann.audience || 'all',
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAnn(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branch_id) {
      setError('Please select a branch.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('message', form.message);
      formData.append('audience', form.audience || 'all');
      if (form.image) {
        formData.append('image', form.image);
      }

      if (editingAnn) {
        await updateSuperAdminBranchAnnouncementApi(form.branch_id, editingAnn.id, formData, token);
        setSuccess('Announcement updated successfully.');
      } else {
        await createSuperAdminBranchAnnouncementApi(form.branch_id, formData, token);
        setSuccess('Announcement created successfully.');
      }
      closeForm();
      loadAnnouncements(selectedBranchId);
    } catch (err) {
      setError(err?.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ann) => {
    if (!window.confirm(`Delete announcement "${ann.title}"?`)) return;
    const branchIdForDelete = ann.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : null);
    if (!branchIdForDelete) {
      setError('Could not identify branch for this announcement.');
      return;
    }
    setDeletingId(ann.id);
    setError('');
    setSuccess('');
    try {
      await deleteSuperAdminBranchAnnouncementApi(branchIdForDelete, ann.id, token);
      setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
      setSuccess('Announcement deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen md:flex bg-[#FAF8F4]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{PAGE_CSS}</style>

      {/* Super Admin Sidebar */}
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="branch-announcements"
      />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E3DDD0] bg-[#FAF8F4]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-[#F1EDE4] md:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Megaphone className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#17140F]">Branch Announcements</h1>
                <p className="text-[10px] text-[#8A8175] font-medium hidden sm:block">
                  Live announcements published across branches by branch admins
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAnnouncements(selectedBranchId)}
              className="rounded-xl p-2 border border-[#E3DDD0] bg-white text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer shadow-2xs"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${annLoading ? 'animate-spin text-[#9C6B2E]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#9C6B2E] text-white hover:bg-[#855923] transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Announcement</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Alerts */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3 sa-fade">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-1 hover:text-rose-950">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-3 sa-fade">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="p-1 hover:text-emerald-950">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4.5 shadow-2xs sa-rise">
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Announcements</span>
                <Megaphone className="h-4 w-4 text-[#9C6B2E]" />
              </div>
              <p className="text-2xl font-bold text-[#17140F]">{stats.total}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selectedBranchId === 'all' ? 'Across all branches' : 'In selected branch'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4.5 shadow-2xs sa-rise">
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Branches</span>
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{selectedBranchId === 'all' ? (stats.distinctBranches || branches.length) : 1}</p>
              <p className="text-[10px] text-emerald-600/70 mt-0.5">
                {selectedBranchId === 'all' ? 'Active branches with posts' : 'Selected branch'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4.5 shadow-2xs sa-rise">
              <div className="flex items-center justify-between text-[#8A8175] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Latest Update</span>
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-[#17140F] truncate">{stats.latest}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Most recent announcement date</p>
            </div>
          </div>

          {/* Branch Filter & Search Bar */}
          <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Branch Selector: GET /super-admin/announcements/all or /super-admin/announcements/all?branch_id=2 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#9C6B2E] shrink-0" />
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Branch:</span>
              </div>
              <div className="relative min-w-[260px]">
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={loadingBranches}
                  className="w-full appearance-none rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer disabled:opacity-50"
                >
                  <option value="all">All Branches (Global)</option>
                  {branches.map((b) => {
                    const bId = b.id ?? b.branch_id ?? b.name;
                    const bName = b.name || b.branch_name || `Branch #${bId}`;
                    const bLoc = b.location || b.city ? ` (${b.location || b.city})` : '';
                    return (
                      <option key={bId} value={bId}>
                        {bName}{bLoc}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              {selectedBranchId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedBranchId('all')}
                  className="text-xs font-semibold text-[#9C6B2E] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Reset to All Branches
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search announcements, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
              />
            </div>
          </div>

          {/* Announcements Feed / Cards */}
          {annLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E]" />
              <p className="text-xs font-semibold text-[#8A8175]">Loading branch announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-[#E3DDD0] bg-white p-12 text-center shadow-2xs">
              <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No announcements found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'No announcements match your search query.'
                  : selectedBranchId !== 'all'
                  ? 'No announcements currently posted for this branch.'
                  : 'No branch announcements have been posted yet.'}
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F4] border border-[#E3DDD0] text-[#9C6B2E] hover:bg-[#F1EDE4] transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Announcement</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((ann, idx) => {
                const bName = ann.branch_name || ann.branch?.name || (typeof ann.branch === 'string' ? ann.branch : null) || 'Branch Announcement';
                const bLoc = ann.location || ann.branch_location || ann.branch?.location;
                const postedOnText = formatPostedDateTime(ann.created_at || ann.date || ann.posted_at || ann.updated_at);

                const imageUrl = ann.image
                  ? (ann.image.startsWith('http')
                      ? ann.image
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ann.image.startsWith('/') ? '' : '/'}${ann.image}`)
                  : null;

                return (
                  <article
                    key={ann.id || idx}
                    className="sa-rise rounded-2xl border border-[#E3DDD0] bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-xl bg-[#F1EDE4] border border-[#E3DDD0] text-[#9C6B2E] flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Branch & Date Badge Header */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold bg-[#FAF8F4] text-[#9C6B2E] border border-[#E3DDD0]">
                              <Building2 className="h-3 w-3" />
                              <span>{bName}</span>
                            </span>
                            {bLoc && (
                              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-200">
                                <MapPin className="h-2.5 w-2.5" />
                                <span>{bLoc}</span>
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Target: {ann.audience === 'branch_admin'
                                ? 'Branch admins'
                                : ann.audience === 'students'
                                ? 'Students'
                                : ann.audience === 'staff'
                                ? 'Staff'
                                : 'Everyone'}
                            </span>
                            {postedOnText && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 ml-auto bg-[#FAF8F4] px-2.5 py-0.5 rounded-lg border border-[#E3DDD0]">
                                <Clock className="h-3 w-3 text-[#9C6B2E]" />
                                <span>Posted on: <strong className="font-semibold text-slate-700">{postedOnText}</strong></span>
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {ann.title}
                          </h3>

                          {/* Message */}
                          <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                            {ann.message || ann.content}
                          </p>

                          {/* Image Attachment */}
                          {imageUrl && (
                            <div className="mt-4 relative group overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-2 max-w-md">
                              <img
                                src={imageUrl}
                                alt={ann.title}
                                className="max-h-64 w-auto rounded-xl object-contain cursor-pointer transition hover:scale-[1.01]"
                                onClick={() => setViewingImage({ url: imageUrl, title: ann.title })}
                              />
                              <button
                                type="button"
                                onClick={() => setViewingImage({ url: imageUrl, title: ann.title })}
                                className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs transition hover:bg-black/90 cursor-pointer"
                              >
                                <Maximize2 className="h-3.5 w-3.5" />
                                <span>View Full</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => openEdit(ann)}
                          className="p-2 rounded-xl border border-[#E3DDD0] text-slate-600 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ann)}
                          disabled={deletingId !== null}
                          className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          title="Delete Announcement"
                        >
                          {deletingId === ann.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs sa-fade"
          onClick={closeForm}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E3DDD0] shadow-2xl p-6 sm:p-7 space-y-4 sa-rise max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD0]">
              <h2 className="font-bold text-base text-[#17140F]">
                {editingAnn ? 'Edit Branch Announcement' : 'New Branch Announcement'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F1EDE4] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Branch
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.branch_id || ''}
                    onChange={(e) => setForm((p) => ({ ...p, branch_id: e.target.value }))}
                    className="w-full appearance-none rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer"
                  >
                    <option value="" disabled>Select a branch</option>
                    {branches.map((b) => (
                      <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                        {b.name || b.branch_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Audience
                </label>
                <div className="relative">
                  <select
                    value={form.audience || 'all'}
                    onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                    className="w-full appearance-none rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 cursor-pointer"
                  >
                    <option value="all">Everyone</option>
                    <option value="students">Students</option>
                    <option value="staff">Staff</option>
                    <option value="branch_admin">Branch admins</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Title
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Schedule Update, Exam Notification"
                  className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Announcement details..."
                  className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attachment Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.files[0] }))}
                  className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2 text-xs font-medium text-slate-800 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F1EDE4] file:text-[#9C6B2E] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3DDD0]">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F1EDE4] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#9C6B2E] text-white hover:bg-[#855923] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingAnn ? (
                    <Edit3 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : editingAnn ? 'Save Changes' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal to view full-size image */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs sa-fade"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col sa-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E3DDD0] px-5 py-3.5 bg-[#FAF8F4]">
              <h3 className="text-xs font-bold text-slate-800 truncate pr-4">{viewingImage.title || 'Announcement Image'}</h3>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-slate-900/5 overflow-auto max-h-[80vh]">
              <img
                src={viewingImage.url}
                alt={viewingImage.title || 'Announcement Image'}
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAnnouncements;
