import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/lib/mock-api";
import type { User } from "@/types";

type PublicUser = Omit<User, "password">;

interface AuthCtx {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, role?: User["role"]) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "phone" | "avatar">>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const TOKEN_KEY = "clinicflow_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY))) || null;
    if (!stored) {
      setLoading(false);
      return;
    }
    authApi
      .profile(stored)
      .then((u) => {
        setUser(u);
        setToken(stored);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login: AuthCtx["login"] = async (email, password, remember = true) => {
    const res = await authApi.login(email, password);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    setToken(res.token);
  };

  const register: AuthCtx["register"] = async (name, email, password, role) => {
    const res = await authApi.register({ name, email, password, role });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  const updateProfile: AuthCtx["updateProfile"] = async (patch) => {
    if (!token) return;
    const u = await authApi.updateProfile(token, patch);
    setUser(u);
  };

  return <Ctx.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
