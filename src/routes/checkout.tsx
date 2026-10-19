import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { MenuPhoto } from "@/components/MenuPhoto";
import { ADDRESS_LINES } from "@/components/site-info";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { getLoyaltyWallet, placeOrder, type LoyaltyWallet } from "@/lib/data";
import { currency } from "@/lib/mock-data";
import { cartTotals, validateDeliveryAddress } from "@/lib/order-rules";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Stacked Foods" },
      {
        name: "description",
        content: "Review your Stacked Foods order and place it for collection or delivery.",
      },
      { property: "og:title", content: "Checkout — Stacked Foods" },
      { property: "og:description", content: "Review your order and place it in one step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

function statusDone(current: OrderStatus, step: OrderStatus) {
  const order: OrderStatus[] = ["Placed", "In kitchen", "Ready", "Completed"];
  return order.indexOf(current) >= order.indexOf(step);
}

function CheckoutPage() {
  const { lines, setQuantity, clear } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [fulfilment, setFulfilment] = useState<"Collection" | "Delivery">("Collection");
  const [payment, setPayment] = useState<"Cash" | "Card">("Cash");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [wallet, setWallet] = useState<LoyaltyWallet | null>(null);
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [redemptionId, setRedemptionId] = useState<string | null>(null);
  const totals = cartTotals(lines, fulfilment);
  const selectedReward = useMemo(
    () => wallet?.availableRewards.find((reward) => reward.id === rewardId) ?? null,
    [wallet, rewardId],
  );
  const canApplyReward = Boolean(
    selectedReward && wallet && wallet.points >= selectedReward.points,
  );
  const discount = canApplyReward && selectedReward ? selectedReward.value : 0;
  const finalTotal = Math.max(0, totals.total - discount);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    void getLoyaltyWallet(user.id).then((next) => {
      if (mounted) setWallet(next);
    });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (placed) {
    const steps = [
      { label: "Accepted", status: "Placed" as const, hint: "Just now" },
      { label: "Preparing", status: "In kitchen" as const, hint: "Up next" },
      { label: "Ready", status: "Ready" as const, hint: "20–25 min" },
    ];
    return (
      <CustomerShell hideCart requireAuth>
        <div className="mx-auto max-w-lg px-4 pt-12">
          <div className="surface-card rounded-[2rem] p-8">
            <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
            <p className="mt-4 text-center text-xs font-semibold tracking-[0.18em] text-success uppercase">
              Order {placed.reference}
            </p>
            <h1 className="mt-2 text-center font-display text-4xl font-semibold">
              The grill is on.
            </h1>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              The kitchen has your order. Keep this reference — staff will call it out when it's
              ready for {fulfilment.toLowerCase()}.
            </p>
            <ol className="mt-8 space-y-4">
              {steps.map((step) => {
                const done = statusDone(placed.status, step.status);
                return (
                  <li key={step.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 text-sm font-semibold">
                      <span
                        className={
                          done
                            ? "grid size-6 place-items-center rounded-full bg-success text-[10px] text-white"
                            : "grid size-6 place-items-center rounded-full bg-secondary text-[10px]"
                        }
                      >
                        {done ? "✓" : ""}
                      </span>
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.hint}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm">
              {fulfilment === "Delivery" && address.trim()
                ? `Delivery to ${address.trim()}`
                : `${fulfilment} from ${ADDRESS_LINES[0]}, ${ADDRESS_LINES[1]}`}
            </p>
            <p className="mt-4 text-center font-semibold">
              Total {currency(placed.total)} · Pay by {payment.toLowerCase()}
            </p>
            <Link
              to="/order"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              Done
            </Link>
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
    if (!/^0\d{9}$/.test(phone.replace(/\s/g, "")))
      return setError("Enter a 10-digit phone number, e.g. 082 123 4567.");
    const addressError = validateDeliveryAddress(fulfilment, address);
    if (addressError) return setError(addressError);
    if (selectedReward && !canApplyReward) {
      return setError("You don't have enough points for this reward.");
    }
    setError("");
    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerId: user?.id ?? "guest",
        customerName: name.trim(),
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        paymentMethod: payment,
        fulfilment,
        deliveryAddress: fulfilment === "Delivery" ? address.trim() : undefined,
        specialInstructions: [
          notes.trim(),
          ...lines
            .filter((l) => l.note || l.options.length)
            .map((l) => `${l.name}: ${[...l.options, l.note].filter(Boolean).join(", ")}`),
        ]
          .filter(Boolean)
          .join("; "),
        fees: totals.fee,
        redemption:
          selectedReward && redemptionId
            ? { rewardId: selectedReward.id, redemptionId }
            : undefined,
      });
      clear();
      setRewardId(null);
      setRedemptionId(null);
      setPlaced(order);
      toast.success("Order placed", {
        description: `${order.reference} · ${fulfilment} · ${currency(order.total)} · ready in 20–25 min`,
        duration: 7000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place your order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "mt-1 min-h-11 w-full rounded-2xl bg-secondary px-3 text-sm outline-none";
  return (
    <CustomerShell hideCart requireAuth>
      <form
        onSubmit={submit}
        className="mx-auto grid max-w-5xl gap-6 px-4 pt-8 lg:grid-cols-[1fr_22rem]"
      >
        <section className="surface-card rounded-[2rem] p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Your order
          </p>
          <h1 className="font-display text-3xl font-semibold">Checkout</h1>
          {!lines.length && (
            <p className="mt-4 text-sm text-muted-foreground">
              Your cart is empty.{" "}
              <Link to="/order" className="font-semibold text-primary">
                Browse the menu
              </Link>
            </p>
          )}
          <ul className="mt-5 space-y-4">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3">
                <MenuPhoto
                  item={{ id: l.menuItemId, category: "Mains" }}
                  className="size-16 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{l.name}</p>
                  {(l.options.length > 0 || l.note) && (
                    <p className="text-xs text-muted-foreground">
                      {[...l.options, l.note].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Remove one ${l.name}`}
                      onClick={() => setQuantity(l.key, l.quantity - 1)}
                      className="size-9 rounded-full bg-secondary"
                    >
                      −
                    </button>
                    <span className="w-5 text-center">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Add one ${l.name}`}
                      onClick={() => setQuantity(l.key, Math.min(20, l.quantity + 1))}
                      className="size-9 rounded-full bg-secondary"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="font-semibold">{currency(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold">Collection details</legend>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
                {(["Collection", "Delivery"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={fulfilment === option}
                    onClick={() => setFulfilment(option)}
                    className={
                      fulfilment === option
                        ? "min-h-11 rounded-full bg-card text-sm font-semibold shadow-sm"
                        : "min-h-11 rounded-full text-sm font-medium text-muted-foreground"
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="text-sm font-semibold">
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
                autoComplete="name"
              />
            </label>
            <label className="text-sm font-semibold">
              Mobile number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            {fulfilment === "Delivery" && (
              <label className="text-sm font-semibold sm:col-span-2">
                Delivery address
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={field}
                  autoComplete="street-address"
                  placeholder="Street, suburb, city"
                  required
                />
              </label>
            )}
            <label className="text-sm font-semibold sm:col-span-2">
              Payment
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as "Cash" | "Card")}
                className={field}
              >
                <option>Cash</option>
                <option>Card</option>
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Reward redemption
              <div className="mt-2 grid gap-2">
                {wallet?.availableRewards.map((reward) => {
                  const enabled = (wallet.points ?? 0) >= reward.points;
                  const active = rewardId === reward.id;
                  return (
                    <button
                      key={reward.id}
                      type="button"
                      disabled={!enabled}
                      onClick={() => {
                        if (active) {
                          setRewardId(null);
                          setRedemptionId(null);
                          return;
                        }
                        const nextId =
                          typeof crypto !== "undefined" && "randomUUID" in crypto
                            ? crypto.randomUUID()
                            : `redeem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        setRewardId(reward.id);
                        setRedemptionId(nextId);
                      }}
                      className={`flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm ${
                        active ? "bg-primary text-primary-foreground" : "bg-secondary"
                      } disabled:opacity-50`}
                    >
                      <span>{reward.title}</span>
                      <span>{reward.points} pts</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Balance: {wallet?.points ?? 0} points. Rewards are disabled if your balance is too
                low.
              </p>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Special instructions
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className={field}
              />
            </label>
          </div>
        </section>
        <aside className="surface-card h-fit rounded-[2rem] p-6 lg:sticky lg:top-20">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Total
          </p>
          <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm">
            Ready in 20–25 minutes
            <span className="mt-1 block text-xs text-muted-foreground">
              {fulfilment === "Delivery"
                ? address.trim()
                  ? `Delivery to ${address.trim()}`
                  : "Enter a delivery address"
                : `${fulfilment} from ${ADDRESS_LINES[0]}, ${ADDRESS_LINES[1]}`}
            </span>
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{currency(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{currency(totals.fee)}</dd>
            </div>
            {selectedReward && (
              <div className="flex justify-between">
                <dt>Reward discount</dt>
                <dd>-{currency(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 font-display text-xl font-semibold">
              <dt>Total</dt>
              <dd>{currency(finalTotal)}</dd>
            </div>
          </dl>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !lines.length}
            className="mt-5 min-h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place order · ${currency(finalTotal)}`}
          </button>
          <Link
            to="/order"
            className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-muted-foreground"
          >
            Back to menu
          </Link>
        </aside>
      </form>
    </CustomerShell>
  );
}
