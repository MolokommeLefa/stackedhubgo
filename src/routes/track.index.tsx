import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, PackageCheck } from "lucide-react";
import { CustomerShell } from "@/components/CustomerShell";
import { useAuth } from "@/lib/auth";
import { getOrderQueue } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track your order — Stacked Foods" },
      { name: "description", content: "See the live status of your recent Stacked Foods orders." },
      { property: "og:title", content: "Track your order — Stacked Foods" },
      { property: "og:description", content: "Live order status for your recent orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackList,
});

function TrackList() {
  const { user } = useAuth();
  const orders = useLoad(getOrderQueue, []);
  const recent = orders.data
    .filter((order) => !user?.id || order.customerId === user.id)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 10);

  return (
    <CustomerShell requireAuth>
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">Your orders</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow preparation and collection progress from your order details.
        </p>

        {orders.error && (
          <div className="surface-card mt-6 rounded-2xl p-4" role="alert">
            <p className="font-semibold">We couldn't load your orders.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <button type="button" onClick={() => void orders.reload()} className="mt-3 text-sm font-semibold text-primary">
              Try again
            </button>
          </div>
        )}

        {orders.loading ? (
          <div className="mt-6 space-y-3" aria-label="Loading orders">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="surface-card mt-6 rounded-[1.5rem] p-6">
            <PackageCheck className="size-8 text-primary" aria-hidden />
            <p className="mt-3 font-semibold">No orders to track yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Once you place an order, its progress will appear here.</p>
            <Link to="/order" className="mt-4 inline-flex font-semibold text-primary">
              Browse the menu →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  to="/track/$reference"
                  params={{ reference: order.id }}
                  className="surface-card flex flex-col gap-3 rounded-[1.5rem] p-4 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{order.reference}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {new Date(order.placedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{order.status}</span>
                    <span className="font-display text-lg font-semibold">{currency(order.total)}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Clock className="size-3.5" aria-hidden /> View progress
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CustomerShell>
  );
}
