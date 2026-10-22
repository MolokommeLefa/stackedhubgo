import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Minus, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { MenuPhoto } from "@/components/MenuPhoto";
import { useBasketUi } from "@/components/BasketSheet";
import { LoadState, StatusPill } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { getMenu, getOrderQueue } from "@/lib/data";
import { allergensFor, optionsFor, tagsFor } from "@/lib/menu-extras";
import { currency } from "@/lib/mock-data";
import type { MenuItem, Order } from "@/lib/types";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Menu — Order from Stacked Foods" },
      {
        name: "description",
        content:
          "Browse the Stacked Foods menu by category, check allergens and add meals to your cart.",
      },
      { property: "og:title", content: "Menu — Order from Stacked Foods" },
      {
        property: "og:description",
        content: "Browse mains, sides, drinks and desserts and order online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

const categories = ["All", "Mains", "Sides", "Drinks", "Desserts"] as const;

function OrderPage() {
  return (
    <CustomerShell requireAuth>
      <OrderMenu />
    </CustomerShell>
  );
}

function OrderMenu() {
  const menu = useLoad(getMenu, []);
  const orders = useLoad(getOrderQueue, []);
  const { user } = useAuth();
  const { add, count, subtotal, lines } = useCart();
  const basket = useBasketUi();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [sharedGroup, setSharedGroup] = useState<Array<{ menuItemId: string; name: string; unitPrice: number; quantity: number; options: string[]; note?: string }> | null>(null);

  // Signed-in customers use the portal as the single ordering surface.
  // Preserve group invitations or transfer the current basket snapshot when redirecting.
  useEffect(() => {
    if (user?.role !== "Customer") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("group") && lines.length > 0) {
      params.set("group", JSON.stringify(lines.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
      }))));
    }
    const query = params.toString();
    window.location.replace("/portal" + (query ? "?" + query : ""));
  }, [user?.role, lines]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("group");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) =>
        item && typeof item.menuItemId === "string" && typeof item.name === "string" &&
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) &&
        typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 &&
        Array.isArray(item.options)
      )) setSharedGroup(parsed);
      else toast.error("This group basket link is invalid.");
    } catch {
      toast.error("This group basket link could not be read.");
    }
  }, []);

  const shareGroupBasket = async () => {
    const payload = lines.map(({ menuItemId, name, unitPrice, quantity, options, note }) =>
      ({ menuItemId, name, unitPrice, quantity, options, note }));
    const url = new URL("/order", window.location.origin);
    url.searchParams.set("group", JSON.stringify(payload));
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Group order link copied", { description: "Share it with everyone joining this order." });
    } catch {
      window.prompt("Copy this group order link:", url.toString());
    }
  };

  const joinSharedGroup = () => {
    if (!sharedGroup) return;
    for (const item of sharedGroup) add({
      menuItemId: item.menuItemId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      options: item.options,
      note: item.note,
    });
    setSharedGroup(null);
    toast.success("Shared items added to your basket", { description: "Review the combined basket before checkout." });
    basket?.openBasket();
  };

  const shown = useMemo(
    () =>
      menu.data.filter(
        (m) =>
          (category === "All" || m.category === category) &&
          `${m.name} ${m.description}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [menu.data, category, query],
  );

  const mine = orders.data.filter((o) => o.customerId === user?.id).slice(0, 4);

  const clearFilters = () => {
    setCategory("All");
    setQuery("");
  };

  const reorder = (order: Order) => {
    for (const item of order.items) {
      add({
        menuItemId: item.menuItemId,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        options: [],
      });
    }
    toast.success(`Added ${order.reference} to your basket`);
    basket?.openBasket();
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-28 lg:pb-16">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
          Order online
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          What are you craving?
        </h1>

        {sharedGroup && (
          <section className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4" aria-label="Join a group order">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">Group order invitation</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Add your friends’ picks</h2>
              <p className="mt-1 text-sm text-muted-foreground">{sharedGroup.length} shared line items are ready to add. Review quantities and customise your own items before checkout.</p>
            </div>
            <button type="button" onClick={joinSharedGroup} className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground sm:mt-0">
              <UsersRound className="size-4" aria-hidden /> Join group basket
            </button>
          </section>
        )}
        <section className="mt-6 flex flex-col gap-3 rounded-3xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary"><UsersRound className="size-5" aria-hidden /></span>
            <div>
              <h2 className="font-semibold">Ordering together?</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">Share a basket link so friends can add the shared picks to their own basket before the organiser checks out.</p>
            </div>
          </div>
          <button type="button" onClick={() => void shareGroupBasket()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-cream">
            <Copy className="size-4" aria-hidden /> Share group basket
          </button>
        </section>
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              The good stuff
            </p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Our menu</h2>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-full bg-card px-4 shadow-sm ring-1 ring-border lg:w-80">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">Search the menu</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        <div
          className="mt-6 flex gap-1 overflow-x-auto border-b border-border"
          role="tablist"
          aria-label="Menu categories"
        >
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? "min-h-11 shrink-0 border-b-2 border-primary px-4 text-sm font-semibold"
                  : "min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <LoadState loading={false} error={menu.error} onRetry={() => void menu.reload()} />
        </div>

        <div className="mt-2 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {menu.loading &&
            [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-[1.6rem] bg-card" />
            ))}
          {shown.map((item) => (
            <article key={item.id} className={item.available ? "" : "opacity-60"}>
              <button
                type="button"
                onClick={() => item.available && setSelected(item)}
                disabled={!item.available}
                className="group relative block w-full overflow-hidden rounded-[1.6rem] bg-[#1c1612] text-left"
              >
                <MenuPhoto
                  item={item}
                  alt={item.name}
                  className="aspect-[5/4] w-full transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-foreground uppercase">
                  {item.category}
                </span>
              </button>
              <div className="pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {tagsFor(item).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                  {!item.available && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      Sold out
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-display text-2xl leading-tight font-semibold tracking-tight">
                  {item.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{currency(item.price)}</p>
                  <button
                    disabled={!item.available}
                    onClick={() => setSelected(item)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
                  >
                    <Plus className="size-4" aria-hidden />
                    {item.available ? "Add" : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!menu.loading && !menu.error && shown.length === 0 && (
          <div className="mt-8 rounded-3xl bg-card p-10 text-center">
            <p className="font-display text-2xl font-semibold">
              Nothing matched “{query || category}”.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Try another word or category.</p>
            <button
              onClick={clearFilters}
              className="mt-5 min-h-11 rounded-full bg-secondary px-5 text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        <section className="mt-16">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Your orders
              </p>
              <h2 className="font-display text-3xl font-semibold">Recent tickets</h2>
            </div>
          </div>
          <div className="mt-5">
            <LoadState loading={orders.loading} error={orders.error} />
            {mine.length === 0 && !orders.loading && (
              <p className="rounded-3xl bg-card px-5 py-6 text-sm text-muted-foreground">
                No tickets yet. Your first order will show up here.
              </p>
            )}
            <ul className="space-y-2">
              {mine.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                      {o.reference.replace(/^[^\d]*/, "").slice(-3) || "#"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {o.reference} · {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.channel}
                        {o.fulfilment ? ` · ${o.fulfilment}` : ""} · {currency(o.total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={o.status} />
                    <button
                      type="button"
                      onClick={() => reorder(o)}
                      className="min-h-11 rounded-full bg-secondary px-4 text-sm font-semibold"
                    >
                      Order again
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-[min(32rem,calc(100%-2rem))] lg:hidden">
          <button
            type="button"
            onClick={() => basket?.openBasket()}
            className="flex min-h-14 w-full items-center justify-between rounded-full bg-ink px-5 text-cream shadow-lg"
          >
            <span className="text-sm font-semibold">
              {count} {count === 1 ? "item" : "items"} · {currency(subtotal)}
            </span>
            <span className="text-sm font-bold">View basket →</span>
          </button>
        </div>
      )}

      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-0 p-0 sm:max-w-3xl sm:rounded-[2rem]">
        <div className="grid md:grid-cols-2">
          <div className="bg-[#1c1612] md:min-h-[32rem]">
            <MenuPhoto
              item={item}
              alt={item.name}
              className="h-56 w-full md:h-full md:min-h-[32rem]"
            />
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <DialogHeader className="text-left">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {item.category}
              </p>
              <DialogTitle className="font-display text-3xl font-semibold">{item.name}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {item.description}
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-2xl bg-secondary px-4 py-3 text-xs text-muted-foreground">
              Made fresh to order.
              {allergens.length > 0
                ? ` Contains ${allergens.join(", ")}. Ask the team if you have an allergy.`
                : " Ask the team if you have an allergy."}
            </p>
            {options.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-semibold">Customise</legend>
                {options.map((o) => (
                  <label
                    key={o.label}
                    className="flex min-h-11 cursor-pointer items-center justify-between rounded-2xl bg-secondary px-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={picked.includes(o.label)}
                        onChange={(e) =>
                          setPicked((p) =>
                            e.target.checked ? [...p, o.label] : p.filter((x) => x !== o.label),
                          )
                        }
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
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                placeholder="e.g. no onions"
                className="mt-1 min-h-11 w-full rounded-2xl bg-secondary px-3 text-sm font-normal outline-none"
              />
            </label>
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center rounded-full bg-secondary"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center font-semibold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="grid size-11 place-items-center rounded-full bg-secondary"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <p className="hidden text-lg font-semibold sm:block">{currency(unit)}</p>
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
                className="min-h-12 flex-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Add to basket · {currency(unit * quantity)}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
