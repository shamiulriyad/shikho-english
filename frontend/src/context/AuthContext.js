import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

const loadStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadStoredUser);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const authenticate = async (endpoint, body, fallbackMessage) => {
    try {
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || fallbackMessage };
    }
  };

  const login = (email, password) =>
    authenticate('/auth/login', { email, password }, 'Login failed');

  const register = (email, username, password, fullName) =>
    authenticate('/auth/register', { email, username, password, fullName }, 'Registration failed');

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
