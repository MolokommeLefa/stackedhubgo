import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { actionLabel, greeting, nextStatus, StatCard, timeAgo } from "@/components/workspace";
import { useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import { getMenu, getOrderQueue, getReport, updateOrderStatus, type Report } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StackedHub" },
      {
        name: "description",
        content: "Today's orders, the live queue and sold-out items for Stacked Foods.",
      },
      { property: "og:title", content: "Dashboard — StackedHub" },
      {
        property: "og:description",
        content: "Today's orders, the live queue and sold-out items for Stacked Foods.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const emptyReport: Report = {
  orderCount: 0,
  completedSales: 0,
  hourlyOrders: [],
  revenueByDay: [],
  bestSellers: [],
  salesByChannel: [],
};

function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  return isAdmin ? <AdminDashboard /> : <StaffDashboard />;
}

function useQueueAndMenu() {
  const orders = useLoad(getOrderQueue, []);
  const menu = useLoad(getMenu, []);
  const list = orders.data;
  const active = list.filter((o) => o.status !== "Completed" && o.status !== "Cancelled");
  const ready = list.filter((o) => o.status === "Ready");
  const completed = list.filter((o) => o.status === "Completed");
  const sales = completed.reduce((s, o) => s + o.total, 0);
  const soldOut = menu.data.filter((m) => !m.available);
  return { orders, menu, list, active, ready, completed, sales, soldOut };
}

function StaffDashboard() {
  const { user } = useAuth();
  const { orders, menu, active, ready, soldOut, list } = useQueueAndMenu();
  const [actionError, setActionError] = useState<unknown>(null);

  const move = async (id: string, next: OrderStatus) => {
    setActionError(null);
    try {
      await updateOrderStatus(id, next);
      orders.setData((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    } catch (e) {
      setActionError(e);
    }
  };

  return (
    <AppShell
      title={greeting(user?.name ?? "there")}
      subtitle="Live service"
      allow={["Admin", "Staff"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          dark
          label="Active orders"
          value={String(active.length)}
          hint={`${list.length} tickets today`}
        />
        <StatCard label="Ready now" value={String(ready.length)} hint="Waiting for collection" />
        <StatCard
          label="Orders today"
          value={String(list.length)}
          hint={`${list.filter((o) => o.status === "Placed").length} still new`}
        />
        <StatCard
          label="Unavailable"
          value={String(soldOut.length)}
          hint="Menu items off the board"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel
          title="Action needed"
          action={
            <Link to="/orders" className="text-sm font-semibold text-primary">
              View full queue
            </Link>
          }
        >
          <LoadState
            loading={orders.loading}
            error={orders.error ?? actionError}
            onRetry={() => void orders.reload()}
          />
          <ul className="divide-y divide-border">
            {active.slice(0, 6).map((o) => (
              <ActionRow key={o.id} order={o} onMove={move} />
            ))}
          </ul>
          {!orders.loading && active.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active orders. The next ticket will land here.
            </p>
          )}
        </Panel>

        <Panel title="Heads up">
          <LoadState loading={menu.loading} error={menu.error} />
          <ul className="space-y-3">
            {soldOut.map((m) => (
              <li key={m.id} className="rounded-2xl bg-secondary px-4 py-3 text-sm">
                <p className="font-semibold">{m.name} is unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Update the menu when stock arrives.
                </p>
              </li>
            ))}
            {ready.map((o) => (
              <li key={o.id} className="rounded-2xl bg-secondary px-4 py-3 text-sm">
                <p className="font-semibold">{o.reference} is ready</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.customerName} · {o.fulfilment ?? o.channel}
                </p>
              </li>
            ))}
            {!menu.loading && soldOut.length === 0 && ready.length === 0 && (
              <p className="text-sm text-muted-foreground">Service is clear for now.</p>
            )}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function ActionRow({
  order,
  onMove,
}: {
  order: Order;
  onMove: (id: string, next: OrderStatus) => void;
}) {
  const next = nextStatus[order.status];
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="font-semibold">
          {order.reference} · {order.customerName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(order.placedAt)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={order.status} />
        {next && (
          <button
            type="button"
            onClick={() => onMove(order.id, next)}
            className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            {actionLabel[next]}
          </button>
        )}
      </div>
    </li>
  );
}

function AdminDashboard() {
  const { orders, menu, list, active, sales, soldOut, completed } = useQueueAndMenu();
  const report = useLoad(getReport, emptyReport);
  const available = menu.data.filter((m) => m.available).length;
  const average = completed.length ? Math.round(sales / completed.length) : 0;
  const hours = report.data.hourlyOrders ?? [];
  const maxHour = Math.max(1, ...hours.map((h) => h.orders));

  return (
    <AppShell
      title="StackedHub at a glance"
      subtitle="Operations overview"
      allow={["Admin", "Staff"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          dark
          label="Today's revenue"
          value={currency(sales)}
          hint="Completed tickets today"
        />
        <StatCard
          label="Orders today"
          value={String(list.length)}
          hint={`${active.length} currently active`}
        />
        <StatCard label="Average order" value={currency(average)} hint="From completed sales" />
        <StatCard
          label="Menu online"
          value={`${available}/${menu.data.length || 0}`}
          hint={`${soldOut.length} items unavailable`}
        />
      </div>

      <Panel title={isLiveApi() ? "Orders by hour" : "Orders today by hour"}>
        <LoadState loading={report.loading} error={report.error} />
        {hours.length === 0 && !report.loading ? (
          <p className="text-sm text-muted-foreground">No hourly totals yet.</p>
        ) : (
          <div className="flex h-56 items-end gap-2">
            {hours.map((h, i) => (
              <div key={h.hour} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg ${i === hours.length - 2 ? "bg-primary" : "bg-brand"}`}
                  style={{ height: `${(h.orders / maxHour) * 170}px` }}
                  title={`${h.hour}: ${h.orders} orders`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {h.hour.replace(":00", "")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
