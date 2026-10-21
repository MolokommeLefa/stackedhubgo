import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { CustomerShell } from "@/components/CustomerShell";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { getMenu, getOrder } from "@/lib/data";
import {
  recordStatus,
  reportIssue,
  saveFeedback,
  useEngagement,
  type IssueKind,
} from "@/lib/engagement";
import { currency } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/track/$reference")({
  head: () => ({
    meta: [
      { title: "Order status — Stacked Foods" },
      { name: "description", content: "Follow your Stacked Foods order from the kitchen to collection." },
      { property: "og:title", content: "Order status — Stacked Foods" },
      { property: "og:description", content: "Live, step-by-step order status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "Placed", label: "Order received" },
  { status: "In kitchen", label: "Preparing your order" },
  { status: "Ready", label: "Ready for handoff" },
  { status: "Completed", label: "Order completed" },
];

function TrackPage() {
  const { reference } = Route.useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const history = useEngagement((s) => s.history[reference] ?? []) ?? [];
  const feedback = useEngagement((s) => s.feedback.find((f) => f.orderId === reference)) ?? null;

  const load = useCallback(async () => {
    try {
      const o = await getOrder(reference);
      setOrder(o);
      setError("");
      if (recordStatus(o)) toast.success(`${o.reference} is now ${o.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load this order.");
    }
  }, [reference]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !order)
    return (
      <CustomerShell>
        <div className="mx-auto max-w-lg px-4 pt-12">
          <div className="surface-card rounded-[1.5rem] p-6">
            <p className="font-semibold">{error}</p>
            <button onClick={load} className="mt-3 text-sm font-semibold text-primary">
              Try again
            </button>
          </div>
        </div>
      </CustomerShell>
    );
  if (!order)
    return (
      <CustomerShell>
        <div className="mx-auto mt-12 h-96 max-w-lg animate-pulse rounded-[1.5rem] bg-card" />
      </CustomerShell>
    );

  // The current API stores fulfilment in the existing order notes; prefer a structured field if one is returned.
  const isDelivery =
    order.fulfilment === "Delivery" ||
    (order.fulfilment == null && /^Delivery(?:\s|—|-|$)/i.test(order.specialInstructions ?? ""));
  const steps = STEPS.map((s) =>
    s.status === "Ready" && isDelivery
      ? { ...s, label: order.deliveryStatus === "Out for delivery" ? "Out for delivery" : "Ready for dispatch" }
      : s,
  );
  const idx = steps.findIndex((s) => s.status === order.status);
  const historyForOrder = order.statusHistory?.length ? order.statusHistory : history;
  const timeFor = (st: OrderStatus) =>
    historyForOrder.find((h) => h.status === st)?.at ??
    (st === "Placed" ? order.placedAt : undefined) ??
    (st === "Ready" ? order.readyAt : undefined) ??
    (st === "Completed" ? order.completedAt : undefined);
  const active = order.status === "Placed" || order.status === "In kitchen";
  const eta = order.estimatedReadyAt
    ? new Date(order.estimatedReadyAt)
    : new Date(new Date(order.placedAt).getTime() + 25 * 60_000);
  const paymentLabel = order.paymentStatus
    ? order.paymentStatus
    : order.paymentMethod === "Cash"
      ? "Cash on collection/delivery"
      : "Pay by card in person";
  const fulfilmentLabel = (() => {
    if (order.deliveryStatus) return order.deliveryStatus;
    if (order.status === "Cancelled") return "Cancelled";
    if (order.status === "Completed") return isDelivery ? "Delivered" : "Collected";
    if (order.status === "Ready") return isDelivery ? "Ready for dispatch" : "Ready for collection";
    return isDelivery ? "Delivery pending" : "Collection pending";
  })();
  const etaLabel = order.estimatedReadyAt ? "Estimated ready time" : "Estimated ready time (initial estimate)";

  const orderAgain = async () => {
    const menu = await getMenu();
    let skipped = 0;
    for (const it of order.items) {
      const m = menu.find((x) => x.id === it.menuItemId || x.name === it.name);
      if (!m || !m.available) {
        skipped++;
        continue;
      }
      add({ menuItemId: m.id, name: m.name, unitPrice: m.price, quantity: it.quantity, options: [], note: "" });
    }
    toast.success(skipped ? `Added to cart · ${skipped} item(s) sold out` : "Added to cart at today's prices");
    void navigate({ to: "/checkout" });
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-lg space-y-6 px-4 pt-10">
        <div className="surface-card rounded-[2rem] p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Order {order.reference}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {order.status === "Cancelled"
              ? "Order cancelled"
              : order.status === "Ready"
                ? (isDelivery ? "Ready for dispatch" : "Ready for collection")
                : order.status === "Completed"
                  ? (isDelivery ? "Delivered" : "Collected / completed")
                  : steps[Math.max(idx, 0)]?.label}
          </h1>
          {active && (
            <div className="mt-3 rounded-2xl bg-secondary p-4">
              <p className="text-xs font-medium text-muted-foreground">{etaLabel}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {eta.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This is an estimate and may change as the kitchen updates your order.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Order status refreshes every 10 seconds while this page is open.</p>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-border p-4">
            <h2 className="font-semibold">Order lifecycle</h2>
            <ol className="mt-4 space-y-4" aria-label="Order progress">
              {steps.map((s, i) => {
                const done = i <= idx && order.status !== "Cancelled";
                const at = timeFor(s.status);
                const label =
                  s.status === "Ready"
                    ? isDelivery
                      ? (order.deliveryStatus === "Out for delivery" ? "Out for delivery" : "Ready for dispatch")
                      : "Ready for collection"
                    : s.status === "Completed"
                      ? (isDelivery ? "Delivered" : "Collected / completed")
                      : s.label;
                return (
                  <li key={s.status} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 text-sm font-semibold">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs transition-colors ${
                          done ? "bg-success text-white" : "bg-secondary text-muted-foreground"
                        } ${i === idx && active ? "ring-4 ring-success/25" : ""}`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className={done ? "" : "text-muted-foreground"}>{label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {at ? new Date(at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </li>
                );
              })}
              {order.status === "Cancelled" && (
                <li className="text-sm font-semibold text-destructive">Order cancelled</li>
              )}
            </ol>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="mt-1 font-semibold">{paymentLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.paymentMethod === "Card"
                  ? "Card payment is only marked paid when the payment provider or API confirms it."
                  : "Payment is handled according to the selected cash-payment arrangement."}
              </p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">{isDelivery ? "Delivery status" : "Collection status"}</p>
              <p className="mt-1 font-semibold">{fulfilmentLabel}</p>
              {order.readyAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ready at {new Date(order.readyAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {order.completedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Completed at {new Date(order.completedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
          {isDelivery && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-border" aria-label="Driver tracking map">
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Delivery map</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">
                    {order.deliveryStatus === "Out for delivery" ? "Your driver is on the way" : order.status === "Completed" ? "Delivery completed" : "Your delivery route"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.deliveryStatus === "Out for delivery" ? "Driver location is a demo marker until live GPS is connected." : "Route preview · live driver location will appear when dispatch starts."}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {order.deliveryStatus === "Out for delivery" ? "On the way" : fulfilmentLabel}
                </span>
              </div>
              <div className="relative h-64 overflow-hidden bg-[#e8eee6]">
                <svg viewBox="0 0 640 360" role="img" aria-label="Illustrative delivery map with a route from restaurant to customer" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
                  <rect width="640" height="360" fill="#e8eee6" />
                  <path d="M-20 65 L660 300 M-30 270 L660 75 M110 -20 L280 390 M450 -20 L350 390 M-20 175 L660 175" stroke="#ffffff" strokeWidth="28" fill="none" />
                  <path d="M-20 65 L660 300 M-30 270 L660 75 M110 -20 L280 390 M450 -20 L350 390 M-20 175 L660 175" stroke="#d3dbd0" strokeWidth="2" fill="none" />
                  <path d="M95 275 C160 260 180 205 250 210 S360 130 410 150 S490 110 545 70" stroke="#f9faf7" strokeWidth="12" fill="none" strokeLinecap="round" />
                  <path d="M95 275 C160 260 180 205 250 210 S360 130 410 150 S490 110 545 70" stroke="#267a61" strokeWidth="5" fill="none" strokeDasharray="8 7" strokeLinecap="round" />
                  <g transform="translate(95 275)">
                    <circle r="18" fill="#267a61" opacity=".15" /><circle r="9" fill="#267a61" stroke="#fff" strokeWidth="3" />
                  </g>
                  <g transform="translate(545 70)">
                    <circle r="21" fill="#e6a23c" opacity=".2" /><circle r="11" fill="#e6a23c" stroke="#fff" strokeWidth="3" />
                    <path d="M-5 -1 h10 M0 -6 v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </g>
                  <g fontFamily="Arial, sans-serif" fontSize="14" fontWeight="600" fill="#26342d">
                    <rect x="35" y="300" width="145" height="28" rx="14" fill="#fff" /><text x="48" y="319">StackedHub kitchen</text>
                    <rect x="450" y="27" width="145" height="28" rx="14" fill="#fff" /><text x="463" y="46">Delivery address</text>
                  </g>
                </svg>
                <div className="absolute bottom-3 left-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-[#26342d] shadow-sm">
                  <span className="mr-2 inline-block size-2 rounded-full bg-[#267a61]" />Restaurant
                  <span className="ml-4 mr-2 inline-block size-2 rounded-full bg-[#e6a23c]" />Destination
                </div>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Driver status</p>
                  <p className="mt-1 text-sm font-semibold">{order.deliveryStatus ?? (order.status === "Completed" ? "Delivered" : order.status === "Ready" ? "Ready for dispatch" : "Waiting for kitchen")}</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Estimated arrival</p>
                  <p className="mt-1 text-sm font-semibold">{order.status === "Completed" ? "Arrived" : order.deliveryStatus === "Out for delivery" ? "About 10–20 min" : "Shown after dispatch"}</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Location updates</p>
                  <p className="mt-1 text-sm font-semibold">Demo preview</p>
                </div>
              </div>
            </section>
          )}
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-secondary px-4 text-sm">
            {order.items.map((it) => (
              <li key={it.menuItemId + it.name} className="flex justify-between py-2">
                <span>
                  {it.quantity}× {it.name}
                </span>
                <span>{currency(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2 font-semibold">
              <span>Total</span>
              <span>{currency(order.total)}</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-3">
            <button
              onClick={orderAgain}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              Order again
            </button>
            <Link
              to="/order"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-secondary text-sm font-semibold"
            >
              Menu
            </Link>
          </div>
        </div>

        {order.status === "Completed" && <FeedbackCard orderId={order.id} existing={feedback?.rating} />}
        <IssueCard order={order} customerName={user?.name ?? order.customerName} />
      </div>
    </CustomerShell>
  );
}

function FeedbackCard({ orderId, existing }: { orderId: string; existing?: number | undefined }) {
  const [rating, setRating] = useState(existing ?? 0);
  const [comment, setComment] = useState("");
  if (existing)
    return (
      <div className="surface-card rounded-[1.5rem] p-5 text-sm">
        Thanks — you rated this order {existing}/5.
      </div>
    );
  return (
    <form
      className="surface-card rounded-[1.5rem] p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) { toast.error("Choose a star rating first."); return; }
        saveFeedback({ orderId, rating, comment: comment.trim() });
        toast.success("Thanks for your feedback");
      }}
    >
      <h2 className="font-semibold">How was your order?</h2>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="p-1"
          >
            <Star className={`size-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Anything we should know? (optional)"
        className="mt-3 w-full rounded-2xl bg-secondary p-3 text-sm outline-none"
      />
      <button className="mt-3 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        Send feedback
      </button>
    </form>
  );
}

function IssueCard({ order, customerName }: { order: Order; customerName: string }) {
  const issues = useEngagement((s) => s.issues.filter((i) => i.orderId === order.id)) ?? [];
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<IssueKind>("Missing item");
  const [details, setDetails] = useState("");
  return (
    <div className="surface-card rounded-[1.5rem] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Something wrong?</h2>
        {!open && (
          <button onClick={() => setOpen(true)} className="text-sm font-semibold text-primary">
            Report a problem
          </button>
        )}
      </div>
      {issues.map((i) => (
        <p key={i.id} className="mt-2 rounded-xl bg-secondary px-3 py-2 text-sm">
          {i.kind}: <strong>{i.status}</strong>
          {i.staffNote && <span className="block text-xs text-muted-foreground">Staff: {i.staffNote}</span>}
        </p>
      ))}
      {open && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (details.trim().length < 5) { toast.error("Tell us a bit more (5+ characters)."); return; }
            reportIssue({ orderId: order.id, reference: order.reference, customerName, kind, details: details.trim() });
            setOpen(false);
            setDetails("");
            toast.success("Reported — staff will follow up");
          }}
        >
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as IssueKind)}
            className="min-h-11 w-full rounded-2xl bg-secondary px-3 text-sm"
            aria-label="Problem type"
          >
            {(["Missing item", "Wrong order", "Delay", "Other"] as const).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            placeholder="What happened?"
            className="w-full rounded-2xl bg-secondary p-3 text-sm outline-none"
          />
          <button className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Send report
          </button>
        </form>
      )}
    </div>
  );
}
