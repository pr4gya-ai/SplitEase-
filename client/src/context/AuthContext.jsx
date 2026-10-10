import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api.me().then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const finish = useCallback((r) => {
    setToken(r.token);
    setUser(r.user);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      login: async (b) => finish(await api.login(b)),
      register: async (b) => finish(await api.register(b)),
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [user, loading, finish]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
