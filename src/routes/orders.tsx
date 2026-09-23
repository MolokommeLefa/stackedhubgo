import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Panel, StatusPill } from "@/components/AppShell";
import { currency, formatTime, orders as seedOrders } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — StackedHub" },
      {
        name: "description",
        content: "Accept orders, move them through the kitchen and track every channel in one board.",
      },
      { property: "og:title", content: "Orders — StackedHub" },
      {
        property: "og:description",
        content: "Accept orders, move them through the kitchen and track every channel in one board.",
      },
    ],
  }),
  component: OrdersPage,
});

const statuses: OrderStatus[] = ["Placed", "In kitchen", "Ready", "Completed", "Cancelled"];
const flow: Record<OrderStatus, OrderStatus | null> = {
  Placed: "In kitchen",
  "In kitchen": "Ready",
  Ready: "Completed",
  Completed: null,
  Cancelled: null,
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [channel, setChannel] = useState<string>("All");

  const channels = useMemo(
    () => ["All", ...Array.from(new Set(seedOrders.map((o) => o.channel)))],
    [],
  );

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.reference.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));
    return (
      matchesQuery &&
      (status === "All" || o.status === status) &&
      (channel === "All" || o.channel === channel)
    );
  });

  const advance = (id: string) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id && flow[o.status] ? { ...o, status: flow[o.status]! } : o)),
    );

  const cancel = (id: string) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o)));

  return (
    <AppShell title="Orders" subtitle="Order management" allow={["Admin", "Staff"]}>
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, customer or item…"
            className="glass-soft min-w-56 flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "All")}
            className="glass-soft rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            <option value="All">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="glass-soft rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            {channels.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All channels" : c}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <Panel title={`${filtered.length} orders`}>
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="glass-soft rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/15 font-display text-xs font-bold text-primary">
                    {order.reference}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.channel} · {formatTime(order.placedAt)} · {currency(order.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={order.status} />
                  {flow[order.status] && (
                    <button
                      onClick={() => advance(order.id)}
                      className="bg-gradient-brand rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Mark {flow[order.status]}
                    </button>
                  )}
                  {order.status !== "Completed" && order.status !== "Cancelled" && (
                    <button
                      onClick={() => cancel(order.id)}
                      className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders match those filters.
            </p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
