/**
 * Single integration point for the StackedHub ASP.NET Core Web API.
 *
 * The API address comes from (in order): the address saved on the Settings
 * page (localStorage), then `VITE_API_BASE_URL`. With neither set, the app
 * runs on bundled demo data. Every live call attaches the JWT as
 * `Authorization: Bearer <token>`.
 */

const ENV_API_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";
const API_URL_KEY = "stackedhub.apiUrl";
const TOKEN_KEY = "stackedhub.jwt";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(API_URL_KEY);
    if (saved) return saved;
  }
  return ENV_API_URL;
}

export function setApiBaseUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, "");
  if (clean) window.localStorage.setItem(API_URL_KEY, clean);
  else window.localStorage.removeItem(API_URL_KEY);
}

export const isLiveApi = () => getApiBaseUrl().length > 0;

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
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

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    if (json.error) return String(json.error);
    if (json.title) return String(json.title);
  } catch {
    /* not json */
  }
  return text || response.statusText || `Request failed (${response.status})`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new ApiError("API address is not set (demo mode).", 0);

  const token = tokenStore.get();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Can't reach the API at ${base}. Is it running?`, 0);
  }

  if (response.status === 401) {
    throw new ApiError("Your session has expired or the details are wrong. Please sign in again.", 401);
  }
  if (response.status === 403) {
    throw new ApiError("Your account doesn't have access to this.", 403);
  }
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Endpoints exposed by backend/StackedHub.Api (Backend-database branch). */
export const endpoints = {
  health: "/health",
  login: "/api/auth/login",
  register: "/api/auth/register",
  forgotPassword: "/api/auth/forgot-password",
  staffOrders: "/api/staff/orders",
  staffOrderStatus: (id: string) => `/api/staff/orders/${id}/status`,
  staffAvailability: (id: string) => `/api/staff/menu/${id}/availability`,
  menu: "/api/menu",
  adminMenu: "/api/admin/menu",
  adminMenuItem: (id: string) => `/api/admin/menu/${id}`,
  adminUsers: "/api/admin/users",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  adminReports: "/api/admin/reports",
  adminAudit: "/api/admin/audit",
  customers: "/api/customers",
  promotions: "/api/promotions",
  aiRecommendations: "/api/ai/recommendations",
} as const;
