import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, endpoints, isLiveApi, setUnauthorizedHandler, tokenStore } from "./api-client";
import type { AuthUser, Role } from "./types";

const USER_KEY = "stackedhub.user";

/** Demo accounts used while the API is not connected. */
const demoUsers: Record<Role, AuthUser> = {
  Admin: { id: "u1", name: "Thandi Mokoena", email: "thandi@stackedfoods.co.za", role: "Admin" },
  Staff: { id: "u2", name: "Jason Reid", email: "jason@stackedfoods.co.za", role: "Staff" },
  Customer: {
    id: "c1",
    name: "Priya Nair",
    email: "priya.nair@example.co.za",
    role: "Customer",
    loyaltyPoints: 412,
  },
};

export const demoEmailForRole = (role: Role) => demoUsers[role].email;

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (args: { email: string; password: string; role: Role }) => Promise<AuthUser>;
  register: (args: { name: string; email: string; password: string }) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const persist = (next: AuthUser) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  };

  const signOut = useCallback(() => {
    window.localStorage.removeItem(USER_KEY);
    tokenStore.clear();
    setUser(null);
  }, []);

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

  useEffect(() => {
    setUnauthorizedHandler(() => {
      window.localStorage.removeItem(USER_KEY);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async ({ email, password, role }) => {
    let next: AuthUser;
    if (isLiveApi()) {
      const res = await apiRequest<{ token: string; user: AuthUser }>(endpoints.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      tokenStore.set(res.token);
      next = res.user;
    } else {
      next = { ...demoUsers[role], email: email || demoUsers[role].email };
      tokenStore.set(`demo.${role.toLowerCase()}.token`);
    }
    persist(next);
    return next;
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async ({ name, email, password }) => {
    let next: AuthUser;
    if (isLiveApi()) {
      const res = await apiRequest<{ token?: string; user: AuthUser }>(endpoints.register, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (res.token) tokenStore.set(res.token);
      next = res.user;
      if (!res.token) {
        const login = await apiRequest<{ token: string; user: AuthUser }>(endpoints.login, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        tokenStore.set(login.token);
        next = login.user;
      }
    } else {
      next = {
        id: `c${Date.now()}`,
        name,
        email,
        role: "Customer",
        loyaltyPoints: 0,
      };
      tokenStore.set("demo.customer.token");
    }
    persist(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, register, signOut }),
    [user, ready, signIn, register, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const homeRouteForRole = (role: Role) => (role === "Customer" ? "/portal" : "/dashboard");
