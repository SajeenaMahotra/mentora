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
  // --- CHANGED: no longer takes a token — the token lives in an httpOnly cookie
  // the browser manages automatically, the frontend never sees it.
  login: (userData: User) => void;
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
    // --- CHANGED: no token in localStorage to read anymore. Instead, ask the
    // backend "who am I" — the httpOnly cookie is sent automatically, and if it's
    // valid the backend returns the current user; if not, this 401s and we just
    // stay logged out.
    async function checkSession() {
      try {
        const res = await api.get(ENDPOINTS.ME);
        setUser(res.data.data);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = (userData: User) => {
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
      // Clears the httpOnly cookie server-side.
      await api.post(ENDPOINTS.LOGOUT);
    } catch {
      // Even if the server call fails (e.g. network issue, already-expired session),
      // we still clear local state below — logout should never get "stuck".
    }
    disconnectSocket();
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