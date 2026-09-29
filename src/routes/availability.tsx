import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, setAvailability } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/availability")({
  head: () => ({
    meta: [
      { title: "Item availability — StackedHub" },
      { name: "description", content: "Toggle menu items on or off for the floor." },
    ],
  }),
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getMenu());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (item: MenuItem) => {
    setBusyId(item.id);
    try {
      const next = await setAvailability(item.id, !item.available);
      setItems((list) => list.map((i) => (i.id === item.id ? next : i)));
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Item availability" subtitle="Kitchen" allow={["Staff", "Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <Panel title="On the board">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No menu items yet — add them from Menu Catalogue.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} · {currency(item.price)} · stock {item.stock}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void toggle(item)}
                    aria-pressed={item.available}
                    className={`min-h-11 rounded-full px-4 text-xs font-semibold disabled:opacity-60 ${
                      item.available ? "bg-success/20" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.available ? "Available" : "Off menu"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
