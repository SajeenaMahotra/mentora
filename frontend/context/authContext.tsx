"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { disconnectSocket } from "@/lib/socket";
import { ENDPOINTS } from "@/lib/api/endpoints";
import api from "@/lib/api/axios";

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: "learner" | "mentor" | "admin";
  isProfileSetup: boolean;
  profilePhoto?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch { }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    if (userData.role === "mentor" && !userData.isProfileSetup) {
      router.push("/setup-profile");
    } else if (userData.role === "mentor") {
      router.push("/mentor/dashboard");
    } else if (userData.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/feed");
    }
  };

  const logout = async () => {
    try {
      await api.post(ENDPOINTS.LOGOUT);
    } catch {
      // Even if the server call fails (e.g. network issue, already-expired token),
      // we still clear the local session below — logout should never get "stuck".
    }
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}