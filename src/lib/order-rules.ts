/**
 * Shared business rules for the order lifecycle and cart pricing.
 * Web, mobile and backend must agree on these (see docs/order-lifecycle.md).
 */
import type { OrderStatus } from "./types";

/** Allowed forward step for each status; null means terminal. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Scheduled: "Placed",
  Placed: "In kitchen",
  "In kitchen": "Ready",
  Ready: "Completed",
  Completed: null,
  Cancelled: null,
};

/** Staff-facing label for the single next action on an order card. */
export const NEXT_ACTION_LABEL: Record<OrderStatus, string | null> = {
  Scheduled: "Release",
  Placed: "Accept",
  "In kitchen": "Mark ready",
  Ready: "Complete",
  Completed: null,
  Cancelled: null,
};

/** Board column / customer-facing name for each backend status. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  Scheduled: "Scheduled",
  Placed: "New",
  "In kitchen": "Preparing",
  Ready: "Ready",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "Cancelled") return from !== "Completed" && from !== "Cancelled";
  return NEXT_STATUS[from] === to;
}

/** Minutes after which an open order is flagged as delayed. */
export const DELAY_WARNING_MINUTES = 15;
export const DELAY_CRITICAL_MINUTES = 25;

export function delayLevel(
  placedAt: string,
  status: OrderStatus,
  now = Date.now(),
): "ok" | "warning" | "critical" {
  if (status === "Completed" || status === "Cancelled" || status === "Ready") return "ok";
  const minutes = (now - new Date(placedAt).getTime()) / 60000;
  if (minutes >= DELAY_CRITICAL_MINUTES) return "critical";
  if (minutes >= DELAY_WARNING_MINUTES) return "warning";
  return "ok";
}

export const DELIVERY_FEE = 25;
export const MAX_LINE_QUANTITY = 20;

export function clampLineQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.floor(quantity)));
}

export function sanitizeCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CartLine>;
    if (typeof row.menuItemId !== "string" || typeof row.name !== "string") continue;
    if (typeof row.unitPrice !== "number" || !Number.isFinite(row.unitPrice) || row.unitPrice < 0)
      continue;
    const quantity = clampLineQuantity(typeof row.quantity === "number" ? row.quantity : 0);
    if (quantity < 1) continue;
    const options = Array.isArray(row.options)
      ? row.options.filter((option): option is string => typeof option === "string")
      : [];
    const key =
      typeof row.key === "string" && row.key
        ? row.key
        : `${row.menuItemId}|${[...options].sort().join(",")}|${row.note ?? ""}`;
    lines.push({
      key,
      menuItemId: row.menuItemId,
      name: row.name,
      unitPrice: row.unitPrice,
      quantity,
      options,
      ...(typeof row.note === "string" && row.note ? { note: row.note } : {}),
    });
  }
  return lines;
}

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  options: string[];
  note?: string | undefined;
}

export function cartTotals(
  lines: CartLine[],
  fulfilment: "Collection" | "Delivery" = "Collection",
) {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const fee = fulfilment === "Delivery" && count > 0 ? DELIVERY_FEE : 0;
  return { count, subtotal, fee, total: subtotal + fee };
}

/** Pack a delivery address into the existing specialInstructions string. */
export function composeOrderNotes(input: {
  fulfilment?: "Collection" | "Delivery" | undefined;
  deliveryAddress?: string | undefined;
  specialInstructions?: string | undefined;
  includeFulfilment?: boolean | undefined;
}): string | undefined {
  const parts: string[] = [];
  if (input.includeFulfilment && input.fulfilment) parts.push(input.fulfilment);
  if (input.fulfilment === "Delivery" && input.deliveryAddress?.trim()) {
    parts.push(`Deliver to: ${input.deliveryAddress.trim()}`);
  }
  if (input.specialInstructions?.trim()) parts.push(input.specialInstructions.trim());
  return parts.join(" — ") || undefined;
}

export function validateDeliveryAddress(
  fulfilment: "Collection" | "Delivery",
  address: string,
): string | null {
  if (fulfilment !== "Delivery") return null;
  const value = address.replace(/\s+/g, " ").trim();
  if (value.length < 8 || !/[a-zA-Z]/.test(value)) {
    return "Enter a delivery street and suburb.";
  }
  return null;
}
