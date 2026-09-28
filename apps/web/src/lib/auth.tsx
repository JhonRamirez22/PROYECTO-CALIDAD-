"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "ADMIN" | "GERENTE" | "OPERADOR" | "CONTADOR" | "PROPIETARIO" | "COMPRADOR" | "VENDEDOR" | "LOGISTICA" | "CLIENTE_PERSONAL";

interface User {
  id: string;
  email: string;
  roles: UserRole[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !token && !["/login", "/forgot-password", "/reset-password"].includes(pathname)) {
      router.push("/login");
    }
  }, [loading, token, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Credenciales inválidas");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    router.push("/");
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!token) return;
    let expiresAt = 0;
    try {
      const encodedPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=")));
      expiresAt = Number(payload.exp) * 1000;
    } catch {
      return;
    }
    const refreshDelay = Math.max(1000, expiresAt - Date.now() - 5 * 60 * 1000);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API}/auth/refresh`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("La sesión expiró");
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
      } catch {
        logout();
      }
    }, refreshDelay);
    return () => window.clearTimeout(timer);
  }, [token, logout]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user || !user.roles) return false;
      return user.roles.some((r) => roles.includes(r));
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
