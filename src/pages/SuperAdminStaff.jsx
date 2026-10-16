import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Edit3,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminStaffBranchesApi,
  getSuperAdminBranchStaffApi,
  getSuperAdminStaffBranchCoursesApi,
  createSuperAdminBranchStaffApi,
  updateSuperAdminBranchStaffApi,
  deleteSuperAdminBranchStaffApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .2s ease both; }
`;

const EMPTY_FORM = {
  branch_id: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  course_id: '',
  salary: '',
  address: '',
};

const SuperAdminStaff = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formCourses, setFormCourses] = useState([]);
  const [formCoursesLoading, setFormCoursesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminStaffBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadBranchData = async (branchId, branchList = branches) => {
    if (!token) return;
    setStaffLoading(true);
    setError('');

    if (branchId === 'all') {
      if (!branchList || branchList.length === 0) {
        setStaff([]);
        setCourses([]);
        setStaffLoading(false);
        return;
      }
      try {
        const [staffResults, courseResults] = await Promise.all([
          Promise.allSettled(
            branchList.map((b) => {
              const bId = b.id ?? b.branch_id;
              const bName = b.name || b.branch_name || '';
              return getSuperAdminBranchStaffApi(bId, token).then((data) => {
                const list = Array.isArray(data) ? data : (Array.isArray(data?.staff) ? data.staff : []);
                return list.map((s) => ({
                  ...s,
                  branch_id: s.branch_id || bId,
                  branch_name: s.branch_name || bName,
                }));
              });
            })
          ),
          Promise.allSettled(
            branchList.map((b) => {
              const bId = b.id ?? b.branch_id;
              return getSuperAdminStaffBranchCoursesApi(bId, token).then((data) => {
                return Array.isArray(data) ? data : (Array.isArray(data?.courses) ? data.courses : []);
              });
            })
          ),
        ]);

        const allStaff = [];
        staffResults.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allStaff.push(...res.value);
          }
        });

        const allCourses = [];
        courseResults.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allCourses.push(...res.value);
          }
        });

        setStaff(allStaff);
        setCourses(allCourses);
      } catch (err) {
        setError(err.message || 'Failed to load staff.');
      } finally {
        setStaffLoading(false);
      }
      return;
    }

    if (!branchId) {
      setStaff([]);
      setCourses([]);
      setStaffLoading(false);
      return;
    }

    const bObj = branchList.find((b) => String(b.id ?? b.branch_id) === String(branchId));
    const bName = bObj?.name || bObj?.branch_name || '';
    Promise.allSettled([
      getSuperAdminBranchStaffApi(branchId, token),
      getSuperAdminStaffBranchCoursesApi(branchId, token),
    ])
      .then(([staffRes, coursesRes]) => {
        if (staffRes.status === 'fulfilled') {
          const sData = staffRes.value;
          const list = Array.isArray(sData) ? sData : (Array.isArray(sData?.staff) ? sData.staff : []);
          setStaff(list.map((s) => ({
            ...s,
            branch_id: s.branch_id || branchId,
            branch_name: s.branch_name || bName,
          })));
        }
        if (coursesRes.status === 'fulfilled') {
          const cData = coursesRes.value;
          setCourses(Array.isArray(cData) ? cData : (Array.isArray(cData?.courses) ? cData.courses : []));
        }
      })
      .catch((err) => setError(err.message || 'Failed to load staff.'))
      .finally(() => setStaffLoading(false));
  };

  useEffect(() => {
    if (!loading && branches.length > 0) {
      loadBranchData(selectedBranchId, branches);
    }
  }, [selectedBranchId, branches, loading, token]);

  const openCreate = () => {
    setEditingStaff(null);
    setForm({ ...EMPTY_FORM, branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id ?? '') });
    setFormCourses(courses);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (s) => {
    setEditingStaff(s);
    setForm({
      branch_id: s.branch_id || selectedBranchId,
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      course_id: s.course_id ? String(s.course_id) : '',
      salary: s.salary ?? '',
      address: s.address || '',
    });
    setFormCourses(courses);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setForm(EMPTY_FORM);
  };

  const handleFormBranchChange = (e) => {
    const newBranchId = e.target.value;
    setForm({ ...form, branch_id: newBranchId, course_id: '' });
    if (!newBranchId) {
      setFormCourses([]);
      return;
    }
    if (String(newBranchId) === String(selectedBranchId)) {
      setFormCourses(courses);
      return;
    }
    setFormCoursesLoading(true);
    getSuperAdminStaffBranchCoursesApi(newBranchId, token)
      .then((data) => setFormCourses(Array.isArray(data) ? data : (Array.isArray(data?.courses) ? data.courses : [])))
      .catch((err) => console.error("Failed to load form courses", err))
      .finally(() => setFormCoursesLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || 'Branch Office',
        salary: Number(form.salary) || 0,
      };

      if (form.course_id) {
        payload.course_id = Number(form.course_id);
      }

      if (form.password) {
        payload.password = form.password;
      }

      if (editingStaff) {
        const staffId = editingStaff.id ?? editingStaff.staff_id;
        const updated = await updateSuperAdminBranchStaffApi(
          form.branch_id,
          staffId,
          payload,
          token
        );
        if (String(form.branch_id) === String(selectedBranchId)) {
          setStaff((prev) =>
            prev.map((s) => ((s.id ?? s.staff_id) === staffId ? { ...s, ...updated } : s))
          );
        }
        setSuccess('Staff member updated successfully.');
      } else {
        if (!payload.password) {
          setError('Password is required for new staff members.');
          setSaving(false);
          return;
        }
        const created = await createSuperAdminBranchStaffApi(
          form.branch_id,
          payload,
          token
        );
        if (String(form.branch_id) === String(selectedBranchId)) {
          setStaff((prev) => [created, ...prev]);
        }
        setSuccess('Staff member created successfully.');
      }
      closeForm();
      if (selectedBranchId === 'all') {
        loadBranchData('all');
      } else if (String(form.branch_id) === String(selectedBranchId)) {
        loadBranchData(selectedBranchId);
      } else {
        setSelectedBranchId(form.branch_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    const id = s.id ?? s.staff_id;
    const branchIdForDelete = s.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : null);
    if (!branchIdForDelete) {
      setError('Could not identify branch for this staff member.');
      return;
    }
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await deleteSuperAdminBranchStaffApi(branchIdForDelete, id, token);
      setStaff((prev) => prev.filter((item) => (item.id ?? item.staff_id) !== id));
      setSuccess(`Staff member ${s.name} deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete staff member.');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedBranch = branches.find(
    (b) => String(b.id ?? b.branch_id) === String(selectedBranchId)
  );

  return (
    <div
      className="min-h-screen md:flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="staff"
      />

      <main className="min-w-0 flex-1">
        <header
          className="flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#9c6b2e' }}
            >
              Super Admin
            </p>
            <h1
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Branch Staff
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
              style={{ background: '#9c6b2e' }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff</span>
            </button>
            <button
              onClick={() => loadBranchData(selectedBranchId, branches)}
              className="rounded-lg p-2 hover:bg-[#f1ede4]"
              title="Refresh staff"
            >
              <RefreshCw
                className={`h-4 w-4 ${staffLoading ? 'animate-spin' : ''}`}
                style={{ color: '#9c6b2e' }}
              />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              }}
            >
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: '#9c6b2e' }}
              />
            </div>
          ) : (
            <>
              {/* Branch Selector Bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 bg-white border shadow-2xs"
                style={{ borderColor: '#e3ddd0' }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select Branch:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="appearance-none rounded-xl border pl-4 pr-9 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50"
                      style={{ borderColor: '#e3ddd0', color: '#17140f' }}
                    >
                      <option value="all">All Branches</option>
                      {branches.map((b) => (
                        <option
                          key={b.id ?? b.branch_id}
                          value={String(b.id ?? b.branch_id)}
                        >
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: '#a39a8c' }}
                    />
                  </div>
                </div>
                <div className="text-xs font-semibold text-sky-700 bg-sky-100/60 px-3 py-1 rounded-full">
                  {staff.length} staff members {selectedBranchId === 'all' ? 'across All Branches' : 'at ' + (selectedBranch?.name || 'branch')}
                </div>
              </div>

              {/* Staff Cards Grid */}
              {staffLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2
                    className="h-7 w-7 animate-spin"
                    style={{ color: '#9c6b2e' }}
                  />
                </div>
              ) : !selectedBranchId ? (
                <div
                  className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
                  style={{ borderColor: '#e3ddd0', color: '#64748b' }}
                >
                  <UserPlus className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Please select a branch</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a branch from the dropdown above to view its staff.
                  </p>
                </div>
              ) : staff.length === 0 ? (
                <div
                  className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
                  style={{ borderColor: '#e3ddd0', color: '#64748b' }}
                >
                  <UserPlus className="h-10 w-10 text-sky-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    {selectedBranchId === 'all' ? 'No staff members found across branches.' : 'No staff members at this branch yet.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Add Staff" above to register faculty and instructors.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {staff.map((s) => {
                    const sid = s.id ?? s.staff_id;
                    return (
                      <div
                        key={sid}
                        className="sa-rise rounded-2xl p-5 bg-white border shadow-2xs flex flex-col justify-between"
                        style={{ borderColor: '#e3ddd0' }}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
                                style={{ background: '#17140f' }}
                              >
                                {s.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 leading-tight">
                                  {s.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <p className="text-xs text-slate-500 font-medium">
                                    {s.role || 'Staff Member'}
                                  </p>
                                  {s.branch_name && (
                                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {s.branch_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span
                              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{
                                background:
                                  s.status === 'active' || s.is_active !== false
                                    ? '#ecfdf5'
                                    : '#fef2f2',
                                color:
                                  s.status === 'active' || s.is_active !== false
                                    ? '#065f46'
                                    : '#991b1b',
                              }}
                            >
                              {s.status || 'Active'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100 mt-1">
                            {/* Contact Details */}
                            <div className="space-y-2">
                              {s.staff_code && (
                                <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                                  ID: {s.staff_code}
                                </p>
                              )}
                              <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-50 text-[#9c6b2e]">
                                    <Phone className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-medium text-slate-700">{s.phone || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-50 text-[#9c6b2e]">
                                    <Mail className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="truncate font-medium text-slate-700">{s.email || '—'}</span>
                                </div>
                                {s.address && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-50 text-[#9c6b2e]">
                                      <MapPin className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate font-medium text-slate-700" title={s.address}>{s.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Job Info (Course & Salary) */}
                            {(s.course_name || (s.salary !== undefined && s.salary !== null && s.salary !== '')) && (
                              <div className="rounded-xl bg-[#faf8f4] p-3 border border-[#f1ede4] space-y-2 mt-2">
                                {s.course_name && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Assigned Course</p>
                                    <p className="flex items-center gap-1.5 font-bold text-[#9c6b2e] truncate">
                                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate" title={s.course_name}>{s.course_name}</span>
                                    </p>
                                  </div>
                                )}
                                {(s.salary !== undefined && s.salary !== null && s.salary !== '') && (
                                  <div className={s.course_name ? 'pt-2 border-t border-[#e3ddd0]' : ''}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Salary</p>
                                    <p className="flex items-center gap-1 font-bold text-emerald-700">
                                      <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                                      {Number(s.salary).toLocaleString('en-IN')} <span className="text-[10px] text-emerald-600/70">/ month</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-sky-700 bg-stone-50 border border-[#e3ddd0] hover:bg-[#f1ede4] transition"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            disabled={deletingId !== null}
                            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                            title="Delete staff"
                          >
                            {deletingId === sid ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Staff Modal (Create / Edit) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="sa-rise relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border"
            style={{ borderColor: '#e3ddd0' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    At {selectedBranch?.name || 'Selected Branch'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Branch *
                </label>
                <select
                  required
                  value={form.branch_id}
                  onChange={handleFormBranchChange}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                >
                  <option value="" disabled>Choose a branch</option>
                  {branches.map((b) => (
                    <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Assigned Course
                  </label>
                  <select
                    value={form.course_id}
                    onChange={(e) =>
                      setForm({ ...form, course_id: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  >
                    <option value="">Select Course (Optional)</option>
                    {formCourses.map((c) => (
                      <option
                        key={c.id ?? c.course_id}
                        value={String(c.id ?? c.course_id)}
                      >
                        {c.title || c.course_title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Monthly Salary (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    placeholder="e.g. 35000"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, State"
                  className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password {editingStaff ? '(Leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingStaff ? 'New password (optional)' : 'Minimum 6 characters'}
                  className="w-full rounded-xl border border-[#e3ddd0] bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-sky-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                  style={{ background: '#9c6b2e' }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingStaff ? (
                    <Edit3 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving
                    ? 'Saving...'
                    : editingStaff
                    ? 'Save Changes'
                    : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminStaff;
