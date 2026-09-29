import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getMenu, saveMenuItem, type MenuInput } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
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
