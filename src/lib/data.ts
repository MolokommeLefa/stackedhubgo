/**
 * Data access for the Staff and Admin MVP. Each function calls the live API
 * when an address is configured, otherwise it works on an in-memory copy of
 * the demo data (changes reset on refresh).
 */
import { ApiError, apiRequest, endpoints, isLiveApi } from "./api-client";
import * as mock from "./mock-data";
import type { AuditLogEntry, AuthUser, Customer, MenuItem, Order, OrderStatus, Promotion } from "./types";

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

export interface PlaceOrderInput {
  customerId: string;
  customerName: string;
  items: { menuItemId: string; name: string; quantity: number; unitPrice: number }[];
  channel?: Order["channel"];
}

async function firstOk<T>(calls: Array<() => Promise<T>>): Promise<T> {
  let last: unknown;
  for (const call of calls) {
    try {
      return await call();
    } catch (err) {
      last = err;
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) continue;
      throw err;
    }
  }
  throw last;
}

let store: {
  orders: Order[];
  menu: MenuItem[];
  users: ManagedUser[];
  audit: AuditLogEntry[];
  customers: Customer[];
  promotions: Promotion[];
} | null = null;

function demo() {
  if (!store) {
    store = {
      orders: mock.orders.map((o) => ({ ...o })),
      menu: mock.menuItems.map((m) => ({ ...m })),
      audit: [...mock.auditLog],
      customers: mock.customers.map((c) => ({ ...c })),
      promotions: mock.promotions.map((p) => ({ ...p })),
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

export async function getOrderQueue(): Promise<Order[]> {
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<Order[]>(endpoints.orders),
      () => apiRequest<Order[]>(endpoints.staffOrders),
    ]);
  }
  return [...demo().orders];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<Order>(endpoints.orderStatus(id), { method: "PATCH", body: json({ status }) }),
      () => apiRequest<Order>(endpoints.staffOrderStatus(id), { method: "PATCH", body: json({ status }) }),
    ]);
  }
  const order = demo().orders.find((o) => o.id === id);
  if (!order) throw new ApiError("That order is no longer on the board.", 404);
  order.status = status;
  return { ...order };
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const total = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.orders, {
      method: "POST",
      body: json({
        customerId: input.customerId,
        items: input.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        channel: input.channel ?? "Website",
      }),
    });
  }
  const created: Order = {
    id: `o${Date.now()}`,
    reference: `SH-${Math.floor(100 + Math.random() * 900)}`,
    customerId: input.customerId,
    customerName: input.customerName,
    channel: input.channel ?? "Website",
    items: input.items,
    total,
    status: "Placed",
    placedAt: new Date().toISOString(),
  };
  demo().orders.unshift(created);
  return created;
}

export async function getMenu(): Promise<MenuItem[]> {
  if (isLiveApi()) return apiRequest<MenuItem[]>(endpoints.menu);
  return [...demo().menu];
}

export async function setAvailability(id: string, available: boolean): Promise<MenuItem> {
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<MenuItem>(endpoints.staffAvailability(id), { method: "PATCH", body: json({ available }) }),
      () => apiRequest<MenuItem>(endpoints.inventoryItem(id), { method: "PATCH", body: json({ available }) }),
    ]);
  }
  const item = demo().menu.find((m) => m.id === id);
  if (!item) throw new ApiError("That menu item was not found.", 404);
  item.available = available;
  return { ...item };
}

export async function setMenuStock(id: string, stock: number): Promise<MenuItem> {
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<MenuItem>(endpoints.inventoryItem(id), { method: "PATCH", body: json({ stock }) }),
      () => apiRequest<MenuItem>(endpoints.adminMenuItem(id), { method: "PUT", body: json({ stock }) }),
    ]);
  }
  const item = demo().menu.find((m) => m.id === id);
  if (!item) throw new ApiError("That menu item was not found.", 404);
  item.stock = stock;
  item.available = stock > 0 ? item.available : false;
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
    if (idx < 0) throw new ApiError("That menu item was not found.", 404);
    menu[idx] = { ...input, id };
    logDemo("Updated menu item", input.name);
    return menu[idx];
  }
  const created = { ...input, id: `m${Date.now()}` };
  menu.push(created);
  logDemo("Created menu item", input.name);
  return created;
}

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
  const user = demo().users.find((u) => u.id === id);
  if (!user) throw new ApiError("That user was not found.", 404);
  user.active = active;
  logDemo(active ? "Activated user" : "Deactivated user", user.email);
}

export async function getCustomers(): Promise<Customer[]> {
  if (isLiveApi()) return apiRequest<Customer[]>(endpoints.customers);
  return demo().customers.map((c) => ({ ...c }));
}

export async function updateCustomerNote(id: string, note: string): Promise<void> {
  if (isLiveApi()) {
    await apiRequest(`${endpoints.customers}/${id}`, { method: "PATCH", body: json({ note }) });
    return;
  }
  const customer = demo().customers.find((c) => c.id === id);
  if (customer) customer.note = note;
}

export async function getPromotions(): Promise<Promotion[]> {
  if (isLiveApi()) return apiRequest<Promotion[]>(endpoints.promotions);
  return demo().promotions.map((p) => ({ ...p }));
}

export async function savePromotion(input: Omit<Promotion, "id" | "active" | "redemptions">): Promise<Promotion> {
  if (isLiveApi()) {
    return apiRequest<Promotion>(endpoints.promotions, { method: "POST", body: json(input) });
  }
  const created: Promotion = { ...input, id: `p${Date.now()}`, active: true, redemptions: 0 };
  demo().promotions.unshift(created);
  logDemo("Created promotion", input.title);
  return created;
}

export async function setPromotionActive(id: string, active: boolean): Promise<void> {
  if (isLiveApi()) {
    await apiRequest(endpoints.promotion(id), { method: "PATCH", body: json({ active }) });
    return;
  }
  const promo = demo().promotions.find((p) => p.id === id);
  if (promo) promo.active = active;
}

export async function getReport(): Promise<Report> {
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<Report>(endpoints.reports),
      () => apiRequest<Report>(endpoints.adminReports),
    ]);
  }
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
  if (isLiveApi()) {
    return firstOk([
      () => apiRequest<AuditLogEntry[]>(endpoints.auditLogs),
      () => apiRequest<AuditLogEntry[]>(endpoints.adminAudit),
    ]);
  }
  return [...demo().audit];
}
