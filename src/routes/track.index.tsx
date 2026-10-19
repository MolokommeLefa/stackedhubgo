import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/CustomerShell";
import { useEngagement } from "@/lib/engagement";
import { currency } from "@/lib/mock-data";

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
  const recent = useEngagement((s) => s.recent) ?? [];
  return (
    <CustomerShell>
      <div className="mx-auto max-w-lg px-4 pt-10">
        <h1 className="font-display text-4xl font-semibold">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your last 5 orders on this device.</p>
        {recent.length === 0 ? (
          <div className="surface-card mt-6 rounded-[1.5rem] p-6 text-sm">
            <p>No recent orders yet.</p>
            <Link to="/order" className="mt-3 inline-flex font-semibold text-primary">
              Browse the menu →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  to="/track/$reference"
                  params={{ reference: r.id }}
                  className="surface-card flex items-center justify-between rounded-[1.5rem] p-4 hover:shadow-md"
                >
                  <span>
                    <span className="block font-semibold">{r.reference}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{currency(r.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CustomerShell>
  );
}
