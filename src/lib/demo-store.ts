/**
 * Browser-session demo store. Mutations live in sessionStorage so they survive
 * client navigations and account switches in the same tab. The server never
 * caches this — each SSR call gets a fresh seed copy.
 */
import * as mock from "./mock-data";
import type { AuditLogEntry, AuthUser, Customer, MenuItem, Order, Promotion } from "./types";

export const DEMO_STORE_KEY = "stackedhub.demoStore";
export const DEMO_STORE_VERSION = 1;

export interface DemoStore {
  orders: Order[];
  menu: MenuItem[];
  users: Array<AuthUser & { active: boolean }>;
  audit: AuditLogEntry[];
  customers: Customer[];
  promotions: Promotion[];
}

export function createSeedStore(now = Date.now()): DemoStore {
  return {
    orders: mock.createSeedOrders(now),
    menu: mock.menuItems.map((m) => ({ ...m })),
    audit: mock.createSeedAudit(now),
    customers: mock.customers.map((c) => ({ ...c })),
    promotions: mock.promotions.map((p) => ({ ...p })),
    users: [
      {
        id: "u1",
        name: "Thandi Mokoena",
        email: "thandi@stackedfoods.co.za",
        role: "Admin",
        active: true,
      },
      {
        id: "u2",
        name: "Jason Reid",
        email: "jason@stackedfoods.co.za",
        role: "Staff",
        active: true,
      },
      {
        id: "u3",
        name: "Nomsa Khumalo",
        email: "nomsa@stackedfoods.co.za",
        role: "Staff",
        active: true,
      },
      ...mock.customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: "Customer" as const,
        loyaltyPoints: c.loyaltyPoints,
        active: true,
      })),
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrderLike(value: unknown): value is Order {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["reference"] === "string" &&
    typeof value["customerId"] === "string" &&
    typeof value["status"] === "string" &&
    typeof value["placedAt"] === "string" &&
    typeof value["total"] === "number" &&
    Array.isArray(value["items"])
  );
}

export function isValidDemoStore(value: unknown): value is DemoStore {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value["orders"]) &&
    value["orders"].every(isOrderLike) &&
    Array.isArray(value["menu"]) &&
    value["menu"].length > 0 &&
    Array.isArray(value["users"]) &&
    Array.isArray(value["audit"]) &&
    Array.isArray(value["customers"]) &&
    Array.isArray(value["promotions"])
  );
}

function canUseSession() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

let clientStore: DemoStore | null = null;

function readSession(): DemoStore | null {
  if (!canUseSession()) return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_STORE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed["version"] !== DEMO_STORE_VERSION ||
      !isValidDemoStore(parsed["data"])
    ) {
      window.sessionStorage.removeItem(DEMO_STORE_KEY);
      return null;
    }
    return parsed["data"];
  } catch {
    try {
      window.sessionStorage.removeItem(DEMO_STORE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function getDemoStore(): DemoStore {
  if (!canUseSession()) {
    return createSeedStore();
  }
  if (!clientStore) {
    clientStore = readSession() ?? createSeedStore();
    persistDemoStore();
  }
  return clientStore;
}

export function persistDemoStore() {
  if (!canUseSession() || !clientStore) return;
  try {
    window.sessionStorage.setItem(
      DEMO_STORE_KEY,
      JSON.stringify({ version: DEMO_STORE_VERSION, data: clientStore }),
    );
  } catch {
    /* private mode / quota — keep the in-memory copy for this page */
  }
}

/** Drop the in-memory cache so the next read reloads sessionStorage (navigation / HMR). */
export function forgetDemoStoreMemory() {
  clientStore = null;
}

/** Test helper: clear memory and session. */
export function resetDemoStore() {
  clientStore = null;
  if (canUseSession()) {
    try {
      window.sessionStorage.removeItem(DEMO_STORE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function hourlyFromOrders(orders: Order[]): { hour: string; orders: number }[] {
  const counts = new Map<string, number>();
  for (const order of orders) {
    const date = new Date(order.placedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${String(date.getHours()).padStart(2, "0")}:00`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return [];
  const hours = [...counts.keys()].map((key) => Number(key.slice(0, 2)));
  const min = Math.min(...hours);
  const max = Math.max(...hours);
  const rows: { hour: string; orders: number }[] = [];
  for (let hour = min; hour <= max; hour += 1) {
    const key = `${String(hour).padStart(2, "0")}:00`;
    rows.push({ hour: key, orders: counts.get(key) ?? 0 });
  }
  return rows;
}

export function bestSellersFromOrders(orders: Order[]): { name: string; sold: number }[] {
  const sold = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    for (const item of order.items) {
      sold.set(item.name, (sold.get(item.name) ?? 0) + item.quantity);
    }
  }
  return [...sold]
    .map(([name, count]) => ({ name, sold: count }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);
}
