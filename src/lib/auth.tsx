import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStore } from "./api-client";
import type { AuthUser, Role } from "./types";

const USER_KEY = "stackedhub.user";

/** Demo accounts used while the .NET API is not connected. */
const demoUsers: Record<Role, AuthUser> = {
  Admin: {
    id: "u1",
    name: "Thandi Mokoena",
    email: "thandi@stackedfoods.co.za",
    role: "Admin",
  },
  Staff: {
    id: "u2",
    name: "Jason Reid",
    email: "jason@stackedfoods.co.za",
    role: "Staff",
  },
  Customer: {
    id: "c1",
    name: "Priya Nair",
    email: "priya.nair@example.co.za",
    role: "Customer",
    loyaltyPoints: 412,
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (role: Role, email?: string) => AuthUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setReady(true);
  }, []);

  const signIn = useCallback((role: Role, email?: string) => {
    const next: AuthUser = { ...demoUsers[role], ...(email ? { email } : {}) };
    window.localStorage.setItem(USER_KEY, JSON.stringify(next));
    // Live mode replaces this with the JWT returned by /api/auth/login.
    tokenStore.set(`demo.${role.toLowerCase()}.token`);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(USER_KEY);
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const homeRouteForRole = (role: Role) =>
  role === "Customer" ? "/portal" : "/dashboard";
