/**
 * Customer engagement data kept on this device until the backend adds the
 * matching tables (see docs/architecture/task3-backend-proposal.md):
 * recent orders, status history, loyalty ledger, notifications, preferences,
 * favourites, feedback and support issues.
 */
import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "./types";
import { addEntry, balance, DOUBLE_POINTS_MULTIPLIER, pointsForTotal, type LedgerEntry } from "./loyalty";

const KEY = "stackedhub.engagement";
const EVENT = "stackedhub:engagement";

export interface StatusEvent {
  status: OrderStatus;
  at: string;
}
export interface AppNotification {
  id: string; // dedupe key
  userId: string;
  kind: "order" | "rewards" | "promo";
  title: string;
  body: string;
  orderId?: string;
  at: string;
  read: boolean;
}
export interface Prefs {
  promos: boolean;
  rewards: boolean;
}
export interface Feedback {
  orderId: string;
  rating: number;
  comment: string;
  at: string;
}
export type IssueKind = "Missing item" | "Wrong order" | "Delay" | "Other";
export type IssueStatus = "Open" | "In progress" | "Resolved";
export interface Issue {
  id: string;
  orderId: string;
  reference: string;
  customerName: string;
  kind: IssueKind;
  details: string;
  status: IssueStatus;
  staffNote: string;
  at: string;
  resolvedAt?: string | undefined;
}
export interface RecentOrder {
  id: string;
  reference: string;
  total: number;
  at: string;
  items: Order["items"];
}

interface State {
  recent: RecentOrder[];
  history: Record<string, StatusEvent[]>;
  ledger: Record<string, LedgerEntry[]>;
  notifications: AppNotification[];
  prefs: Record<string, Prefs>;
  favourites: Record<string, string[]>;
  feedback: Feedback[];
  issues: Issue[];
  doublePoints: boolean;
}

const empty = (): State => ({
  recent: [],
  history: {},
  ledger: {},
  notifications: [],
  prefs: {},
  favourites: {},
  feedback: [],
  issues: [],
  doublePoints: false,
});

function read(): State {
  if (typeof window === "undefined") return empty();
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return empty();
  }
}
function write(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVENT));
}
function update(fn: (s: State) => void) {
  const s = read();
  fn(s);
  write(s);
}

/** Re-renders whenever engagement data changes (this tab or another). */
export function useEngagement<T>(select: (s: State) => T): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    const sync = () => setValue(select(read()));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export const prefsFor = (s: State, userId: string): Prefs =>
  s.prefs[userId] ?? { promos: false, rewards: true };

function notify(s: State, n: Omit<AppNotification, "at" | "read">) {
  if (s.notifications.some((x) => x.id === n.id)) return false;
  const p = prefsFor(s, n.userId);
  if (n.kind === "promo" && !p.promos) return false;
  if (n.kind === "rewards" && !p.rewards) return false;
  s.notifications.unshift({ ...n, at: new Date().toISOString(), read: false });
  s.notifications = s.notifications.slice(0, 50);
  return true;
}

const STATUS_COPY: Record<OrderStatus, string> = {
  Placed: "The kitchen has your order.",
  "In kitchen": "Your order is being prepared.",
  Ready: "Your order is ready.",
  Completed: "Enjoy your meal — thanks for ordering!",
  Cancelled: "Your order was cancelled.",
};

export function rememberOrder(order: Order) {
  update((s) => {
    s.recent = [
      { id: order.id, reference: order.reference, total: order.total, at: order.placedAt, items: order.items },
      ...s.recent.filter((r) => r.id !== order.id),
    ].slice(0, 5);
  });
  recordStatus(order);
}

/**
 * Saves a status change with its time. Returns true when the status is new,
 * so the caller can show a pop-up. Completing an order earns points once.
 */
export function recordStatus(order: Order): boolean {
  let changed = false;
  update((s) => {
    const list = s.history[order.id] ?? [];
    if (list.at(-1)?.status === order.status) return;
    list.push({ status: order.status, at: order.updatedAt ?? new Date().toISOString() });
    s.history[order.id] = list;
    changed = list.length > 1;
    notify(s, {
      id: `${order.id}:${order.status}`,
      userId: order.customerId,
      kind: "order",
      orderId: order.id,
      title: `${order.reference} · ${order.status}`,
      body: STATUS_COPY[order.status],
    });
    if (order.status === "Completed" && order.customerId !== "guest") {
      const pts = pointsForTotal(order.total, s.doublePoints ? DOUBLE_POINTS_MULTIPLIER : 1);
      const before = s.ledger[order.customerId] ?? [];
      const after = addEntry(before, {
        key: `earn:${order.id}`,
        type: "earn",
        points: pts,
        label: `Order ${order.reference}${s.doublePoints ? " (double points)" : ""}`,
        at: new Date().toISOString(),
      });
      if (after !== before && pts > 0) {
        s.ledger[order.customerId] = after;
        notify(s, {
          id: `points:${order.id}`,
          userId: order.customerId,
          kind: "rewards",
          title: `+${pts} points`,
          body: `You earned ${pts} points on ${order.reference}.`,
        });
      }
    }
  });
  return changed;
}

export function redeem(userId: string, key: string, points: number, label: string) {
  update((s) => {
    s.ledger[userId] = addEntry(s.ledger[userId] ?? [], {
      key,
      type: "redeem",
      points: -points,
      label,
      at: new Date().toISOString(),
    });
  });
}

export const ledgerFor = (s: State, userId: string) => s.ledger[userId] ?? [];
export const pointsFor = (s: State, userId: string) => balance(ledgerFor(s, userId));

export function setPrefs(userId: string, prefs: Prefs) {
  update((s) => {
    s.prefs[userId] = prefs;
  });
}
export function markAllRead(userId: string) {
  update((s) => s.notifications.forEach((n) => n.userId === userId && (n.read = true)));
}
export function toggleFavourite(userId: string, itemId: string) {
  update((s) => {
    const list = s.favourites[userId] ?? [];
    s.favourites[userId] = list.includes(itemId) ? list.filter((x) => x !== itemId) : [...list, itemId];
  });
}
export function saveFeedback(f: Omit<Feedback, "at">) {
  update((s) => {
    s.feedback = [{ ...f, at: new Date().toISOString() }, ...s.feedback.filter((x) => x.orderId !== f.orderId)];
  });
}
export function reportIssue(i: Omit<Issue, "id" | "status" | "staffNote" | "at">) {
  update((s) => {
    s.issues.unshift({ ...i, id: `i${Date.now()}`, status: "Open", staffNote: "", at: new Date().toISOString() });
  });
}
export function updateIssue(id: string, status: IssueStatus, staffNote: string) {
  update((s) => {
    const it = s.issues.find((x) => x.id === id);
    if (!it) return;
    it.status = status;
    it.staffNote = staffNote;
    it.resolvedAt = status === "Resolved" ? new Date().toISOString() : undefined;
  });
}
export function setDoublePoints(on: boolean) {
  update((s) => {
    s.doublePoints = on;
  });
}
