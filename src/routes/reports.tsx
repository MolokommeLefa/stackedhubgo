import { createFileRoute } from "@tanstack/react-router";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { StatCard, wsBtnGhost } from "@/components/workspace";
import { isLiveApi } from "@/lib/api-client";
import { getReport, type Report } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StackedHub" },
      {
        name: "description",
        content: "Order counts, revenue, best sellers and sales by channel with CSV export.",
      },
      { property: "og:title", content: "Reports — StackedHub" },
      {
        property: "og:description",
        content: "Order counts, revenue, best sellers and sales by channel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

const empty: Report = {
  orderCount: 0,
  completedSales: 0,
  hourlyOrders: [],
  revenueByDay: [],
  bestSellers: [],
  salesByChannel: [],
};

function ReportsPage() {
  const { data: r, loading, error, reload } = useLoad(getReport, empty);
  const days = r.revenueByDay ?? [];
  const sellers = r.bestSellers ?? [];
  const channels = r.salesByChannel ?? [];
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const itemsSold = sellers.reduce((s, b) => s + b.sold, 0);
  const channelTotal = channels.reduce((s, c) => s + c.total, 0) || 1;
  const average = r.orderCount ? Math.round(r.completedSales / r.orderCount) : 0;

  const exportCsv = () => {
    const csv = ["Day,Revenue", ...days.map((d) => `${d.day},${d.revenue}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stackedhub-revenue.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Reports"
      subtitle="Performance"
      allow={["Admin"]}
      actions={
        <button type="button" onClick={exportCsv} className={wsBtnGhost}>
          Export CSV
        </button>
      }
    >
      <LoadState loading={loading} error={error} onRetry={() => void reload()} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          dark
          label="Revenue"
          value={currency(r.completedSales)}
          hint={isLiveApi() ? "Completed sales" : "Completed demo tickets"}
        />
        <StatCard
          label="Orders"
          value={String(r.orderCount)}
          hint={isLiveApi() ? "All recorded tickets" : "All demo tickets this session"}
        />
        <StatCard label="Average order" value={currency(average)} hint="Revenue ÷ all tickets" />
        <StatCard
          label="Items sold"
          value={String(itemsSold)}
          hint={isLiveApi() ? "From best-seller counts" : "From demo tickets"}
        />
      </div>

      {days.length > 0 && (
        <Panel title={isLiveApi() ? "Revenue" : "Typical week (illustrative)"}>
          <div className="flex h-56 items-end gap-3">
            {days.map((d, i) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(d.revenue / 1000)}k
                </span>
                <div
                  className={`w-full rounded-t-xl ${i === days.length - 3 ? "bg-primary" : "bg-brand"}`}
                  style={{ height: `${(d.revenue / max) * 170}px` }}
                />
                <span className="text-xs">{d.day}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={isLiveApi() ? "Best sellers" : "Best sellers (demo tickets)"}>
          <ol className="space-y-4">
            {sellers.map((b, i) => (
              <li key={b.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{b.name}</span>
                    <span className="block text-xs text-muted-foreground">{b.sold} sold</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Sales by channel">
          <ul className="space-y-3">
            {channels.map((c) => (
              <li key={c.channel}>
                <div className="flex justify-between text-sm">
                  <span>{c.channel}</span>
                  <span className="font-semibold">
                    {currency(c.total)} · {Math.round((c.total / channelTotal) * 100)}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${(c.total / channelTotal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
