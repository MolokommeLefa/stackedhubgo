import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { getMenu, getOrderQueue, getReport } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import type { MenuItem, Order } from "@/lib/types";
import type { Report } from "@/lib/data";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { getMenu, getOrderQueue } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StackedHub" },
      {
        name: "description",
        content: "Live revenue, orders, peak hours and stock alerts for Stacked Foods.",
      },
      { name: "description", content: "Today's orders, the live queue and sold-out items for Stacked Foods." },
      { property: "og:title", content: "Dashboard — StackedHub" },
      { property: "og:description", content: "Today's orders, the live queue and sold-out items for Stacked Foods." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextOrders, nextMenu, nextReport] = await Promise.all([getOrderQueue(), getMenu(), getReport()]);
      setOrders(nextOrders);
      setMenu(nextMenu);
      setReport(nextReport);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + o.total, 0);
  const active = orders.filter((o) => o.status === "Placed" || o.status === "In kitchen");
  const lowStock = menu.filter((m) => m.stock <= m.lowStockThreshold);
  const paid = orders.filter((o) => o.status !== "Cancelled");
  const avgTicket = paid.length ? Math.round(revenue / paid.length) : 0;
  const hourly = report?.hourlyOrders ?? [];
  const peak = Math.max(1, ...hourly.map((h) => h.orders));
  const sellers = report?.bestSellers ?? [];

  const kpis = [
    { label: "Revenue today", value: currency(revenue), sub: `${orders.length} tickets on the board` },
    { label: "Active orders", value: String(active.length), sub: `${lowStock.length} stock alerts` },
    { label: "Completed sales", value: currency(report?.completedSales ?? 0), sub: "From the reports feed" },
    { label: "Avg. ticket", value: currency(avgTicket), sub: `across ${paid.length || 0} paid orders` },
  ];

  return (
    <AppShell title="Good morning, team" subtitle={today} allow={["Admin", "Staff"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="glass rounded-3xl p-5">
                <p className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">{kpi.label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{kpi.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{kpi.sub}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Live orders"
              className="lg:col-span-2"
              action={
                <Link to="/orders" className="rounded-xl bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  View all
                </Link>
              }
            >
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet — they will show here as soon as one is placed.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 font-display text-xs font-bold text-primary">
                          {order.reference}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {order.customerName} · {order.channel}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{formatTime(order.placedAt)}</span>
                        <StatusPill status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Kitchen notes">
              <div className="space-y-3">
                <div className="glass-soft rounded-2xl p-4">
                  <p className="text-xs font-semibold text-primary">Inventory alert</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lowStock.length
                      ? `${lowStock.length} items below threshold — ${lowStock.map((i) => i.name).join(", ")}.`
                      : "Stock levels are healthy."}
                  </p>
                </div>
                <div className="glass-soft rounded-2xl p-4">
                  <p className="text-xs font-semibold text-primary">Board load</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active.length} order{active.length === 1 ? "" : "s"} currently in placed or kitchen.
                  </p>
                </div>
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Panel title="Peak hours" className="lg:col-span-2">
              <div className="flex h-40 items-end gap-2">
                {hourly.map((h) => (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={
                        h.orders === peak ? "bg-gradient-brand w-full rounded-t-lg" : "w-full rounded-t-lg bg-primary/20"
                      }
                      style={{ height: `${(h.orders / peak) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{h.hour.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Best sellers">
              <div className="space-y-4">
                {sellers.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.sold}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="bg-gradient-brand h-full rounded-full"
                        style={{ width: `${(item.sold / (sellers[0]?.sold ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </>
      )}
  const orders = useLoad(getOrderQueue, []);
  const menu = useLoad(getMenu, []);
  const list = orders.data;
  const active = list.filter((o) => o.status !== "Completed" && o.status !== "Cancelled");
  const sales = list.filter((o) => o.status === "Completed").reduce((s, o) => s + o.total, 0);
  const soldOut = menu.data.filter((m) => !m.available);

  const stats = [
    ["Orders today", String(list.length)],
    ["In progress", String(active.length)],
    ["Completed sales", currency(sales)],
    ["Sold-out items", String(soldOut.length)],
  ];

  return (
    <AppShell title="Dashboard" subtitle="Overview" allow={["Admin", "Staff"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-3xl bg-card p-5">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Active orders"
          className="lg:col-span-2"
          action={<Link to="/orders" className="text-sm font-semibold text-primary">Open queue</Link>}
        >
          <LoadState loading={orders.loading} error={orders.error} />
          <div className="divide-y divide-border">
            {active.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold">{o.reference} · {o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.channel} · {formatTime(o.placedAt)} · {currency(o.total)}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
            ))}
            {!orders.loading && active.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No active orders.</p>
            )}
          </div>
        </Panel>

        <Panel title="Sold out">
          <LoadState loading={menu.loading} error={menu.error} />
          <div className="space-y-2">
            {soldOut.map((m) => (
              <p key={m.id} className="rounded-xl bg-secondary px-3 py-2 text-sm">{m.name}</p>
            ))}
            {!menu.loading && soldOut.length === 0 && (
              <p className="text-sm text-muted-foreground">Everything is available.</p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
