import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false, studentOnly = false, branchAdminOnly = false, staffOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Resolve user from context state or localStorage fallback to eliminate race condition
  let effectiveUser = user;
  if (!effectiveUser) {
    try {
      const storedSuper = localStorage.getItem('superAdminUser');
      if (storedSuper) {
        effectiveUser = JSON.parse(storedSuper);
      } else {
        const storedBranch = localStorage.getItem('branchAdminUser');
        if (storedBranch) {
          effectiveUser = JSON.parse(storedBranch);
        } else {
          const storedStaff = localStorage.getItem('staffUser');
          if (storedStaff) effectiveUser = JSON.parse(storedStaff);
        }
      }
    } catch {
      // ignore
    }
  }

  const effectiveAuth = isAuthenticated || !!effectiveUser;

  if (loading && !effectiveUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6ED]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-semibold text-slate-600">Verifying access authentication...</p>
        </div>
      </div>
    );
  }

  if (!effectiveAuth) {
    if (staffOnly) {
      return <Navigate to="/staff-login" state={{ from: location, message: 'Please sign in to access the staff portal.' }} replace />;
    }
    if (branchAdminOnly) {
      return <Navigate to="/branch-admin-login" state={{ from: location, message: 'Please sign in to access the branch admin portal.' }} replace />;
    }
    if (adminOnly) {
      return <Navigate to="/super-admin/login" state={{ from: location, message: 'Please sign in to access the admin portal.' }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdminUser = ['admin', 'super_admin'].includes(effectiveUser?.role);
  const isBranchAdmin = effectiveUser?.role === 'branch_admin';
  const isStaff = effectiveUser?.role === 'staff';

  if (adminOnly && !isAdminUser) {
    return <Navigate to="/" replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/staff-login" replace />;
  }

  if (studentOnly && isAdminUser) {
    return <Navigate to="/admin/announcements" replace />;
  }

  if (studentOnly && isBranchAdmin) {
    return <Navigate to="/branch-admin/courses" replace />;
  }

  if (studentOnly && isStaff) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (branchAdminOnly && !isBranchAdmin) {
    return <Navigate to="/branch-admin-login" replace />;
  }

  return children;
};

export default ProtectedRoute;
