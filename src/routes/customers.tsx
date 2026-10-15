import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { Initials, SearchField } from "@/components/workspace";
import { getCustomers, getOrderQueue, updateCustomerNote } from "@/lib/data";
import { currency, formatDate } from "@/lib/mock-data";
import type { Customer, Order } from "@/lib/types";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — StackedHub" },
      {
        name: "description",
        content: "Customer profiles, loyalty tiers, order history and notes in one CRM view.",
      },
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
    (c) =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q),
  );

  return (
    <AppShell title="Customers" subtitle="Customer relationships" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Panel title="Directory">
            <SearchField
              id="customer-search"
              value={query}
              onChange={setQuery}
              placeholder="Name, email or phone"
              label="Search customers"
            />
            {shown.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No customers match that search.</p>
            ) : (
              <ul className="mt-4 space-y-1">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left ${
                        c.id === selectedId ? "bg-secondary" : "hover:bg-secondary/60"
                      }`}
                    >
                      <Initials name={c.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.tier} · {c.orders} orders
                        </span>
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {selected && (
            <section className="surface-card rounded-3xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Initials name={selected.name} />
                  <div>
                    <h2 className="font-display text-3xl font-semibold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground">{selected.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden />
                  {selected.tier}
                </span>
              </div>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{selected.phone}</dd>
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Joined
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{formatDate(selected.joinedAt)}</dd>
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Loyalty points
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{selected.loyaltyPoints}</dd>
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Lifetime spend
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{currency(selected.spend)}</dd>
                </div>
              </dl>
              <label className="mt-6 block text-xs font-semibold text-muted-foreground">
                Customer note
                <textarea
                  value={selected.note}
                  onChange={(e) => {
                    const note = e.target.value;
                    setList((p) => p.map((c) => (c.id === selected.id ? { ...c, note } : c)));
                    void updateCustomerNote(selected.id, note);
                  }}
                  className="mt-2 w-full rounded-2xl bg-secondary p-3 text-sm outline-none"
                  rows={3}
                />
              </label>
              <h3 className="mt-8 font-display text-2xl font-semibold">Recent orders</h3>
              <ul className="mt-3 divide-y divide-border">
                {orders
                  .filter((o) => o.customerId === selected.id)
                  .map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <span className="text-sm">
                        {o.reference} · {o.channel}
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusPill status={o.status} />
                        <span className="text-sm font-semibold">{currency(o.total)}</span>
                      </span>
                    </li>
                  ))}
              </ul>
              {orders.every((o) => o.customerId !== selected.id) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No orders for this customer yet.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
