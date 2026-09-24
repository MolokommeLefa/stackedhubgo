import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { currency, customers as seed, formatDate, orders } from "@/lib/mock-data";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — StackedHub" },
      { name: "description", content: "Customer profiles, loyalty tiers, order history and notes in one CRM view." },
      { property: "og:title", content: "Customers — StackedHub" },
      { property: "og:description", content: "Customer profiles, loyalty tiers and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [list, setList] = useState<Customer[]>(seed);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seed[0]?.id);
  const selected = list.find((c) => c.id === selectedId);
  const q = query.toLowerCase();
  const shown = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));

  return (
    <AppShell title="Customers" subtitle="Customer relationships" allow={["Admin", "Staff"]}>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title={`${shown.length} customers`}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" className="glass-soft mb-4 w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
          <div className="space-y-2">
            {shown.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center justify-between rounded-2xl p-4 text-left transition-colors ${c.id === selectedId ? "bg-card/80 shadow-sm" : "glass-soft hover:bg-card/60"}`}
              >
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{c.tier}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{c.orders} orders · {currency(c.spend)}</p>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {selected && (
          <Panel title={selected.name}>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{selected.phone}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Joined</dt><dd>{formatDate(selected.joinedAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Loyalty points</dt><dd className="font-semibold">{selected.loyaltyPoints}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Lifetime spend</dt><dd className="font-semibold">{currency(selected.spend)}</dd></div>
            </dl>
            <label className="mt-5 block text-xs text-muted-foreground">Notes</label>
            <textarea
              value={selected.note}
              onChange={(e) => setList((p) => p.map((c) => (c.id === selected.id ? { ...c, note: e.target.value } : c)))}
              className="glass-soft mt-1 w-full rounded-xl p-3 text-sm outline-none"
              rows={3}
            />
            <h3 className="mt-5 mb-2 text-sm font-semibold">Recent orders</h3>
            <div className="space-y-2">
              {orders.filter((o) => o.customerId === selected.id).map((o) => (
                <div key={o.id} className="glass-soft flex justify-between rounded-xl px-3 py-2 text-xs">
                  <span>{o.reference} · {o.channel}</span><span>{currency(o.total)} · {o.status}</span>
                </div>
              ))}
              {orders.every((o) => o.customerId !== selected.id) && <p className="text-xs text-muted-foreground">No orders today.</p>}
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
