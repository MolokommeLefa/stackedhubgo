import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Copy, ShoppingBasket, Truck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { MenuPhoto } from "@/components/MenuPhoto";
import { useAuth } from "@/lib/auth";
import { apiRequest, endpoints, isLiveApi } from "@/lib/api-client";
import { getMenu, getOrderQueue, getPromotions, placeOrder } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { DELIVERY_FEE, validateDeliveryAddress } from "@/lib/order-rules";
import type { MenuItem, Order, Promotion } from "@/lib/types";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Customer Portal — StackedHub" },
      {
        name: "description",
        content: "Order food, track orders, earn loyalty points and get AI meal suggestions.",
      },
    ],
  }),
  component: PortalPage,
});

interface Suggestion {
  name: string;
  reason: string;
}

function demoSuggest(prompt: string, pool: MenuItem[]): Suggestion[] {
  const p = prompt.toLowerCase();
  let picks = pool.filter((m) => m.available);
  if (/spic|hot|chilli/.test(p)) picks = picks.filter((m) => m.spicy);
  else if (/light|veg|healthy/.test(p)) picks = picks.filter((m) => m.category !== "Mains");
  else if (/sweet|dessert/.test(p)) picks = picks.filter((m) => m.category === "Desserts");
  else if (/cheap|budget/.test(p)) picks = [...picks].sort((a, b) => a.price - b.price);
  return picks
    .slice(0, 3)
    .map((m) => ({ name: m.name, reason: `${m.description} (${currency(m.price)})` }));
}

function PortalPage() {
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [asking, setAsking] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [fulfilment, setFulfilment] = useState<"Collection" | "Delivery">("Collection");
  const [scheduleMode, setScheduleMode] = useState<"asap" | "scheduled">("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [cardholder, setCardholder] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [cardCvv, setCardCvv] = useState("123");
  const [groupInvite, setGroupInvite] = useState<Array<{ menuItemId: string; quantity: number }> | null>(null);
  const [inviteRead, setInviteRead] = useState(false);
  const [basketOpen, setBasketOpen] = useState(true);
  const [headerBasketOpen, setHeaderBasketOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextMenu, nextOrders, nextPromos] = await Promise.all([
        getMenu(),
        getOrderQueue(),
        getPromotions(),
      ]);
      setMenu(nextMenu);
      setOrders(nextOrders);
      setPromos(nextPromos);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (menu.length === 0 || inviteRead) return;
    setInviteRead(true);
    const raw = new URLSearchParams(window.location.search).get("group");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) =>
        item && typeof item.menuItemId === "string" &&
        typeof item.quantity === "number" && Number.isInteger(item.quantity) &&
        item.quantity > 0 && menu.some((m) => m.id === item.menuItemId)
      )) setGroupInvite(parsed.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })));
      else toast.error("This group basket link is invalid or contains unavailable items.");
    } catch {
      toast.error("This group basket link could not be read.");
    }
  }, [menu, inviteRead]);

  const mine = orders.filter((o) => o.customerId === user?.id);
  const cartItems = menu.filter((m) => cart[m.id]);
  const itemCount = cartItems.reduce((sum, m) => sum + cart[m.id]!, 0);
  const subtotal = cartItems.reduce((sum, m) => sum + m.price * cart[m.id]!, 0);
  const deliveryFee = fulfilment === "Delivery" && cartItems.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const available = menu.filter((m) => m.available);

  const shareGroupBasket = async () => {
    if (cartItems.length === 0) {
      toast.error("Add items to your basket before sharing a group order.");
      return;
    }
    const payload = cartItems.map((item) => ({ menuItemId: item.id, quantity: cart[item.id]! }));
    const url = new URL("/portal", window.location.origin);
    url.searchParams.set("group", JSON.stringify(payload));
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Group basket link copied", { description: "Share it with friends so they can add these items." });
    } catch {
      window.prompt("Copy this group basket link:", url.toString());
    }
  };

  const joinGroupBasket = () => {
    if (!groupInvite) return;
    setCart((current) => {
      const next = { ...current };
      for (const item of groupInvite) next[item.menuItemId] = (next[item.menuItemId] ?? 0) + item.quantity;
      return next;
    });
    setGroupInvite(null);
    setPlaced(null);
    setPlacedOrder(null);
    setBasketOpen(true);
    toast.success("Group items added to your basket");
  };

  const toLocalDateTimeValue = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  const add = (id: string) => {
    setPlaced(null);
    setPlacedOrder(null);
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  };
  const remove = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      if (n[id]! > 1) n[id]!--;
      else delete n[id];
      return n;
    });

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setAsking(true);
    try {
      setSuggestions(
        isLiveApi()
          ? await apiRequest<Suggestion[]>(endpoints.aiRecommendations, {
              method: "POST",
              body: JSON.stringify({ prompt }),
            })
          : await new Promise((r) => setTimeout(() => r(demoSuggest(prompt, menu)), 600)),
      );
    } catch (err) {
      setError(err);
    } finally {
      setAsking(false);
    }
  };

  const checkout = async () => {
    if (!user || cartItems.length === 0) return;
    const addressError = validateDeliveryAddress(fulfilment, deliveryAddress);
    if (addressError) {
      setError(addressError);
      return;
    }
    if (scheduleMode === "scheduled") {
      const selectedTime = new Date(scheduledFor).getTime();
      if (!scheduledFor || !Number.isFinite(selectedTime) || selectedTime < Date.now() + 45 * 60 * 1000 || selectedTime > Date.now() + 7 * 24 * 60 * 60 * 1000) {
        setError("Choose a time at least 45 minutes from now and within the next 7 days.");
        return;
      }
    }
    if (paymentMethod === "Card") {
      if (isLiveApi()) {
        setError("Card payments are demo-only until a payment provider is connected. Choose cash for live orders.");
        return;
      }
      if (cardholder.trim().length < 2 || cardNumber.replace(/\D/g, "") !== "4242424242424242" || cardExpiry !== "12/30" || cardCvv !== "123") {
        setError("Demo card declined. Use 4242 4242 4242 4242, expiry 12/30 and CVV 123.");
        return;
      }
    }
    setOrdering(true);
    setError(null);
    try {
      const order = await placeOrder({
        customerId: user.id,
        customerName: user.name,
        paymentMethod,
        paymentStatus: paymentMethod === "Card" ? "Paid" : undefined,
        fulfilment,
        deliveryAddress: fulfilment === "Delivery" ? deliveryAddress.trim() : undefined,
        fees: deliveryFee,
        specialInstructions: scheduleMode === "scheduled" && scheduledFor
          ? "Scheduled order for " + new Date(scheduledFor).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
          : undefined,
        items: cartItems.map((m) => ({
          menuItemId: m.id,
          name: m.name,
          quantity: cart[m.id]!,
          unitPrice: m.price,
        })),
      });
      setOrders((prev) => [order, ...prev]);
      setCart({});
      setPlacedOrder(order);
      setPlaced("Order " + order.reference + " is confirmed. " + (fulfilment === "Delivery" ? "Delivery" : "Collection") + " · " + (scheduleMode === "scheduled" && scheduledFor ? "scheduled for " + new Date(scheduledFor).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "as soon as possible") + ".");
      toast.success("Order placed", {
        description: `${order.reference} · ${order.items.reduce((n, i) => n + i.quantity, 0)} items · we'll update the status as the kitchen works`,
        duration: 7000,
      });
    } catch (err) {
      setError(err);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <AppShell
      title={user?.name ? `Welcome back, ${user.name.split(' ')[0]}!` : "Welcome back!"}
      allow={["Customer"]}
      actions={
        <div className="relative">
          <button type="button" onClick={() => setHeaderBasketOpen((open) => !open)} aria-expanded={headerBasketOpen} aria-label={"Preview basket: " + itemCount + " items, " + currency(total)} className="relative inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ShoppingBasket className="size-4" aria-hidden />
            <span className="hidden sm:inline">Basket</span>
            <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{itemCount}</span>
          </button>
          {headerBasketOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl">
              <div className="flex items-center justify-between gap-3"><p className="font-display text-lg font-semibold">Your basket</p><span className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"}</span></div>
              {cartItems.length === 0 ? (
                <p className="py-5 text-sm text-muted-foreground">Your basket is empty. Add something from the menu.</p>
              ) : (
                <>
                  <ul className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                    {cartItems.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0">{cart[item.id]} × {item.name}</span><span className="shrink-0 font-medium">{currency(item.price * cart[item.id]!)}</span></li>)}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
                  {fulfilment === "Delivery" && <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Delivery fee</span><span>{currency(deliveryFee)}</span></div>}
                  <div className="mt-1 flex justify-between text-sm font-semibold"><span>Total</span><span>{currency(total)}</span></div>
                </>
              )}
              <button type="button" onClick={() => { setHeaderBasketOpen(false); setBasketOpen(true); document.getElementById("portal-basket")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="mt-4 min-h-10 w-full rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">{cartItems.length === 0 ? "Browse menu" : "View basket & checkout"}</button>
            </div>
          )}
        </div>
      }
    >
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && (
        <>
          {groupInvite && (
            <section className="surface-card mb-5 flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Group order invitation</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Add the shared basket?</h2>
                <p className="mt-1 text-sm text-muted-foreground">{groupInvite.reduce((sum, item) => sum + item.quantity, 0)} items from your group invite are ready to add.</p>
              </div>
              <button type="button" onClick={joinGroupBasket} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
                <UsersRound className="size-4" aria-hidden /> Add to my basket
              </button>
            </section>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card rounded-3xl p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Loyalty points
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">{user?.loyaltyPoints ?? 0}</p>
            </div>
            <div className="surface-card rounded-3xl p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Your orders
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">{mine.length}</p>
            </div>
            <div className="surface-card rounded-3xl p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Live offers
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">
                {promos.filter((p) => p.active).length}
              </p>
            </div>
          </div>

          <Panel title="Ask for a recommendation">
            <p className="mb-3 text-sm text-muted-foreground">
              {isLiveApi()
                ? "Suggestions come from the connected API."
                : "Demo suggestions from the current menu — not live AI."}
            </p>
            <form onSubmit={ask} className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="meal-prompt">
                What are you in the mood for
              </label>
              <input
                id="meal-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Something spicy under R150"
                className="min-h-11 min-w-56 flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none"
              />
              <button
                disabled={asking}
                className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {asking ? "Thinking…" : "Recommend"}
              </button>
            </form>
            {suggestions.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {suggestions.map((s) => {
                  const match = menu.find((m) => m.name === s.name);
                  return (
                    <div key={s.name} className="overflow-hidden rounded-2xl bg-secondary">
                      {match && <MenuPhoto item={match} alt="" className="aspect-[5/4] w-full" />}
                      <div className="p-4">
                        <p className="font-display text-xl font-semibold">{s.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                        {match && (
                          <button
                            type="button"
                            onClick={() => add(match.id)}
                            className="mt-3 min-h-11 text-xs font-semibold text-primary"
                          >
                            + Add to order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Panel title="Menu">
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing is on the menu right now. Try again shortly.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {available.map((m) => (
                    <article key={m.id} className="min-w-0">
                      <MenuPhoto
                        item={m}
                        alt={m.name}
                        className="aspect-[5/4] w-full rounded-[1.4rem]"
                      />
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-lg leading-tight font-semibold">
                            {m.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {m.description}
                          </p>
                          <p className="mt-2 text-sm font-semibold">{currency(m.price)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Add ${m.name} to order`}
                          onClick={() => add(m.id)}
                          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
                        >
                          +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <div className="space-y-6">
              <div id="portal-basket">
              <Panel title={placedOrder ? "Order confirmation" : "Your basket · " + itemCount + " " + (itemCount === 1 ? "item" : "items")} action={
                <button type="button" onClick={() => setBasketOpen((open) => !open)} aria-expanded={basketOpen} className="grid size-10 place-items-center rounded-full bg-secondary" aria-label={basketOpen ? "Collapse basket" : "Expand basket"}>
                  <ShoppingBasket className="size-5" aria-hidden />
                </button>
              }>
                {placed ? (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground" role="status">
                      {placed}
                    </p>
                    {placedOrder && (
                      <div className="rounded-2xl bg-secondary p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{placedOrder.reference}</span>
                          <StatusPill status={placedOrder.status} />
                        </div>
                        <ul className="mt-3 space-y-2 text-sm">
                          {placedOrder.items.map((item) => (
                            <li key={item.menuItemId} className="flex justify-between gap-3">
                              <span>{item.quantity} × {item.name}</span>
                              <span className="shrink-0">{currency(item.unitPrice * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
                          <span>Total</span><span>{currency(placedOrder.total)}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{paymentMethod === "Card" ? "Demo card payment simulated" : "Payment: cash"} · {fulfilment} · {scheduleMode === "scheduled" && scheduledFor ? new Date(scheduledFor).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "ASAP"}</p>
                      </div>
                    )}
                    {placedOrder && (
                      <Link
                        to="/track/$reference"
                        params={{ reference: placedOrder.id }}
                        className="flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        Track your order →
                      </Link>
                    )}
                  </div>
                ) : !basketOpen ? (
                  <button type="button" onClick={() => setBasketOpen(true)} className="w-full rounded-2xl bg-secondary p-4 text-left text-sm">
                    {itemCount === 0 ? "Your basket is empty — add items from the menu." : "View " + itemCount + " items · " + currency(total)}
                  </button>
                ) : cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your basket is empty — add items from the menu.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {cartItems.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 text-sm">
                          <MenuPhoto item={m} alt="" className="size-12 rounded-full" />
                          <span className="min-w-0 flex-1 font-medium">{m.name}</span>
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Remove one ${m.name}`}
                              onClick={() => remove(m.id)}
                              className="grid size-11 place-items-center rounded-full bg-secondary"
                            >
                              −
                            </button>
                            <span className="min-w-4 text-center tabular-nums">{cart[m.id]}</span>
                            <button type="button" aria-label={"Add one " + m.name} onClick={() => add(m.id)} className="grid size-9 place-items-center rounded-full bg-secondary">+</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency(subtotal)}</span></div>
                      {fulfilment === "Delivery" && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{currency(deliveryFee)}</span></div>}
                      <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{currency(total)}</span></div>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold">Fulfilment</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" aria-pressed={fulfilment === "Collection"} onClick={() => setFulfilment("Collection")} className={fulfilment === "Collection" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}>Collection</button>
                          <button type="button" aria-pressed={fulfilment === "Delivery"} onClick={() => setFulfilment("Delivery")} className={fulfilment === "Delivery" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}><Truck className="mr-1 inline size-4" aria-hidden /> Delivery</button>
                        </div>
                      </div>
                      {fulfilment === "Delivery" && (
                        <label className="block text-sm font-medium">Delivery address
                          <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} placeholder="Street, suburb, city" className="mt-2 w-full rounded-2xl bg-secondary px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                          <span className="mt-1 block text-xs text-muted-foreground">Delivery fee: R25. Driver tracking is currently a demo map preview.</span>
                        </label>
                      )}
                      <div>
                        <p className="mb-2 text-sm font-semibold">Timing</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" aria-pressed={scheduleMode === "asap"} onClick={() => setScheduleMode("asap")} className={scheduleMode === "asap" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}>ASAP</button>
                          <button type="button" aria-pressed={scheduleMode === "scheduled"} onClick={() => setScheduleMode("scheduled")} className={scheduleMode === "scheduled" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}><CalendarClock className="mr-1 inline size-4" aria-hidden /> Schedule</button>
                        </div>
                        {scheduleMode === "scheduled" && <label className="mt-3 block text-sm font-medium">Preferred date and time
                          <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} min={toLocalDateTimeValue(new Date(Date.now() + 45 * 60 * 1000))} max={toLocalDateTimeValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))} className="mt-2 min-h-11 w-full rounded-xl bg-secondary px-3 py-2 text-sm" />
                          <span className="mt-1 block text-xs text-muted-foreground">At least 45 minutes ahead, within 7 days.</span>
                        </label>}
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold">Payment</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" aria-pressed={paymentMethod === "Cash"} onClick={() => setPaymentMethod("Cash")} className={paymentMethod === "Cash" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}>Cash</button>
                          <button type="button" aria-pressed={paymentMethod === "Card"} onClick={() => setPaymentMethod("Card")} className={paymentMethod === "Card" ? "min-h-10 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground" : "min-h-10 rounded-full bg-secondary px-3 text-sm"}>Demo card</button>
                        </div>
                        {paymentMethod === "Card" && (
                          <div className="mt-3 space-y-2 rounded-2xl border border-border p-3">
                            <p className="text-xs text-muted-foreground">Demo only · no real charge. PayPal is not connected. Use the test details below; live API checkout blocks this option.</p>
                            <label className="block text-xs font-medium">Name on card<input value={cardholder} onChange={(e) => setCardholder(e.target.value)} autoComplete="cc-name" className="mt-1 min-h-10 w-full rounded-lg bg-secondary px-3 text-sm" /></label>
                            <label className="block text-xs font-medium">Card number<input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} autoComplete="off" inputMode="numeric" maxLength={19} className="mt-1 min-h-10 w-full rounded-lg bg-secondary px-3 text-sm" /></label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block text-xs font-medium">Expiry<input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} autoComplete="off" maxLength={5} className="mt-1 min-h-10 w-full rounded-lg bg-secondary px-3 text-sm" /></label>
                              <label className="block text-xs font-medium">CVV<input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} autoComplete="off" inputMode="numeric" maxLength={4} className="mt-1 min-h-10 w-full rounded-lg bg-secondary px-3 text-sm" /></label>
                            </div>
                            <p className="text-xs text-muted-foreground">4242 4242 4242 4242 · 12/30 · 123</p>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => void shareGroupBasket()} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold">
                        <Copy className="size-4" aria-hidden /> Share group basket
                      </button>
                    </div>
                    <button type="button" disabled={ordering} onClick={() => void checkout()} className="mt-4 min-h-11 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                      {ordering ? "Placing order…" : "Confirm order"}
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground">Review items, delivery, timing and payment here. You won't be redirected to a separate checkout screen.</p>
                  </>
                )}
              </Panel>
              </div>

              {placedOrder && fulfilment === "Delivery" && (
                <Panel title="Delivery status">
                  <div className="rounded-2xl bg-secondary p-3">
                    <p className="text-sm font-semibold">{placedOrder.deliveryStatus ?? placedOrder.status}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Illustrative route preview · live driver GPS is not connected yet.</p>
                    <svg viewBox="0 0 320 112" role="img" aria-label="Illustrative route from restaurant to delivery destination" className="mt-3 h-28 w-full rounded-xl bg-[#e8eee6]">
                      <path d="M18 88 C70 88 70 24 130 38 S210 86 300 18" stroke="#fff" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <path d="M18 88 C70 88 70 24 130 38 S210 86 300 18" stroke="#267a61" strokeWidth="4" fill="none" strokeDasharray="6 5" strokeLinecap="round" />
                      <circle cx="18" cy="88" r="7" fill="#267a61" stroke="#fff" strokeWidth="3" /><circle cx="300" cy="18" r="8" fill="#e6a23c" stroke="#fff" strokeWidth="3" />
                    </svg>
                    <Link to="/track/$reference" params={{ reference: placedOrder.id }} className="mt-3 flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Open full tracking →</Link>
                  </div>
                </Panel>
              )}
              <Panel title="Recent tickets">
                {mine.map((o) => (
                  <Link
                    key={o.id}
                    to="/track/$reference"
                    params={{ reference: o.id }}
                    aria-label={`Track order ${o.reference}`}
                    className="mb-3 flex min-h-11 items-center justify-between gap-2 rounded-xl p-2 text-sm transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{o.reference}</span>
                      <span className="text-xs text-muted-foreground">{currency(o.total)} · Track order →</span>
                    </span>
                    <StatusPill status={o.status} />
                  </Link>
                ))}
                {mine.length === 0 && (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
