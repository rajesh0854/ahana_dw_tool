'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to handle token expiration
  const handleTokenExpiration = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token');
    setUser(null);
    router.push('/auth/login');
  };

  // Function to verify token
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const isValid = await verifyToken(token);
          
          if (isValid) {
            setUser(JSON.parse(userData));
            Cookies.set('token', token, { expires: 7 });
          } else {
            handleTokenExpiration();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleTokenExpiration();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Add authentication check
  useEffect(() => {
    if (loading) return;

    const token = localStorage.getItem('token');
    const isAuthRoute = pathname?.startsWith('/auth/');
    
    // Don't redirect if we're already on the login page
    if (!token && !isAuthRoute && pathname !== '/auth/login') {
      router.push('/auth/login');
    } else if (token && isAuthRoute && pathname !== '/auth/logout') {
      router.push('/');
    }
  }, [loading, pathname, router]);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        department: data.department,
        role: data.role
      }));

      // Set cookie for middleware
      Cookies.set('token', data.token, { expires: 7 });

      setUser({
        id: data.user_id,
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        department: data.department,
        role: data.role
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token');
    setUser(null);
    router.push('/auth/login');
  };

  const checkTokenExpiration = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    return await verifyToken(token);
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch('http://localhost:5000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = (profileData) => {
    const updatedUser = {
      ...user,
      ...profileData
    };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update context state
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkTokenExpiration,
    handleTokenExpiration,
    forgotPassword,
    resetPassword,
    updateUserProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 