'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config';
import axios from 'axios';

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
  const [licenseStatus, setLicenseStatus] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Function to handle token expiration
  const handleTokenExpiration = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('licenseStatus');
    Cookies.remove('token');
    setUser(null);
    setLicenseStatus(null);
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

  // Function to check license status
  const checkLicenseStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/status`);
      const data = await response.json();
      setLicenseStatus(data);
      localStorage.setItem('licenseStatus', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('License check error:', error);
      const status = { valid: false, message: 'Failed to check license status' };
      setLicenseStatus(status);
      localStorage.setItem('licenseStatus', JSON.stringify(status));
      return status;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const storedLicenseStatus = localStorage.getItem('licenseStatus');

        if (token && userData) {
          const isValid = await verifyToken(token);
          
          if (isValid) {
            setUser(JSON.parse(userData));
            if (storedLicenseStatus) {
              setLicenseStatus(JSON.parse(storedLicenseStatus));
            }
            Cookies.set('token', token);
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
    
    // Use a more stable approach to prevent redirection loops
    // Special case for change-password to prevent screen shaking
    if (token && isAuthRoute && pathname === '/auth/change-password') {
      // On change-password page with token, check if the user needs to change password
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.change_password) {
          router.push('/');
        }
        // If they do need to change password, stay on this page
      } catch (err) {
        console.error("Failed to parse user data:", err);
      }
    } 
    // Standard redirection logic for other pages
    else if (!token && !isAuthRoute) {
      router.push('/auth/login');
    } 
    else if (token && isAuthRoute && pathname !== '/auth/logout') {
      // Only redirect if not on change-password
      if (pathname !== '/auth/change-password') {
        router.push('/');
      }
    }
  }, [loading, pathname, router]);

  const login = async (username, password, recaptchaToken) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, 
        { 
          username, 
          password,
          recaptchaToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );

      const data = response.data;

      if (response.status !== 200) {
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
        role: data.role,
        change_password: data.change_password,
        show_notification: data.show_notification
      }));

      Cookies.set('token', data.token);

      setUser({
        id: data.user_id,
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        department: data.department,
        role: data.role,
        change_password: data.change_password,
        show_notification: data.show_notification
      });

      // Check license status after successful login
      await checkLicenseStatus();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('licenseStatus');
    Cookies.remove('token');
    setUser(null);
    setLicenseStatus(null);
    router.push('/auth/login');
  };

  const checkTokenExpiration = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    return await verifyToken(token);
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
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

  const needsPasswordChange = () => {
    if (!user) return false;
    return !!user.change_password;
  };

  const changePasswordAfterLogin = async (newPassword) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password-after-login`,
        { new_password: newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      
      if (response.status === 200) {
        // Update the user state to reflect that password has been changed
        const updatedUser = {
          ...user,
          change_password: false
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.error || 'Failed to change password' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to change password' 
      };
    }
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
    changePasswordAfterLogin,
    isAuthenticated: !!user,
    licenseStatus,
    checkLicenseStatus,
    needsPasswordChange
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 