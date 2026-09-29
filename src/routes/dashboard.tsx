import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { getMenu, getOrderQueue } from "@/lib/data";
import { currency, formatTime } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StackedHub" },
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
