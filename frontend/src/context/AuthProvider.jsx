import { useState, useEffect, useCallback } from 'react';
import AuthContext from './AuthContext';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth';

// The backend returns { id, name, email, role } (not _id).
// Normalize to always expose _id so all components work consistently.
const normalizeUser = (u) => u ? { ...u, _id: u._id ?? u.id } : null;

const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying existing token

  // ── On mount: try to restore session from stored token ────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(({ data }) => setUser(normalizeUser(data.user)))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await apiLogin({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    const normalizedUser = normalizeUser(data.user);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const value = { user, loading, login, logout, isAdmin: user?.role === 'admin' };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
