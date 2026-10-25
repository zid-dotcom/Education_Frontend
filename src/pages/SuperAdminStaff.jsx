import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Search,
  Trash2,
  UserPlus,
  Users,
  ShieldCheck,
  Activity,
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
  updateSuperAdminStaffStatusApi,
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
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleToggleStatus = async (staffMember, targetStatus) => {
    const staffId = staffMember.id ?? staffMember.staff_id ?? staffMember.user_id;
    if (!staffId || !token) return;
    const normalizedStatus = String(targetStatus).toLowerCase() === 'active' ? 'Active' : 'Inactive';
    const isNowActive = normalizedStatus === 'Active';
    try {
      setStatusUpdatingId(staffId);
      setError('');
      setSuccess('');
      await updateSuperAdminStaffStatusApi(staffId, normalizedStatus, token);
      setStaff((prev) =>
        prev.map((s) => {
          const sId = s.id ?? s.staff_id ?? s.user_id;
          if (String(sId) === String(staffId)) {
            return {
              ...s,
              status: normalizedStatus,
              is_active: isNowActive,
            };
          }
          return s;
        })
      );
      setSuccess(`${staffMember.name || 'Staff member'}'s status changed to ${normalizedStatus} successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to update staff status.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => {
      const name = String(s.name || '').toLowerCase();
      const code = String(s.staff_code || s.id || '').toLowerCase();
      const email = String(s.email || '').toLowerCase();
      const phone = String(s.phone || '').toLowerCase();
      const course = String(s.course_name || '').toLowerCase();
      const branch = String(s.branch_name || '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        course.includes(q) ||
        branch.includes(q)
      );
    });
  }, [staff, searchTerm]);

  const stats = useMemo(() => {
    const total = staff.length;
    let active = 0;
    let inactive = 0;
    staff.forEach((m) => {
      const s = String(
        m.status || (m.is_active === false ? 'inactive' : 'active')
      ).toLowerCase();
      if (s === 'active') active++;
      else inactive++;
    });
    return { total, active, inactive };
  }, [staff]);

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
            <Link
              to="/super-admin/staff-monitoring"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-2xs"
            >
              <Activity className="h-4 w-4 text-[#9c6b2e]" />
              <span>Staff Monitoring</span>
            </Link>
            <Link
              to="/super-admin/staff-verification"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-2xs"
            >
              <ShieldCheck className="h-4 w-4 text-[#9c6b2e]" />
              <span>Verify Documents</span>
            </Link>
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

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
              {/* Top Banner / Metrics Cards (Matching Image 2) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                  className="rounded-2xl p-5 bg-white border shadow-2xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <p className="text-xs font-medium text-slate-500">
                    Total Staff
                  </p>
                  <p
                    className="mt-2 text-3xl font-semibold tabular-nums text-slate-900"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {stats.total}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-5 bg-white border shadow-2xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <p className="text-xs font-medium text-slate-500">
                    Active Accounts
                  </p>
                  <p
                    className="mt-2 text-3xl font-semibold tabular-nums text-emerald-700"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {stats.active}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-5 bg-white border shadow-2xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <p className="text-xs font-medium text-slate-500">
                    Inactive Accounts
                  </p>
                  <p
                    className="mt-2 text-3xl font-semibold tabular-nums text-rose-700"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {stats.inactive}
                  </p>
                </div>
              </div>

              {/* Branch Selector & Search Bar */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-4 bg-white border shadow-2xs"
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

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search staff, code, course..."
                      className="w-full rounded-xl border pl-9 pr-8 py-2 text-xs sm:text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                      style={{ borderColor: '#e3ddd0', color: '#17140f' }}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-sky-700 bg-sky-100/60 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {filteredStaff.length} of {staff.length} staff {selectedBranchId === 'all' ? 'across All Branches' : 'at ' + (selectedBranch?.name || 'branch')}
                  </div>
                </div>
              </div>

              {/* Staff Table / Content */}
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
              ) : filteredStaff.length === 0 ? (
                <div
                  className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
                  style={{ borderColor: '#e3ddd0', color: '#64748b' }}
                >
                  <UserPlus className="h-10 w-10 text-sky-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    {searchTerm
                      ? 'No staff members match your search.'
                      : selectedBranchId === 'all'
                      ? 'No staff members found across branches.'
                      : 'No staff members at this branch yet.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm
                      ? 'Try clearing your search query.'
                      : 'Click "Add Staff" above to register faculty and instructors.'}
                  </p>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 border border-stone-200"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div
                    className="hidden md:block overflow-x-auto rounded-2xl bg-white border shadow-2xs"
                    style={{ borderColor: '#e3ddd0' }}
                  >
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #e3ddd0',
                            background: '#faf8f4',
                          }}
                        >
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Staff Member
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Contact
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Address
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Branch
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Assigned Course
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Monthly Salary
                          </th>
                          <th className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-3.5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#efe9dd]">
                        {filteredStaff.map((s) => {
                          const sid = s.id ?? s.staff_id;
                          const isUpdating = statusUpdatingId === sid;
                          const currentStatus = String(
                            s.status || (s.is_active === false ? 'inactive' : 'active')
                          ).toLowerCase();
                          const isActive = currentStatus === 'active';

                          return (
                            <tr
                              key={sid}
                              className="transition-colors hover:bg-[#faf8f4]"
                            >
                              {/* Staff Member */}
                              <td className="px-3.5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                                    style={{ background: '#17140f' }}
                                  >
                                    {s.name?.charAt(0).toUpperCase() || 'S'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 leading-tight truncate">
                                      {s.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      ID: {s.staff_code || sid}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="px-3.5 py-3.5">
                                <div className="space-y-0.5">
                                  <a
                                    href={s.phone ? `tel:${s.phone}` : undefined}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-[#9c6b2e] whitespace-nowrap"
                                  >
                                    <Phone className="h-3 w-3 text-[#9c6b2e] shrink-0" />
                                    <span>{s.phone || '—'}</span>
                                  </a>
                                  <a
                                    href={s.email ? `mailto:${s.email}` : undefined}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#9c6b2e] truncate max-w-[170px]"
                                    title={s.email}
                                  >
                                    <Mail className="h-3 w-3 text-[#9c6b2e] shrink-0" />
                                    <span className="truncate">{s.email || '—'}</span>
                                  </a>
                                </div>
                              </td>

                              {/* Address */}
                              <td className="px-3.5 py-3.5">
                                <span
                                  className="text-xs text-slate-600 block max-w-[140px] truncate"
                                  title={s.address || '—'}
                                >
                                  {s.address || '—'}
                                </span>
                              </td>

                              {/* Branch */}
                              <td className="px-3.5 py-3.5">
                                {s.branch_name ? (
                                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    <MapPin className="h-3 w-3 text-amber-700 shrink-0" />
                                    <span className="truncate max-w-[130px]" title={s.branch_name}>
                                      {s.branch_name}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>

                              {/* Assigned Course */}
                              <td className="px-3.5 py-3.5">
                                {s.course_name ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-[#faf8f4] text-[#9c6b2e] border border-[#e3ddd0]">
                                    <BookOpen className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-[160px]" title={s.course_name}>
                                      {s.course_name}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Not assigned</span>
                                )}
                              </td>

                              {/* Monthly Salary */}
                              <td className="px-3.5 py-3.5">
                                {s.salary !== undefined && s.salary !== null && s.salary !== '' ? (
                                  <div>
                                    <div className="flex items-center gap-1 font-bold text-emerald-700 whitespace-nowrap">
                                      <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                                      <span>{Number(s.salary).toLocaleString('en-IN')}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">per month</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>

                              {/* Status Toggle */}
                              <td className="px-3.5 py-3.5">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleToggleStatus(s, isActive ? 'Inactive' : 'Active')}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isActive ? 'bg-emerald-600' : 'bg-slate-300'
                                    } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                        isActive ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    >
                                      {isUpdating && (
                                        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                                      )}
                                    </span>
                                  </button>
                                  <span
                                    className={`text-xs font-bold capitalize ${
                                      isActive ? 'text-emerald-700' : 'text-slate-500'
                                    }`}
                                  >
                                    {isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(s)}
                                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-stone-50 border border-[#e3ddd0] hover:bg-[#f1ede4] transition"
                                    title="Edit staff"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(s)}
                                    disabled={deletingId !== null}
                                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                                    title="Delete staff"
                                  >
                                    {deletingId === sid ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="space-y-4 md:hidden">
                    {filteredStaff.map((s) => {
                      const sid = s.id ?? s.staff_id;
                      const isUpdating = statusUpdatingId === sid;
                      const currentStatus = String(
                        s.status || (s.is_active === false ? 'inactive' : 'active')
                      ).toLowerCase();
                      const isActive = currentStatus === 'active';

                      return (
                        <div
                          key={sid}
                          className="sa-rise rounded-2xl p-4 bg-white border shadow-2xs space-y-3"
                          style={{ borderColor: '#e3ddd0' }}
                        >
                          <div className="flex items-start justify-between gap-3">
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
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  ID: {s.staff_code || sid}
                                </p>
                              </div>
                            </div>

                            {/* Status toggle on mobile */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleToggleStatus(s, isActive ? 'Inactive' : 'Active')}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isActive ? 'bg-emerald-600' : 'bg-slate-300'
                                } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                    isActive ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                >
                                  {isUpdating && (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />
                                  )}
                                </span>
                              </button>
                              <span
                                className={`text-xs font-bold capitalize ${
                                  isActive ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                            <div>
                              <p className="text-slate-400 text-[10px] uppercase font-bold">Branch</p>
                              <p className="font-semibold text-slate-700 truncate">{s.branch_name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] uppercase font-bold">Course</p>
                              <p className="font-semibold text-[#9c6b2e] truncate">{s.course_name || 'Not assigned'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] uppercase font-bold">Phone</p>
                              <p className="font-semibold text-slate-700">{s.phone || '—'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] uppercase font-bold">Salary</p>
                              <p className="font-bold text-emerald-700">
                                {s.salary ? `₹${Number(s.salary).toLocaleString('en-IN')} / mo` : '—'}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-400 text-[10px] uppercase font-bold">Address</p>
                              <p className="font-medium text-slate-700">{s.address || '—'}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-sky-700 bg-stone-50 border border-[#e3ddd0] hover:bg-[#f1ede4] transition"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
                              disabled={deletingId !== null}
                              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                            >
                              {deletingId === sid ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
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
