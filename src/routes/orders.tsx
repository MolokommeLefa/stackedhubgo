import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { getOrderQueue, updateOrderStatus } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — StackedHub" },
      {
        name: "description",
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [channel, setChannel] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await getOrderQueue());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const channels = useMemo(() => ["All", ...Array.from(new Set(orders.map((o) => o.channel)))], [orders]);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.reference.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));
    return matchesQuery && (status === "All" || o.status === status) && (channel === "All" || o.channel === channel);
  });

  const changeStatus = async (id: string, next: OrderStatus) => {
    setBusyId(id);
    try {
      const updated = await updateOrderStatus(id, next);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Order queue" subtitle="Kitchen" allow={["Admin", "Staff"]}>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="order-search">
          Search orders
        </label>
        <input
          id="order-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, customer or item…"
          className="glass-soft min-h-11 min-w-56 flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "All")}
          className="glass-soft min-h-11 rounded-xl px-3 py-2.5 text-sm outline-none"
        >
          <option value="All">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="glass-soft min-h-11 rounded-xl px-3 py-2.5 text-sm outline-none"
        >
          {channels.map((c) => (
            <option key={c}>{c === "All" ? "All channels" : c}</option>
          ))}
        </select>
      </div>

      <LoadState loading={loading} error={error} onRetry={() => void load()} />

      {!loading && !error && (
        <Panel title={`${filtered.length} orders`}>
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="glass-soft rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{order.reference}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.channel} · {formatTime(order.placedAt)} · {currency(order.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={order.status} />
                    {flow[order.status] && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void changeStatus(order.id, flow[order.status]!)}
                        className="bg-gradient-brand min-h-11 rounded-xl px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        Mark {flow[order.status]}
                      </button>
                    )}
                    {order.status !== "Completed" && order.status !== "Cancelled" && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void changeStatus(order.id, "Cancelled")}
                        className="min-h-11 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders match those filters. Clear search or wait for the next ticket.</p>
            )}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
