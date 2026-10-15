import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { SearchField, wsBtnGhost, wsBtnPrimary, wsField } from "@/components/workspace";
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
      {
        property: "og:description",
        content: "Admins add and edit menu items, prices and categories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

const categories: MenuItem["category"][] = ["Mains", "Sides", "Drinks", "Desserts"];
const blank: MenuInput = {
  name: "",
  description: "",
  category: "Mains",
  price: 0,
  stock: 0,
  lowStockThreshold: 10,
  spicy: false,
  available: true,
};

function MenuPage() {
  const { data: items, setData, loading, error } = useLoad(getMenu, []);
  const [form, setForm] = useState<MenuInput>(blank);
  const [editId, setEditId] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<unknown>(null);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.name} ${i.description} ${i.category}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      const saved = await saveMenuItem(form, editId);
      setData((prev) =>
        editId ? prev.map((m) => (m.id === editId ? saved : m)) : [...prev, saved],
      );
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
    <AppShell title="Menu catalogue" subtitle="Management" allow={["Admin"]}>
      <Panel title={editId ? "Edit menu item" : "Add menu item"}>
        <p className="mb-4 text-sm text-muted-foreground">
          Publish a new item to the customer menu, or save changes to an existing one.
        </p>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-muted-foreground">
            Item name
            <input
              required
              placeholder="e.g. Double Smash Burger"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${wsField} mt-1`}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as MenuItem["category"] })
              }
              className={`${wsField} mt-1`}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Price (R)
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className={`${wsField} mt-1`}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
            Description
            <input
              placeholder="Short customer-facing description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${wsField} mt-1`}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Stock
            <input
              type="number"
              min={0}
              placeholder="0"
              value={form.stock || ""}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              className={`${wsField} mt-1`}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-3">
            <button className={wsBtnPrimary}>{editId ? "Save changes" : "Add item"}</button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(undefined);
                  setForm(blank);
                }}
                className={wsBtnGhost}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="mt-3">
          <LoadState loading={false} error={saveError} />
        </div>
      </Panel>

      <Panel
        title={`${shown.length} menu items`}
        action={
          <SearchField
            id="menu-search"
            value={query}
            onChange={setQuery}
            placeholder="Search"
            label="Search menu items"
          />
        }
      >
        <LoadState loading={loading} error={error} />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="py-3">Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-4">
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.description}</p>
                  </td>
                  <td>{i.category}</td>
                  <td>{currency(i.price)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`size-1.5 rounded-full ${i.available ? "bg-success" : "bg-destructive"}`}
                        aria-hidden
                      />
                      {i.available ? "Available" : "Sold out"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => edit(i)}
                      className="min-h-11 text-sm font-semibold text-primary"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {shown.map((i) => (
            <li key={i.id} className="rounded-2xl bg-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.description}</p>
                  <p className="mt-2 text-sm">
                    {i.category} · {currency(i.price)}
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {i.available ? "Available" : "Sold out"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => edit(i)}
                  className="min-h-11 text-sm font-semibold text-primary"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!loading && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No items match that search.
          </p>
        )}
      </Panel>
    </AppShell>
  );
}
