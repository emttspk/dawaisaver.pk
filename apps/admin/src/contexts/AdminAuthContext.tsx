import { createContext, useContext, ReactNode } from "react";

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
  const login = async (_email: string, _password: string) => {
    console.log("Login placeholder");
  };

  const logout = () => {
    console.log("Logout placeholder");
  };

  const hasRole = (role: UserRole): boolean => {
    return true;
  };

  const value: AuthContextValue = {
    user: null,
    login,
    logout,
    isAuthenticated: false,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}