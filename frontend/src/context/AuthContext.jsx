import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('baghnetra_user');
    return saved ? JSON.parse(saved) : {
      name: 'Pench Field Officer',
      role: 'biologist',
      username: 'admin',
      badgeNumber: 'PTR-DFO-01'
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('baghnetra_token'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('baghnetra_token', res.data.token);
      localStorage.setItem('baghnetra_user', JSON.stringify(res.data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('baghnetra_token');
    localStorage.removeItem('baghnetra_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
