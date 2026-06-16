import { createContext, useContext, ReactNode, useMemo, useState } from "react";
import { apiClient } from "../services/api-client";

export type UserRole = "USER" | "ADMIN" | "REVIEWER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AdminAuthProvider");
  }
  return context;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("dawaisaver.admin.user");
    return stored ? JSON.parse(stored) as AuthUser : null;
  });

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    setUser(response.data.user as AuthUser);
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
    hasRole,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
