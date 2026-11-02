/**
 * Single integration point for the StackedHub ASP.NET Core Web API.
 *
 * The API address comes from a non-Azure Settings address, then a non-Azure
 * `VITE_API_BASE_URL`, then the deployed Render API. Retired Azure hosts are
 * replaced automatically. If Render cannot be reached, screens fall back to
 * bundled demo data. Every live call attaches the JWT as
 * `Authorization: Bearer <token>`.
 */

const ENV_API_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";
/** Deployed ASP.NET Core API used when neither deployment env nor a saved URL is configured. */
export const DEFAULT_API_BASE_URL = "https://stackedhubgo.onrender.com";
const API_URL_KEY = "stackedhub.apiUrl";
/** Long enough for a sleeping Render instance to wake on the first request. */
export const API_TIMEOUT_MS = 45_000;
const TOKEN_KEY = "stackedhub.jwt";
/** Previous hosted hosts. A saved Settings URL for these is replaced by the configured API. */
const LEGACY_AZURE_HOSTS = new Set([
  "stackedhub-api-eufvdfc5duhwcpe4.southafricanorth-01.azurewebsites.net",
  "stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net",
]);

function apiHost(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function isLegacyAzureApi(url: string) {
  const host = apiHost(url);
  return host !== null && LEGACY_AZURE_HOSTS.has(host);
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export type ApiConnectionState = "unknown" | "online" | "offline";
let apiConnectionState: ApiConnectionState = "unknown";
const apiStateListeners = new Set<(state: ApiConnectionState) => void>();

export function getApiConnectionState(): ApiConnectionState {
  return apiConnectionState;
}

export function isApiOffline(): boolean {
  return apiConnectionState === "offline";
}

export function subscribeToApiState(listener: (state: ApiConnectionState) => void) {
  apiStateListeners.add(listener);
  return () => {
    apiStateListeners.delete(listener);
  };
}

function setApiConnectionState(state: ApiConnectionState) {
  if (apiConnectionState === state) return;
  apiConnectionState = state;
  apiStateListeners.forEach((listener) => listener(state));
}

export function markApiOffline() {
  setApiConnectionState("offline");
}

export function markApiOnline() {
  setApiConnectionState("online");
}

export async function checkApiConnection(): Promise<boolean> {
  if (!getApiBaseUrl()) return false;
  try {
    await apiRequest<{ status?: string }>("/health", { timeoutMs: API_TIMEOUT_MS });
    markApiOnline();
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return false;
    markApiOffline();
    return false;
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

/** Retired Azure hosts never win over the Render API, even when baked into an old build. */
export function selectApiBaseUrl(
  envUrl: string,
  savedUrl: string | null,
  fallback = DEFAULT_API_BASE_URL,
): string {
  const fromEnv = envUrl.trim().replace(/\/+$/, "");
  const configured =
    fromEnv && !isLegacyAzureApi(fromEnv) ? fromEnv : fallback.trim().replace(/\/+$/, "");
  const saved = savedUrl?.trim().replace(/\/+$/, "") ?? "";
  if (!saved) return configured;
  if (isLegacyAzureApi(saved) && configured && !isLegacyAzureApi(configured)) return configured;
  return saved;
}

export function getApiBaseUrl(): string {
  const saved =
    typeof window !== "undefined" ? window.localStorage.getItem(API_URL_KEY) : null;
  const selected = selectApiBaseUrl(ENV_API_URL, saved);
  if (typeof window !== "undefined" && saved) {
    const normalized = saved.trim().replace(/\/+$/, "");
    if (normalized && normalized !== selected) window.localStorage.setItem(API_URL_KEY, selected);
  }
  return selected;
}

export function setApiBaseUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, "");
  if (clean) window.localStorage.setItem(API_URL_KEY, clean);
  else window.localStorage.removeItem(API_URL_KEY);
}

export const isLiveApi = () => getApiBaseUrl().length > 0 && !isApiOffline();

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
    const abortedByCaller =
      !timedOut &&
      (init.signal?.aborted || (err instanceof Error && err.name === "AbortError"));
    // A route change aborts the request. That is not an API outage.
    if (abortedByCaller) throw err;
    const error = networkError(base, timedOut);
    markApiOffline();
    throw error;
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
    if (response.status >= 500) markApiOffline();
    throw new ApiError(
      await readError(response),
      response.status,
      "http",
      readOnly && response.status >= 500,
    );
  }
  if (response.status === 204) {
    markApiOnline();
    return undefined as T;
  }

  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    throw new ApiError("The server sent an empty response.", response.status, "parse", readOnly);
  }
  const parsed = parseSuccessBody<T>(text, response.status, readOnly);
  markApiOnline();
  return parsed;
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
