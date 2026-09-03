import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, adminLoginApi, registerApi, getMeApi } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token validation & current user on load
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await getMeApi(token);
        setUser(userData);
      } catch (err) {
        console.error('Failed to validate session token:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
    const accessToken = data.access_token;
    
    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    const userData = await getMeApi(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone = '') => {
    await registerApi({ name, email, password, phone });
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        adminLogin,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
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
