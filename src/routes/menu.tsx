import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { currency, menuItems as seed } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Inventory — StackedHub" },
      { name: "description", content: "Manage menu items, prices, availability and stock levels with low-stock alerts." },
      { property: "og:title", content: "Menu & Inventory — StackedHub" },
      { property: "og:description", content: "Manage menu items, prices, availability and stock levels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

const categories: MenuItem["category"][] = ["Mains", "Sides", "Drinks", "Desserts"];
const blank = { name: "", description: "", category: "Mains" as MenuItem["category"], price: 0, stock: 0 };

function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(seed);
  const [filter, setFilter] = useState<string>("All");
  const [form, setForm] = useState(blank);

  const low = items.filter((i) => i.stock <= i.lowStockThreshold);
  const shown = items.filter((i) => filter === "All" || i.category === filter);

  const update = (id: string, patch: Partial<MenuItem>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setItems((p) => [
      ...p,
      { ...form, id: `m${Date.now()}`, lowStockThreshold: 10, spicy: false, available: form.stock > 0 },
    ]);
    setForm(blank);
  };

  return (
    <AppShell title="Menu & Inventory" subtitle="Catalogue" allow={["Admin", "Staff"]}>
      {low.length > 0 && (
        <Panel title="Low stock alerts">
          <div className="flex flex-wrap gap-2">
            {low.map((i) => (
              <span key={i.id} className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold">
                {i.name} · {i.stock} left
              </span>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title={`${shown.length} items`}
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="glass-soft rounded-xl px-3 py-2 text-sm outline-none">
            <option value="All">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr><th className="py-2">Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th></tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="border-t border-border/50">
                  <td className="py-3">
                    <p className="font-semibold">{i.name} {i.spicy && "🌶"}</p>
                    <p className="text-xs text-muted-foreground">{i.description}</p>
                  </td>
                  <td>{i.category}</td>
                  <td>{currency(i.price)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => update(i.id, { stock: Math.max(0, i.stock - 1) })} className="glass-soft size-7 rounded-lg">−</button>
                      <span className={`w-8 text-center font-semibold ${i.stock <= i.lowStockThreshold ? "text-destructive" : ""}`}>{i.stock}</span>
                      <button onClick={() => update(i.id, { stock: i.stock + 1 })} className="glass-soft size-7 rounded-lg">+</button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => update(i.id, { available: !i.available })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${i.available ? "bg-success/20" : "bg-secondary text-muted-foreground"}`}
                    >
                      {i.available ? "On menu" : "Hidden"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Add menu item">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass-soft rounded-xl px-4 py-2.5 text-sm outline-none" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MenuItem["category"] })} className="glass-soft rounded-xl px-3 py-2.5 text-sm outline-none">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-soft rounded-xl px-4 py-2.5 text-sm outline-none sm:col-span-2" />
          <input type="number" min={0} placeholder="Price (R)" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="glass-soft rounded-xl px-4 py-2.5 text-sm outline-none" />
          <input type="number" min={0} placeholder="Opening stock" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="glass-soft rounded-xl px-4 py-2.5 text-sm outline-none" />
          <button className="bg-gradient-brand rounded-xl py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2">Add item</button>
        </form>
      </Panel>
    </AppShell>
  );
}
