import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { apiRequest, endpoints, isLiveApi } from "@/lib/api-client";
import { getMenu, getOrderQueue, getPromotions, placeOrder } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { MenuItem, Order, Promotion } from "@/lib/types";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Customer Portal — StackedHub" },
      { name: "description", content: "Order food, track orders, earn loyalty points and get AI meal suggestions." },
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
  return picks.slice(0, 3).map((m) => ({ name: m.name, reason: `${m.description} (${currency(m.price)})` }));
}

function PortalPage() {
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [asking, setAsking] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextMenu, nextOrders, nextPromos] = await Promise.all([getMenu(), getOrderQueue(), getPromotions()]);
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

  const mine = orders.filter((o) => o.customerId === user?.id);
  const cartItems = menu.filter((m) => cart[m.id]);
  const total = cartItems.reduce((s, m) => s + m.price * cart[m.id]!, 0);
  const available = menu.filter((m) => m.available);

  const add = (id: string) => {
    setPlaced(null);
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
    setOrdering(true);
    setError(null);
    try {
      const order = await placeOrder({
        customerId: user.id,
        customerName: user.name,
        items: cartItems.map((m) => ({
          menuItemId: m.id,
          name: m.name,
          quantity: cart[m.id]!,
          unitPrice: m.price,
        })),
      });
      setOrders((prev) => [order, ...prev]);
      setCart({});
      setPlaced(`Order ${order.reference} is in. We'll update the status as the kitchen works.`);
    } catch (err) {
      setError(err);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <AppShell title="Customer portal" subtitle="Order & loyalty" allow={["Admin", "Customer"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-muted-foreground">Loyalty points</p>
              <p className="mt-1 text-2xl font-bold">{user?.loyaltyPoints ?? 0}</p>
            </div>
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-muted-foreground">Your orders</p>
              <p className="mt-1 text-2xl font-bold">{mine.length}</p>
            </div>
            <div className="glass rounded-3xl p-5">
              <p className="text-xs text-muted-foreground">Live offers</p>
              <p className="mt-1 text-2xl font-bold">{promos.filter((p) => p.active).length}</p>
            </div>
          </div>

          <Panel title="Ask for a recommendation">
            <form onSubmit={ask} className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="meal-prompt">
                What are you in the mood for
              </label>
              <input
                id="meal-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Something spicy under R150"
                className="glass-soft min-h-11 min-w-56 flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
              <button disabled={asking} className="bg-gradient-brand min-h-11 rounded-xl px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {asking ? "Thinking…" : "Recommend"}
              </button>
            </form>
            {suggestions.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {suggestions.map((s) => (
                  <div key={s.name} className="glass-soft rounded-2xl p-4">
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                    {menu.find((m) => m.name === s.name) && (
                      <button
                        type="button"
                        onClick={() => add(menu.find((m) => m.name === s.name)!.id)}
                        className="mt-3 min-h-11 text-xs font-semibold text-primary"
                      >
                        + Add to order
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <Panel title="Menu">
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing is on the menu right now. Try again shortly.</p>
              ) : (
                <ul className="space-y-2">
                  {available.map((m) => (
                    <li key={m.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl p-4">
                      <div>
                        <p className="text-sm font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                        <p className="mt-1 text-sm font-medium">{currency(m.price)}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Add ${m.name} to order`}
                        onClick={() => add(m.id)}
                        className="bg-gradient-brand size-11 shrink-0 rounded-lg font-bold text-primary-foreground"
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div className="space-y-6">
              <Panel title="Your order">
                {placed ? (
                  <p className="text-sm text-foreground" role="status">
                    {placed}
                  </p>
                ) : cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Your basket is empty — add items from the menu.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {cartItems.map((m) => (
                        <li key={m.id} className="flex items-center justify-between text-sm">
                          <span>{m.name}</span>
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Remove one ${m.name}`}
                              onClick={() => remove(m.id)}
                              className="glass-soft size-11 rounded"
                            >
                              −
                            </button>
                            {cart[m.id]}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm font-semibold">Total {currency(total)}</p>
                    <button
                      type="button"
                      disabled={ordering}
                      onClick={() => void checkout()}
                      className="bg-gradient-brand mt-4 min-h-11 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {ordering ? "Placing order…" : "Place order"}
                    </button>
                  </>
                )}
              </Panel>

              <Panel title="Recent tickets">
                {mine.map((o) => (
                  <div key={o.id} className="mb-2 flex items-center justify-between text-sm">
                    <span>
                      {o.reference} · {currency(o.total)}
                    </span>
                    <StatusPill status={o.status} />
                  </div>
                ))}
                {mine.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              </Panel>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
