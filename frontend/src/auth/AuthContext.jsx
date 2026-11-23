import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // true until we know if a session exists

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    // On page load/refresh, ask the server if we're still signed in
    apiRequest('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}