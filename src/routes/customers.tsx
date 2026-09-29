import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getCustomers, getOrderQueue, updateCustomerNote } from "@/lib/data";
import { currency, formatDate } from "@/lib/mock-data";
import type { Customer, Order } from "@/lib/types";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — StackedHub" },
      { name: "description", content: "Customer profiles, loyalty tiers, order history and notes in one CRM view." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customers, queue] = await Promise.all([getCustomers(), getOrderQueue()]);
      setList(customers);
      setOrders(queue);
      setSelectedId((id) => id ?? customers[0]?.id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = list.find((c) => c.id === selectedId);
  const q = query.toLowerCase();
  const shown = list.filter(
    (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q),
  );

  return (
    <AppShell title="Customers" subtitle="CRM" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <Panel title="Directory">
            <label className="sr-only" htmlFor="customer-search">
              Search customers
            </label>
            <input
              id="customer-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or phone…"
              className="glass-soft mb-4 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            />
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customers match that search.</p>
            ) : (
              <div className="space-y-2">
                {shown.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-2xl p-4 text-left transition-colors ${c.id === selectedId ? "bg-card/80 shadow-sm" : "glass-soft hover:bg-card/60"}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.email}</span>
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {c.tier}
                      <br />
                      {c.orders} orders · {currency(c.spend)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {selected && (
            <Panel title={selected.name}>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd>{selected.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Joined</dt>
                  <dd>{formatDate(selected.joinedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Loyalty points</dt>
                  <dd>{selected.loyaltyPoints}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Lifetime spend</dt>
                  <dd>{currency(selected.spend)}</dd>
                </div>
              </dl>
              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Notes
                <textarea
                  value={selected.note}
                  onChange={(e) => {
                    const note = e.target.value;
                    setList((p) => p.map((c) => (c.id === selected.id ? { ...c, note } : c)));
                    void updateCustomerNote(selected.id, note);
                  }}
                  className="glass-soft mt-1 w-full rounded-xl p-3 text-sm outline-none"
                  rows={3}
                />
              </label>
              <p className="mt-4 text-xs font-semibold text-muted-foreground">Recent orders</p>
              <ul className="mt-2 space-y-2">
                {orders
                  .filter((o) => o.customerId === selected.id)
                  .map((o) => (
                    <li key={o.id} className="glass-soft rounded-xl px-3 py-2 text-sm">
                      {o.reference} · {o.channel} {currency(o.total)} · {o.status}
                    </li>
                  ))}
              </ul>
              {orders.every((o) => o.customerId !== selected.id) && (
                <p className="mt-2 text-sm text-muted-foreground">No orders for this customer yet.</p>
              )}
            </Panel>
          )}
        </div>
      )}
    </AppShell>
  );
}
