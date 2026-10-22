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
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [cardCvv, setCardCvv] = useState("123");
  const [groupInvite, setGroupInvite] = useState<Array<{ menuItemId: string; quantity: number }> | null>(null);
  const [inviteRead, setInviteRead] = useState(false);
  const [basketOpen, setBasketOpen] = useState(true);

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
  const deliveryFee = fulfilment === "Delivery" && cartItems.length > 0 ? 25 : 0;
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
    if (fulfilment === "Delivery" && !deliveryAddress.trim()) {
      setError("Add your delivery address before placing the order.");
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
      if (cardNumber.replace(/\D/g, "") !== "4242424242424242" || cardExpiry !== "12/30" || cardCvv !== "123") {
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
    <AppShell title="Customer portal" subtitle="Order & loyalty" allow={["Customer"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && (
        <>
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

          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
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
              <Panel title="Your order">
                {placed ? (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground" role="status">
                      {placed}
                    </p>
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
                            {cart[m.id]}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 font-display text-xl font-semibold">
                      Total {currency(total)}
                    </p>
                    <button
                      type="button"
                      disabled={ordering}
                      onClick={() => void checkout()}
                      className="mt-4 min-h-11 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {ordering ? "Placing order…" : "Place order"}
                    </button>
                  </>
                )}
              </Panel>

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
