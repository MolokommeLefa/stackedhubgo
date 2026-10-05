import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, setAvailability } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/availability")({
  head: () => ({
    meta: [
      { title: "Item Availability — StackedHub" },
      { name: "description", content: "Staff switch menu items on or off when they run out." },
      { property: "og:title", content: "Item Availability — StackedHub" },
      { property: "og:description", content: "Staff switch menu items on or off when they run out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const { data: items, setData, loading, error } = useLoad(getMenu, []);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const toggle = async (id: string, available: boolean) => {
    setBusy(id);
    setActionError(null);
    try {
      const updated = await setAvailability(id, available);
      setData((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated, available } : m)));
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell title="Item Availability" subtitle="Staff" allow={["Staff", "Admin"]}>
      <Panel title={`${items.length} menu items`}>
        <LoadState loading={loading} error={error ?? actionError} />
        <div className="divide-y divide-border">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.category} · {currency(i.price)}
                </p>
              </div>
              <button
                disabled={busy === i.id}
                onClick={() => toggle(i.id, !i.available)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  i.available ? "bg-success/20 text-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i.available ? "Available" : "Sold out"}
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
