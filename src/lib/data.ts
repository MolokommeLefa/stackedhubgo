/**
 * Data access for the Staff and Admin MVP. Each function calls the live API
 * when an address is configured, otherwise it works on an in-memory copy of
 * the demo data (changes reset on refresh).
 */
import { apiRequest, endpoints, isLiveApi } from "./api-client";
import * as mock from "./mock-data";
import type { AuditLogEntry, AuthUser, MenuItem, Order, OrderStatus } from "./types";

export interface ManagedUser extends AuthUser {
  active: boolean;
}

export interface Report {
  orderCount: number;
  completedSales: number;
  hourlyOrders: { hour: string; orders: number }[];
  revenueByDay: { day: string; revenue: number }[];
  bestSellers: { name: string; sold: number }[];
  salesByChannel: { channel: string; total: number }[];
}

export type MenuInput = Omit<MenuItem, "id">;

// ---- demo store (lazy so nothing runs at module load) ----
let store: {
  orders: Order[];
  menu: MenuItem[];
  users: ManagedUser[];
  audit: AuditLogEntry[];
} | null = null;

function demo() {
  if (!store) {
    store = {
      orders: mock.orders.map((o) => ({ ...o })),
      menu: mock.menuItems.map((m) => ({ ...m })),
      audit: [...mock.auditLog],
      users: [
        { id: "u1", name: "Thandi Mokoena", email: "thandi@stackedfoods.co.za", role: "Admin", active: true },
        { id: "u2", name: "Jason Reid", email: "jason@stackedfoods.co.za", role: "Staff", active: true },
        { id: "u3", name: "Nomsa Khumalo", email: "nomsa@stackedfoods.co.za", role: "Staff", active: true },
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
  return store;
}

function logDemo(action: string, target: string) {
  demo().audit.unshift({
    id: `a${Date.now()}`,
    actor: "You (demo)",
    role: "Admin",
    action,
    target,
    at: new Date().toISOString(),
  });
}

const json = (body: unknown) => JSON.stringify(body);

// ---- orders ----
export async function getOrderQueue(): Promise<Order[]> {
  if (isLiveApi()) return apiRequest<Order[]>(endpoints.staffOrders);
  return [...demo().orders];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.staffOrderStatus(id), {
      method: "PATCH",
      body: json({ status }),
    });
  }
  const order = demo().orders.find((o) => o.id === id)!;
  order.status = status;
  return { ...order };
}

// ---- menu / availability ----
export async function getMenu(): Promise<MenuItem[]> {
  if (isLiveApi()) return apiRequest<MenuItem[]>(endpoints.menu);
  return [...demo().menu];
}

export async function setAvailability(id: string, available: boolean): Promise<MenuItem> {
  if (isLiveApi()) {
    return apiRequest<MenuItem>(endpoints.staffAvailability(id), {
      method: "PATCH",
      body: json({ available }),
    });
  }
  const item = demo().menu.find((m) => m.id === id)!;
  item.available = available;
  return { ...item };
}

export async function saveMenuItem(input: MenuInput, id?: string): Promise<MenuItem> {
  if (isLiveApi()) {
    return apiRequest<MenuItem>(id ? endpoints.adminMenuItem(id) : endpoints.adminMenu, {
      method: id ? "PUT" : "POST",
      body: json(input),
    });
  }
  const menu = demo().menu;
  if (id) {
    const idx = menu.findIndex((m) => m.id === id);
    menu[idx] = { ...input, id };
    logDemo("Updated menu item", input.name);
    return menu[idx];
  }
  const created = { ...input, id: `m${Date.now()}` };
  menu.push(created);
  logDemo("Created menu item", input.name);
  return created;
}

// ---- users ----
export async function getUsers(): Promise<ManagedUser[]> {
  if (isLiveApi()) {
    const users = await apiRequest<AuthUser[]>(endpoints.adminUsers);
    return users.map((u) => ({ ...u, active: true }));
  }
  return demo().users.map((u) => ({ ...u }));
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  if (isLiveApi()) {
    await apiRequest(endpoints.adminUser(id), { method: "PATCH", body: json({ isActive: active }) });
    return;
  }
  const user = demo().users.find((u) => u.id === id)!;
  user.active = active;
  logDemo(active ? "Activated user" : "Deactivated user", user.email);
}

// ---- reports & audit ----
export async function getReport(): Promise<Report> {
  if (isLiveApi()) return apiRequest<Report>(endpoints.adminReports);
  const orders = demo().orders;
  const channels = new Map<string, number>();
  orders.forEach((o) => channels.set(o.channel, (channels.get(o.channel) ?? 0) + o.total));
  return {
    orderCount: orders.length,
    completedSales: orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.total, 0),
    hourlyOrders: mock.hourlyOrders,
    revenueByDay: mock.revenueByDay,
    bestSellers: mock.bestSellers,
    salesByChannel: [...channels].map(([channel, total]) => ({ channel, total })),
  };
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  if (isLiveApi()) return apiRequest<AuditLogEntry[]>(endpoints.adminAudit);
  return [...demo().audit];
}
