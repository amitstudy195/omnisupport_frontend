import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const API_BASE_URL = 'https://omnisupport-skgt.onrender.com/api';

export const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      // Use bearer fallback plus credentials to support cookie and token login.
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching auth status:', err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Login failed');
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      return { success: false, message: err.message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Registration failed');
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      localStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
