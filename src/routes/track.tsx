import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, ChefHat, PackageCheck, RefreshCw, ShoppingBag } from "lucide-react";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/AppShell";
import { getOrder } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({ id: typeof search.id === "string" ? search.id : undefined }),
  head: () => ({ meta: [{ title: "Track your order — Stacked Foods" }, { name: "description", content: "Follow your Stacked Foods order from confirmation to kitchen preparation and collection." }, { property: "og:title", content: "Track your order — Stacked Foods" }, { property: "og:description", content: "See the latest kitchen status for your Stacked Foods order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: TrackingPage,
});
const steps = [{ status: "Placed", label: "Order received", icon: ShoppingBag }, { status: "In kitchen", label: "In the kitchen", icon: ChefHat }, { status: "Ready", label: "Ready", icon: PackageCheck }, { status: "Completed", label: "Completed", icon: Check }];
function TrackingPage() {
  const { id: requestedId } = Route.useSearch();
  const [id, setId] = useState(requestedId ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { setId(requestedId ?? window.sessionStorage.getItem("stackedhub.lastOrderId") ?? ""); }, [requestedId]);
  const refresh = useCallback(async () => { if (!id) return; setLoading(true); setError(""); try { setOrder(await getOrder(id)); } catch (e) { setError(e instanceof Error ? e.message : "Could not load your order."); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void refresh(); if (!id) return; const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 15000); return () => clearInterval(timer); }, [id, refresh]);
  const current = steps.findIndex((s) => s.status === order?.status);
  return <CustomerShell><div className="mx-auto max-w-3xl px-4 pt-8"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-primary">YOUR ORDER</p><h1 className="mt-2 text-3xl font-bold">Fresh from the kitchen</h1></div>{id && <Button variant="outline" size="icon" aria-label="Refresh order" title="Refresh order" disabled={loading} onClick={() => void refresh()}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>}</div>
    {!id && <p className="mt-8 text-sm text-muted-foreground">No recent order in this tab. Place an order to see its progress here.</p>}
    {error && <div role="alert" className="mt-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}<Button variant="outline" className="ml-3" onClick={() => void refresh()}>Retry</Button></div>}
    {loading && !order && <p role="status" className="mt-8 text-muted-foreground">Checking your order…</p>}
    {order && <><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-border py-5"><div><h2 className="text-xl font-bold">{order.reference}</h2><p className="mt-1 text-sm text-muted-foreground">Placed at {formatTime(order.placedAt)}</p></div><StatusPill status={order.status} /></div>
      {order.status === "Cancelled" ? <p className="mt-6 text-destructive">This order was cancelled. Contact the restaurant if you need help.</p> : <ol className="my-8 grid grid-cols-2 gap-5 sm:grid-cols-4">{steps.map((s,index) => <li key={s.status} className="flex flex-col items-center gap-3 text-center"><span className={`grid size-12 place-items-center rounded-full ${index <= current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}><s.icon className="size-5" /></span><span className={`text-sm ${index === current ? "font-bold text-primary" : "text-muted-foreground"}`}>{s.label}</span></li>)}</ol>}
      <h2 className="mt-8 text-lg font-bold">Order summary</h2><ul className="mt-3 divide-y divide-border">{order.items.map((item,index) => <li key={index} className="flex justify-between gap-3 py-3 text-sm"><span>{item.quantity}× {item.name}</span><span>{currency(item.unitPrice * item.quantity)}</span></li>)}</ul><p className="flex justify-between border-t border-border pt-4 font-bold"><span>Total</span>{currency(order.total)}</p><p className="mt-6 text-sm text-muted-foreground">{order.status === "Ready" ? "Your order is ready. Please have your reference handy." : order.status === "Completed" ? "Thanks for ordering with Stacked Foods." : "The latest kitchen status will appear here."}</p>
    </>}
  </div></CustomerShell>;
}
