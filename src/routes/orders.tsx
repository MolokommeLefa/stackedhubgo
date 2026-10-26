import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, StatusPill } from "@/components/AppShell";
import {
  actionLabel,
  EmptyHint,
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
      {
        name: "description",
        content: "Acknowledge orders and move them through the kitchen lifecycle.",
      },
      { property: "og:title", content: "Order Queue — StackedHub" },
      {
        property: "og:description",
        content: "Acknowledge orders and move them through the kitchen lifecycle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const statuses: OrderStatus[] = ["Scheduled", "Placed", "In kitchen", "Ready", "Completed", "Cancelled"];
const flow: Record<OrderStatus, OrderStatus | null> = {
  Scheduled: "Placed",
  Scheduled: null,
  Placed: "In kitchen",
  "In kitchen": "Ready",
  Ready: "Completed",
  Completed: null,
  Cancelled: null,
};
const label: Partial<Record<OrderStatus, string>> = {
  Placed: "Release",
  "In kitchen": "Accept",
  Ready: "Mark ready",
  Completed: "Complete",
};
const label: Partial<Record<OrderStatus, string>> = { "In kitchen": "Accept", Ready: "Mark ready", Completed: "Complete" };
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

  const shown = orders.filter((o) => {
    const matchTab =
      tab === "All"
        ? true
        : tab === "Completed"
          ? o.status === "Completed" || o.status === "Cancelled"
          : o.status === tab;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      o.reference.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));
    return matchTab && matchQuery;
  });

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
    <AppShell title="Order queue" subtitle="Live service" allow={["Admin", "Staff"]}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <FilterTabs options={[...tabs]} value={tab} onChange={setTab} label="Order status" />
        <div className="flex flex-wrap gap-2">
          <div className="min-w-56 flex-1">
            <SearchField
              id="queue-search"
              value={query}
              onChange={setQuery}
              placeholder="Order or customer"
              label="Search the queue"
            />
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
                    <p className="text-xs text-muted-foreground">
                      {o.channel} · {formatTime(o.placedAt)} · {currency(o.total)}
                      {o.scheduledFor ? ` · collect ${formatTime(o.scheduledFor)}` : ""}
                      {o.items.some((item) => item.addedByName) ? ` · ${o.items.map((item) => item.addedByName ?? item.name).filter((name, index, all) => all.indexOf(name) === index).join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={o.status} />
                    {next && (
                      <button onClick={() => move(o.id, next)} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                        {label[next]}
                      </button>
                    )}
                    {(next || o.status === "Scheduled") && (
                      <button onClick={() => move(o.id, "Cancelled")} className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                        Cancel
                      </button>
                    )}
                  </div>
          <button type="button" onClick={() => void reload()} className={wsBtnGhost}>
            Refresh
          </button>
        </div>
      </div>

      <LoadState loading={loading} error={error ?? actionError} onRetry={() => void reload()} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((o) => {
          const next = nextStatus[o.status] ?? flow[o.status];
          return (
            <article key={o.id} className="surface-card overflow-hidden rounded-[1.6rem]">
              <div className={`h-1 ${statusAccent[o.status] ?? "bg-border"}`} aria-hidden />
              <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4">
                <div>
                  <p className="font-display text-xl font-semibold">{o.reference}</p>
                  <StatusPill status={o.status} />
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo(o.placedAt)}</p>
              </div>
              <div className="px-5 pt-4">
                <p className="font-semibold">{o.customerName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                </p>
                <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {o.fulfilment ?? o.channel}
                  {o.scheduledFor ? ` · ${timeAgo(o.scheduledFor)}` : ""}
                </p>
                {o.specialInstructions && (
                  <p className="mt-3 rounded-2xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    Special instruction: {o.specialInstructions}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4">
                <p className="font-display text-xl font-semibold">{currency(o.total)}</p>
                <div className="flex flex-wrap gap-2">
                  {next && (
                    <button type="button" onClick={() => move(o.id, next)} className={wsBtnPrimary}>
                      {actionLabel[next] ?? label[next]}
                    </button>
                  )}
                  {(next || o.status === "Scheduled") && (
                    <button
                      type="button"
                      onClick={() => move(o.id, "Cancelled")}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-destructive/10 px-4 text-sm font-semibold text-destructive"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!loading && shown.length === 0 && <EmptyHint>No orders here.</EmptyHint>}
    </AppShell>
  );
}
