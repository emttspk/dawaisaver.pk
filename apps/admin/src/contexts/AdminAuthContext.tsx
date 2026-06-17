import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { AdminRole, AdminUser, apiClient } from "../services/api-client";

interface AuthContextValue {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: AdminRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AdminAuthProvider");
  return context;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => apiClient.getStoredUser());

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    setUser(response.user);
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const hasRole = (role: AdminRole) => user?.role === role;

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout, isAuthenticated: Boolean(user), hasRole }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
