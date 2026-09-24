import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel, StatusPill } from "@/components/AppShell";
import {
  bestSellers,
  currency,
  formatTime,
  hourlyOrders,
  menuItems,
  orders,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StackedHub" },
      {
        name: "description",
        content: "Live revenue, orders, peak hours and stock alerts for Stacked Foods.",
      },
      { property: "og:title", content: "Dashboard — StackedHub" },
      {
        property: "og:description",
        content: "Live revenue, orders, peak hours and stock alerts for Stacked Foods.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const revenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const active = orders.filter((o) => o.status === "Placed" || o.status === "In kitchen");
  const lowStock = menuItems.filter((m) => m.stock <= m.lowStockThreshold);
  const avgTicket = Math.round(revenue / orders.filter((o) => o.status !== "Cancelled").length);
  const peak = Math.max(...hourlyOrders.map((h) => h.orders));

  const kpis = [
    { label: "Revenue today", value: currency(revenue), sub: "+12.4% vs last week" },
    { label: "Active orders", value: String(active.length), sub: `${lowStock.length} stock alerts` },
    { label: "New customers", value: "24", sub: "+6 this hour" },
    { label: "Avg. ticket", value: currency(avgTicket), sub: `across ${orders.length} orders` },
  ];

  return (
    <AppShell title="Good morning, team" subtitle="Wednesday, 23 September" allow={["Admin", "Staff"]}>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-3xl p-5">
            <p className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              {kpi.label}
            </p>
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
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="glass-soft flex items-center justify-between gap-3 rounded-2xl p-4"
              >
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
        </Panel>

        <Panel title="Gemini insights">
          <div className="space-y-3">
            {[
              {
                t: "Demand forecast",
                d: "Expect a 22% dinner rush at 18:00. Prep 12 extra peri-peri portions.",
              },
              {
                t: "Customer trend",
                d: "Repeat customers up 9%. Elena Costa is due a birthday voucher this Friday.",
              },
              {
                t: "Inventory alert",
                d: `${lowStock.length} items below threshold — chakalaka fries run out in about 2 hours.`,
              },
            ].map((item) => (
              <div key={item.t} className="glass-soft rounded-2xl p-4">
                <p className="text-xs font-semibold text-primary">{item.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Peak hours" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-2">
            {hourlyOrders.map((h) => (
              <div key={h.hour} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={
                    h.orders === peak
                      ? "bg-gradient-brand w-full rounded-t-lg"
                      : "w-full rounded-t-lg bg-primary/20"
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
            {bestSellers.map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.sold}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div
                    className="bg-gradient-brand h-full rounded-full"
                    style={{ width: `${(item.sold / (bestSellers[0]?.sold ?? 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
