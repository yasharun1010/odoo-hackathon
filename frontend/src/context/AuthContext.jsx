import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const extractAuthPayload = (data = {}) => ({
    accessToken: data.access_token || data.accessToken || '',
    refreshToken: data.refresh_token || data.refreshToken || '',
    user: data.user || null,
    company: data.company || null,
  });

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Verify token by getting current user
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
        setCompany(response.data.company);
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid - clear storage
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user, company } = extractAuthPayload(response.data);

      if (!accessToken || !refreshToken || !user) {
        return {
          success: false,
          error: 'Invalid login response from server',
        };
      }
      
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setCompany(company);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { accessToken, refreshToken, user, company } = extractAuthPayload(response.data);

      if (!accessToken || !refreshToken || !user) {
        return {
          success: false,
          error: 'Invalid signup response from server',
        };
      }
      
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setCompany(company);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    company,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
