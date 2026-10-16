import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Edit3,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
  CreditCard,
  Check,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminCourseBranchesApi,
  getSuperAdminBranchCoursesApi,
  createSuperAdminBranchCourseApi,
  createBulkSuperAdminBranchCourseApi,
  updateSuperAdminBranchCourseApi,
  deleteSuperAdminBranchCourseApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
.sa-rise { animation: sa-rise .35s ease both; }
.sa-fade { animation: sa-fade .2s ease both; }
`;

const EMPTY_COURSE = {
  branch_id: '',
  branch_ids: [],
  all_branches: false,
  title: '',
  description: '',
  price: '',
  duration: '',
  category: '',
  level: '',
  start_date: '',
  end_date: '',
  curriculum: [{ title: '', topics: [''] }],
  installment_schedule: 'monthly',
  installment_count: '',
  installment_terms: [],
  is_active: true,
};

const SuperAdminCourses = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Course Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [imageFile, setImageFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminCourseBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadCourses = async (branchId, branchList = branches) => {
    if (!token) return;
    setCoursesLoading(true);
    setError('');

    if (branchId === 'all') {
      if (!branchList || branchList.length === 0) {
        setCourses([]);
        setCoursesLoading(false);
        return;
      }
      try {
        const results = await Promise.allSettled(
          branchList.map((b) => {
            const bId = b.id ?? b.branch_id;
            const bName = b.name || b.branch_name || '';
            return getSuperAdminBranchCoursesApi(bId, token).then((data) => {
              const list = Array.isArray(data) ? data : [];
              return list.map((c) => ({
                ...c,
                branch_id: c.branch_id || bId,
                branch_name: c.branch_name || bName,
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
        setCourses(combined);
      } catch (err) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setCoursesLoading(false);
      }
      return;
    }

    if (!branchId) {
      setCourses([]);
      setCoursesLoading(false);
      return;
    }

    const bObj = branchList.find((b) => String(b.id ?? b.branch_id) === String(branchId));
    const bName = bObj?.name || bObj?.branch_name || '';
    getSuperAdminBranchCoursesApi(branchId, token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list.map((c) => ({
          ...c,
          branch_id: c.branch_id || branchId,
          branch_name: c.branch_name || bName,
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setCoursesLoading(false));
  };

  useEffect(() => {
    if (!loading && branches.length > 0) {
      loadCourses(selectedBranchId, branches);
    }
  }, [selectedBranchId, branches, loading, token]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ ...EMPTY_COURSE, branch_ids: selectedBranchId && selectedBranchId !== 'all' ? [selectedBranchId] : [] });
    setImageFile(null);
    setFormErrors({});
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    
    let parsedCurriculum = course.curriculum;
    if (typeof parsedCurriculum === 'string') {
      try { parsedCurriculum = JSON.parse(parsedCurriculum); } 
      catch (e) { parsedCurriculum = [{ title: 'Module 1', topics: [parsedCurriculum] }]; }
    }
    if (!Array.isArray(parsedCurriculum) || parsedCurriculum.length === 0) {
      parsedCurriculum = [{ title: '', topics: [''] }];
    } else {
      parsedCurriculum = parsedCurriculum.map(c => ({
        title: c.title || c.module_title || '',
        topics: c.topics || ['']
      }));
    }

    let parsedTerms = course.installment_terms;
    if (typeof parsedTerms === 'string') {
      try { parsedTerms = JSON.parse(parsedTerms); } catch (e) { parsedTerms = []; }
    }
    if (!Array.isArray(parsedTerms)) parsedTerms = [];

    setForm({
      branch_id: course.branch_id || selectedBranchId,
      title: course.title || '',
      description: course.description || '',
      price: course.price ?? '',
      duration: course.duration || '',
      category: course.category || '',
      level: course.level || '',
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      curriculum: parsedCurriculum,
      installment_schedule: course.installment_schedule || 'monthly',
      installment_count: course.installment_count || '',
      installment_terms: parsedTerms,
      is_active: course.is_active !== undefined ? course.is_active : true,
    });
    setImageFile(null);
    setFormErrors({});
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setForm(EMPTY_COURSE);
    setImageFile(null);
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    if (name === 'installment_count') {
      const countValue = val === '' ? '' : parseInt(val, 10);
      const count = countValue || 0;
      setForm((prev) => {
        const newTerms = [...(prev.installment_terms || [])];
        if (count > newTerms.length) {
          for (let i = newTerms.length; i < count; i++) {
            newTerms.push({ amount: '', due_date: '' });
          }
        } else {
          newTerms.splice(count);
        }
        return { ...prev, installment_count: countValue, installment_terms: newTerms };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleInstallmentTermChange = (index, field, value) => {
    setForm((prev) => {
      const newTerms = [...prev.installment_terms];
      newTerms[index] = { ...newTerms[index], [field]: value };
      return { ...prev, installment_terms: newTerms };
    });
  };

  const handleModuleChange = (index, value) => {
    setForm((prev) => {
      const newCurr = [...prev.curriculum];
      newCurr[index] = { ...newCurr[index], title: value };
      return { ...prev, curriculum: newCurr };
    });
  };

  const handleTopicChange = (modIndex, topicIndex, value) => {
    setForm((prev) => {
      const newCurr = [...prev.curriculum];
      const newTopics = [...newCurr[modIndex].topics];
      newTopics[topicIndex] = value;
      newCurr[modIndex] = { ...newCurr[modIndex], topics: newTopics };
      return { ...prev, curriculum: newCurr };
    });
  };

  const addTopic = (modIndex) => {
    setForm((prev) => {
      const newCurr = [...prev.curriculum];
      newCurr[modIndex] = { ...newCurr[modIndex], topics: [...newCurr[modIndex].topics, ''] };
      return { ...prev, curriculum: newCurr };
    });
  };

  const removeTopic = (modIndex, topicIndex) => {
    setForm((prev) => {
      const newCurr = [...prev.curriculum];
      const newTopics = [...newCurr[modIndex].topics];
      newTopics.splice(topicIndex, 1);
      newCurr[modIndex] = { ...newCurr[modIndex], topics: newTopics };
      return { ...prev, curriculum: newCurr };
    });
  };

  const addModule = () => {
    setForm((prev) => ({
      ...prev,
      curriculum: [...prev.curriculum, { title: '', topics: [''] }],
    }));
  };

  const removeModule = (index) => {
    setForm((prev) => {
      const newCurr = [...prev.curriculum];
      newCurr.splice(index, 1);
      return { ...prev, curriculum: newCurr };
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    
    if (editingCourse && !form.branch_id) {
      setError('Please select a branch first.');
      return;
    }

    let validationErrors = {};
    
    if (!form.title?.trim()) validationErrors.title = "Title is required.";
    if (!form.description?.trim()) validationErrors.description = "Description is required.";
    if (!form.price) validationErrors.price = "Price is required.";
    if (!form.duration?.trim()) validationErrors.duration = "Duration is required.";
    if (!form.category?.trim()) validationErrors.category = "Category is required.";
    if (!form.level?.trim()) validationErrors.level = "Level is required.";
    if (!form.start_date) validationErrors.start_date = "Start date is required.";
    if (!form.end_date) validationErrors.end_date = "End date is required.";

    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (end < start) {
        validationErrors.end_date = "End date must be after the start date.";
      }
    }

    if (form.installment_terms?.length > 0) {
      form.installment_terms.forEach((term, index) => {
        if (!term.amount) {
           validationErrors[`installment_amount_${index}`] = "Amount is required.";
        }
        if (!term.due_date) {
           validationErrors[`installment_due_${index}`] = "Due date is required.";
        } else if (form.start_date && form.end_date) {
          const start = new Date(form.start_date);
          const end = new Date(form.end_date);
          const due = new Date(term.due_date);
          if (due < start || due > end) {
            validationErrors[`installment_due_${index}`] = `Term ${index + 1} due date must be within the course start date and end date.`;
          }
        }
      });
    }

    if (form.curriculum?.length > 0) {
       form.curriculum.forEach((mod, mIndex) => {
          if (!mod.title?.trim()) validationErrors[`module_${mIndex}`] = "Module title is required.";
          if (mod.topics?.length > 0) {
             mod.topics.forEach((topic, tIndex) => {
                if (!topic?.trim()) validationErrors[`topic_${mIndex}_${tIndex}`] = "Topic is required.";
             });
          } else {
             validationErrors[`module_${mIndex}_topics`] = "At least one topic is required.";
          }
       });
    } else {
       validationErrors.curriculum = "At least one module is required.";
    }

    if (!editingCourse && !imageFile) {
       validationErrors.image = "Course banner image is required.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setError("Please fix the highlighted errors in the form.");
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('price', String(Number(form.price) || 0));
      fd.append('duration', form.duration.trim());
      fd.append('category', form.category);
      fd.append('level', form.level);
      fd.append('start_date', form.start_date);
      fd.append('end_date', form.end_date);
      const processedCurriculum = (form.curriculum || []).map(module => ({
        title: module.title,
        topics: module.topics
      }));
      fd.append('curriculum', JSON.stringify(processedCurriculum));
      fd.append('installment_schedule', form.installment_schedule || 'monthly');
      fd.append('installment_count', String(Number(form.installment_count) || 0));
      fd.append('is_active', form.is_active);
      const processedTerms = (form.installment_terms || []).map((term, index) => ({
        term_number: index + 1,
        amount: Number(term.amount) || 0,
        due_date: term.due_date || ''
      }));
      fd.append('installment_terms', JSON.stringify(processedTerms));

      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (editingCourse) {
        await updateSuperAdminBranchCourseApi(
          form.branch_id,
          editingCourse.id ?? editingCourse.course_id,
          fd,
          token
        );
        setSuccess(`Course "${form.title}" updated successfully.`);
      } else {
        if (!form.all_branches && (!form.branch_ids || form.branch_ids.length === 0)) {
          setFormErrors({ branch_ids: 'Please select at least one branch or check "All Branches".' });
          setSaving(false);
          return;
        }

        fd.append('all_branches', form.all_branches ? 'true' : 'false');
        if (!form.all_branches) {
          form.branch_ids.forEach(id => fd.append('branch_ids', id));
        }

        await createBulkSuperAdminBranchCourseApi(fd, token);
        setSuccess(`Course "${form.title}" created successfully.`);
      }
      closeModal();
      loadCourses(selectedBranchId, branches);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to save course.';
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(', '));
      } else {
        setError(JSON.stringify(detail));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    const courseId = course.id ?? course.course_id;
    const branchIdForDelete = course.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : null);
    if (!branchIdForDelete) {
      setError('Could not identify branch for this course.');
      return;
    }
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setDeletingId(courseId);
    setError('');
    setSuccess('');
    try {
      await deleteSuperAdminBranchCourseApi(branchIdForDelete, courseId, token);
      setCourses((prev) => prev.filter((c) => (c.id ?? c.course_id) !== courseId));
      setSuccess(`"${course.title}" deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
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
        activePage="courses"
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
              Branch Courses
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
              style={{ background: '#9c6b2e' }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Course</span>
            </button>
            <button
              onClick={() => loadCourses(selectedBranchId, branches)}
              className="rounded-lg p-2 hover:bg-[#f1ede4]"
              title="Refresh courses"
            >
              <RefreshCw
                className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`}
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
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
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
                          {b.name || b.branch_name}
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
                  {courses.length} courses listed for {selectedBranchId === 'all' ? 'All Branches' : (selectedBranch?.name || selectedBranch?.branch_name || 'branch')}
                </div>
              </div>

              {/* Courses Grid */}
              {coursesLoading ? (
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
                  <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Please select a branch</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a branch from the dropdown above to view its courses.
                  </p>
                </div>
              ) : courses.length === 0 ? (
                <div
                  className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
                  style={{ borderColor: '#e3ddd0', color: '#64748b' }}
                >
                  <BookOpen className="h-10 w-10 text-sky-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    {selectedBranchId === 'all' ? 'No courses found across branches.' : 'No courses for this branch yet.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Add Course" above to create the first course.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course, idx) => (
                    <article
                      key={course.id ?? course.course_id ?? idx}
                      className="sa-rise rounded-2xl overflow-hidden flex flex-col bg-white border transition-all hover:shadow-md"
                      style={{
                        animationDelay: `${idx * 25}ms`,
                        borderColor: '#e3ddd0',
                      }}
                    >
                      {course.image ? (
                        <div className="h-40 overflow-hidden bg-slate-100">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="h-full w-full object-cover transition hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-32 items-center justify-center bg-stone-50"
                        >
                          <BookOpen
                            className="h-8 w-8"
                            style={{ color: '#a39a8c' }}
                          />
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e] bg-sky-100/70 px-2 py-0.5 rounded">
                                {course.category || 'General'}
                              </span>
                              {course.branch_name && (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {course.branch_name}
                                </span>
                              )}
                            </div>
                            <span
                              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                background:
                                  course.is_active !== false
                                    ? '#ecfdf5'
                                    : '#fef2f2',
                                color:
                                  course.is_active !== false
                                    ? '#065f46'
                                    : '#991b1b',
                              }}
                            >
                              {course.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <h3
                            className="font-bold text-base mt-2 text-slate-900 leading-snug line-clamp-2"
                          >
                            {course.title}
                          </h3>

                          {course.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 border-t pt-3 border-sky-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-xs text-slate-400">Fee</span>
                            <span
                              className="font-bold text-base flex items-center"
                              style={{ color: '#9c6b2e' }}
                            >
                              <IndianRupee className="h-3.5 w-3.5" />
                              {(Number(course.price) || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Duration: {course.duration || 'Flexible'}</span>
                            <span>Level: {course.level || 'All Levels'}</span>
                          </div>

                          {course.start_date && (
                            <div className="text-[11px] text-slate-400">
                              Schedule: {course.start_date} → {course.end_date || 'Ongoing'}
                            </div>
                          )}

                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(course)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-sky-700 bg-stone-50 border border-[#e3ddd0] hover:bg-[#f1ede4] transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(course)}
                              disabled={deletingId !== null}
                              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                              title="Delete course"
                            >
                              {deletingId === (course.id ?? course.course_id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
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

      {/* Course Modal (Create & Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="sa-rise relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border"
            style={{ borderColor: '#e3ddd0' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCourse ? 'Edit Branch Course' : 'Create New Course'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    For {selectedBranch?.name || selectedBranch?.branch_name || 'Selected Branch'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!editingCourse ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Select Branch(es) *
                  </label>
                  
                  <div className="rounded-xl border border-[#e3ddd0] bg-white p-3 space-y-2">
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 pb-3 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded border ${form.all_branches ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {form.all_branches && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-800">All Branches</span>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={form.all_branches}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm({ 
                            ...form, 
                            all_branches: checked, 
                            branch_ids: checked ? branches.map(b => String(b.id ?? b.branch_id)) : [] 
                          });
                        }}
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                      {branches.map((b) => {
                        const bId = String(b.id ?? b.branch_id);
                        const isSelected = form.all_branches || form.branch_ids.includes(bId);
                        
                        return (
                          <label key={bId} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                            <div className={`flex items-center justify-center w-5 h-5 rounded border ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                              {b.name || b.branch_name}
                            </span>
                            <input 
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={(e) => {
                                if (form.all_branches) {
                                  const allIds = branches.map(br => String(br.id ?? br.branch_id));
                                  setForm({
                                    ...form,
                                    all_branches: false,
                                    branch_ids: allIds.filter(id => id !== bId)
                                  });
                                } else {
                                  const checked = e.target.checked;
                                  let newIds = checked 
                                    ? [...form.branch_ids, bId]
                                    : form.branch_ids.filter(id => id !== bId);
                                  
                                  if (newIds.length === branches.length && branches.length > 0) {
                                    setForm({ ...form, all_branches: true, branch_ids: newIds });
                                  } else {
                                    setForm({ ...form, branch_ids: newIds });
                                  }
                                }
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {formErrors.branch_ids && <p className="text-xs text-red-500 mt-1">{formErrors.branch_ids}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Branch *
                  </label>
                  <select
                    name="branch_id"
                    required
                    value={form.branch_id}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  >
                    <option value="" disabled>Choose a branch</option>
                    {branches.map((b) => (
                      <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                        {b.name || b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Master Fashion Designing & Illustration"
                  className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Comprehensive description of the course..."
                  className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Course Fee (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    required
                    value={form.duration}
                    onChange={handleFormChange}
                    placeholder="e.g. 6 Months"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="e.g. Fashion Designing"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Level *
                  </label>
                  <input
                    type="text"
                    name="level"
                    required
                    value={form.level}
                    onChange={handleFormChange}
                    placeholder="e.g. Beginner"
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    value={form.start_date}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    required
                    value={form.end_date}
                    onChange={handleFormChange}
                    className={`w-full rounded-xl border ${formErrors.end_date ? 'border-red-500 bg-red-50' : 'border-[#e3ddd0] bg-white'} px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]`}
                  />
                  {formErrors.end_date && (
                    <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                      ⚠️ {formErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-[#e3ddd0] text-[#9c6b2e] focus:ring-[#9c6b2e]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Course is Active
                </label>
              </div>

              {/* Payment & Installments Card */}
              <div className="rounded-2xl p-6 mt-6" style={{ background: '#faf8f4', border: '1px solid #e3ddd0' }}>
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#e3ddd0]">
                      <CreditCard className="h-4 w-4" style={{ color: '#9c6b2e' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#17140f' }}>Payment & Installments</h3>
                      <p className="text-xs text-slate-500">Configure installment plans for this course.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Installment Schedule
                    </label>
                    <select
                      name="installment_schedule"
                      value={form.installment_schedule}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Installment Count
                    </label>
                    <input
                      type="number"
                      name="installment_count"
                      min="0"
                      value={form.installment_count}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-[#e3ddd0] bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]"
                    />
                  </div>
                </div>

                {form.installment_terms?.length > 0 && (
                  <div>
                    <div className="mb-4 pt-4 border-t border-[#e3ddd0]">
                      <h4 className="text-sm font-bold text-slate-800">Installment Terms</h4>
                      <p className="text-xs text-slate-400">Define amount and due date for each installment.</p>
                    </div>

                    <div className="space-y-4">
                      {form.installment_terms.map((term, index) => (
                        <div key={index} className="rounded-xl p-4 bg-white border border-[#e3ddd0]">
                          <div className="text-xs font-bold text-[#9c6b2e] uppercase tracking-wider mb-3">
                            TERM {index + 1}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Amount</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                <input
                                  type="number"
                                  value={term.amount}
                                  onChange={(e) => handleInstallmentTermChange(index, 'amount', e.target.value)}
                                  className={`w-full rounded-lg border ${formErrors[`installment_amount_${index}`] ? 'border-red-500 bg-red-50' : 'border-[#e3ddd0] bg-white'} pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]`}
                                />
                              </div>
                              {formErrors[`installment_amount_${index}`] && (
                                <p className="mt-1 text-[11px] font-semibold text-red-600">
                                  ⚠️ {formErrors[`installment_amount_${index}`]}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
                              <input
                                type="date"
                                value={term.due_date}
                                onChange={(e) => handleInstallmentTermChange(index, 'due_date', e.target.value)}
                                className={`w-full rounded-lg border ${formErrors[`installment_due_${index}`] ? 'border-red-500 bg-red-50' : 'border-[#e3ddd0] bg-white'} px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]`}
                              />
                              {formErrors[`installment_due_${index}`] && (
                                <p className="mt-1 text-[11px] font-semibold text-red-600">
                                  ⚠️ {formErrors[`installment_due_${index}`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Summary Box */}
                      <div className="rounded-xl p-4 mt-6 bg-[#eef2ea] border border-[#d5e0d5] flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                           <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#5c7a5a]">
                             <Check className="h-3.5 w-3.5 text-[#5c7a5a]" />
                           </div>
                           <div>
                             <p className="text-[11px] text-slate-500">Total Installments</p>
                             <p className="font-bold text-slate-800">₹{form.installment_terms.reduce((acc, t) => acc + (Number(t.amount) || 0), 0)}</p>
                           </div>
                         </div>
                         <div>
                           <p className="text-[11px] text-slate-500">Course Price</p>
                           <p className="font-bold text-slate-800">₹{form.price || 0}</p>
                         </div>
                         <div>
                           <p className="text-[11px] text-slate-500">Difference</p>
                           <p className="font-bold text-slate-800">
                             ₹{Number(form.price || 0) - form.installment_terms.reduce((acc, t) => acc + (Number(t.amount) || 0), 0)}
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modules and Topics Card */}
              <div className="rounded-2xl p-6 mt-6" style={{ background: '#faf8f4', border: '1px solid #e3ddd0' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Fraunces', serif", color: '#17140f' }}>Modules and topics</h3>
                    <p className="text-xs text-slate-500">Curriculum</p>
                  </div>
                  <button
                    type="button"
                    onClick={addModule}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e3ddd0] rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Module
                  </button>
                </div>
                
                <div className="space-y-4">
                  {form.curriculum?.map((module, modIdx) => (
                    <div key={modIdx} className="rounded-xl p-4 bg-white border border-[#e3ddd0]">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="text"
                          placeholder={`Module ${modIdx + 1} title`}
                          value={module.title}
                          onChange={(e) => handleModuleChange(modIdx, e.target.value)}
                          className={`flex-1 rounded-lg border ${formErrors[`module_${modIdx}`] ? 'border-red-500 bg-red-50' : 'border-[#e3ddd0] bg-white'} px-3 py-2 text-sm focus:outline-none focus:border-[#9c6b2e]`}
                        />
                        <button
                          type="button"
                          onClick={() => removeModule(modIdx)}
                          className="text-slate-400 hover:text-rose-500 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {formErrors[`module_${modIdx}`] && (
                        <p className="mb-3 text-[11px] font-semibold text-red-600">
                          ⚠️ {formErrors[`module_${modIdx}`]}
                        </p>
                      )}
                      {formErrors[`module_${modIdx}_topics`] && (
                        <p className="mb-3 text-[11px] font-semibold text-red-600">
                          ⚠️ {formErrors[`module_${modIdx}_topics`]}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        {module.topics?.map((topic, topicIdx) => (
                          <div key={topicIdx}>
                            <div className="flex items-center gap-3 ml-4">
                              <input
                                type="text"
                                placeholder="Topic covered"
                                value={topic}
                                onChange={(e) => handleTopicChange(modIdx, topicIdx, e.target.value)}
                                className={`flex-1 rounded-lg border ${formErrors[`topic_${modIdx}_${topicIdx}`] ? 'border-red-500 bg-red-50' : 'border-[#e3ddd0] bg-white'} px-3 py-1.5 text-sm focus:outline-none focus:border-[#9c6b2e]`}
                              />
                              <button
                                type="button"
                                onClick={() => removeTopic(modIdx, topicIdx)}
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {formErrors[`topic_${modIdx}_${topicIdx}`] && (
                              <p className="ml-4 mt-1 text-[11px] font-semibold text-red-600">
                                ⚠️ {formErrors[`topic_${modIdx}_${topicIdx}`]}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="ml-4 pt-1">
                          <button
                            type="button"
                            onClick={() => addTopic(modIdx)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#9c6b2e] hover:opacity-80"
                          >
                            <Plus className="h-3 w-3" />
                            Add topic
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!form.curriculum || form.curriculum.length === 0) && (
                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-[#e3ddd0]">
                      <p className="text-xs text-slate-500 mb-2">No modules defined.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Course Banner Image {editingCourse ? '(Leave empty to keep existing)' : '*'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-50 file:text-sky-700 hover:file:bg-sky-100 ${formErrors.image ? 'text-red-500 border border-red-500 p-1 rounded-xl bg-red-50' : 'text-slate-500'}`}
                  />
                </div>
                {formErrors.image && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    ⚠️ {formErrors.image}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-sky-100">
                <button
                  type="button"
                  onClick={closeModal}
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
                  ) : editingCourse ? (
                    <Edit3 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving
                    ? 'Saving Course...'
                    : editingCourse
                    ? 'Save Changes'
                    : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCourses;
