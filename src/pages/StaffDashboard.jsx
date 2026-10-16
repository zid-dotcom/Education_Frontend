import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StaffSidebar from '../components/layout/StaffSidebar';

// Modular Staff Components
import StaffHeader from '../components/staff/StaffHeader';
import StaffOverviewTab from '../components/staff/tabs/StaffOverviewTab';
import StaffCoursesTab from '../components/staff/tabs/StaffCoursesTab';
import StaffAssignmentsTab from '../components/staff/tabs/StaffAssignmentsTab';
import StaffAnnouncementsTab from '../components/staff/tabs/StaffAnnouncementsTab';
import StaffDocumentsTab from '../components/staff/tabs/StaffDocumentsTab';
import StaffProfileTab from '../components/staff/tabs/StaffProfileTab';

// Modular Staff Modals
import StaffAssignmentModal from '../components/staff/modals/StaffAssignmentModal';
import StaffGradingModal from '../components/staff/modals/StaffGradingModal';
import StaffAnnouncementModal from '../components/staff/modals/StaffAnnouncementModal';
import StaffStudentModal from '../components/staff/modals/StaffStudentModal';

// API Services
import {
  getMyStaffDashboardApi,
  getMyStaffProfileApi,
  getMyCourseStudentsApi,
  getMyCourseAssignmentsApi,
  createCourseAssignmentApi,
  gradeAssignmentMarksApi,
  getCourseVerifiedAssignmentsApi,
  updateMyStaffDocumentsApi,
  getMyStaffAttendanceApi,
  createCourseAnnouncementApi,
  getStaffCourseAnnouncementsApi,
  getStaffAnnouncementsApi,
  updateStaffAnnouncementApi,
  deleteStaffAnnouncementApi,
} from '../services/staff';
import { getAllCoursesApi } from '../services/courses';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(18px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes sa-fade { from { opacity:0; } to { opacity:1; } }
@keyframes sa-pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
@keyframes sa-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes sa-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-4px)} }
.sa-rise { animation: sa-rise .45s cubic-bezier(.22,.68,0,1.2) both; }
.sa-fade { animation: sa-fade .35s ease both; }
.sa-pulse-dot { animation: sa-pulse-dot 2s ease-in-out infinite; }
.sa-float { animation: sa-float 3s ease-in-out infinite; }
.stat-card-hover {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease;
}
.stat-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(16, 185, 129, 0.08), 0 2px 8px rgba(0,0,0,0.03) !important;
  border-color: #10B981 !important;
}
.stat-card-icon {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.course-item:hover .course-select-btn { background: #10B981 !important; color: #ffffff !important; }
.staff-portal-scope ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.staff-portal-scope ::-webkit-scrollbar-track {
  background: transparent !important;
}
.staff-portal-scope ::-webkit-scrollbar-thumb {
  background: #cbd5e1 !important;
  border-radius: 9999px !important;
  border: none !important;
}
.staff-portal-scope ::-webkit-scrollbar-thumb:hover {
  background: #10b981 !important;
}
`;

const VALID_TABS = ['dashboard', 'courses', 'assignments', 'announcements', 'documents', 'profile'];

const StaffDashboard = ({ defaultTab }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state for top search bar
  const [searchQuery, setSearchQuery] = useState('');

  // Derive initial tab from pathname, defaultTab prop, URL search query, or saved localStorage
  const getTabFromLocation = () => {
    const path = location.pathname;
    if (path.includes('/staff/courses')) return 'courses';
    if (path.includes('/staff/assignments')) return 'assignments';
    if (path.includes('/staff/announcements')) return 'announcements';
    if (path.includes('/staff/documents')) return 'documents';
    if (path.includes('/staff/profile')) return 'profile';
    if (path.includes('/staff/dashboard') || path === '/staff') {
      const tabParam = searchParams.get('tab');
      if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
      if (defaultTab && VALID_TABS.includes(defaultTab)) return defaultTab;
      const savedTab = localStorage.getItem('staff_active_tab');
      if (savedTab && VALID_TABS.includes(savedTab)) return savedTab;
      return 'dashboard';
    }
    if (defaultTab && VALID_TABS.includes(defaultTab)) return defaultTab;
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
    const savedTab = localStorage.getItem('staff_active_tab');
    if (savedTab && VALID_TABS.includes(savedTab)) return savedTab;
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState(getTabFromLocation);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync activeTab with URL route pathname & localStorage
  const setActiveTab = (newTab) => {
    if (!VALID_TABS.includes(newTab)) return;
    setActiveTabState(newTab);
    localStorage.setItem('staff_active_tab', newTab);
    const targetPath = newTab === 'dashboard' ? '/staff/dashboard' : `/staff/${newTab}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  };

  // Keep state synchronized with URL pathname & search params changes (back/forward, direct links, reloads)
  useEffect(() => {
    const currentTab = getTabFromLocation();
    if (currentTab !== activeTab) {
      setActiveTabState(currentTab);
      localStorage.setItem('staff_active_tab', currentTab);
    }
  }, [location.pathname, searchParams]);

  // Data State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [coursesCatalog, setCoursesCatalog] = useState([]);

  // Selected Course for Students & Assignments (with persistence)
  const [selectedCourseId, setSelectedCourseIdState] = useState(() => {
    return localStorage.getItem('staff_selected_course_id') || null;
  });

  const setSelectedCourseId = (courseId) => {
    setSelectedCourseIdState(courseId);
    if (courseId) {
      localStorage.setItem('staff_selected_course_id', String(courseId));
    }
  };

  const [courseStudents, setCourseStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Course Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentFilterTab, setAssignmentFilterTab] = useState('all'); // 'all' | 'verified'
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_marks: 100,
    student_ids: [],
  });
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentMsg, setAssignmentMsg] = useState({ type: '', text: '' });

  // Grading Modal & Submissions State
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [gradingForm, setGradingForm] = useState({ marks_obtained: '', feedback: '' });
  const [studentGrades, setStudentGrades] = useState({});
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [gradingSubmitting, setGradingSubmitting] = useState(false);
  const [gradingMsg, setGradingMsg] = useState({ type: '', text: '' });

  // Announcements State (with course filter persistence)
  const [selectedAnnouncementCourseId, setSelectedAnnouncementCourseIdState] = useState(() => {
    const saved = localStorage.getItem('staff_selected_announcement_course_id');
    return (saved && saved !== 'ALL') ? saved : '';
  });

  const setSelectedAnnouncementCourseId = (courseId) => {
    setSelectedAnnouncementCourseIdState(courseId);
    if (courseId && courseId !== 'ALL') {
      localStorage.setItem('staff_selected_announcement_course_id', String(courseId));
    }
  };

  const [staffAnnouncements, setStaffAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    course_id: '',
    title: '',
    message: '',
    scheduled_event_time: '',
  });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState({ type: '', text: '' });
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);

  // Document Uploads State
  const [docForm, setDocForm] = useState({
    aadhaar_number: '',
    pan_number: '',
    bank_account_number: '',
    bank_ifsc: '',
  });
  const [docFiles, setDocFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    pan_card: null,
    bank_passbook: null,
    other_document: null,
  });
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docMsg, setDocMsg] = useState({ type: '', text: '' });

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState('');

  // 1. Initial Load: Dashboard + Profile + Courses Catalog
  const loadInitialData = async () => {
    if (!token) return;
    try {
      setError('');
      const [dashRes, profRes, catalogRes] = await Promise.allSettled([
        getMyStaffDashboardApi(token),
        getMyStaffProfileApi(token),
        getAllCoursesApi(),
      ]);

      if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
      if (profRes.status === 'fulfilled') {
        const p = profRes.value;
        setProfileData(p);
        setDocForm({
          aadhaar_number: p.aadhaar_number || '',
          pan_number: p.pan_number || '',
          bank_account_number: p.bank_account_number || '',
          bank_ifsc: p.bank_ifsc || '',
        });
      }
      if (catalogRes.status === 'fulfilled') {
        const cList = Array.isArray(catalogRes.value)
          ? catalogRes.value
          : catalogRes.value?.courses || [];
        setCoursesCatalog(cList);
      }
    } catch (err) {
      console.error('Error loading initial staff data:', err);
      setError('Could not load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

  // Derived: Assigned Courses list
  const assignedCourses = useMemo(() => {
    const rawCourses =
      dashboardData?.courses ||
      dashboardData?.assigned_courses ||
      profileData?.courses ||
      profileData?.assigned_courses ||
      user?.courses ||
      user?.assigned_courses ||
      [];

    return rawCourses.map((item) => {
      const id = typeof item === 'object' ? item.id ?? item.course_id : item;
      const catalogMatch = coursesCatalog.find((c) => String(c.id) === String(id));

      const title =
        catalogMatch?.title ||
        (typeof item === 'object' ? item.title || item.course_title || item.name : null) ||
        `Course #${id}`;

      const category =
        catalogMatch?.category ||
        catalogMatch?.categoryId ||
        (typeof item === 'object' ? item.category : null) ||
        'Academic Curriculum';

      const duration = catalogMatch?.duration || (typeof item === 'object' ? item.duration : null);
      const level = catalogMatch?.level || (typeof item === 'object' ? item.level : null);

      return {
        ...(typeof item === 'object' && item !== null ? item : {}),
        id,
        course_id: id,
        title,
        category,
        duration,
        level,
      };
    });
  }, [dashboardData, profileData, user, coursesCatalog]);

  // If no course was selected but courses arrived, pick the first
  useEffect(() => {
    if (!selectedCourseId && assignedCourses.length > 0) {
      setSelectedCourseId(assignedCourses[0].id || assignedCourses[0].course_id);
    }
    if ((!selectedAnnouncementCourseId || selectedAnnouncementCourseId === 'ALL') && assignedCourses.length > 0) {
      setSelectedAnnouncementCourseId(assignedCourses[0].id || assignedCourses[0].course_id);
    }
  }, [assignedCourses, selectedCourseId, selectedAnnouncementCourseId]);

  // 2. Fetch Course Students when selected course changes or tab is active
  useEffect(() => {
    if (!token || !selectedCourseId || (activeTab !== 'courses' && activeTab !== 'dashboard')) return;

    let isMounted = true;
    setStudentsLoading(true);

    getMyCourseStudentsApi(selectedCourseId, token)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : data?.students || [];
        setCourseStudents(list);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Course students fetch error:', err);
        setCourseStudents([]);
      })
      .finally(() => {
        if (isMounted) setStudentsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, selectedCourseId, activeTab]);

  // 3. Fetch Course Assignments when selected course changes or assignments tab is active
  const loadCourseAssignments = async (courseId = selectedCourseId, filterType = assignmentFilterTab) => {
    if (!token || !courseId) return;
    try {
      setAssignmentsLoading(true);
      const data =
        filterType === 'verified'
          ? await getCourseVerifiedAssignmentsApi(courseId, token)
          : await getMyCourseAssignmentsApi(courseId, token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.assignments)
        ? data.assignments
        : Array.isArray(data?.verified_assignments)
        ? data.verified_assignments
        : [];
      setAssignments(list);
    } catch (err) {
      console.warn('Course assignments fetch error:', err);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !selectedCourseId || (activeTab !== 'assignments' && activeTab !== 'dashboard')) return;
    loadCourseAssignments(selectedCourseId, assignmentFilterTab);
  }, [token, selectedCourseId, activeTab, assignmentFilterTab]);

  // 4. Fetch Attendance Records when attendance tab is active
  useEffect(() => {
    if (!token || activeTab !== 'attendance') return;

    let isMounted = true;
    setAttendanceLoading(true);

    getMyStaffAttendanceApi(token, attendanceDate || null)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : data?.attendance || [];
        setAttendanceRecords(list);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Attendance fetch error:', err);
        setAttendanceRecords([]);
      })
      .finally(() => {
        if (isMounted) setAttendanceLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, activeTab, attendanceDate]);

  // 5. Fetch Staff Announcements (Specific Course or fallback): GET /staff/courses/{course_id}/announcements or GET /staff/announcements
  const loadStaffAnnouncements = async (filterId = selectedAnnouncementCourseId) => {
    if (!token) return;
    try {
      setAnnouncementsLoading(true);
      const courseIdToFetch =
        (filterId && filterId !== 'ALL')
          ? filterId
          : assignedCourses[0]?.id || assignedCourses[0]?.course_id || '';

      let data;
      if (courseIdToFetch) {
        data = await getStaffCourseAnnouncementsApi(courseIdToFetch, token);
      } else {
        data = await getStaffAnnouncementsApi(token);
      }
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.announcements)
        ? data.announcements
        : [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setStaffAnnouncements(sorted);
    } catch (err) {
      console.warn('Staff announcements fetch error:', err);
      setStaffAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || (activeTab !== 'announcements' && activeTab !== 'dashboard')) return;
    loadStaffAnnouncements(selectedAnnouncementCourseId);
  }, [token, selectedAnnouncementCourseId, activeTab]);

  // Open Create Announcement Modal
  const handleOpenCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    const assignedCourseId =
      (selectedAnnouncementCourseId && selectedAnnouncementCourseId !== 'ALL')
        ? selectedAnnouncementCourseId
        : assignedCourses[0]?.id || assignedCourses[0]?.course_id || selectedCourseId || '';
    setAnnouncementForm({
      course_id: assignedCourseId,
      title: '',
      message: '',
      scheduled_event_time: '',
    });
    setAnnouncementMsg({ type: '', text: '' });
    setIsAnnouncementModalOpen(true);
  };

  // Open Edit Announcement Modal: PUT /staff/announcements/{announcement_id}
  const handleOpenEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    let formattedTime = '';
    const rawTime =
      ann.scheduled_event_time || ann.event_time || ann.exam_time || ann.scheduled_time;
    if (rawTime) {
      try {
        const d = new Date(rawTime);
        if (!isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          formattedTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      } catch {}
    }

    const assignedCourseId =
      ann.course_id ||
      ann.course?.id ||
      selectedAnnouncementCourseId ||
      assignedCourses[0]?.id ||
      assignedCourses[0]?.course_id ||
      '';

    setAnnouncementForm({
      course_id: assignedCourseId,
      title: ann.title || '',
      message: ann.message || '',
      scheduled_event_time: formattedTime,
    });
    setAnnouncementMsg({ type: '', text: '' });
    setIsAnnouncementModalOpen(true);
  };

  // Handle Save Announcement: POST /staff/courses/{course_id}/announcements or PUT /staff/announcements/{announcement_id}
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    const targetCourseId =
      announcementForm.course_id ||
      selectedAnnouncementCourseId ||
      assignedCourses[0]?.id ||
      assignedCourses[0]?.course_id ||
      selectedCourseId;

    if (!editingAnnouncement && !targetCourseId) {
      setAnnouncementMsg({ type: 'error', text: 'No assigned course found for this announcement.' });
      return;
    }
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementMsg({ type: 'error', text: 'Title and message are required.' });
      return;
    }

    try {
      setAnnouncementSubmitting(true);
      setAnnouncementMsg({ type: '', text: '' });

      const payload = {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        ...(announcementForm.scheduled_event_time
          ? {
              scheduled_event_time: announcementForm.scheduled_event_time,
              event_time: announcementForm.scheduled_event_time,
              exam_time: announcementForm.scheduled_event_time,
            }
          : {}),
      };

      if (editingAnnouncement) {
        const annId = editingAnnouncement.id ?? editingAnnouncement.announcement_id;
        await updateStaffAnnouncementApi(annId, payload, token);
        setAnnouncementMsg({ type: 'success', text: 'Announcement updated successfully!' });
      } else {
        await createCourseAnnouncementApi(targetCourseId, payload, token);
        setAnnouncementMsg({ type: 'success', text: 'Course announcement published successfully!' });
      }

      await loadStaffAnnouncements(selectedAnnouncementCourseId);

      setTimeout(() => {
        setIsAnnouncementModalOpen(false);
        setEditingAnnouncement(null);
        setAnnouncementMsg({ type: '', text: '' });
      }, 1000);
    } catch (err) {
      setAnnouncementMsg({ type: 'error', text: err.message || 'Failed to save announcement.' });
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  // Handle Delete Announcement: DELETE /staff/announcements/{announcement_id}
  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingAnnouncementId(annId);
      await deleteStaffAnnouncementApi(annId, token);
      await loadStaffAnnouncements(selectedAnnouncementCourseId);
    } catch (err) {
      alert(err.message || 'Failed to delete announcement.');
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  // Handle Create Assignment Submit
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setAssignmentMsg({ type: 'error', text: 'Please select a course first.' });
      return;
    }
    if (!assignmentForm.title.trim() || !assignmentForm.description.trim()) {
      setAssignmentMsg({ type: 'error', text: 'Title and description are required.' });
      return;
    }

    try {
      setAssignmentSubmitting(true);
      setAssignmentMsg({ type: '', text: '' });

      const payload = {
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        due_date: assignmentForm.due_date || null,
        max_marks: Number(assignmentForm.max_marks) || 100,
        student_ids:
          Array.isArray(assignmentForm.student_ids) && assignmentForm.student_ids.length > 0
            ? assignmentForm.student_ids
            : undefined,
      };

      await createCourseAssignmentApi(selectedCourseId, payload, token);
      setAssignmentMsg({ type: 'success', text: 'Assignment created successfully!' });
      setAssignmentForm({
        title: '',
        description: '',
        due_date: '',
        max_marks: 100,
        student_ids: [],
      });

      await loadCourseAssignments(selectedCourseId, assignmentFilterTab);

      setTimeout(() => {
        setIsAssignmentModalOpen(false);
        setAssignmentMsg({ type: '', text: '' });
      }, 1200);
    } catch (err) {
      setAssignmentMsg({ type: 'error', text: err.message || 'Failed to create assignment.' });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  // Handle Open Grading Modal
  const handleOpenGradingModal = (assignment) => {
    setGradingAssignment(assignment);
    const initGrades = {};
    const studentsList = Array.isArray(assignment.students)
      ? assignment.students
      : Array.isArray(assignment.submissions)
      ? assignment.submissions
      : [];

    studentsList.forEach((s, idx) => {
      const sId = s.student_id ?? s.id ?? s.assignment_id ?? idx;
      initGrades[sId] = {
        marks_obtained: s.marks_obtained !== undefined && s.marks_obtained !== null ? s.marks_obtained : '',
        feedback: s.feedback || '',
      };
    });

    setStudentGrades(initGrades);
    setGradingForm({
      marks_obtained: assignment.marks_obtained !== undefined && assignment.marks_obtained !== null ? String(assignment.marks_obtained) : '',
      feedback: assignment.feedback || '',
    });
    setGradingMsg({ type: '', text: '' });
  };

  // Handle Save Student Marks
  const handleSaveStudentMarks = async (student) => {
    const sId = student.student_id ?? student.id ?? student.assignment_id;
    const gradeData = studentGrades[sId];
    const marksVal = gradeData?.marks_obtained;

    if (marksVal === '' || marksVal === undefined || isNaN(Number(marksVal))) {
      setGradingMsg({ type: 'error', text: 'Please enter a valid marks number.' });
      return;
    }

    const targetAssignmentId =
      student.assignment_id ||
      student.id ||
      gradingAssignment?.task_id ||
      gradingAssignment?.id ||
      gradingAssignment?.assignment_id;

    if (!targetAssignmentId) {
      setGradingMsg({ type: 'error', text: 'Assignment reference ID missing for student submission.' });
      return;
    }

    try {
      setGradingStudentId(sId);
      setGradingMsg({ type: '', text: '' });

      const payload = {
        marks_obtained: Number(marksVal),
        feedback: gradeData?.feedback ? gradeData.feedback.trim() : 'Good work',
      };

      await gradeAssignmentMarksApi(targetAssignmentId, payload, token);

      setGradingAssignment((prev) => {
        if (!prev) return prev;
        const updatedStudents = (prev.students || []).map((s) => {
          if ((s.student_id ?? s.id ?? s.assignment_id) === sId) {
            return {
              ...s,
              marks_obtained: Number(marksVal),
              feedback: payload.feedback,
              status: 'graded',
            };
          }
          return s;
        });
        return {
          ...prev,
          marks_obtained: Number(marksVal),
          feedback: payload.feedback,
          students: updatedStudents,
        };
      });

      setGradingMsg({ type: 'success', text: `Marks saved successfully for ${student.name || 'student'}!` });
      await loadCourseAssignments(selectedCourseId, assignmentFilterTab);
    } catch (err) {
      setGradingMsg({ type: 'error', text: err?.message || 'Failed to submit marks.' });
    } finally {
      setGradingStudentId(null);
    }
  };

  // Fallback Handle Save Marks
  const handleSaveMarks = async (e, customTargetId) => {
    e?.preventDefault?.();
    const targetId =
      customTargetId ||
      gradingAssignment?.task_id ||
      gradingAssignment?.id ||
      gradingAssignment?.assignment_id;
    if (!targetId) return;

    if (gradingForm.marks_obtained === '' || isNaN(Number(gradingForm.marks_obtained))) {
      setGradingMsg({ type: 'error', text: 'Please enter a valid marks obtained number.' });
      return;
    }

    try {
      setGradingSubmitting(true);
      setGradingMsg({ type: '', text: '' });

      const payload = {
        marks_obtained: Number(gradingForm.marks_obtained),
        feedback: gradingForm.feedback ? gradingForm.feedback.trim() : 'Good work',
      };

      await gradeAssignmentMarksApi(targetId, payload, token);

      setGradingMsg({ type: 'success', text: 'Marks & feedback saved successfully!' });
      await loadCourseAssignments(selectedCourseId, assignmentFilterTab);

      setTimeout(() => {
        setGradingAssignment(null);
        setGradingForm({ marks_obtained: '', feedback: '' });
        setGradingMsg({ type: '', text: '' });
      }, 1200);
    } catch (err) {
      setGradingMsg({ type: 'error', text: err?.message || 'Failed to submit marks.' });
    } finally {
      setGradingSubmitting(false);
    }
  };

  // Handle Documents Form Submit
  const handleUpdateDocuments = async (e) => {
    e.preventDefault();
    try {
      setDocSubmitting(true);
      setDocMsg({ type: '', text: '' });

      const formData = new FormData();
      if (docForm.aadhaar_number) formData.append('aadhaar_number', docForm.aadhaar_number);
      if (docForm.pan_number) formData.append('pan_number', docForm.pan_number);
      if (docForm.bank_account_number) formData.append('bank_account_number', docForm.bank_account_number);
      if (docForm.bank_ifsc) formData.append('bank_ifsc', docForm.bank_ifsc);

      if (docFiles.aadhaar_front) formData.append('aadhaar_front', docFiles.aadhaar_front);
      if (docFiles.aadhaar_back) formData.append('aadhaar_back', docFiles.aadhaar_back);
      if (docFiles.pan_card) formData.append('pan_card', docFiles.pan_card);
      if (docFiles.bank_passbook) formData.append('bank_passbook', docFiles.bank_passbook);
      if (docFiles.other_document) formData.append('other_document', docFiles.other_document);

      const res = await updateMyStaffDocumentsApi(formData, token);
      setDocMsg({ type: 'success', text: res?.message || 'Documents updated successfully for verification.' });

      const updatedProfile = await getMyStaffProfileApi(token);
      setProfileData(updatedProfile);
    } catch (err) {
      setDocMsg({ type: 'error', text: err.message || 'Failed to upload documents.' });
    } finally {
      setDocSubmitting(false);
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    if (!studentsSearch.trim()) return courseStudents;
    const q = studentsSearch.toLowerCase();
    return courseStudents.filter((s) =>
      (s.name || s.student_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      String(s.enrollment_id || s.id || '').includes(q)
    );
  }, [courseStudents, studentsSearch]);

  const activeCourseObj = assignedCourses.find((c) => String(c.id || c.course_id) === String(selectedCourseId));

  // Branch and Location info derived from dashboard API, profile API or user state
  const branchName =
    dashboardData?.branch_name ||
    dashboardData?.branch?.name ||
    dashboardData?.branch?.branch_name ||
    profileData?.branch?.branch_name ||
    profileData?.branch_name ||
    profileData?.branch?.name ||
    user?.branch_name ||
    user?.branch?.name ||
    '';

  const branchLocation =
    dashboardData?.branch_location ||
    dashboardData?.data?.branch_location ||
    dashboardData?.location ||
    dashboardData?.data?.location ||
    dashboardData?.branch?.location ||
    dashboardData?.branch?.branch_location ||
    dashboardData?.branch?.city ||
    dashboardData?.branch?.address ||
    profileData?.branch?.branch_location ||
    profileData?.branch_location ||
    profileData?.data?.branch_location ||
    profileData?.location ||
    profileData?.branch?.location ||
    user?.branch_location ||
    user?.location ||
    (branchName?.toLowerCase().includes('kochi') ? 'MG Road, Ernakulam' : '');

  // Current tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'courses': return 'My Courses & Students';
      case 'assignments': return 'Course Assignments';
      case 'announcements': return 'Course Announcements';
      case 'documents': return 'Staff KYC & Documents';
      case 'profile': return 'My Staff Profile';
      default: return 'Staff Dashboard';
    }
  };

  return (
    <div
      className="h-screen max-h-screen w-full overflow-hidden bg-[#DDEEE3] p-2 sm:p-2.5 lg:p-3 flex flex-col staff-portal-scope"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{PAGE_CSS}</style>

      {/* Main Dashboard Window Surface (fills viewport with slim 8-12px mint border, matching Student Portal) */}
      <div className="w-full flex-1 h-full max-h-full min-h-0 bg-white rounded-[1.75rem] sm:rounded-[2.25rem] lg:rounded-[2.5rem] shadow-[0_15px_45px_-10px_rgba(5,150,105,0.15)] border border-emerald-900/10 overflow-hidden flex flex-col md:flex-row">
        {/* Part 1: Left Navigation (Narrow green gradient rail + white secondary panel) */}
        <StaffSidebar
          user={{
            ...(user || {}),
            ...(profileData || {}),
            branch_name: branchName,
            branch_location: branchLocation,
          }}
          logout={logout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewAssignment={() => {
            setActiveTab('assignments');
            setIsAssignmentModalOpen(true);
          }}
        />

        {/* Part 2: Center Main Content Area (Independent Scroll Container) */}
        <main className="min-w-0 flex-1 relative flex flex-col h-full bg-[#F8FAF9] overflow-hidden">
          {/* Top Header Bar - Pinned at Top */}
          <div className="shrink-0 px-5 sm:px-8 pt-5 pb-3 border-b border-slate-100 bg-[#F8FAF9]">
            <StaffHeader
              title={getTabTitle()}
              loading={loading}
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await loadInitialData();
                  if (activeTab === 'announcements') {
                    await loadStaffAnnouncements(selectedAnnouncementCourseId);
                  } else if (activeTab === 'assignments') {
                    await loadCourseAssignments(selectedCourseId, assignmentFilterTab);
                  } else if (activeTab === 'courses' && selectedCourseId) {
                    setStudentsLoading(true);
                    try {
                      const s = await getMyCourseStudentsApi(selectedCourseId, token);
                      setCourseStudents(Array.isArray(s) ? s : s?.students || []);
                    } finally {
                      setStudentsLoading(false);
                    }
                  }
                } finally {
                  setRefreshing(false);
                }
              }}
              user={user}
              profileData={profileData}
              onOpenSidebar={() => setSidebarOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Content Container - Only this section scrolls */}
          <div className="w-full px-5 sm:px-8 py-5 flex-1 overflow-y-auto space-y-6 custom-staff-scrollbar">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs font-semibold flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => loadInitialData()} className="underline text-xs font-bold cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <StaffOverviewTab
                dashboardData={dashboardData}
                profileData={profileData}
                user={user}
                branchName={branchName}
                branchLocation={branchLocation}
                assignedCourses={assignedCourses}
                courseStudents={courseStudents}
                assignments={assignments}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
                activeCourseObj={activeCourseObj}
                studentsLoading={studentsLoading}
                assignmentsLoading={assignmentsLoading}
                setActiveTab={setActiveTab}
                onOpenNewAssignment={() => {
                  setActiveTab('assignments');
                  setIsAssignmentModalOpen(true);
                }}
                onSelectStudent={(s) => {
                  setSelectedStudent(s);
                  setIsStudentModalOpen(true);
                }}
              />
            )}

            {/* TAB 2: MY COURSES & STUDENTS */}
            {activeTab === 'courses' && (
              <StaffCoursesTab
                assignedCourses={assignedCourses}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
                studentsSearch={studentsSearch}
                setStudentsSearch={setStudentsSearch}
                filteredStudents={filteredStudents}
                activeCourseObj={activeCourseObj}
                studentsLoading={studentsLoading}
                onSelectStudent={(s) => {
                  setSelectedStudent(s);
                  setIsStudentModalOpen(true);
                }}
              />
            )}

            {/* TAB 3: ASSIGNMENTS */}
            {activeTab === 'assignments' && (
              <StaffAssignmentsTab
                assignedCourses={assignedCourses}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
                assignmentFilterTab={assignmentFilterTab}
                setAssignmentFilterTab={setAssignmentFilterTab}
                assignments={assignments}
                assignmentsLoading={assignmentsLoading}
                onOpenCreateAssignment={() => setIsAssignmentModalOpen(true)}
                onOpenGradingModal={handleOpenGradingModal}
              />
            )}

            {/* TAB 4: COURSE ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <StaffAnnouncementsTab
                assignedCourses={assignedCourses}
                selectedAnnouncementCourseId={selectedAnnouncementCourseId}
                setSelectedAnnouncementCourseId={setSelectedAnnouncementCourseId}
                staffAnnouncements={staffAnnouncements}
                announcementsLoading={announcementsLoading}
                onOpenCreateAnnouncement={handleOpenCreateAnnouncement}
                onOpenEditAnnouncement={handleOpenEditAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                deletingAnnouncementId={deletingAnnouncementId}
                activeCourseObj={activeCourseObj}
                user={user}
              />
            )}

            {/* TAB 5: DOCUMENTS & KYC */}
            {activeTab === 'documents' && (
              <StaffDocumentsTab
                profileData={profileData}
                docMsg={docMsg}
                handleUpdateDocuments={handleUpdateDocuments}
                docForm={docForm}
                setDocForm={setDocForm}
                docFiles={docFiles}
                setDocFiles={setDocFiles}
                docSubmitting={docSubmitting}
              />
            )}

            {/* TAB 6: PROFILE */}
            {activeTab === 'profile' && (
              <StaffProfileTab
                profileData={profileData}
                user={user}
                branchName={branchName}
                branchLocation={branchLocation}
                assignedCourses={assignedCourses}
                coursesCatalog={coursesCatalog}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: CREATE ASSIGNMENT */}
      <StaffAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        activeCourseObj={activeCourseObj}
        assignmentForm={assignmentForm}
        setAssignmentForm={setAssignmentForm}
        assignmentMsg={assignmentMsg}
        assignmentSubmitting={assignmentSubmitting}
        handleCreateAssignment={handleCreateAssignment}
      />

      {/* MODAL 2: EVALUATE & GRADE ASSIGNMENT */}
      <StaffGradingModal
        gradingAssignment={gradingAssignment}
        onClose={() => {
          setGradingAssignment(null);
          setGradingMsg({ type: '', text: '' });
        }}
        gradingMsg={gradingMsg}
        studentGrades={studentGrades}
        setStudentGrades={setStudentGrades}
        gradingStudentId={gradingStudentId}
        handleSaveStudentMarks={handleSaveStudentMarks}
        gradingForm={gradingForm}
        setGradingForm={setGradingForm}
        handleSaveMarks={handleSaveMarks}
        gradingSubmitting={gradingSubmitting}
      />

      {/* MODAL 3: STUDENT DETAILS */}
      <StaffStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudent(null);
        }}
        selectedStudent={selectedStudent}
        activeCourseObj={activeCourseObj}
      />

      {/* MODAL 4: CREATE & EDIT ANNOUNCEMENT */}
      <StaffAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => {
          setIsAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
        }}
        editingAnnouncement={editingAnnouncement}
        selectedAnnouncementCourseId={selectedAnnouncementCourseId}
        activeCourseObj={activeCourseObj}
        assignedCourses={assignedCourses}
        announcementForm={announcementForm}
        setAnnouncementForm={setAnnouncementForm}
        announcementMsg={announcementMsg}
        announcementSubmitting={announcementSubmitting}
        handleSaveAnnouncement={handleSaveAnnouncement}
      />
    </div>
  );
};

export default StaffDashboard;
