import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem(api.USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (api.getToken() ? storedUser() : null));
  const [flash, setFlash] = useState(() => {
    const msg = sessionStorage.getItem(api.FLASH_KEY);
    sessionStorage.removeItem(api.FLASH_KEY);
    return msg;
  });

  const startSession = useCallback((result) => {
    localStorage.setItem(api.TOKEN_KEY, result.access_token);
    localStorage.setItem(api.USER_KEY, JSON.stringify(result.user));
    setFlash(null);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(api.TOKEN_KEY);
    localStorage.removeItem(api.USER_KEY);
    setUser(null);
  }, []);

  // A 401 from any API call clears the session (see api.js)
  useEffect(() => {
    const onUnauthorized = () => {
      setFlash(sessionStorage.getItem(api.FLASH_KEY));
      sessionStorage.removeItem(api.FLASH_KEY);
      setUser(null);
    };
    window.addEventListener("ss:unauthorized", onUnauthorized);
    return () => window.removeEventListener("ss:unauthorized", onUnauthorized);
  }, []);

  // Refresh the stored user once after a page reload
  useEffect(() => {
    if (!api.getToken()) return;
    api.me().then((u) => {
      localStorage.setItem(api.USER_KEY, JSON.stringify(u));
      setUser(u);
    }).catch(() => {});
  }, []);

  const value = useMemo(() => ({ user, flash, startSession, logout }), [user, flash, startSession, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
