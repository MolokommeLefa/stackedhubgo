import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { placeOrder } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { cartTotals } from "@/lib/order-rules";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Stacked Foods" },
      { name: "description", content: "Review your Stacked Foods order and place it for collection or delivery." },
      { property: "og:title", content: "Checkout — Stacked Foods" },
      { property: "og:description", content: "Review your order and place it in one step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { lines, setQuantity, clear } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfilment, setFulfilment] = useState<"Collection" | "Delivery">("Collection");
  const [payment, setPayment] = useState<"Cash" | "Card">("Cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const totals = cartTotals(lines, fulfilment);

  if (placed) {
    return (
      <CustomerShell hideCart>
        <div className="mx-auto max-w-lg px-4 pt-12 text-center">
          <div className="rounded-3xl bg-card p-8">
            <p className="text-sm font-semibold text-success">Order placed</p>
            <h1 className="mt-2 text-3xl font-bold">{placed.reference}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The kitchen has your order. Keep this reference — staff will call it out when it's ready for {fulfilment.toLowerCase()}.
            </p>
            <p className="mt-4 font-semibold">Total {currency(placed.total)} · Pay by {payment.toLowerCase()}</p>
            <Link to="/order" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Order something else</Link>
          </div>
        </div>
      </CustomerShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!lines.length) return setError("Your cart is empty.");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (!/^0\d{9}$/.test(phone.replace(/\s/g, ""))) return setError("Enter a 10-digit phone number, e.g. 082 123 4567.");
    setError("");
    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerId: user?.id ?? "guest",
        customerName: name.trim(),
        items: lines.map((l) => ({ menuItemId: l.menuItemId, name: l.name, quantity: l.quantity, unitPrice: l.unitPrice })),
        paymentMethod: payment,
        fulfilment,
        specialInstructions: [notes.trim(), ...lines.filter((l) => l.note || l.options.length).map((l) => `${l.name}: ${[...l.options, l.note].filter(Boolean).join(", ")}`)].filter(Boolean).join("; "),
        fees: totals.fee,
      });
      clear();
      setPlaced(order);
      toast.success(`Order ${order.reference} placed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place your order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "mt-1 min-h-11 w-full rounded-xl bg-secondary px-3 text-sm outline-none";
  return (
    <CustomerShell hideCart>
      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 px-4 pt-8 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-3xl bg-card p-6">
          <h1 className="text-2xl font-bold">Review your order</h1>
          {!lines.length && (
            <p className="mt-4 text-sm text-muted-foreground">Your cart is empty. <Link to="/order" className="font-semibold text-primary">Browse the menu</Link></p>
          )}
          <ul className="mt-4 divide-y divide-border">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  {(l.options.length > 0 || l.note) && <p className="text-xs text-muted-foreground">{[...l.options, l.note].filter(Boolean).join(" · ")}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={`Remove one ${l.name}`} onClick={() => setQuantity(l.key, l.quantity - 1)} className="size-9 rounded-lg bg-secondary">−</button>
                  <span className="w-5 text-center">{l.quantity}</span>
                  <button type="button" aria-label={`Add one ${l.name}`} onClick={() => setQuantity(l.key, Math.min(20, l.quantity + 1))} className="size-9 rounded-lg bg-secondary">+</button>
                  <span className="w-20 text-right font-semibold">{currency(l.unitPrice * l.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Name<input value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" /></label>
            <label className="text-sm font-semibold">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} inputMode="tel" autoComplete="tel" /></label>
            <label className="text-sm font-semibold">Collection or delivery
              <select value={fulfilment} onChange={(e) => setFulfilment(e.target.value as "Collection" | "Delivery")} className={field}><option>Collection</option><option>Delivery</option></select>
            </label>
            <label className="text-sm font-semibold">Payment
              <select value={payment} onChange={(e) => setPayment(e.target.value as "Cash" | "Card")} className={field}><option>Cash</option><option>Card</option></select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Special instructions<input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className={field} /></label>
          </div>
        </section>
        <aside className="h-fit rounded-3xl bg-card p-6 lg:sticky lg:top-20">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{currency(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{currency(totals.fee)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd>{currency(totals.total)}</dd></div>
          </dl>
          {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={submitting || !lines.length} className="mt-5 min-h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {submitting ? "Placing order…" : `Place order · ${currency(totals.total)}`}
          </button>
        </aside>
      </form>
    </CustomerShell>
  );
}
