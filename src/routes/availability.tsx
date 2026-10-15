import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { MenuPhoto } from "@/components/MenuPhoto";
import { Toggle } from "@/components/workspace";
import { getMenu, setAvailability } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/availability")({
  head: () => ({
    meta: [
      { title: "Item Availability — StackedHub" },
      { name: "description", content: "Staff switch menu items on or off when they run out." },
      { property: "og:title", content: "Item Availability — StackedHub" },
      {
        property: "og:description",
        content: "Staff switch menu items on or off when they run out.",
      },
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
    <AppShell title="Item availability" subtitle="Menu operations" allow={["Staff", "Admin"]}>
      <Panel
        title="Today's menu"
        action={<p className="text-xs text-muted-foreground">Changes update the customer menu.</p>}
      >
        <LoadState loading={loading} error={error ?? actionError} />
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 py-4">
              <MenuPhoto item={i} alt="" className="size-14 rounded-2xl" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.category} · {currency(i.price)}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    i.available ? "text-foreground" : "text-destructive"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${i.available ? "bg-success" : "bg-destructive"}`}
                    aria-hidden
                  />
                  {i.available ? "Available" : "Unavailable"}
                </span>
                <Toggle
                  checked={i.available}
                  disabled={busy === i.id}
                  onChange={(next) => void toggle(i.id, next)}
                  label={i.available ? `Mark ${i.name} sold out` : `Put ${i.name} back on the menu`}
                />
              </div>
            </li>
          ))}
        </ul>
        {!loading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No menu items loaded.</p>
        )}
      </Panel>
    </AppShell>
  );
}
