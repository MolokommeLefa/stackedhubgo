import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel, StatusPill } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { apiRequest, endpoints, isLiveApi } from "@/lib/api-client";
import { currency, menuItems, orders, promotions } from "@/lib/mock-data";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Customer Portal — StackedHub" },
      { name: "description", content: "Order food, track orders, earn loyalty points and get AI meal suggestions." },
      { property: "og:title", content: "Customer Portal — StackedHub" },
      { property: "og:description", content: "Order food, track orders and get AI meal suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalPage,
});

interface Suggestion { name: string; reason: string }

/** Demo fallback until the .NET API proxies Google Gemini at /api/ai/recommendations. */
function demoSuggest(prompt: string): Suggestion[] {
  const p = prompt.toLowerCase();
  const pool = menuItems.filter((m) => m.available);
  let picks: MenuItem[] = pool;
  if (/spic|hot|chilli/.test(p)) picks = pool.filter((m) => m.spicy);
  else if (/light|veg|healthy/.test(p)) picks = pool.filter((m) => m.category !== "Mains");
  else if (/sweet|dessert/.test(p)) picks = pool.filter((m) => m.category === "Desserts");
  else if (/cheap|budget/.test(p)) picks = [...pool].sort((a, b) => a.price - b.price);
  return picks.slice(0, 3).map((m) => ({ name: m.name, reason: `${m.description} (${currency(m.price)})` }));
}

function PortalPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const mine = orders.filter((o) => o.customerId === user?.id);
  const cartItems = menuItems.filter((m) => cart[m.id]);
  const total = cartItems.reduce((s, m) => s + m.price * cart[m.id]!, 0);

  const add = (id: string) => { setPlaced(false); setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })); };
  const remove = (id: string) =>
    setCart((c) => { const n = { ...c }; if (n[id]! > 1) n[id]!--; else delete n[id]; return n; });

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      setSuggestions(
        isLiveApi()
          ? await apiRequest<Suggestion[]>(endpoints.aiRecommendations, { method: "POST", body: JSON.stringify({ prompt }) })
          : await new Promise((r) => setTimeout(() => r(demoSuggest(prompt)), 600)),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title={`Hi ${user?.name.split(" ")[0] ?? ""}`} subtitle="Customer portal" allow={["Admin", "Staff", "Customer"]}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-3xl p-5"><p className="text-xs text-muted-foreground uppercase">Loyalty points</p><p className="font-display text-2xl font-bold">{user?.loyaltyPoints ?? 0}</p></div>
        <div className="glass rounded-3xl p-5"><p className="text-xs text-muted-foreground uppercase">Your orders</p><p className="font-display text-2xl font-bold">{mine.length}</p></div>
        <div className="glass rounded-3xl p-5"><p className="text-xs text-muted-foreground uppercase">Live offers</p><p className="font-display text-2xl font-bold">{promotions.filter((p) => p.active).length}</p></div>
      </div>

      <Panel title="AI meal assistant">
        <form onSubmit={ask} className="flex flex-wrap gap-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Something spicy under R150" className="glass-soft min-w-56 flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" />
          <button disabled={loading} className="bg-gradient-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {loading ? "Thinking…" : "Recommend"}
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {suggestions.map((s) => (
              <div key={s.name} className="glass-soft rounded-2xl p-4">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                {menuItems.find((m) => m.name === s.name) && (
                  <button onClick={() => add(menuItems.find((m) => m.name === s.name)!.id)} className="mt-3 text-xs font-semibold text-primary">+ Add to order</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel title="Menu">
          <div className="grid gap-3 md:grid-cols-2">
            {menuItems.filter((m) => m.available).map((m) => (
              <div key={m.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl p-4">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                  <p className="mt-1 text-xs font-semibold">{currency(m.price)}</p>
                </div>
                <button onClick={() => add(m.id)} className="bg-gradient-brand size-8 shrink-0 rounded-lg font-bold text-primary-foreground">+</button>
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Your order">
            {placed ? (
              <p className="text-sm">Order placed! We'll let you know when it's ready.</p>
            ) : cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add items from the menu.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {cartItems.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span>{m.name}</span>
                      <span className="flex items-center gap-2">
                        <button onClick={() => remove(m.id)} className="glass-soft size-6 rounded">−</button>
                        {cart[m.id]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between font-semibold"><span>Total</span><span>{currency(total)}</span></div>
                <button onClick={() => { setCart({}); setPlaced(true); }} className="bg-gradient-brand mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground">Place order</button>
              </>
            )}
          </Panel>
          <Panel title="Order history">
            <div className="space-y-2">
              {mine.map((o) => (
                <div key={o.id} className="glass-soft flex items-center justify-between rounded-xl px-3 py-2 text-xs">
                  <span>{o.reference} · {currency(o.total)}</span><StatusPill status={o.status} />
                </div>
              ))}
              {mine.length === 0 && <p className="text-xs text-muted-foreground">No orders yet.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
