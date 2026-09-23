/**
 * Single integration point for the ASP.NET Core Web API.
 *
 * While `VITE_API_BASE_URL` is unset the app runs on the bundled demo data
 * (see `src/lib/mock-data.ts`). Set the variable and every call below hits the
 * real API with the JWT attached as `Authorization: Bearer <token>`.
 */

export const API_BASE_URL: string = import.meta.env['VITE_API_BASE_URL'] ?? "";

export const isLiveApi = () => API_BASE_URL.length > 0;

const TOKEN_KEY = "stackedhub.jwt";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!isLiveApi()) {
    throw new ApiError("API base URL is not configured (demo mode).", 0);
  }

  const token = tokenStore.get();
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 401) {
    tokenStore.clear();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    throw new ApiError(await response.text().catch(() => response.statusText), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Endpoint map matching the planned REST API contract. */
export const endpoints = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  forgotPassword: "/api/auth/forgot-password",
  orders: "/api/orders",
  orderStatus: (id: string) => `/api/orders/${id}/status`,
  menu: "/api/menu",
  inventory: "/api/inventory",
  customers: "/api/customers",
  promotions: "/api/promotions",
  reports: "/api/reports",
  auditLogs: "/api/audit-logs",
  aiRecommendations: "/api/ai/recommendations",
} as const;
