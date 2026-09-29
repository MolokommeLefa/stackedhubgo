import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { getOrderQueue, updateOrderStatus } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import type { OrderStatus } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Order Queue — StackedHub" },
      { name: "description", content: "Acknowledge orders and move them through the kitchen lifecycle." },
      { property: "og:title", content: "Order Queue — StackedHub" },
      { property: "og:description", content: "Acknowledge orders and move them through the kitchen lifecycle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
const label: Partial<Record<OrderStatus, string>> = { "In kitchen": "Accept", Ready: "Mark ready", Completed: "Complete" };

function OrdersPage() {
  const { data: orders, setData, loading, error, reload } = useLoad(getOrderQueue, []);
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [actionError, setActionError] = useState<unknown>(null);
  const shown = orders.filter((o) => status === "All" || o.status === status);

  const move = async (id: string, next: OrderStatus) => {
    setActionError(null);
    try {
      await updateOrderStatus(id, next);
      setData((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    } catch (e) {
      setActionError(e);
    }
  };

  return (
    <AppShell title="Order Queue" subtitle="Orders" allow={["Admin", "Staff"]}>
      <Panel
        title={`${shown.length} orders`}
        action={
          <div className="flex gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "All")} className="glass-soft rounded-xl px-3 py-2 text-sm outline-none">
              <option value="All">All statuses</option>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => void reload()} className="rounded-xl bg-secondary px-3 py-2 text-sm font-semibold">Refresh</button>
          </div>
        }
      >
        <LoadState loading={loading} error={error ?? actionError} />
        <div className="divide-y divide-border">
          {shown.map((o) => {
            const next = flow[o.status];
            return (
              <div key={o.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{o.reference} · {o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.channel} · {formatTime(o.placedAt)} · {currency(o.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={o.status} />
                    {next && (
                      <button onClick={() => move(o.id, next)} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                        {label[next]}
                      </button>
                    )}
                    {next && (
                      <button onClick={() => move(o.id, "Cancelled")} className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}</p>
              </div>
            );
          })}
          {!loading && shown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No orders here.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
