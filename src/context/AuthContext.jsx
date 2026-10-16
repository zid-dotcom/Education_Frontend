import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, adminLoginApi, registerApi, getMeApi, logoutApi } from '../services/auth';
import { branchAdminLoginApi, getBranchAdminToken } from '../services/branchadminlogin';
import { staffLoginApi, getMyStaffProfileApi } from '../services/staff';
import { isTokenExpired, getTokenRemainingTime, parseJwt } from '../utils/token';
import { setupAuthInterceptor } from '../services/apiInterceptor';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user synchronously from localStorage to avoid null flash on SPA navigation
  const [user, setUser] = useState(() => {
    try {
      const storedSuper = localStorage.getItem('superAdminUser');
      if (storedSuper) return JSON.parse(storedSuper);
      const storedBranch = localStorage.getItem('branchAdminUser');
      if (storedBranch) return JSON.parse(storedBranch);
      const storedStaff = localStorage.getItem('staffUser');
      if (storedStaff) return JSON.parse(storedStaff);
    } catch { /* ignore */ }
    return null; 
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  // Skip loading state if we already have user data from localStorage
  const [loading, setLoading] = useState(() => {
    const hasToken = !!localStorage.getItem('token');
    const hasAdminOrStaff =
      !!localStorage.getItem('superAdminUser') ||
      !!localStorage.getItem('branchAdminUser') ||
      !!localStorage.getItem('staffUser');
    if (!hasToken) return false;
    if (hasAdminOrStaff) return false;
    return true; // Only loading if we have a token but need to fetch user via API
  });

  const navigate = useNavigate();

  const isLoggingOutRef = useRef(false);

  // Stable ref for triggerAutoLogout to break the circular dependency chain:
  // setUser → logout recreated → triggerAutoLogout recreated → fetchUser effect re-runs → setUser → ...
  const triggerAutoLogoutRef = useRef(null);

  // Helper to determine destination login route based on role or current pathname
  const getLoginPathForUser = useCallback((userObj) => {
    const pathname = window.location.pathname;
    const role = userObj?.role;

    if (role === 'branch_admin' || pathname.startsWith('/branch-admin')) {
      return '/branch-admin-login';
    }
    if (role === 'staff' || pathname.startsWith('/staff')) {
      return '/staff-login';
    }
    if (['admin', 'super_admin'].includes(role) || pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
      return '/super-admin/login';
    }
    return '/login';
  }, []);

  // Central logout handler (manual or automatic)
  const logout = useCallback(async (options = {}) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    const currentToken = token || localStorage.getItem('token');
    let storedSessionUser = null;
    try {
      const superItem = localStorage.getItem('superAdminUser');
      if (superItem) storedSessionUser = JSON.parse(superItem);
      else {
        const branchItem = localStorage.getItem('branchAdminUser');
        if (branchItem) storedSessionUser = JSON.parse(branchItem);
        else {
          const staffItem = localStorage.getItem('staffUser');
          if (staffItem) storedSessionUser = JSON.parse(staffItem);
        }
      }
    } catch {
      // ignore
    }

    const currentUser = user || storedSessionUser;
    const targetPath = options.redirectTo || getLoginPathForUser(currentUser);

    // 1. Immediately purge client credentials
    localStorage.removeItem('token');
    localStorage.removeItem('superAdminUser');
    localStorage.removeItem('branchAdminUser');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('branchAdminNavSettings');
    setToken(null);
    setUser(null);

    // 2. Call the server logout API (POST /auth/logout)
    try {
      if (currentToken) {
        await logoutApi(currentToken);
      }
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      // 3. Navigate if redirect is not explicitly disabled
      if (options.redirect !== false) {
        const stateObj = options.message ? { message: options.message } : undefined;
        navigate(targetPath, { replace: true, state: stateObj });
      }

      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 500);
    }
  }, [getLoginPathForUser, navigate, token, user]);

  // Specific automatic logout trigger when token expires
  const triggerAutoLogout = useCallback((reason = 'Your session has expired. Please log in again.') => {
    logout({
      message: reason,
    });
  }, [logout]);

  // Keep the ref in sync with the latest triggerAutoLogout
  useEffect(() => {
    triggerAutoLogoutRef.current = triggerAutoLogout;
  }, [triggerAutoLogout]);

  // Install global fetch interceptor to catch any 401 Unauthorized responses
  // Runs once — uses ref to always call the latest triggerAutoLogout
  useEffect(() => {
    setupAuthInterceptor((reason) => {
      triggerAutoLogoutRef.current?.(reason);
    });

    const handleSessionExpiredEvent = (event) => {
      const reason = event.detail?.message || 'Your session has expired. Please log in again.';
      triggerAutoLogoutRef.current?.(reason);
    };

    window.addEventListener('auth:session_expired', handleSessionExpiredEvent);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpiredEvent);
    };
  }, []);

  // Multi-tab synchronization (if logged out in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync token validation & current user on load
  // Only depends on `token` — uses triggerAutoLogoutRef to avoid circular dep
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedSuperAdmin = localStorage.getItem('superAdminUser');
      const storedBranchAdmin = localStorage.getItem('branchAdminUser');
      const storedStaffUser = localStorage.getItem('staffUser');

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Check if token in storage is already expired
      if (isTokenExpired(storedToken)) {
        console.warn('Stored token is expired on load. Logging out...');
        if (isMounted) {
          setLoading(false);
          triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
        }
        return;
      }

      if (storedSuperAdmin) {
        try {
          const parsed = JSON.parse(storedSuperAdmin);
          if (isMounted) {
            setUser(prev => {
              if (prev && prev.id === parsed.id && prev.email === parsed.email && prev.role === parsed.role) {
                return prev;
              }
              return parsed;
            });
            setLoading(false);
          }
          return;
        } catch {
          // invalid json, proceed
        }
      }

      if (storedBranchAdmin) {
        try {
          const parsed = JSON.parse(storedBranchAdmin);
          if (isMounted) {
            // Use functional update to avoid creating new reference when data is identical
            setUser(prev => {
              if (prev && prev.id === parsed.id && prev.email === parsed.email && prev.role === parsed.role) {
                return prev; // Same data, keep existing reference
              }
              return parsed;
            });
            setLoading(false);
          }
          return;
        } catch {
          // invalid json, proceed
        }
      }

      if (storedStaffUser) {
        try {
          const parsed = JSON.parse(storedStaffUser);
          if (isMounted) {
            setUser(prev => {
              if (prev && prev.id === parsed.id && prev.staff_code === parsed.staff_code) {
                return prev;
              }
              return parsed;
            });
            setLoading(false);
          }
          return;
        } catch {
          // invalid json, proceed
        }
      }

      // Check token payload directly for admin or staff roles to avoid calling /auth/me
      const tokenPayload = parseJwt(storedToken);
      if (tokenPayload && (tokenPayload.role === 'super_admin' || tokenPayload.role === 'admin')) {
        const recoveredAdmin = {
          id: tokenPayload.id || tokenPayload.sub || 'super_admin',
          name: tokenPayload.name || 'Super Admin',
          email: tokenPayload.email || (typeof tokenPayload.sub === 'string' && tokenPayload.sub.includes('@') ? tokenPayload.sub : 'admin@gmail.com'),
          role: tokenPayload.role || 'super_admin',
        };
        try {
          localStorage.setItem('superAdminUser', JSON.stringify(recoveredAdmin));
        } catch { /* ignore */ }
        if (isMounted) {
          setUser(recoveredAdmin);
          setLoading(false);
        }
        return;
      }

      if (tokenPayload && (tokenPayload.role === 'staff' || tokenPayload.role === 'staff_member')) {
        const recoveredStaff = {
          id: tokenPayload.id || tokenPayload.sub || 'staff',
          staff_code: tokenPayload.staff_code || tokenPayload.sub || '',
          name: tokenPayload.name || 'Staff Member',
          role: 'staff',
        };
        try {
          localStorage.setItem('staffUser', JSON.stringify(recoveredStaff));
        } catch { /* ignore */ }
        if (isMounted) {
          setUser(recoveredStaff);
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await getMeApi(storedToken);
        if (isMounted) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to validate session token on startup:', err);
        if (isMounted) {
          triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Proactive token expiration timer & heartbeat monitoring
  // Only depends on `token` — uses triggerAutoLogoutRef
  useEffect(() => {
    if (!token) return;

    // Check immediately
    if (isTokenExpired(token)) {
      triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
      return;
    }

    const remainingTime = getTokenRemainingTime(token);
    let timerId = null;

    if (remainingTime > 0) {
      // Prevent 32-bit integer overflow in setTimeout (~24.8 days)
      const safeDelay = Math.min(remainingTime, 2147483647);
      timerId = setTimeout(() => {
        triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
      }, safeDelay);
    }

    // Periodic heartbeat check every 15 seconds (catches OS sleep, tab suspension drift)
    const intervalId = setInterval(() => {
      if (isTokenExpired(token)) {
        triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
      }
    }, 15000);

    // Immediate check when tab becomes visible or gains focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && isTokenExpired(token)) {
        triggerAutoLogoutRef.current?.('Your session has expired. Please log in again.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token]);

  const login = async (email, password) => {
    // Call user login API directly (POST /auth/login)
    const data = await loginApi({ email, password });
    const accessToken = data.access_token;

    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    const userData = await getMeApi(accessToken);
    setUser(userData);
    return userData;
  };

  const adminLogin = async (email, password) => {
    const data = await adminLoginApi({ email, password });
    const accessToken = data.access_token || data.token;

    if (!accessToken) {
      throw new Error('Admin login response did not include an access token.');
    }

    const payload = parseJwt(accessToken);

    const superAdminUser = {
      id: data.user_id || data.id || payload?.id || payload?.sub || 'super_admin',
      name: data.name || payload?.name || 'Super Admin',
      email: data.email || payload?.email || (typeof payload?.sub === 'string' && payload.sub.includes('@') ? payload.sub : email),
      role: data.role || payload?.role || 'super_admin',
    };

    localStorage.setItem('superAdminUser', JSON.stringify(superAdminUser));
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(superAdminUser);
    setLoading(false);
    return superAdminUser;
  };

  const branchAdminLogin = async (branchAdminId, password) => {
    const adminId = (typeof branchAdminId === 'string' ? branchAdminId : branchAdminId?.branch_admin_id || branchAdminId?.email || '').trim();
    const data = await branchAdminLoginApi({ branch_admin_id: adminId, password });
    const accessToken = getBranchAdminToken(data);

    if (!accessToken) {
      throw new Error('Branch admin login response did not include an access token.');
    }

    const branchAdminUser = {
      id: data.user_id || data.id,
      user_id: data.user_id,
      branch_admin_id: data.branch_admin_id || adminId,
      branch_id: data.branch_id,
      name: data.name,
      email: data.email,
      role: data.role || 'branch_admin',
    };

    localStorage.setItem('branchAdminUser', JSON.stringify(branchAdminUser));
    localStorage.setItem('token', accessToken);
    localStorage.removeItem('branchAdminNavSettings');
    setToken(accessToken);
    setUser(branchAdminUser);
    setLoading(false);
    return branchAdminUser;
  };

  const staffLogin = async (staffCode, password) => {
    const data = await staffLoginApi({ staff_code: staffCode, password });
    const accessToken = data.access_token || data.token;

    if (!accessToken) {
      throw new Error('Staff login response did not include an access token.');
    }

    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    let profile = null;
    try {
      profile = await getMyStaffProfileApi(accessToken);
    } catch (e) {
      console.warn('Could not fetch staff profile during login:', e);
    }

    const payload = parseJwt(accessToken);
    const staffUser = {
      id: profile?.id || profile?.staff_id || payload?.id || payload?.sub || 'staff',
      staff_id: profile?.staff_id || profile?.id || payload?.id,
      staff_code: profile?.staff_code || staffCode,
      name: profile?.name || profile?.full_name || payload?.name || 'Staff Member',
      email: profile?.email || payload?.email || '',
      phone: profile?.phone || '',
      role: 'staff',
      branch_id: profile?.branch_id,
      branch_name: profile?.branch_name,
      designation: profile?.designation,
      qualification: profile?.qualification || profile?.highest_qualification,
      ...(profile || {}),
    };

    localStorage.setItem('staffUser', JSON.stringify(staffUser));
    setUser(staffUser);
    setLoading(false);
    return staffUser;
  };

  const register = async (registrationData) => {
    await registerApi(registrationData);
    return await login(registrationData.email, registrationData.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        adminLogin,
        branchAdminLogin,
        staffLogin,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: ['admin', 'super_admin'].includes(user?.role),
        isBranchAdmin: user?.role === 'branch_admin',
        isStaff: user?.role === 'staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;



