/**
 * Single integration point for the StackedHub ASP.NET Core Web API.
 *
 * The API address comes from (in order): the address saved on the Settings
 * page (localStorage), then `VITE_API_BASE_URL`. With neither set, the app
 * runs on bundled demo data. Every live call attaches the JWT as
 * `Authorization: Bearer <token>`.
 */

const ENV_API_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";
/** Deployed ASP.NET Core API used when neither deployment env nor a saved URL is configured. */
export const DEFAULT_API_BASE_URL =
  "https://stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net";
const API_URL_KEY = "stackedhub.apiUrl";
const TOKEN_KEY = "stackedhub.jwt";

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(API_URL_KEY);
    if (saved) return saved;
  }
  return ENV_API_URL || DEFAULT_API_BASE_URL;
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

export const API_TIMEOUT_MS = 15_000;

export type ApiErrorCode = "timeout" | "offline" | "network" | "http" | "parse" | "config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: ApiErrorCode = "http",
    public retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isReadOnlyMethod(method?: string) {
  const verb = (method ?? "GET").toUpperCase();
  return verb === "GET" || verb === "HEAD";
}

export function toUserMessage(
  error: unknown,
  fallback = "The request failed. Check your connection and try again.",
) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

export type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  idempotencyKey?: string;
};

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { error?: unknown; title?: unknown; detail?: unknown };
    if (json.error) return String(json.error);
    if (json.title) return String(json.title);
    if (json.detail) return String(json.detail);
  } catch {
    /* not json */
  }
  if (response.status === 400) return "Check the details you entered and try again.";
  if (response.status === 404) return "That record was not found.";
  if (response.status === 500) return "The server hit a problem. Try again in a moment.";
  return text || response.statusText || `Request failed (${response.status})`;
}

function networkError(base: string, timedOut: boolean): ApiError {
  if (timedOut) {
    return new ApiError(
      "The request took too long. Check your connection and try again.",
      0,
      "timeout",
      true,
    );
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new ApiError("You appear to be offline. Reconnect and try again.", 0, "offline", true);
  }
  return new ApiError(
    `Can't reach the API at ${base}. Check the address and that the API is running, then retry.`,
    0,
    "network",
    true,
  );
}

function parseSuccessBody<T>(text: string, status: number, retryable: boolean): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("The server sent a response we could not read.", status, "parse", retryable);
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new ApiError("API address is not set (demo mode).", 0, "config", false);

  const { timeoutMs = API_TIMEOUT_MS, idempotencyKey, ...init } = options;
  const method = init.method ?? "GET";
  const readOnly = isReadOnlyMethod(method);
  const token = tokenStore.get();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onUserAbort = () => controller.abort();
  init.signal?.addEventListener("abort", onUserAbort);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw networkError(base, timedOut);
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", onUserAbort);
  }

  if (response.status === 401) {
    tokenStore.clear();
    unauthorizedHandler?.();
    throw new ApiError(
      "Your session has expired or the details are wrong. Please sign in again.",
      401,
      "http",
      false,
    );
  }
  if (response.status === 403) {
    throw new ApiError("Your account doesn't have access to this.", 403, "http", false);
  }
  if (!response.ok) {
    throw new ApiError(
      await readError(response),
      response.status,
      "http",
      readOnly && response.status >= 500,
    );
  }
  if (response.status === 204) return undefined as T;

  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    throw new ApiError("The server sent an empty response.", response.status, "parse", readOnly);
  }
  return parseSuccessBody<T>(text, response.status, readOnly);
}

/** Endpoints from Role 2 (`ROLE-2.md` on Backend-database), plus staff aliases. */
export const endpoints = {
  health: "/health",
  login: "/api/auth/login",
  register: "/api/auth/register",
  forgotPassword: "/api/auth/forgot-password",
  me: "/api/auth/me",
  orders: "/api/orders",
  orderSlots: "/api/orders/slots",
  orderCancel: (id: string) => `/api/orders/${id}/cancel`,
  orderStatus: (id: string) => `/api/orders/${id}/status`,
  staffOrders: "/api/staff/orders",
  staffOrderStatus: (id: string) => `/api/staff/orders/${id}/status`,
  staffAvailability: (id: string) => `/api/staff/menu/${id}/availability`,
  inventory: "/api/inventory",
  inventoryItem: (id: string) => `/api/inventory/${id}`,
  menu: "/api/menu",
  adminMenu: "/api/admin/menu",
  adminMenuItem: (id: string) => `/api/admin/menu/${id}`,
  adminUsers: "/api/admin/users",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  reports: "/api/reports",
  auditLogs: "/api/audit-logs",
  adminReports: "/api/admin/reports",
  adminAudit: "/api/admin/audit",
  customers: "/api/customers",
  promotions: "/api/promotions",
  promotion: (id: string) => `/api/promotions/${id}`,
  aiRecommendations: "/api/ai/recommendations",
  groups: "/api/groups",
  groupJoin: "/api/groups/join",
  group: (id: string) => `/api/groups/${id}`,
  groupItems: (id: string) => `/api/groups/${id}/items`,
  groupItem: (id: string, itemId: string) => `/api/groups/${id}/items/${itemId}`,
  groupLock: (id: string) => `/api/groups/${id}/lock`,
  groupUnlock: (id: string) => `/api/groups/${id}/unlock`,
  groupCancel: (id: string) => `/api/groups/${id}/cancel`,
  groupLeave: (id: string) => `/api/groups/${id}/leave`,
  groupCheckout: (id: string) => `/api/groups/${id}/checkout`,
  loyalty: "/api/loyalty",
  loyaltyRedeem: "/api/loyalty/redeem",
} as const;
