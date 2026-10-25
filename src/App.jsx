import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ClientRouteGuard = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && ['admin', 'super_admin'].includes(user?.role)) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  if (isAuthenticated && user?.role === 'staff') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return children;
};

// Context
import { AuthProvider } from './context/AuthContext';

// Layout & Common
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ApplicationModal from './components/common/ApplicationModal';
import BackToTop from './components/common/BackToTop';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import FashionCategory from './pages/FashionCategory';
import ComputerCategory from './pages/ComputerCategory';
import HospitalityCategory from './pages/HospitalityCategory';
import CourseDetails from './pages/CourseDetails';
import Admissions from './pages/Admissions';
import Contact from './pages/Contact';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import BranchAdminLogin from './pages/BranchAdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import BranchAdminCourses from './pages/BranchAdminCourses';
import BranchAdminAnnouncements from './pages/BranchAdminAnnouncements';
import BranchAdminEnrollments from './pages/BranchAdminEnrollments';
import BranchAdminStudentRegistration from './pages/BranchAdminStudentRegistration';
import BranchAdminCourseEnrollments from './pages/BranchAdminCourseEnrollments';
import BranchAdminPurchases from './pages/BranchAdminPurchases';
import BranchAdminStaff from './pages/BranchAdminStaff';
import BranchAdminAllStaff from './pages/BranchAdminAllStaff';
import BranchAdminStaffMonitoring from './pages/BranchAdminStaffMonitoring';
import BranchAdminStaffVerification from './pages/BranchAdminStaffVerification';
import BranchAdminAttendance from './pages/BranchAdminAttendance';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
import BranchAdminProfit from './pages/BranchAdminProfit';
import BranchAdminFeesDue from './pages/BranchAdminFeesDue';
import BranchAdminMessages from './pages/BranchAdminMessages';
import BranchAdminEnquiries from './pages/BranchAdminEnquiries';
import Register from './pages/Register';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminPassword from './pages/AdminPassword';
import AdminBranches from './pages/AdminBranches';
import AdminBranchAdmins from './pages/AdminBranchAdmins';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminBranchOverview from './pages/SuperAdminBranchOverview';
import SuperAdminBranchNavigation from './pages/SuperAdminBranchNavigation';
import SuperAdminEnquiries from './pages/SuperAdminEnquiries';
import SuperAdminCourses from './pages/SuperAdminCourses';
import SuperAdminEnrollments from './pages/SuperAdminEnrollments';
import SuperAdminPurchases from './pages/SuperAdminPurchases';
import SuperAdminDueStudents from './pages/SuperAdminDueStudents';
import SuperAdminStudents from './pages/SuperAdminStudents';
import SuperAdminProfit from './pages/SuperAdminProfit';
import SuperAdminAttendance from './pages/SuperAdminAttendance';
import SuperAdminAnnouncements from './pages/SuperAdminAnnouncements';
import SuperAdminStaff from './pages/SuperAdminStaff';
import SuperAdminStaffMonitoring from './pages/SuperAdminStaffMonitoring';
import SuperAdminStaffVerification from './pages/SuperAdminStaffVerification';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminStaffMessages from './pages/SuperAdminStaffMessages';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentCourseDetails from './pages/StudentCourseDetails';
import StudentAnnouncements from './pages/StudentAnnouncements';
import StudentInstitutionAnnouncements from './pages/StudentInstitutionAnnouncements';
import StudentEnquiries from './pages/StudentEnquiries';
import StudentAssignments from './pages/StudentAssignments';
import StudentStudyMaterials from './pages/StudentStudyMaterials';
import StudentMessages from './pages/StudentMessages';
import StudentLayout from './components/layout/StudentLayout';

// Scroll to top helper component on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

// Layout Wrapper to selectively render Navbar & Footer on non-admin routes
const MainLayout = ({ children, onOpenApplyModal }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6ED] text-slate-900 font-sans selection:bg-[#F5B718] selection:text-slate-950">
      <Navbar onOpenApplyModal={onOpenApplyModal} />
      <main className="flex-grow">{children}</main>
      <Footer onOpenApplyModal={onOpenApplyModal} />
      <ApplicationModal
        isOpen={onOpenApplyModal.isOpen}
        onClose={onOpenApplyModal.onClose}
        defaultCourse={onOpenApplyModal.defaultCourse}
      />
      <BackToTop />
    </div>
  );
};

import { useNavigate } from 'react-router-dom';

const ClientAppContent = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState('');

  const handleOpenApplyModal = (courseName = '') => {
    const course = typeof courseName === 'string'
      ? { title: courseName }
      : courseName;
    const courseTitle = course?.title || '';
    
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          message: 'Please log in to your account to apply for courses and submit inquiries.',
          targetCourse: courseTitle
        }
      });
      return;
    }

    setSelectedCourseForModal(course);
    setIsApplyModalOpen(true);
  };

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
    setSelectedCourseForModal('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6ED] text-slate-900 font-sans selection:bg-[#F5B718] selection:text-slate-950">
      <Navbar onOpenApplyModal={handleOpenApplyModal} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home onOpenApplyModal={handleOpenApplyModal} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About onOpenApplyModal={handleOpenApplyModal} />} />
          <Route path="/courses" element={<Courses onOpenApplyModal={handleOpenApplyModal} />} />
          
          {/* Category Pages */}
          <Route path="/courses/fashion-designing" element={<FashionCategory onOpenApplyModal={handleOpenApplyModal} />} />
          <Route path="/courses/computer-diploma" element={<ComputerCategory onOpenApplyModal={handleOpenApplyModal} />} />
          <Route path="/courses/hospitality-management" element={<HospitalityCategory onOpenApplyModal={handleOpenApplyModal} />} />
          
          {/* Dynamic Course Details */}
          <Route path="/courses/:courseId" element={<CourseDetails onOpenApplyModal={handleOpenApplyModal} />} />
          
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Home onOpenApplyModal={handleOpenApplyModal} />} />
        </Routes>
      </main>
      <Footer onOpenApplyModal={handleOpenApplyModal} />
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={handleCloseApplyModal}
        defaultCourse={selectedCourseForModal}
      />
      <BackToTop />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        
        <Routes>
          <Route path="/branch-admin-login" element={<BranchAdminLogin />} />
                    <Route
                      path="/branch-admin/dashboard"
                      element={
                        <ProtectedRoute branchAdminOnly>
                          <BranchAdminDashboard />
                        </ProtectedRoute>
                      }
                    />

          <Route path="/super-admin/login" element={<SuperAdminLogin />} />

          <Route
            path="/branch-admin/courses"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/announcements"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminAnnouncements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/enrollments"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminEnrollments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/student-registration"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminStudentRegistration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/course-enrollments"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminCourseEnrollments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/purchases"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminPurchases />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/staff"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminStaff />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/all-staff"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminAllStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branch-admin/staff/all"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminAllStaff />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/staff-monitoring"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminStaffMonitoring />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/staff-verification"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminStaffVerification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/attendance"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/profit"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminProfit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/fees-due"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminFeesDue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/messages"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch-admin/enquiries"
            element={
              <ProtectedRoute branchAdminOnly>
                <BranchAdminEnquiries />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Navigate to="/admin/announcements" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute adminOnly>
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/change-password"
            element={
              <ProtectedRoute adminOnly>
                <AdminPassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/branches"
            element={
              <ProtectedRoute adminOnly>
                <AdminBranches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/branch-admins"
            element={
              <ProtectedRoute adminOnly>
                <AdminBranchAdmins />
              </ProtectedRoute>
            }
          />

          {/* Super Admin extra pages */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/branch-overview"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminBranchOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/navigation-settings"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminBranchNavigation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/enquiries"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminEnquiries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/messages"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/staff-messages"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminStaffMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/courses"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/enrollments"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminEnrollments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/purchases"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminPurchases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/due-students"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminDueStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/students"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/profit"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminProfit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/attendance"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/announcements"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/branch-announcements"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminAnnouncements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/staff"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/staff-monitoring"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminStaffMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/staff-verification"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminStaffVerification />
              </ProtectedRoute>
            }
          />

          {/* Staff Protected Routes */}
          <Route
            path="/staff"
            element={
              <Navigate to="/staff/dashboard" replace />
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/courses"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="courses" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/assignments"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="assignments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/study-materials"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="study_materials" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/announcements"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="announcements" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/institution-announcements"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="institution_announcements" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/documents"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="documents" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/profile"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="profile" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/messages"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="messages" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/super-admin-messages"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard defaultTab="super_admin_messages" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-dashboard"
            element={
              <Navigate to="/staff/dashboard" replace />
            }
          />

          {/* Student Protected Route */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute studentOnly>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Course Catalog and Details share a persistent student shell */}
          <Route
            path="/student-dashboard/courses"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentCourses />} />
            <Route path=":courseId" element={<StudentCourseDetails />} />
          </Route>

          <Route
            path="/student-dashboard/announcements"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentAnnouncements />} />
          </Route>

          <Route
            path="/student-dashboard/institution-announcements"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentInstitutionAnnouncements />} />
          </Route>

          <Route
            path="/student-dashboard/enquiries"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentEnquiries />} />
          </Route>

          <Route
            path="/student-dashboard/assignments"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentAssignments />} />
          </Route>

          <Route
            path="/student-dashboard/study-materials"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentStudyMaterials />} />
          </Route>

          <Route
            path="/student-dashboard/messages"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentMessages />} />
          </Route>

          {/* Public Frontend Routes with Main Navbar & Footer */}
          <Route
            path="*"
            element={
              <ClientRouteGuard>
                <ClientAppContent />
              </ClientRouteGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
