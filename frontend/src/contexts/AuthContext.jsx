import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authMe, authLogout } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount and after OAuth redirect
  const checkAuth = useCallback(async () => {
    try {
      const data = await authMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success') || params.get('auth_error')) {
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await authLogout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
