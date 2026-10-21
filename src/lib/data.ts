/**
 * Data access for the Staff and Admin MVP. Each function calls the live API
 * when an address is configured, otherwise it works on the browser-session
 * demo store (sessionStorage). Live API behaviour is unchanged.
 */
import { ApiError, apiRequest, endpoints, isLiveApi } from "./api-client";
import {
  bestSellersFromOrders,
  getDemoStore,
  hourlyFromOrders,
  persistDemoStore,
} from "./demo-store";
import {
  addEntry,
  balance,
  canRedeem,
  nextReward,
  pointsForCompletedOrder,
  REWARDS,
} from "./loyalty";
import * as mock from "./mock-data";
import { composeOrderNotes } from "./order-rules";
import type {
  AuditLogEntry,
  AuthUser,
  Customer,
  MenuItem,
  Order,
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
  items: { menuItemId: string; name: string; quantity: number; unitPrice: number }[];
  channel?: Order["channel"] | undefined;
  paymentMethod?: "Cash" | "Card" | undefined;
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded" | undefined;
  fulfilment?: "Collection" | "Delivery" | undefined;
  specialInstructions?: string | undefined;
  /** Street and suburb. Required in the UI only for Delivery; packed into specialInstructions. */
  deliveryAddress?: string | undefined;
  /** Extra charges such as delivery, added on top of item totals. */
  fees?: number | undefined;
  redemption?: { rewardId: string; redemptionId: string } | undefined;
}

export interface LoyaltyWallet {
  points: number;
  next: ReturnType<typeof nextReward>;
  availableRewards: typeof REWARDS;
  history: ReturnType<typeof getCustomerLedger>;
  rules: string[];
}

export interface RedemptionResult {
  rewardId: string;
  redemptionId: string;
  applied: boolean;
  pointsBalance: number;
  discountValue: number;
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

function demo() {
  return getDemoStore();
}

function getCustomerLedger(customerId: string) {
  return demo().loyalty.ledgers[customerId] ?? [];
}

function syncCustomerPoints(customerId: string) {
  const customer = demo().customers.find((c) => c.id === customerId);
  if (!customer) return;
  customer.loyaltyPoints = balance(getCustomerLedger(customerId));
}

function applyCompletedOrderEarn(
  customerId: string,
  orderId: string,
  status: OrderStatus,
  total: number,
) {
  const points = pointsForCompletedOrder(total, status);
  if (points <= 0) return;
  const store = demo();
  const ledger = store.loyalty.ledgers[customerId] ?? [];
  store.loyalty.ledgers[customerId] = addEntry(ledger, {
    key: `earn:${orderId}`,
    type: "earn",
    points,
    label: "Completed order",
    at: new Date().toISOString(),
  });
  syncCustomerPoints(customerId);
}

function redeemInDemo(input: {
  customerId: string;
  rewardId: string;
  redemptionId: string;
}): RedemptionResult {
  const reward = REWARDS.find((candidate) => candidate.id === input.rewardId);
  if (!reward) throw new ApiError("That reward is no longer available.", 404);
  const store = demo();
  if (store.loyalty.usedRedemptionIds.includes(input.redemptionId)) {
    return {
      rewardId: reward.id,
      redemptionId: input.redemptionId,
      applied: false,
      pointsBalance: balance(getCustomerLedger(input.customerId)),
      discountValue: 0,
    };
  }
  const ledger = getCustomerLedger(input.customerId);
  if (!canRedeem(ledger, reward)) throw new ApiError("Not enough points for that reward.", 400);
  store.loyalty.ledgers[input.customerId] = addEntry(ledger, {
    key: `redeem:${input.redemptionId}`,
    type: "redeem",
    points: -reward.points,
    label: reward.title,
    at: new Date().toISOString(),
  });
  store.loyalty.usedRedemptionIds.push(input.redemptionId);
  syncCustomerPoints(input.customerId);
  persistDemoStore();
  return {
    rewardId: reward.id,
    redemptionId: input.redemptionId,
    applied: true,
    pointsBalance: balance(getCustomerLedger(input.customerId)),
    discountValue: reward.value,
  };
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
  persistDemoStore();
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
      () =>
        apiRequest<Order>(endpoints.orderStatus(id), { method: "PATCH", body: json({ status }) }),
      () =>
        apiRequest<Order>(endpoints.staffOrderStatus(id), {
          method: "PATCH",
          body: json({ status }),
        }),
    ]);
  }
  const order = demo().orders.find((o) => o.id === id);
  if (!order) throw new ApiError("That order is no longer on the board.", 404);
  order.status = status;
  order.updatedAt = new Date().toISOString();
  applyCompletedOrderEarn(order.customerId, order.id, status, order.total);
  persistDemoStore();
  return { ...order };
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const fees = input.fees ?? 0;
  let discount = 0;
  if (isLiveApi()) {
    return apiRequest<Order>(endpoints.orders, {
      method: "POST",
      body: json({
        paymentMethod: input.paymentMethod ?? "Cash",
        specialInstructions:
          composeOrderNotes({
            fulfilment: input.fulfilment,
            deliveryAddress: input.deliveryAddress,
            specialInstructions: input.specialInstructions,
            includeFulfilment: true,
          }) ?? null,
        items: input.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        channel: input.channel ?? "Website",
        redemption: input.redemption
          ? { rewardId: input.redemption.rewardId, redemptionId: input.redemption.redemptionId }
          : undefined,
      }),
    });
  }
  if (input.redemption) {
    const redeemed = redeemInDemo({
      customerId: input.customerId,
      rewardId: input.redemption.rewardId,
      redemptionId: input.redemption.redemptionId,
    });
    discount = redeemed.discountValue;
  }
  const total = Math.max(0, subtotal + fees - discount);
  const notes = composeOrderNotes({
    fulfilment: input.fulfilment,
    deliveryAddress: input.deliveryAddress,
    specialInstructions: input.specialInstructions,
  });
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
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    fulfilment: input.fulfilment,
    specialInstructions: notes,
  };
  const store = demo();
  store.orders.unshift(created);
  const customer = store.customers.find((c) => c.id === input.customerId);
  if (customer) {
    customer.orders += 1;
    customer.spend += total;
  }
  persistDemoStore();
  return created;
}

export async function getLoyaltyWallet(customerId: string): Promise<LoyaltyWallet> {
  if (isLiveApi())
    return apiRequest<LoyaltyWallet>(`${endpoints.loyaltyWallet}?customerId=${customerId}`);
  const history = getCustomerLedger(customerId);
  const points = balance(history);
  return {
    points,
    next: nextReward(points),
    availableRewards: REWARDS,
    history,
    rules: [
      "Earn 1 point for every R10 spent.",
      "Points are earned when an order is marked Completed.",
      "Redeem points at checkout for available rewards.",
    ],
  };
}

export async function redeemReward(input: {
  customerId: string;
  rewardId: string;
  redemptionId: string;
}): Promise<RedemptionResult> {
  if (isLiveApi())
    return apiRequest<RedemptionResult>(endpoints.loyaltyRedeem, {
      method: "POST",
      body: json(input),
    });
  return redeemInDemo(input);
}

export async function getOrder(id: string): Promise<Order> {
  if (isLiveApi()) return apiRequest<Order>(`${endpoints.orders}/${id}`);
  const order = demo().orders.find((o) => o.id === id);
  if (!order) throw new ApiError("We couldn't find that order.", 404);
  return { ...order };
}

/** Public menu for the customer ordering pages. */
export async function getMenu(): Promise<MenuItem[]> {
  if (isLiveApi()) return apiRequest<MenuItem[]>(endpoints.menu);
  return [...demo().menu];
}

export async function setAvailability(id: string, available: boolean): Promise<MenuItem> {
  if (isLiveApi()) {
    return firstOk([
      () =>
        apiRequest<MenuItem>(endpoints.staffAvailability(id), {
          method: "PATCH",
          body: json({ available }),
        }),
      () =>
        apiRequest<MenuItem>(endpoints.inventoryItem(id), {
          method: "PATCH",
          body: json({ available }),
        }),
    ]);
  }
  const item = demo().menu.find((m) => m.id === id);
  if (!item) throw new ApiError("That menu item was not found.", 404);
  item.available = available;
  persistDemoStore();
  return { ...item };
}

export async function setMenuStock(id: string, stock: number): Promise<MenuItem> {
  if (isLiveApi()) {
    return firstOk([
      () =>
        apiRequest<MenuItem>(endpoints.inventoryItem(id), {
          method: "PATCH",
          body: json({ stock }),
        }),
      () =>
        apiRequest<MenuItem>(endpoints.adminMenuItem(id), { method: "PUT", body: json({ stock }) }),
    ]);
  }
  const item = demo().menu.find((m) => m.id === id);
  if (!item) throw new ApiError("That menu item was not found.", 404);
  item.stock = stock;
  item.available = stock > 0 ? item.available : false;
  persistDemoStore();
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
    persistDemoStore();
    return menu[idx];
  }
  const created = { ...input, id: `m${Date.now()}` };
  menu.push(created);
  logDemo("Created menu item", input.name);
  persistDemoStore();
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
    await apiRequest(endpoints.adminUser(id), {
      method: "PATCH",
      body: json({ isActive: active }),
    });
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
  if (customer) {
    customer.note = note;
    persistDemoStore();
  }
}

export async function getPromotions(): Promise<Promotion[]> {
  if (isLiveApi()) return apiRequest<Promotion[]>(endpoints.promotions);
  return demo().promotions.map((p) => ({ ...p }));
}

export async function savePromotion(
  input: Omit<Promotion, "id" | "active" | "redemptions">,
): Promise<Promotion> {
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
  if (promo) {
    promo.active = active;
    persistDemoStore();
  }
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
    hourlyOrders: hourlyFromOrders(orders),
    revenueByDay: mock.revenueByDay,
    bestSellers: bestSellersFromOrders(orders),
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
