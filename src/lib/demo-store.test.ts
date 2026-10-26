import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLoyaltyWallet, getOrderQueue, getReport, placeOrder, updateOrderStatus } from "./data";
import {
  bestSellersFromOrders,
  createSeedStore,
  DEMO_STORE_KEY,
  DEMO_STORE_VERSION,
  forgetDemoStoreMemory,
  getDemoStore,
  hourlyFromOrders,
  isValidDemoStore,
  resetDemoStore,
} from "./demo-store";
import { formatTimeAgo } from "./mock-data";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("demo store persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      sessionStorage: memoryStorage(),
      localStorage: memoryStorage(),
    });
    resetDemoStore();
  });

  afterEach(() => {
    resetDemoStore();
    vi.unstubAllGlobals();
  });

  it("keeps a customer order after a module-style remount", async () => {
    const created = await placeOrder({
      customerId: "c1",
      customerName: "Priya Nair",
      items: [{ menuItemId: "m1", name: "Peri-Peri Chicken Stack", quantity: 1, unitPrice: 129 }],
      fulfilment: "Collection",
    });

    forgetDemoStoreMemory();

    const queue = await getOrderQueue();
    const found = queue.find((order) => order.id === created.id);
    expect(found).toMatchObject({
      id: created.id,
      customerId: "c1",
      status: "Placed",
      total: 129,
    });
    expect(
      queue.filter((order) => order.customerId === "c1").some((order) => order.id === created.id),
    ).toBe(true);
  });

  it("carries a staff status change into admin reports", async () => {
    const created = await placeOrder({
      customerId: "c1",
      customerName: "Priya Nair",
      items: [{ menuItemId: "m2", name: "Double Smash Burger", quantity: 1, unitPrice: 145 }],
    });

    forgetDemoStoreMemory();
    await updateOrderStatus(created.id, "In kitchen");
    forgetDemoStoreMemory();
    await updateOrderStatus(created.id, "Ready");
    forgetDemoStoreMemory();
    await updateOrderStatus(created.id, "Completed");
    forgetDemoStoreMemory();

    const queue = await getOrderQueue();
    expect(queue.find((order) => order.id === created.id)?.status).toBe("Completed");

    const report = await getReport();
    expect(report.orderCount).toBeGreaterThanOrEqual(7);
    expect(report.completedSales).toBeGreaterThanOrEqual(145 + 446 + 166);
    expect(report.bestSellers.some((item) => item.name === "Double Smash Burger")).toBe(true);
    expect(report.hourlyOrders.reduce((sum, row) => sum + row.orders, 0)).toBe(report.orderCount);
  });

  it("earns points only after an order is completed", async () => {
    const before = await getLoyaltyWallet("c1");
    const created = await placeOrder({
      customerId: "c1",
      customerName: "Priya Nair",
      items: [{ menuItemId: "m1", name: "Peri-Peri Chicken Stack", quantity: 1, unitPrice: 129 }],
      fulfilment: "Collection",
    });
    const afterPlaced = await getLoyaltyWallet("c1");
    expect(afterPlaced.balance).toBe(before.balance);
    await updateOrderStatus(created.id, "Completed");
    const afterCompleted = await getLoyaltyWallet("c1");
    expect(afterCompleted.balance).toBe(before.balance + 12);
  });

  it("does not apply the same redemption id twice", async () => {
    const before = await getLoyaltyWallet("c1");
    const redemption = { rewardId: "r-20", redemptionId: "idem-r-20" };
    await placeOrder({
      customerId: "c1",
      customerName: "Priya Nair",
      items: [{ menuItemId: "m1", name: "Peri-Peri Chicken Stack", quantity: 1, unitPrice: 129 }],
      fulfilment: "Collection",
      redemption,
    });
    const afterFirst = await getLoyaltyWallet("c1");
    await placeOrder({
      customerId: "c1",
      customerName: "Priya Nair",
      items: [{ menuItemId: "m1", name: "Peri-Peri Chicken Stack", quantity: 1, unitPrice: 129 }],
      fulfilment: "Collection",
      redemption,
    });
    const afterSecond = await getLoyaltyWallet("c1");
    expect(afterFirst.balance).toBe(before.balance - 50);
    expect(afterSecond.balance).toBe(afterFirst.balance);
  });

  it("reseeds when stored JSON is invalid or from an older version", () => {
    window.sessionStorage.setItem(DEMO_STORE_KEY, "{not-json");
    forgetDemoStoreMemory();
    expect(getDemoStore().orders.length).toBeGreaterThan(0);
    expect(isValidDemoStore(createSeedStore())).toBe(true);

    resetDemoStore();
    window.sessionStorage.setItem(
      DEMO_STORE_KEY,
      JSON.stringify({ version: DEMO_STORE_VERSION - 1, data: { orders: [] } }),
    );
    forgetDemoStoreMemory();
    expect(getDemoStore().orders.some((order) => order.id === "o1")).toBe(true);
    expect(isValidDemoStore({ orders: [] })).toBe(false);
  });
});

describe("demo report helpers", () => {
  it("builds hourly buckets from ticket times", () => {
    const rows = hourlyFromOrders([
      { placedAt: "2026-10-14T10:05:00" } as never,
      { placedAt: "2026-10-14T10:40:00" } as never,
      { placedAt: "2026-10-14T12:10:00" } as never,
    ]);
    expect(rows).toEqual([
      { hour: "10:00", orders: 2 },
      { hour: "11:00", orders: 0 },
      { hour: "12:00", orders: 1 },
    ]);
  });

  it("counts sold items and skips cancelled tickets", () => {
    expect(
      bestSellersFromOrders([
        {
          status: "Completed",
          items: [{ name: "Bunny Chow", quantity: 2 }],
        } as never,
        {
          status: "Cancelled",
          items: [{ name: "Bunny Chow", quantity: 9 }],
        } as never,
      ]),
    ).toEqual([{ name: "Bunny Chow", sold: 2 }]);
  });
});

describe("formatTimeAgo", () => {
  const now = new Date(2026, 9, 14, 18, 0, 0).getTime();

  it("uses relative minutes and Today for the same day", () => {
    expect(formatTimeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe("5 min ago");
    expect(formatTimeAgo(new Date(now - 3 * 60 * 60_000).toISOString(), now)).toBe("3h ago");
    expect(formatTimeAgo(new Date(2026, 9, 14, 2, 0, 0).toISOString(), now)).toBe("Today");
  });
});
