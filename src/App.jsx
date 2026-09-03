import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Route Guard for Client pages: Logged in admin cannot visit client pages unless logged out
const ClientRouteGuard = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
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
import AdminDashboard from './pages/AdminDashboard';

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
    const course = typeof courseName === 'string' ? courseName : '';
    
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          message: 'Please log in to your account to apply for courses and submit inquiries.',
          targetCourse: course
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
          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

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
