import { describe, expect, it } from "vitest";
import {
  canTransition,
  cartTotals,
  clampLineQuantity,
  composeOrderNotes,
  delayLevel,
  MAX_LINE_QUANTITY,
  NEXT_STATUS,
  sanitizeCartLines,
  validateDeliveryAddress,
  type CartLine,
} from "./order-rules";

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

describe("cart quantity", () => {
  it("clamps to whole numbers between 0 and 20", () => {
    expect(clampLineQuantity(2.8)).toBe(2);
    expect(clampLineQuantity(-3)).toBe(0);
    expect(clampLineQuantity(99)).toBe(MAX_LINE_QUANTITY);
    expect(clampLineQuantity(Number.NaN)).toBe(0);
  });

  it("drops broken stored basket rows", () => {
    expect(
      sanitizeCartLines([
        { key: "ok", menuItemId: "m1", name: "Burger", unitPrice: 129, quantity: 2, options: [] },
        { menuItemId: "m2", name: "Broken", unitPrice: 10, quantity: 0, options: [] },
        { not: "a line" },
      ]),
    ).toEqual([
      { key: "ok", menuItemId: "m1", name: "Burger", unitPrice: 129, quantity: 2, options: [] },
    ]);
  });
});

describe("delivery address", () => {
  it("is required only for Delivery", () => {
    expect(validateDeliveryAddress("Collection", "")).toBeNull();
    expect(validateDeliveryAddress("Delivery", "")).toBe("Enter a delivery street and suburb.");
    expect(validateDeliveryAddress("Delivery", "12 Main Rd, Rosebank")).toBeNull();
  });

  it("packs the address into special instructions without changing Collection", () => {
    expect(
      composeOrderNotes({
        fulfilment: "Delivery",
        deliveryAddress: "12 Main Rd, Rosebank",
        specialInstructions: "No onions",
      }),
    ).toBe("Deliver to: 12 Main Rd, Rosebank — No onions");
    expect(
      composeOrderNotes({
        fulfilment: "Collection",
        deliveryAddress: "12 Main Rd, Rosebank",
        specialInstructions: "No onions",
      }),
    ).toBe("No onions");
  });
});
