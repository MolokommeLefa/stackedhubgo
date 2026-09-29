import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getCustomers, getReport } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { Report } from "@/lib/data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — StackedHub" },
      { name: "description", content: "Weekly revenue, best sellers, channel mix and customer insights with CSV export." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [vipCount, setVipCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextReport, customers] = await Promise.all([getReport(), getCustomers()]);
      setReport(nextReport);
      setVipCount(customers.filter((c) => c.tier === "VIP").length);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueByDay = report?.revenueByDay ?? [];
  const total = revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const max = Math.max(1, ...revenueByDay.map((d) => d.revenue));
  const bestSellers = report?.bestSellers ?? [];
  const topSold = Math.max(1, ...bestSellers.map((b) => b.sold));
  const channels = report?.salesByChannel ?? [];

  const exportCsv = () => {
    const csv = ["Day,Revenue", ...revenueByDay.map((d) => `${d.day},${d.revenue}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stackedhub-weekly-revenue.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Reports" subtitle="Analytics" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Weekly revenue", currency(total)],
              ["Avg per day", currency(total / Math.max(1, revenueByDay.length))],
              ["VIP customers", String(vipCount)],
            ].map(([l, v]) => (
              <div key={l} className="glass rounded-3xl p-5">
                <p className="text-xs text-muted-foreground uppercase">{l}</p>
                <p className="mt-1 font-display text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>

          <Panel
            title="Revenue this week"
            action={
              <button type="button" onClick={exportCsv} className="glass-soft min-h-11 rounded-xl px-3 py-2 text-xs font-semibold">
                Export CSV
              </button>
            }
          >
            <div className="flex h-56 items-end gap-3">
              {revenueByDay.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{Math.round(d.revenue / 1000)}k</span>
                  <div className="bg-gradient-brand w-full rounded-t-xl" style={{ height: `${(d.revenue / max) * 170}px` }} />
                  <span className="text-xs">{d.day}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Best sellers">
              <div className="space-y-3">
                {bestSellers.map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-sm">
                      <span>{b.name}</span>
                      <span className="font-semibold">{b.sold}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(b.sold / topSold) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Today's sales by channel">
              <div className="space-y-2">
                {channels.map((row) => (
                  <div key={row.channel} className="glass-soft flex justify-between rounded-xl px-4 py-2.5 text-sm">
                    <span>{row.channel}</span>
                    <span className="font-semibold">{currency(row.total)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}
