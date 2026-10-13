import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { LoadState } from "@/components/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { getMenu } from "@/lib/data";
import { allergensFor, categoryImage, optionsFor, tagsFor } from "@/lib/menu-extras";
import { currency } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Menu — Order from Stacked Foods" },
      { name: "description", content: "Browse the Stacked Foods menu by category, check allergens and add meals to your cart." },
      { property: "og:title", content: "Menu — Order from Stacked Foods" },
      { property: "og:description", content: "Browse mains, sides, drinks and desserts and order online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

const categories = ["All", "Mains", "Sides", "Drinks", "Desserts"] as const;

function OrderPage() {
  const menu = useLoad(getMenu, []);
  const { count, subtotal } = useCart();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const shown = useMemo(
    () =>
      menu.data.filter(
        (m) =>
          (category === "All" || m.category === category) &&
          `${m.name} ${m.description}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [menu.data, category, query],
  );

  const clearFilters = () => {
    setCategory("All");
    setQuery("");
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Our menu</h1>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Menu categories">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={
                  category === c
                    ? "min-h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    : "min-h-11 shrink-0 rounded-full bg-card px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 sm:w-72">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">Search the menu</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search burgers, fries…" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>

        <div className="mt-6">
          <LoadState loading={false} error={menu.error} onRetry={() => void menu.reload()} />
        </div>

        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menu.loading && [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-card" />)}
          {shown.map((item) => (
            <article key={item.id} className={`flex flex-col overflow-hidden rounded-3xl bg-card ${item.available ? "" : "opacity-60"}`}>
              <img src={categoryImage[item.category]} alt={item.name} loading="lazy" width={944} height={704} className="aspect-[4/3] w-full object-cover" />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="shrink-0 font-bold">{currency(item.price)}</p>
                </div>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tagsFor(item).map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{t}</span>
                  ))}
                  {!item.available && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">Sold out</span>}
                </div>
                <button
                  disabled={!item.available}
                  onClick={() => setSelected(item)}
                  className="mt-4 min-h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
                >
                  {item.available ? "Add to cart" : "Unavailable today"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {!menu.loading && !menu.error && shown.length === 0 && (
          <div className="mt-6 rounded-3xl bg-card p-8 text-center">
            <p className="font-semibold">Nothing matched “{query || category}”.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try another word or category.</p>
            <button onClick={clearFilters} className="mt-4 min-h-11 rounded-xl bg-secondary px-4 text-sm font-semibold">Clear filters</button>
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-[min(32rem,calc(100%-2rem))]">
          <Link to="/checkout" className="flex min-h-14 items-center justify-between rounded-2xl bg-primary px-5 text-primary-foreground shadow-lg">
            <span className="text-sm font-semibold">{count} {count === 1 ? "item" : "items"} · {currency(subtotal)}</span>
            <span className="text-sm font-bold">Review order →</span>
          </Link>
        </div>
      )}

      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </CustomerShell>
  );
}

function ItemDialog({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");

  if (!item) return null;
  const options = optionsFor(item);
  const extra = options.filter((o) => picked.includes(o.label)).reduce((s, o) => s + o.price, 0);
  const unit = item.price + extra;
  const allergens = allergensFor(item);

  const close = () => {
    setQuantity(1);
    setPicked([]);
    setNote("");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        {allergens.length > 0 && <p className="text-xs text-muted-foreground">Contains: {allergens.join(", ")}</p>}
        {options.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Customise</legend>
            {options.map((o) => (
              <label key={o.label} className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl bg-secondary px-3 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={picked.includes(o.label)}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, o.label] : p.filter((x) => x !== o.label)))}
                  />
                  {o.label}
                </span>
                <span className="text-muted-foreground">+{currency(o.price)}</span>
              </label>
            ))}
          </fieldset>
        )}
        <label className="block text-sm font-semibold">
          Notes for the kitchen
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="e.g. no onions" className="mt-1 min-h-11 w-full rounded-xl bg-secondary px-3 text-sm font-normal outline-none" />
        </label>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-xl bg-secondary"><Minus className="size-4" /></button>
            <span className="w-6 text-center font-semibold" aria-live="polite">{quantity}</span>
            <button aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(20, q + 1))} className="grid size-11 place-items-center rounded-xl bg-secondary"><Plus className="size-4" /></button>
          </div>
          <button
            onClick={() => {
              add({
                menuItemId: item.id,
                name: item.name,
                unitPrice: unit,
                quantity,
                options: picked,
                note: note.trim() || undefined,
              });
              toast.success(`Added ${quantity}× ${item.name}`);
              close();
            }}
            className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Add · {currency(unit * quantity)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
