/**
 * Data access for the Staff and Admin MVP. Each function calls the live API
 * when an address is configured, otherwise it works on an in-memory copy of
 * the demo data (changes reset on refresh).
 */
import { ApiError, apiRequest, endpoints, isLiveApi } from "./api-client";
import * as mock from "./mock-data";
import type {
  AuditLogEntry,
  AuthUser,
  Customer,
  GroupBasket,
  MenuItem,
  Order,
  OrderSlot,
  OrderStatus,
  Promotion,
} from "./types";

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
  items: { menuItemId: string; name: string; quantity: number; unitPrice: number; specialInstructions?: string }[];
  channel?: Order["channel"];
  paymentMethod?: "Cash" | "Card";
  scheduledFor?: string;
  specialInstructions?: string;
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
    const live = await firstOk([
      () => apiRequest<Order[]>(endpoints.orders),
      () => apiRequest<Order[]>(endpoints.staffOrders),
    ]);
    try {
      const scheduled = await apiRequest<Order[]>(`${endpoints.orders}?status=Scheduled`);
      const seen = new Set(live.map((order) => order.id));
      return [...scheduled.filter((order) => !seen.has(order.id)), ...live];
    } catch {
      return live;
    }
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
  const scheduled = Boolean(input.scheduledFor);
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.orders, {
      method: "POST",
      body: json({
        items: input.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        channel: input.channel ?? "Website",
        paymentMethod: input.paymentMethod ?? "Cash",
        scheduledFor: input.scheduledFor,
        specialInstructions: input.specialInstructions,
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
    status: scheduled ? "Scheduled" : "Placed",
    placedAt: new Date().toISOString(),
    fulfilment: scheduled ? "Scheduled" : "Immediate",
    statusHistory: [
      {
        status: scheduled ? "Scheduled" : "Placed",
        at: new Date().toISOString(),
        note: scheduled ? "Order scheduled for collection." : "Order placed.",
      },
    ],
    ...(input.scheduledFor ? { scheduledFor: input.scheduledFor } : {}),
  };
  demo().orders.unshift(created);
  return created;
}

export async function cancelOrder(id: string): Promise<Order> {
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.orderCancel(id), { method: "POST" });
  }
  const order = demo().orders.find((item) => item.id === id);
  if (!order) throw new ApiError("That order is no longer on the board.", 404);
  if (order.status !== "Placed" && order.status !== "Scheduled") {
    throw new ApiError("This order can no longer be cancelled.", 409);
  }
  order.status = "Cancelled";
  return { ...order };
}

export async function getOrderSlots(): Promise<OrderSlot[]> {
  if (isLiveApi()) return apiRequest<OrderSlot[]>(endpoints.orderSlots);
  const slots: OrderSlot[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / 15) * 15 + 30);
  while (slots.length < 12) {
    const hour = cursor.getHours();
    if (hour >= 10 && hour < 21) {
      const start = cursor.toISOString();
      const end = new Date(cursor.getTime() + 15 * 60_000).toISOString();
      slots.push({ start, end, capacity: 8, booked: 0, remaining: 8, available: true });
    }
    cursor.setMinutes(cursor.getMinutes() + 15);
  }
  return slots;
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
    return apiRequest<ManagedUser[]>(endpoints.adminUsers);
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

let demoGroups: GroupBasket[] = [];

function demoJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]!).join("");
}

function groupTotal(basket: GroupBasket) {
  basket.total = basket.items.reduce((sum, item) => sum + item.subtotal, 0);
  return basket;
}

export async function listGroupBaskets(): Promise<GroupBasket[]> {
  if (isLiveApi()) return apiRequest<GroupBasket[]>(endpoints.groups);
  return demoGroups.filter((basket) => basket.status === "Open" || basket.status === "Locked").map((basket) => ({ ...basket, items: [...basket.items], participants: [...basket.participants] }));
}

export async function getGroupBasket(id: string): Promise<GroupBasket> {
  if (isLiveApi()) return apiRequest<GroupBasket>(endpoints.group(id));
  const basket = demoGroups.find((item) => item.id === id);
  if (!basket) throw new ApiError("Group order not found.", 404);
  return { ...basket, items: [...basket.items], participants: [...basket.participants] };
}

export async function createGroupBasket(host: AuthUser): Promise<GroupBasket> {
  if (isLiveApi()) return apiRequest<GroupBasket>(endpoints.groups, { method: "POST", body: json({}) });
  const basket: GroupBasket = {
    id: `g${Date.now()}`,
    joinCode: demoJoinCode(),
    status: "Open",
    hostCustomerId: host.id,
    hostName: host.name,
    createdAt: new Date().toISOString(),
    total: 0,
    participants: [{ customerId: host.id, name: host.name, joinedAt: new Date().toISOString(), isHost: true }],
    items: [],
  };
  demoGroups.unshift(basket);
  return { ...basket, items: [], participants: [...basket.participants] };
}

export async function joinGroupBasket(joinCode: string, user: AuthUser): Promise<GroupBasket> {
  if (isLiveApi()) return apiRequest<GroupBasket>(endpoints.groupJoin, { method: "POST", body: json({ joinCode }) });
  const basket = demoGroups.find((item) => item.joinCode === joinCode.trim().toUpperCase());
  if (!basket) throw new ApiError("That group order code is not valid.", 404);
  if (!basket.participants.some((person) => person.customerId === user.id)) {
    basket.participants.push({ customerId: user.id, name: user.name, joinedAt: new Date().toISOString(), isHost: false });
  }
  return groupTotal(basket);
}

export async function addGroupItem(
  basketId: string,
  user: AuthUser,
  menuItem: MenuItem,
  quantity: number,
  specialInstructions?: string,
): Promise<GroupBasket> {
  if (isLiveApi()) {
    return apiRequest<GroupBasket>(endpoints.groupItems(basketId), {
      method: "POST",
      body: json({ menuItemId: menuItem.id, quantity, specialInstructions }),
    });
  }
  const basket = demoGroups.find((item) => item.id === basketId);
  if (!basket) throw new ApiError("Group order not found.", 404);
  basket.items.push({
    id: `gi${Date.now()}`,
    customerId: user.id,
    customerName: user.name,
    menuItemId: menuItem.id,
    name: menuItem.name,
    quantity,
    unitPrice: menuItem.price,
    subtotal: menuItem.price * quantity,
    ...(specialInstructions ? { specialInstructions } : {}),
  });
  return groupTotal(basket);
}

export async function removeGroupItem(basketId: string, itemId: string): Promise<GroupBasket> {
  if (isLiveApi()) return apiRequest<GroupBasket>(endpoints.groupItem(basketId, itemId), { method: "DELETE" });
  const basket = demoGroups.find((item) => item.id === basketId);
  if (!basket) throw new ApiError("Group order not found.", 404);
  basket.items = basket.items.filter((item) => item.id !== itemId);
  return groupTotal(basket);
}

export async function checkoutGroupBasket(
  basketId: string,
  paymentMethod: "Cash" | "Card",
  user: AuthUser,
): Promise<Order> {
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.groupCheckout(basketId), {
      method: "POST",
      body: json({ paymentMethod }),
    });
  }
  const basket = demoGroups.find((item) => item.id === basketId);
  if (!basket) throw new ApiError("Group order not found.", 404);
  const order = await placeOrder({
    customerId: user.id,
    customerName: user.name,
    paymentMethod,
    items: basket.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(item.specialInstructions ? { specialInstructions: item.specialInstructions } : {}),
    })),
  });
  basket.status = "Converted";
  basket.orderId = order.id;
  return order;
}
