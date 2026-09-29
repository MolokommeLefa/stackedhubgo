import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, saveMenuItem, setAvailability, setMenuStock } from "@/lib/data";
import { useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, saveMenuItem, type MenuInput } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Inventory — StackedHub" },
      { name: "description", content: "Manage menu items, prices, availability and stock levels with low-stock alerts." },
      { title: "Menu Catalogue — StackedHub" },
      { name: "description", content: "Admins add and edit menu items, prices and categories." },
      { property: "og:title", content: "Menu Catalogue — StackedHub" },
      { property: "og:description", content: "Admins add and edit menu items, prices and categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

const categories: MenuItem["category"][] = ["Mains", "Sides", "Drinks", "Desserts"];
const blank: MenuInput = { name: "", description: "", category: "Mains", price: 0, stock: 0, lowStockThreshold: 10, spicy: false, available: true };
const field = "glass-soft rounded-xl px-4 py-2.5 text-sm outline-none";

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
  const { data: items, setData, loading, error } = useLoad(getMenu, []);
  const [form, setForm] = useState<MenuInput>(blank);
  const [editId, setEditId] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<unknown>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      const saved = await saveMenuItem(form, editId);
      setData((prev) => (editId ? prev.map((m) => (m.id === editId ? saved : m)) : [...prev, saved]));
      setForm(blank);
      setEditId(undefined);
    } catch (err) {
      setSaveError(err);
    }
  };

  const edit = (m: MenuItem) => {
    const { id, ...rest } = m;
    setEditId(id);
    setForm(rest);
  };

  return (
    <AppShell title="Menu Catalogue" subtitle="Management" allow={["Admin"]}>
      <Panel title={editId ? "Edit menu item" : "Add menu item"}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MenuItem["category"] })} className={field}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} sm:col-span-2`} />
          <input type="number" min={0} step="0.01" placeholder="Price (R)" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={field} />
          <input type="number" min={0} placeholder="Stock" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={field} />
          <div className="flex gap-2 sm:col-span-2">
            <button className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">{editId ? "Save changes" : "Add item"}</button>
            {editId && (
              <button type="button" onClick={() => { setEditId(undefined); setForm(blank); }} className="rounded-xl bg-secondary px-4 text-sm font-semibold">Cancel</button>
            )}
          </div>
        </form>
        <div className="mt-3"><LoadState loading={false} error={saveError} /></div>
      </Panel>

      <Panel title={`${items.length} items`}>
        <LoadState loading={loading} error={error} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr><th className="py-2">Item</th><th>Category</th><th>Price</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-3">
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.description}</p>
                  </td>
                  <td>{i.category}</td>
                  <td>{currency(i.price)}</td>
                  <td className="text-xs">{i.available ? "Available" : "Sold out"}</td>
                  <td className="text-right"><button onClick={() => edit(i)} className="text-sm font-semibold text-primary">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
