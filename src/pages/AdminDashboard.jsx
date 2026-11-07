import NavLogoutButton from "../components/common/NavLogoutButton";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAllCoursesApi, 
  addCourseApi, 
  updateCourseApi, 
  deleteCourseApi 
} from '../services/courses';
import { getUsersApi, changeAdminPasswordApi } from '../services/auth';
import { getSettingsApi, updateSettingsApi } from '../services/settings';
import { 
  getAllEnquiriesApi, 
  updateEnquiryStatusApi, 
  deleteEnquiryApi 
} from '../services/enquiries';
import CurriculumBuilder from '../components/admin/CurriculumBuilder';
import { 
  LayoutDashboard,
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  ArrowLeft,
  Search,
  Clock,
  Layers,
  GraduationCap,
  X,
  ShieldAlert,
  Menu,
  MessageSquare,
  Settings,
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Filter,
  Save,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'courses', 'users', 'enquiries', 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal state for Courses
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('Beginner');
  // Dynamic Curriculum Sections State
  const [curriculumSections, setCurriculumSections] = useState([
    {
      title: 'Week 1',
      topics: ['']
    }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  // Delete Confirmation State
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  // Real Database Students / Users Data
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Real Database Enquiries Data & Filter State
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiryTab, setEnquiryTab] = useState('all'); // 'all', 'course', 'general'

  // Admin Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Institute Settings State
  const [instituteAddress, setInstituteAddress] = useState('');
  const [institutePhone, setInstitutePhone] = useState('');
  const [instituteAltPhone, setInstituteAltPhone] = useState('');
  const [instituteEmail, setInstituteEmail] = useState('');
  const [instituteAdmissionsEmail, setInstituteAdmissionsEmail] = useState('');
  const [instituteWorkingHours, setInstituteWorkingHours] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await changeAdminPasswordApi(
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        token
      );

      setPasswordSuccess('Admin password updated successfully!');
      setSuccessMsg('Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fetch Institute & Counselor Settings
  const fetchSettings = async () => {
    try {
      const data = await getSettingsApi();
      if (data) {
        setInstituteAddress(data.address || '');
        setInstitutePhone(data.phone || '');
        setInstituteAltPhone(data.alt_phone || '');
        setInstituteEmail(data.email || '');
        setInstituteAdmissionsEmail(data.admissions_email || '');
        setInstituteWorkingHours(data.working_hours || '');
      }
    } catch (err) {
      console.error('Failed to fetch institute settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    try {
      setSavingSettings(true);
      await updateSettingsApi(
        {
          address: instituteAddress,
          phone: institutePhone,
          alt_phone: instituteAltPhone,
          email: instituteEmail,
          admissions_email: instituteAdmissionsEmail,
          working_hours: instituteWorkingHours,
        },
        token
      );

      setSettingsSuccess('Institute & Counselor contact settings saved successfully!');
      setSuccessMsg('Institute & Counselor contact settings saved successfully!');
    } catch (err) {
      setSettingsError(err.message || 'Failed to update institute settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getAllCoursesApi();
      setCourses(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Real Registered Student Users from Database (Excluding Admins)
  const fetchStudents = async () => {
    if (!token) return;
    try {
      setLoadingStudents(true);
      const data = await getUsersApi(token);
      const studentUsers = data.filter((u) => u.role !== 'admin');
      setStudents(studentUsers);
    } catch (err) {
      console.error('Failed to fetch real database users:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch Real Admission Enquiries from Database API
  const fetchEnquiries = async () => {
    if (!token) return;
    try {
      setLoadingEnquiries(true);
      const data = await getAllEnquiriesApi(token);
      setEnquiries(data);
    } catch (err) {
      console.error('Failed to fetch real database enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchEnquiries();
    fetchSettings();
  }, [token]);

  const openAddModal = () => {
    setErrorMsg('');
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setDuration('');
    setCategory('');
    setLevel('Beginner');
    setCurriculumSections([
      {
        title: 'Week 1',
        topics: [
          'Introduction to Course',
          'Basic Fundamentals & Tools'
        ]
      }
    ]);
    setImageFile(null);
    setPreviewImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setErrorMsg('');
    setEditingCourse(course);
    setTitle(course.title || '');
    setDescription(course.description || '');
    setPrice(course.price || '');
    setDuration(course.duration || '');
    setCategory(course.category || 'fashion-designing');
    setLevel(course.level || 'Beginner');
    
    let loadedCurriculum = course.curriculum;
    if (typeof loadedCurriculum === 'string') {
      try {
        loadedCurriculum = JSON.parse(loadedCurriculum);
      } catch {
        loadedCurriculum = null;
      }
    }

    if (Array.isArray(loadedCurriculum) && loadedCurriculum.length > 0) {
      if (typeof loadedCurriculum[0] === 'object' && loadedCurriculum[0] !== null && loadedCurriculum[0].title) {
        setCurriculumSections(loadedCurriculum.map(sec => ({
          title: sec.title || 'Section',
          topics: Array.isArray(sec.topics) && sec.topics.length > 0 ? sec.topics : ['']
        })));
      } else {
        setCurriculumSections(loadedCurriculum.map((item, idx) => ({
          title: `Section ${idx + 1}`,
          topics: [String(item)]
        })));
      }
    } else {
      setCurriculumSections([
        {
          title: 'Week 1',
          topics: ['']
        }
      ]);
    }

    setImageFile(null);
    setPreviewImage(course.image ? `http://localhost:8000/${course.image}` : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setErrorMsg('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || !description || !price || !duration || !category || !level) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!editingCourse && !imageFile) {
      setErrorMsg('Please upload a course thumbnail image.');
      return;
    }

    // Clean curriculum sections & filter out empty values
    const cleanedCurriculum = curriculumSections
      .map((sec) => ({
        title: sec.title.trim(),
        topics: sec.topics.map((t) => t.trim()).filter(Boolean)
      }))
      .filter((sec) => sec.title && sec.topics.length > 0);

    if (cleanedCurriculum.length === 0) {
      setErrorMsg('Please add at least one curriculum section with a title and at least one topic.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', parseFloat(price));
      formData.append('duration', duration);
      formData.append('category', category);
      formData.append('level', level);
      formData.append('curriculum', JSON.stringify(cleanedCurriculum));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingCourse) {
        await updateCourseApi(editingCourse.id, formData, token);
        setSuccessMsg(`Course "${title}" updated successfully!`);
      } else {
        await addCourseApi(formData, token);
        setSuccessMsg(`Course "${title}" created successfully!`);
      }

      closeModal();
      await fetchCourses();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteCourseApi(courseId, token);
      setSuccessMsg('Course deleted successfully!');
      setDeletingCourseId(null);
      await fetchCourses();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete course.');
    }
  };

  const updateEnquiryStatus = async (id, newStatus) => {
    if (!token) return;
    try {
      await updateEnquiryStatusApi(id, newStatus, token);
      setEnquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      setSuccessMsg(`Enquiry #${id} status updated to "${newStatus}"`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update enquiry status.');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!token || !window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await deleteEnquiryApi(id, token);
      setEnquiries(prev => prev.filter(item => item.id !== id));
      setSuccessMsg(`Enquiry #${id} deleted successfully.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete enquiry.');
    }
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredCourses = courses.filter((c) => {
    if (!q) return true;
    const titleMatch = c.title ? String(c.title).toLowerCase().includes(q) : false;
    const categoryMatch = c.category ? String(c.category).toLowerCase().includes(q) : false;
    const descriptionMatch = c.description ? String(c.description).toLowerCase().includes(q) : false;
    const levelMatch = c.level ? String(c.level).toLowerCase().includes(q) : false;
    return titleMatch || categoryMatch || descriptionMatch || levelMatch;
  });

  const filteredStudents = students.filter((s) => {
    if (!q) return true;
    const nameMatch = s.name ? String(s.name).toLowerCase().includes(q) : false;
    const emailMatch = s.email ? String(s.email).toLowerCase().includes(q) : false;
    const phoneMatch = s.phone ? String(s.phone).toLowerCase().includes(q) : false;
    const courseMatch = s.course ? String(s.course).toLowerCase().includes(q) : false;
    const roleMatch = s.role ? String(s.role).toLowerCase().includes(q) : false;
    return nameMatch || emailMatch || phoneMatch || courseMatch || roleMatch;
  });

  const isGeneralEnquiry = (e) => {
    if (!e) return false;
    const c = String(e.course || '').toLowerCase().trim();
    return c === '' || c === 'general inquiry' || c.includes('general') || c.includes('inquiry') || Boolean(e.message && !c.includes('diploma') && !c.includes('course') && !c.includes('development') && !c.includes('management') && !c.includes('design'));
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const isGen = isGeneralEnquiry(e);
    if (enquiryTab === 'course' && isGen) return false;
    if (enquiryTab === 'general' && !isGen) return false;

    if (!q) return true;
    const nameMatch = e.name ? String(e.name).toLowerCase().includes(q) : false;
    const emailMatch = e.email ? String(e.email).toLowerCase().includes(q) : false;
    const courseMatch = e.course ? String(e.course).toLowerCase().includes(q) : false;
    const messageMatch = e.message ? String(e.message).toLowerCase().includes(q) : false;
    const phoneMatch = e.phone ? String(e.phone).toLowerCase().includes(q) : false;
    return nameMatch || emailMatch || courseMatch || messageMatch || phoneMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* MOBILE TOP NAV WITH SIDEBAR TOGGLE */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            <span className="font-extrabold text-slate-900 text-base">Aurumfx Admin</span>
          </div>
        </div>

        {/* LOGOUT OPTION - KEPT AS IS */}
        <button
          onClick={logout}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY WHEN SIDEBAR IS OPEN */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs z-35 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:static shrink-0 shadow-sm`}
      >
        <div>
          {/* Sidebar Header / Logo */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-base tracking-tight leading-none">
                  Aurumfx
                </h1>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items (5 Mandatory Sections Requested) */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>

            {/* 1. Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 2. Courses Management */}
            <button
              onClick={() => { setActiveTab('courses'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span>Courses</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'courses' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {courses.length}
              </span>
            </button>

            {/* 3. Users / Students */}
            <button
              onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Users / Students</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'users' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {students.length}
              </span>
            </button>

            {/* 4. Enquiries */}
            <button
              onClick={() => { setActiveTab('enquiries'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>Enquiries</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'enquiries' ? 'bg-slate-950 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {enquiries.filter(e => e.status === 'New').length} New
              </span>
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info & Logout (SIGN OUT OPTIONS KEPT INTACT) */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-extrabold text-slate-900 truncate">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 truncate">
                {user?.email || 'admin@aurumfx.com'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOP BAR / HEADER */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight capitalize">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'courses' && 'Course Catalog Management'}
              {activeTab === 'users' && 'Users & Student Accounts'}
              {activeTab === 'enquiries' && 'Student Admission Enquiries'}
              {activeTab === 'settings' && 'System & Portal Settings'}
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="p-6 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">

          {/* Success & Error Alert Messages */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900 font-semibold text-sm shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-center justify-between text-rose-900 font-semibold text-sm shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-950">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            <div 
              onClick={() => setActiveTab('courses')}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Courses</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-950">{courses.length}</div>
              <p className="text-xs text-slate-500 font-medium">Active catalog listings</p>
            </div>

            <div 
              onClick={() => setActiveTab('users')}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Students & Users</span>
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-950">{students.length}</div>
              <p className="text-xs text-slate-500 font-medium">Registered portal accounts</p>
            </div>

            <div 
              onClick={() => setActiveTab('enquiries')}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">New Enquiries</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-950">{enquiries.length}</div>
              <p className="text-xs text-slate-500 font-medium">{enquiries.filter(e => e.status === 'New').length} pending follow-ups</p>
            </div>

          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Welcome Banner Card (Shown ONLY on Dashboard) */}
              <div className="bg-gradient-to-r from-amber-100/70 via-amber-50 to-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-200/80 text-amber-950 text-xs font-extrabold uppercase tracking-wider mb-3 border border-amber-300">
                      <span>Control Center Active</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Welcome back, {user?.name || 'Administrator'} 👋
                    </h1>
                    <p className="mt-2 text-slate-600 text-sm max-w-xl font-normal leading-relaxed">
                      Manage active course offerings, track student inquiries, oversee user roles, and customize portal configuration.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Recent Enquiries Summary */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-950">Recent Student Enquiries</h3>
                      <p className="text-xs text-slate-500 font-medium">Latest admission requests submitted online</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('enquiries')}
                      className="text-xs font-extrabold text-amber-700 hover:text-amber-900"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {enquiries.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-2xl border border-slate-100">
                        {loadingEnquiries ? 'Loading enquiries...' : 'No enquiries received yet.'}
                      </div>
                    ) : (
                      enquiries.slice(0, 4).map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.course || 'General Inquiry'} • {item.email}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            item.status === 'New' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            item.status === 'Contacted' ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Quick Course Catalog Overview */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-950">Active Courses Overview</h3>
                      <p className="text-xs text-slate-500 font-medium">{courses.length} courses loaded from API</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('courses')}
                      className="text-xs font-extrabold text-amber-700 hover:text-amber-900"
                    >
                      Manage →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {courses.slice(0, 4).map((c) => (
                      <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 line-clamp-1">{c.title}</div>
                            <div className="text-[10px] text-slate-500">{c.category} • ₹{c.price}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">ID #{c.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: COURSES MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                    Course Offerings ({filteredCourses.length})
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                    Manage active diploma and certification programs.
                  </p>
                </div>

                {/* Search Bar & Add Course Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search course title..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Course</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-sm font-bold text-slate-600">Fetching courses from database...</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    {searchQuery ? 'No course matches your search query.' : 'Click "Add Course" to create your first course offering.'}
                  </p>
                  <button
                    onClick={openAddModal}
                    className="mt-4 px-5 py-2.5 bg-slate-950 text-white font-bold text-xs rounded-full inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-amber-400" /> Add Course
                  </button>
                </div>
              ) : (
                /* Course Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 rounded-l-xl">ID</th>
                        <th className="py-3.5 px-4">Course Info</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Duration / Level</th>
                        <th className="py-3.5 px-4">Course Fee</th>
                        <th className="py-3.5 px-4 rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-slate-950">
                            #{course.id}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                {course.image ? (
                                  <img
                                    src={`http://localhost:8000/${course.image}`}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm line-clamp-1">
                                  {course.title}
                                </div>
                                <div className="text-slate-500 text-[11px] line-clamp-1 max-w-md">
                                  {course.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {course.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 space-y-0.5">
                            <div className="font-bold text-slate-900">{course.duration}</div>
                            <div className="text-[11px] text-slate-500">{course.level}</div>
                          </td>
                          <td className="py-4 px-4 font-black text-slate-950 text-sm">
                            ₹{course.price}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(course)}
                                className="py-1.5 px-3 bg-white hover:bg-amber-100 text-slate-900 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setDeletingCourseId(course.id)}
                                className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: USERS / STUDENTS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                    Users & Student Directory ({filteredStudents.length})
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                    Manage student accounts, user permissions, and enrollment access.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student name or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 rounded-l-xl">User ID</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Enrolled Course</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500 font-semibold">
                          {loadingStudents ? 'Loading registered students...' : 'No registered student users found in database.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-slate-950">#{s.id}</td>
                          <td className="py-4 px-4 font-bold text-slate-900">{s.name}</td>
                          <td className="py-4 px-4 text-slate-600">{s.email}</td>
                          <td className="py-4 px-4 text-slate-700 font-medium">{s.phone || '-'}</td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                              STUDENT
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-800 font-semibold">{s.course || 'Registered Student'}</td>
                          <td className="py-4 px-4 text-slate-500">
                            {s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              s.is_active !== false ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {s.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                    Admission Applications & General Enquiries ({filteredEnquiries.length})
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                    Manage online course applications and public general helpdesk enquiries.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter Sub-Tabs */}
                  <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEnquiryTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        enquiryTab === 'all'
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({enquiries.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryTab('course')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        enquiryTab === 'course'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Course Applications ({enquiries.filter(e => !isGeneralEnquiry(e)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryTab('general')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        enquiryTab === 'general'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      General Enquiries ({enquiries.filter(e => isGeneralEnquiry(e)).length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, course or message..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Enquiries Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 rounded-l-xl">Ref ID</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Sender Name</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Program / Subject</th>
                      <th className="py-3.5 px-4">Message Details</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredEnquiries.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-500 font-semibold">
                          {loadingEnquiries ? 'Loading enquiries...' : 'No enquiries found for this section.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEnquiries.map((e) => {
                        const isGen = isGeneralEnquiry(e);
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-4 font-mono font-extrabold text-slate-950">#EQ-{e.id}</td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                                isGen ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {isGen ? 'General Enquiry' : 'Course Application'}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900">{e.name}</td>
                            <td className="py-4 px-4 space-y-0.5">
                              <div className="text-slate-900 font-semibold">{e.phone || '-'}</div>
                              <div className="text-slate-500 text-[11px]">{e.email}</div>
                            </td>
                            <td className="py-4 px-4 font-bold text-amber-900">{e.course || 'General Inquiry'}</td>
                            <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={e.message || '-'}>
                              {e.message || '-'}
                            </td>
                            <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                              {e.created_at ? new Date(e.created_at).toISOString().split('T')[0] : (e.date || 'N/A')}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                e.status === 'New' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                e.status === 'Contacted' ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                                e.status === 'Resolved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 flex items-center gap-2">
                              <select
                                value={e.status}
                                onChange={(event) => updateEnquiryStatus(e.id, event.target.value)}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-800 cursor-pointer"
                              >
                                <option value="New">Mark New</option>
                                <option value="Contacted">Mark Contacted</option>
                                <option value="Admitted">Mark Admitted</option>
                                <option value="Resolved">Mark Resolved</option>
                              </select>
                              <button
                                onClick={() => handleDeleteEnquiry(e.id)}
                                title="Delete Enquiry"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              {/* Main Portal & Institute Contact Settings Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                      Institute & Contact Information
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                      Update campus location, phone numbers, counselor emails, and working hours.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase rounded-full">
                    Counselor Portal
                  </span>
                </div>

                {settingsError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                    <span>{settingsError}</span>
                  </div>
                )}

                {settingsSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Campus Location Address
                    </label>
                    <input
                      type="text"
                      value={instituteAddress}
                      onChange={(e) => setInstituteAddress(e.target.value)}
                      placeholder="e.g. Calicut Cyberpark Road, Mavoor Road Junction..."
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Primary Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={institutePhone}
                        onChange={(e) => setInstitutePhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Secondary Phone (Alt)
                      </label>
                      <input
                        type="text"
                        value={instituteAltPhone}
                        onChange={(e) => setInstituteAltPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43211"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Primary Email Address
                      </label>
                      <input
                        type="email"
                        value={instituteEmail}
                        onChange={(e) => setInstituteEmail(e.target.value)}
                        placeholder="e.g. info@exampleinstitute.com"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Admissions / Counselor Email
                      </label>
                      <input
                        type="email"
                        value={instituteAdmissionsEmail}
                        onChange={(e) => setInstituteAdmissionsEmail(e.target.value)}
                        placeholder="e.g. admissions@exampleinstitute.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={instituteWorkingHours}
                      onChange={(e) => setInstituteWorkingHours(e.target.value)}
                      placeholder="e.g. Monday – Saturday: 8:30 AM – 6:30 PM"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 cursor-pointer" />
                      <span className="text-xs font-medium text-slate-600">Receive email notification alerts</span>
                    </div>

                    <button 
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-amber-400" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Security & Change Password Section */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                        Admin Security & Password
                      </h3>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                      Update your administrator account password securely.
                    </p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-emerald-500 hidden sm:block opacity-80" />
                </div>

                {passwordError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-slate-950" />
                          <span>Update Admin Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CREATE / EDIT COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative">
            
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  {editingCourse ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingCourse ? 'Edit Course Details' : 'Add New Course'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Fill in the program specifications below</p>
                </div>
              </div>
              
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error Alert Banner */}
            {errorMsg && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button type="button" onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diploma in Fashion Designing & Styling"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Fashion Designing, Computer Diploma, Hospitality"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 6 Months / 1 Year"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of what students will learn..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                ></textarea>
              </div>

              {/* Dynamic Section-Based Curriculum Builder */}
              <CurriculumBuilder
                sections={curriculumSections}
                onChange={setCurriculumSections}
              />

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Course Thumbnail Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={!editingCourse}
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                />

                {previewImage && (
                  <div className="mt-3 relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 w-full sm:w-48">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Delete Course?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this course from the catalog? This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingCourseId(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(deletingCourseId)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
