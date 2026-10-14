import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, RefreshCw, List, Columns3, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getOrderQueue, updateOrderStatus } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import { NEXT_STATUS, NEXT_ACTION_LABEL, STATUS_LABEL, delayLevel } from "@/lib/order-rules";
import type { Order, OrderStatus } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [
    { title: "Order Queue — StackedHub" },
    { name: "description", content: "Manage incoming orders and kitchen progress at Stacked Foods." },
    { property: "og:title", content: "Order Queue — StackedHub" },
    { property: "og:description", content: "Manage incoming orders and kitchen progress at Stacked Foods." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: OrdersPage,
});
const statuses: OrderStatus[] = ["Placed", "In kitchen", "Ready", "Completed", "Cancelled"];
function OrdersPage() {
  const { data: orders, setData, loading, error, reload } = useLoad(getOrderQueue, []);
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("All");
  const [board, setBoard] = useState(true);
  const [busy, setBusy] = useState<string[]>([]);
  const [actionError, setActionError] = useState<unknown>(null);
  const shown = orders.filter((o) => (status === "All" || o.status === status) && (channel === "All" || channel === o.channel) && `${o.reference} ${o.customerName}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { const timer = setInterval(() => { if (!document.hidden && busy.length === 0) void reload(); }, 20000); return () => clearInterval(timer); }, [reload, busy]);
  const move = async (order: Order, next: OrderStatus) => {
    if (busy.includes(order.id)) return;
    if (next === "Cancelled" && !window.confirm(`Cancel order ${order.reference}?`)) return;
    setBusy((p) => [...p, order.id]); setActionError(null);
    try { const saved = await updateOrderStatus(order.id, next); setData((p) => p.map((o) => o.id === order.id ? saved : o)); toast.success(`${order.reference} · ${STATUS_LABEL[saved.status]} saved`); }
    catch (e) { setActionError(e); }
    finally { setBusy((p) => p.filter((id) => id !== order.id)); }
  };
  const renderOrder = (o: Order) => {
    const next = NEXT_STATUS[o.status]; const delay = delayLevel(o.placedAt, o.status);
    return <article key={o.id} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold">{o.reference}</p><p className="mt-1 text-xs text-muted-foreground">{o.customerName}</p></div><StatusPill status={o.status} /></div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3" />{formatTime(o.placedAt)} · {o.channel}{delay !== "ok" && <span className={delay === "critical" ? "font-semibold text-destructive" : "font-semibold text-status-preparing"}>Needs attention</span>}</div>
      <ul className="my-4 space-y-2 border-y border-border py-3 text-sm">{o.items.map((i, index) => <li key={`${i.menuItemId}-${index}`} className="flex gap-2"><span className="font-semibold text-primary">{i.quantity}×</span>{i.name}</li>)}</ul>
      {o.specialInstructions && <p className="mb-3 rounded-md bg-warning/15 p-2 text-xs">{o.specialInstructions}</p>}
      <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{currency(o.total)}</span>{next && <div className="flex gap-1"><Button size="sm" disabled={busy.includes(o.id)} onClick={() => void move(o, next)}>{busy.includes(o.id) ? "Saving…" : NEXT_ACTION_LABEL[o.status]}</Button><Button variant="ghost" size="icon" className="size-9 text-muted-foreground" title="Cancel order" aria-label={`Cancel ${o.reference}`} disabled={busy.includes(o.id)} onClick={() => void move(o, "Cancelled")}><X /></Button></div>}</div>
    </article>;
  };
  return <AppShell title="Order Queue" subtitle="Kitchen operations" allow={["Admin", "Staff"]} actions={<Button variant="outline" size="icon" title="Refresh orders" aria-label="Refresh orders" disabled={loading} onClick={() => void reload()}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{statuses.slice(0,4).map((s) => <div key={s} className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{STATUS_LABEL[s]}</p><p className="mt-2 text-2xl font-bold">{orders.filter((o) => o.status === s).length}</p></div>)}</div>
    <Panel title={`${shown.length} orders`} action={<div className="flex gap-1"><Button variant={board ? "secondary" : "ghost"} size="icon" title="Board view" aria-label="Board view" aria-pressed={board} onClick={() => setBoard(true)}><Columns3 /></Button><Button variant={!board ? "secondary" : "ghost"} size="icon" title="List view" aria-label="List view" aria-pressed={!board} onClick={() => setBoard(false)}><List /></Button></div>}>
      <div className="mb-5 flex flex-wrap gap-3"><label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3"><Search className="size-4 text-muted-foreground" /><input aria-label="Search orders" placeholder="Search reference or customer" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-sm outline-none" /></label><select aria-label="Order status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "All")} className="min-h-11 rounded-md border border-border bg-card px-3 text-sm"><option value="All">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select><select aria-label="Order channel" value={channel} onChange={(e) => setChannel(e.target.value)} className="min-h-11 rounded-md border border-border bg-card px-3 text-sm"><option value="All">All channels</option>{[...new Set(orders.map((o) => o.channel))].map((c) => <option key={c}>{c}</option>)}</select></div>
      <LoadState loading={loading && orders.length === 0} error={error ?? actionError} onRetry={() => void reload()} />
      {board ? <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">{statuses.filter((s) => status === "All" ? s !== "Cancelled" : s === status).map((s) => <div key={s} className="min-w-0"><div className="mb-3 flex items-center justify-between border-b border-border pb-3"><h3 className="text-sm font-semibold">{STATUS_LABEL[s]}</h3><span className="text-xs text-muted-foreground">{shown.filter((o) => o.status === s).length}</span></div><div className="space-y-3">{shown.filter((o) => o.status === s).map(renderOrder)}{!shown.some((o) => o.status === s) && <p className="py-8 text-center text-xs text-muted-foreground">No {STATUS_LABEL[s].toLowerCase()} orders</p>}</div></div>)}</div> : <div className="grid gap-3 md:grid-cols-2">{shown.map(renderOrder)}</div>}
      {!loading && shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matching orders.</p>}
    </Panel>
  </AppShell>;
}
