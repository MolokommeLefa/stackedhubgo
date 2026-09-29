import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, saveMenuItem, setAvailability, setMenuStock } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Inventory — StackedHub" },
      { name: "description", content: "Manage menu items, prices, availability and stock levels with low-stock alerts." },
    ],
  }),
  component: MenuPage,
});

const categories: MenuItem["category"][] = ["Mains", "Sides", "Drinks", "Desserts"];
const blank = { name: "", description: "", category: "Mains" as MenuItem["category"], price: 0, stock: 0 };

function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

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

  const low = items.filter((i) => i.stock <= i.lowStockThreshold);
  const shown = items.filter((i) => filter === "All" || i.category === filter);

  const update = async (id: string, patch: Partial<MenuItem>) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    try {
      if (patch.stock !== undefined) {
        const next = await setMenuStock(id, patch.stock);
        setItems((p) => p.map((i) => (i.id === id ? next : i)));
        return;
      }
      if (patch.available !== undefined) {
        const next = await setAvailability(id, patch.available);
        setItems((p) => p.map((i) => (i.id === id ? next : i)));
      }
    } catch (err) {
      setError(err);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Enter an item name.");
      return;
    }
    if (form.price < 0) {
      setFormError("Price cannot be negative.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await saveMenuItem({
        ...form,
        lowStockThreshold: 10,
        spicy: false,
        available: form.stock > 0,
      });
      setItems((p) => [...p, created]);
      setForm(blank);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Menu catalogue" subtitle="Inventory" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <>
          {low.length > 0 && (
            <div className="rounded-2xl bg-warning/20 px-4 py-3 text-sm" role="status">
              {low.length} item{low.length === 1 ? "" : "s"} at or below the stock threshold:{" "}
              {low.map((i) => `${i.name} (${i.stock})`).join(", ")}.
            </div>
          )}

          <Panel
            title="Items"
            action={
              <select
                aria-label="Filter by category"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="glass-soft min-h-11 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option>All</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            }
          >
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this category yet.</p>
            ) : (
              <div className="space-y-2">
                {shown.map((i) => (
                  <div key={i.id} className="glass-soft grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                    <div>
                      <p className="text-sm font-semibold">
                        {i.name} {i.spicy ? "🌶" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{i.description}</p>
                    </div>
                    <p className="text-sm">{currency(i.price)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease stock for ${i.name}`}
                        onClick={() => void update(i.id, { stock: Math.max(0, i.stock - 1) })}
                        className="glass-soft size-11 rounded-lg"
                      >
                        −
                      </button>
                      <span aria-live="polite">{i.stock}</span>
                      <button
                        type="button"
                        aria-label={`Increase stock for ${i.name}`}
                        onClick={() => void update(i.id, { stock: i.stock + 1 })}
                        className="glass-soft size-11 rounded-lg"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-pressed={i.available}
                      onClick={() => void update(i.id, { available: !i.available })}
                      className={`min-h-11 rounded-full px-3 py-1 text-xs font-semibold ${i.available ? "bg-success/20" : "bg-secondary text-muted-foreground"}`}
                    >
                      {i.available ? "On menu" : "Hidden"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Add item">
            <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as MenuItem["category"] })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
                Description
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Price (R)
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Stock
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </label>
              {formError && (
                <p className="text-sm text-destructive sm:col-span-2" role="alert">
                  {formError}
                </p>
              )}
              <button
                disabled={saving}
                className="bg-gradient-brand min-h-11 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2"
              >
                {saving ? "Adding…" : "Add item"}
              </button>
            </form>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
