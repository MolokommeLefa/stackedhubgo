import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyHint, LoadState, StatusPill } from "@/components/AppShell";
import {
  actionLabel,
  FilterTabs,
  nextStatus,
  SearchField,
  statusAccent,
  timeAgo,
  wsBtnGhost,
  wsBtnPrimary,
} from "@/components/workspace";
import { getOrderQueue, updateOrderStatus } from "@/lib/data";
import { currency } from "@/lib/mock-data";
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

const tabs = [
  { id: "All", label: "All" },
  { id: "Scheduled", label: "Scheduled" },
  { id: "Placed", label: "New" },
  { id: "In kitchen", label: "Preparing" },
  { id: "Ready", label: "Ready" },
  { id: "Completed", label: "Done" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function OrdersPage() {
  const { data: orders, setData, loading, error, reload } = useLoad(getOrderQueue, []);
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<unknown>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  const shown = orders.filter((order) => {
    const matchesTab =
      tab === "All"
        ? true
        : tab === "Completed"
          ? order.status === "Completed" || order.status === "Cancelled"
          : order.status === tab;
    const search = query.trim().toLowerCase();
    const matchesSearch =
      !search ||
      order.reference.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.items.some((item) => item.name.toLowerCase().includes(search));
    return matchesTab && matchesSearch;
  });

  async function move(id: string, status: OrderStatus) {
    setActionError(null);
    setBusyOrder(id);
    try {
      const updated = await updateOrderStatus(id, status);
      setData((current) => current.map((order) => (order.id === id ? { ...order, ...updated, status } : order)));
    } catch (cause) {
      setActionError(cause);
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <AppShell title="Order queue" subtitle="Live service" allow={["Admin", "Staff"]}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <FilterTabs options={[...tabs]} value={tab} onChange={setTab} label="Order status" />
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <SearchField id="queue-search" value={query} onChange={setQuery} placeholder="Order or customer" label="Search the queue" />
          </div>
          <button type="button" onClick={() => void reload()} className={wsBtnGhost}>Refresh</button>
        </div>
      </div>

      <LoadState loading={loading} error={error ?? actionError} onRetry={() => void reload()} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((order) => {
          const next = nextStatus[order.status];
          return (
            <article key={order.id} className="surface-card overflow-hidden rounded-[1.6rem]">
              <div className={`h-1 ${statusAccent[order.status] ?? "bg-border"}`} aria-hidden />
              <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4">
                <div>
                  <p className="font-display text-xl font-semibold">{order.reference}</p>
                  <StatusPill status={order.status} />
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo(order.placedAt)}</p>
              </div>
              <div className="px-5 pt-4">
                <p className="font-semibold">{order.customerName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                </p>
                <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {order.fulfilment ?? order.channel}
                  {order.scheduledFor ? ` · ${timeAgo(order.scheduledFor)}` : ""}
                </p>
                {order.specialInstructions && (
                  <p className="mt-3 rounded-2xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    Special instruction: {order.specialInstructions}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4">
                <p className="font-display text-xl font-semibold">{currency(order.total)}</p>
                <div className="flex flex-wrap gap-2">
                  {next && (
                    <button type="button" disabled={busyOrder === order.id} onClick={() => void move(order.id, next)} className={wsBtnPrimary}>
                      {busyOrder === order.id ? "Updating…" : actionLabel[next] ?? next}
                    </button>
                  )}
                  {next && order.status !== "Completed" && order.status !== "Cancelled" && (
                    <button type="button" disabled={busyOrder === order.id} onClick={() => void move(order.id, "Cancelled")} className="inline-flex min-h-11 items-center justify-center rounded-full bg-destructive/10 px-4 text-sm font-semibold text-destructive">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!loading && shown.length === 0 && <EmptyHint>No orders match these filters.</EmptyHint>}
    </AppShell>
  );
}
