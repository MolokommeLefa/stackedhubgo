import { describe, expect, it } from "vitest";
import { canTransition, cartTotals, delayLevel, NEXT_STATUS, type CartLine } from "./order-rules";

const line = (unitPrice: number, quantity: number): CartLine => ({
  key: `${unitPrice}-${quantity}`,
  menuItemId: "m1",
  name: "Item",
  unitPrice,
  quantity,
  options: [],
});

describe("order lifecycle", () => {
  it("moves Placed → In kitchen → Ready → Completed", () => {
    expect(NEXT_STATUS.Placed).toBe("In kitchen");
    expect(NEXT_STATUS["In kitchen"]).toBe("Ready");
    expect(NEXT_STATUS.Ready).toBe("Completed");
    expect(NEXT_STATUS.Completed).toBeNull();
  });
  it("rejects skipping steps", () => {
    expect(canTransition("Placed", "Ready")).toBe(false);
    expect(canTransition("Placed", "Completed")).toBe(false);
  });
  it("blocks cancelling a completed order", () => {
    expect(canTransition("Completed", "Cancelled")).toBe(false);
    expect(canTransition("In kitchen", "Cancelled")).toBe(true);
  });
  it("flags open orders after 15 and 25 minutes", () => {
    const now = Date.parse("2026-10-13T12:00:00Z");
    expect(delayLevel("2026-10-13T11:50:00Z", "Placed", now)).toBe("ok");
    expect(delayLevel("2026-10-13T11:45:00Z", "Placed", now)).toBe("warning");
    expect(delayLevel("2026-10-13T11:35:00Z", "In kitchen", now)).toBe("critical");
  });
});

describe("cart totals", () => {
  it("sums quantity and subtotal", () => {
    const t = cartTotals([line(129, 2), line(55, 1)]);
    expect(t.count).toBe(3);
    expect(t.subtotal).toBe(313);
    expect(t.total).toBe(313);
  });
  it("adds R25 delivery fee only for delivery", () => {
    expect(cartTotals([line(100, 1)], "Delivery").total).toBe(125);
    expect(cartTotals([], "Delivery").total).toBe(0);
  });
});
