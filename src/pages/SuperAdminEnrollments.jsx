import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit3,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Users,
  Eye,
  CreditCard,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminEnrollmentBranchesApi,
  getSuperAdminBranchEnrollmentCoursesApi,
  getSuperAdminCourseStudentsApi,
  updateSuperAdminBranchStudentApi,
} from '../services/superadmin';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;


const SuperAdminEnrollments = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // View Details modal state
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSuperAdminEnrollmentBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleBranchChange = (newBranchId) => {
    setSelectedBranchId(newBranchId);
    setSelectedCourseId('all');
    setError('');
  };

  useEffect(() => {
    if (!token || branches.length === 0) return;
    setCoursesLoading(true);
    setError('');

    if (selectedBranchId === 'all') {
      Promise.allSettled(
        branches.map(async (b) => {
          const bId = b.id ?? b.branch_id;
          const bName = b.name || b.branch_name || '';
          const data = await getSuperAdminBranchEnrollmentCoursesApi(bId, token);
          const list = Array.isArray(data) ? data : [];
          return list.map((c) => ({
            ...c,
            branch_id: c.branch_id || bId,
            branch_name: c.branch_name || bName,
          }));
        })
      )
        .then((results) => {
          const combinedCourses = [];
          results.forEach((r) => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
              combinedCourses.push(...r.value);
            }
          });
          setCourses(combinedCourses);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setCoursesLoading(false);
        });
    } else {
      const bObj = branches.find((b) => String(b.id ?? b.branch_id) === String(selectedBranchId));
      const bName = bObj?.name || bObj?.branch_name || '';
      getSuperAdminBranchEnrollmentCoursesApi(selectedBranchId, token)
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setCourses(
            list.map((c) => ({
              ...c,
              branch_id: c.branch_id || selectedBranchId,
              branch_name: c.branch_name || bName,
            }))
          );
        })
        .catch((err) => setError(err.message))
        .finally(() => setCoursesLoading(false));
    }
  }, [selectedBranchId, branches, token]);

  const loadStudents = async (branchId, courseId, currentCourses = courses) => {
    if (!token) return;
    setStudentsLoading(true);
    setError('');

    if (courseId === 'all') {
      if (!currentCourses || currentCourses.length === 0) {
        setStudents([]);
        setStudentsLoading(false);
        return;
      }
      try {
        const results = await Promise.allSettled(
          currentCourses.map(async (c) => {
            const bId = c.branch_id || (branchId !== 'all' ? branchId : null);
            const cId = c.id ?? c.course_id;
            if (!bId || !cId) return [];
            const sData = await getSuperAdminCourseStudentsApi(bId, cId, token);
            const list = Array.isArray(sData) ? sData : (sData?.students ?? Object.values(sData ?? {}));
            return (Array.isArray(list) ? list : []).map((s) => ({
              ...s,
              branch_id: s.branch_id || bId,
              branch_name: s.branch_name || c.branch_name || '',
              course_id: s.course_id || cId,
              course_title: s.course_title || c.title || c.course_title || '',
            }));
          })
        );
        const combined = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            combined.push(...r.value);
          }
        });
        setStudents(combined);
      } catch (err) {
        setError(err.message || 'Failed to load students.');
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
      return;
    }

    // Specific course selected
    const foundCourse = currentCourses.find((c) => String(c.id ?? c.course_id) === String(courseId));
    const bId = foundCourse?.branch_id || (branchId !== 'all' ? branchId : null);
    if (!bId) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    getSuperAdminCourseStudentsApi(bId, courseId, token)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.students ?? Object.values(data ?? {}));
        const enriched = (Array.isArray(list) ? list : []).map((s) => ({
          ...s,
          branch_id: s.branch_id || bId,
          branch_name: s.branch_name || foundCourse?.branch_name || '',
          course_id: s.course_id || courseId,
          course_title: s.course_title || foundCourse?.title || foundCourse?.course_title || '',
        }));
        setStudents(enriched);
      })
      .catch((err) => {
        setError(err.message);
        setStudents([]);
      })
      .finally(() => setStudentsLoading(false));
  };

  useEffect(() => {
    if (!token || coursesLoading) return;
    if (courses.length === 0) {
      setStudents([]);
      return;
    }
    loadStudents(selectedBranchId, selectedCourseId, courses);
  }, [selectedBranchId, selectedCourseId, courses, coursesLoading, token]);

  const openViewDetails = (s) => {
    setSelectedStudent(s);
    setError('');
    setSuccess('');
  };

  const closeViewDetails = () => {
    setSelectedStudent(null);
  };

  const selectedBranch = branches.find(
    (b) => String(b.id ?? b.branch_id) === String(selectedBranchId)
  );
  const selectedCourse = courses.find(
    (c) => String(c.id ?? c.course_id) === String(selectedCourseId)
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
        activePage="enrollments"
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
              Course Enrollments
            </h1>
          </div>
          <button
            onClick={() => loadStudents(selectedBranchId, selectedCourseId, courses)}
            className="rounded-lg p-2 hover:bg-[#f1ede4]"
            title="Refresh students"
          >
            <RefreshCw
              className={`h-4 w-4 ${studentsLoading ? 'animate-spin' : ''}`}
              style={{ color: '#9c6b2e' }}
            />
          </button>
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
              {/* Breadcrumb selectors */}
              <div
                className="flex flex-wrap items-center gap-3 rounded-2xl p-4 bg-white border shadow-2xs"
                style={{ borderColor: '#e3ddd0' }}
              >
                <GraduationCap
                  className="h-5 w-5 shrink-0"
                  style={{ color: '#9c6b2e' }}
                />

                {/* Branch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Branch:
                  </span>
                  <div className="relative">
                    <select
                      value={selectedBranchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="appearance-none rounded-xl border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-sky-50"
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
                      className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                      style={{ color: '#a39a8c' }}
                    />
                  </div>
                </div>

                <ChevronRight className="h-4 w-4" style={{ color: '#a39a8c' }} />

                {/* Course */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Course:
                  </span>
                  <div className="relative">
                    {coursesLoading ? (
                      <div
                        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs bg-sky-50"
                        style={{ borderColor: '#e3ddd0', color: '#9c6b2e' }}
                      >
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <select
                        value={selectedCourseId}
                        onChange={(e) => {
                          setSelectedCourseId(e.target.value);
                          setError('');
                        }}
                        className="appearance-none rounded-xl border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-sky-50"
                        style={{ borderColor: '#e3ddd0', color: '#17140f' }}
                        disabled={courses.length === 0}
                      >
                        <option value="all">All Courses</option>
                        {courses.map((c, idx) => (
                          <option
                            key={`${c.id ?? c.course_id}-${c.branch_id ?? idx}`}
                            value={String(c.id ?? c.course_id)}
                          >
                            {c.title || c.course_title} {selectedBranchId === 'all' && c.branch_name ? `(${c.branch_name})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <ChevronDown
                      className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                      style={{ color: '#a39a8c' }}
                    />
                  </div>
                </div>

                <span
                  className="text-xs font-semibold text-sky-700 bg-sky-100/60 px-3 py-1 rounded-full ml-auto"
                >
                  {students.length} enrolled students
                </span>
              </div>

              {/* Students Table */}
              {studentsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2
                    className="h-7 w-7 animate-spin"
                    style={{ color: '#9c6b2e' }}
                  />
                </div>
              ) : students.length === 0 ? (
                <div
                  className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
                  style={{ borderColor: '#e3ddd0', color: '#64748b' }}
                >
                  <Users className="h-10 w-10 text-sky-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No students enrolled.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When students enroll or are registered by the branch admin, they will appear here.
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-2xl overflow-hidden bg-white border shadow-2xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          style={{
                            background: '#faf8f4',
                            borderBottom: '1px solid #e3ddd0',
                          }}
                        >
                          {[
                            'Student',
                            'Contact',
                            'Qualification',
                            'Total Fee',
                            'Paid',
                            'Balance',
                            'Installments',
                            'Status',
                            'Action',
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                              style={{ color: '#0284c7' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => {
                          const enrollmentId = s.enrollment_id ?? s.id ?? i;
                          return (
                            <tr
                              key={enrollmentId}
                              className="transition hover:bg-sky-50/70"
                              style={{ borderBottom: '1px solid #f1ede4' }}
                            >
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900">
                                  {s.name || s.student_name || '—'}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID #{enrollmentId}
                                  </span>
                                  {(s.course_title || selectedCourse?.title) && (
                                    <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                      {s.course_title || selectedCourse?.title}
                                    </span>
                                  )}
                                  {(s.branch_name || selectedBranch?.name) && (
                                    <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {s.branch_name || selectedBranch?.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-600 space-y-1">
                                <p className="flex items-center gap-1.5 font-medium">
                                  <Phone className="h-3 w-3 text-sky-500" />
                                  {s.phone || '—'}
                                </p>
                                <p className="flex items-center gap-1.5 text-slate-500">
                                  <Mail className="h-3 w-3 text-sky-500" />
                                  {s.email || '—'}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-600">
                                {s.highest_qualification || s.qualification || '—'}
                              </td>
                              <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                ₹{Number(s.total_fee || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-4 text-xs font-semibold text-emerald-600">
                                ₹{Number(s.total_paid || 0).toLocaleString('en-IN')}
                              </td>
                              <td className={`px-5 py-4 text-xs font-semibold ${Number(s.balance_amount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ₹{Number(s.balance_amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                                {s.paid_installment_count || 0} / {s.installment_count || 0}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    background: String(s.status).toLowerCase() === 'paid' ? '#ecfdf5' : '#fff7ed',
                                    color: String(s.status).toLowerCase() === 'paid' ? '#065f46' : '#9a3412',
                                    border: String(s.status).toLowerCase() === 'paid' ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                                  }}
                                >
                                  {s.status || 'Pending'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => openViewDetails(s)}
                                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition shadow-2xs whitespace-nowrap"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="sa-rise relative w-full max-w-5xl rounded-3xl bg-[#faf8f4] shadow-2xl border border-[#e3ddd0] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-[#e3ddd0] bg-white rounded-t-3xl shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedStudent.name || selectedStudent.student_name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-xs font-semibold">
                      Enrollment #{selectedStudent.enrollment_id ?? selectedStudent.id}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen className="h-3.5 w-3.5" />
                      {selectedStudent.course_title || selectedCourse?.title || selectedCourse?.course_title}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeViewDetails}
                className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Student & Parent info) */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-white rounded-2xl p-5 border border-[#e3ddd0] shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-sky-600" />
                      Student Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Name</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Enrollment ID</p>
                        <p className="font-semibold text-slate-900 font-mono">#{selectedStudent.enrollment_id ?? selectedStudent.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="font-semibold text-slate-900 break-all">{selectedStudent.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Phone</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Highest Qualification</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.highest_qualification || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500 mb-1">Address</p>
                        <p className="font-medium text-slate-800">{selectedStudent.address || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#e3ddd0] shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-600" />
                      Parent / Guardian
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Parent Name</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.parent_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Parent Phone</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.parent_phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Course info & Status) */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-5 border border-[#e3ddd0] shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-sky-600" />
                      Course Information
                    </h3>
                    {selectedStudent.course_image && (
                      <div className="mb-4 rounded-xl overflow-hidden h-32 bg-slate-100">
                        <img src={selectedStudent.course_image} alt="Course" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Course Name</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.course_title || selectedCourse?.title || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Duration</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.course_duration || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Course Fee</p>
                        <p className="font-bold text-emerald-700">₹{Number(selectedStudent.total_fee || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#e3ddd0] shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sky-600" />
                      Status & Approval
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-slate-600">Enrollment Status</span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-1 rounded-md tracking-wider ${
                          String(selectedStudent.status).toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          String(selectedStudent.status).toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedStudent.status || '—'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-slate-600">Branch Approval</span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-1 rounded-md tracking-wider ${
                          String(selectedStudent.branch_approval_status).toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          String(selectedStudent.branch_approval_status).toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                          String(selectedStudent.branch_approval_status).toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedStudent.branch_approval_status || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Super Admin Approval</span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-1 rounded-md tracking-wider ${
                          String(selectedStudent.super_admin_approval_status).toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          String(selectedStudent.super_admin_approval_status).toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                          String(selectedStudent.super_admin_approval_status).toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedStudent.super_admin_approval_status || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm bg-linear-to-br from-white to-sky-50/30">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Fee</p>
                    <p className="text-xl font-bold text-slate-800">₹{Number(selectedStudent.total_fee || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-emerald-600">₹{Number(selectedStudent.total_paid || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className={`bg-white rounded-xl p-4 border shadow-xs ${Number(selectedStudent.balance_amount || 0) > 0 ? 'border-rose-100' : 'border-emerald-100'}`}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Balance</p>
                    <p className={`text-xl font-bold ${Number(selectedStudent.balance_amount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{Number(selectedStudent.balance_amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-sky-100 shadow-xs">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Installments</p>
                    <p className="text-xl font-bold text-sky-700">{selectedStudent.paid_installment_count || 0} / {selectedStudent.installment_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-xs overflow-hidden">
                <div className="p-5 border-b border-[#e3ddd0]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-600" />
                    Installment Schedule
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#faf8f4] border-b border-[#e3ddd0]">
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Term</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede4]">
                      {selectedStudent.installments && selectedStudent.installments.length > 0 ? (
                        selectedStudent.installments.map((inst, idx) => (
                          <tr key={inst.installment_id || idx} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-3 font-medium text-slate-800">Term {inst.installment_number}</td>
                            <td className="px-5 py-3 font-medium text-slate-700">₹{Number(inst.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-emerald-600 font-medium">₹{Number(inst.paid_amount || 0).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-rose-600 font-medium">₹{Number(inst.remaining_amount || 0).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-slate-600">{inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                String(inst.status).toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                String(inst.status).toLowerCase() === 'partial' || String(inst.status).toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {inst.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                            No installment data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-xs overflow-hidden">
                <div className="p-5 border-b border-[#e3ddd0]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-sky-600" />
                    Payment History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#faf8f4] border-b border-[#e3ddd0]">
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Installment</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Method</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede4]">
                      {selectedStudent.payments && selectedStudent.payments.length > 0 ? (
                        selectedStudent.payments.map((pay, idx) => {
                          let mappedMethod = pay.payment_method;
                          if (mappedMethod === 'cash_upi') mappedMethod = 'Cash + UPI';
                          else if (mappedMethod === 'cash') mappedMethod = 'Cash';
                          else if (mappedMethod === 'upi') mappedMethod = 'UPI';
                          else if (mappedMethod === 'razorpay') mappedMethod = 'Razorpay';
                          else if (mappedMethod) mappedMethod = mappedMethod.charAt(0).toUpperCase() + mappedMethod.slice(1);
                          
                          return (
                            <tr key={pay.id || idx} className="hover:bg-slate-50 transition">
                              <td className="px-5 py-3 font-mono text-slate-500 text-xs">#{pay.id}</td>
                              <td className="px-5 py-3 font-medium text-slate-800">Term {pay.installment_number}</td>
                              <td className="px-5 py-3 font-bold text-emerald-700">₹{Number(pay.amount || 0).toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3 text-slate-600">₹{Number(pay.cash_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3 text-slate-600">₹{Number(pay.upi_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3 font-medium text-slate-700">{mappedMethod || '—'}</td>
                              <td className="px-5 py-3 text-slate-600">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  String(pay.status || 'received').toLowerCase() === 'received' || String(pay.status || 'received').toLowerCase() === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                  String(pay.status || 'received').toLowerCase() === 'failed' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {pay.status || 'Received'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-5 py-8 text-center text-slate-500 text-sm">
                            No payment history available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer row: Razorpay details */}
              {(selectedStudent.razorpay_order_id || selectedStudent.razorpay_payment_id) && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400 border-t border-slate-200 pt-6 mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Payment Gateway Details</span>
                    <span>Order ID: <span className="font-mono text-slate-600">{selectedStudent.razorpay_order_id || 'Not applicable'}</span></span>
                    <span>Payment ID: <span className="font-mono text-slate-600">{selectedStudent.razorpay_payment_id || 'Not applicable'}</span></span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEnrollments;
