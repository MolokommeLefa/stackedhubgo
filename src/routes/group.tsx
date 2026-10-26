import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel, StatusPill } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  addGroupItem,
  checkoutGroupBasket,
  createGroupBasket,
  getMenu,
  joinGroupBasket,
  listGroupBaskets,
  removeGroupItem,
} from "@/lib/data";
import { currency } from "@/lib/mock-data";
import type { GroupBasket, MenuItem } from "@/lib/types";

export const Route = createFileRoute("/group")({
  head: () => ({
    meta: [
      { title: "Group order — StackedHub" },
      { name: "description", content: "Share a basket with friends, customise items, and check out as one pickup order." },
    ],
  }),
  component: GroupOrderPage,
});

function GroupOrderPage() {
  const { user } = useAuth();
  const [baskets, setBaskets] = useState<GroupBasket[]>([]);
  const [active, setActive] = useState<GroupBasket | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState<"Cash" | "Card">("Cash");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextBaskets, nextMenu] = await Promise.all([listGroupBaskets(), getMenu()]);
      setBaskets(nextBaskets);
      setMenu(nextMenu.filter((item) => item.available));
      setActive((current) => nextBaskets.find((basket) => basket.id === current?.id) ?? nextBaskets[0] ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const create = () => {
    if (!user) return;
    void run(async () => {
      const basket = await createGroupBasket(user);
      setBaskets((prev) => [basket, ...prev.filter((item) => item.id !== basket.id)]);
      setActive(basket);
      setNote(`Share code ${basket.joinCode} with your friends.`);
    });
  };

  const join = () => {
    if (!user || !joinCode.trim()) return;
    void run(async () => {
      const basket = await joinGroupBasket(joinCode, user);
      setBaskets((prev) => [basket, ...prev.filter((item) => item.id !== basket.id)]);
      setActive(basket);
      setJoinCode("");
      setNote(`You joined ${basket.hostName}'s order.`);
    });
  };

  const add = (item: MenuItem) => {
    if (!user || !active) return;
    void run(async () => {
      const basket = await addGroupItem(active.id, user, item, 1);
      setActive(basket);
      setBaskets((prev) => prev.map((entry) => (entry.id === basket.id ? basket : entry)));
    });
  };

  const remove = (itemId: string) => {
    if (!active) return;
    void run(async () => {
      const basket = await removeGroupItem(active.id, itemId);
      setActive(basket);
      setBaskets((prev) => prev.map((entry) => (entry.id === basket.id ? basket : entry)));
    });
  };

  const checkout = () => {
    if (!user || !active) return;
    void run(async () => {
      const order = await checkoutGroupBasket(active.id, payment, user);
      setNote(`Group order ${order.reference} is in. Track it from the customer portal.`);
      setActive({ ...active, status: "Converted", orderId: order.id });
      setBaskets((prev) => prev.filter((entry) => entry.id !== active.id));
    });
  };

  const isHost = Boolean(user && active && active.hostCustomerId === user.id);
  const canEdit = active?.status === "Open";

  return (
    <AppShell title="Group order" subtitle="Order with friends" allow={["Admin", "Customer"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Panel title="Start or join">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={create}
                  className="bg-gradient-brand min-h-11 rounded-xl px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Create group order
                </button>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Join code"
                  className="glass-soft min-h-11 min-w-36 flex-1 rounded-xl px-4 text-sm outline-none"
                />
                <button
                  type="button"
                  disabled={busy || !joinCode.trim()}
                  onClick={join}
                  className="min-h-11 rounded-xl bg-secondary px-4 text-sm font-semibold disabled:opacity-60"
                >
                  Join
                </button>
              </div>
              {note && (
                <p className="mt-3 text-sm" role="status">
                  {note}{" "}
                  {note.includes("portal") && (
                    <Link to="/portal" className="font-semibold text-primary">
                      Open portal
                    </Link>
                  )}
                </p>
              )}
            </Panel>

            {active && (
              <Panel
                title={`${active.hostName}'s basket`}
                action={<StatusPill status={active.status} />}
              >
                <p className="text-sm text-muted-foreground">
                  Code <span className="font-semibold text-foreground">{active.joinCode}</span>
                  {isHost ? " — share this so friends can add their items." : ` — hosted by ${active.hostName}.`}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {active.participants.map((person) => person.name).join(" · ")}
                </p>
                {active.items.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No items yet. Add from the menu.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {active.items.map((item) => (
                      <li key={item.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl p-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.customerName}
                            {item.specialInstructions ? ` · ${item.specialInstructions}` : ""}
                          </p>
                        </div>
                        {canEdit && user?.id === item.customerId && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => remove(item.id)}
                            className="min-h-11 text-xs font-semibold text-destructive"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-sm font-semibold">Combined total {currency(active.total)}</p>
                {isHost && active.status !== "Converted" && (
                  <div className="mt-4 space-y-3">
                    <fieldset className="space-y-2">
                      <legend className="text-xs font-semibold text-muted-foreground">Pay at collection</legend>
                      {(["Cash", "Card"] as const).map((method) => (
                        <label key={method} className="flex min-h-11 items-center gap-2 text-sm">
                          <input type="radio" name="group-pay" checked={payment === method} onChange={() => setPayment(method)} />
                          {method}
                        </label>
                      ))}
                    </fieldset>
                    <button
                      type="button"
                      disabled={busy || active.items.length === 0}
                      onClick={checkout}
                      className="bg-gradient-brand min-h-11 w-full rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {busy ? "Checking out…" : "Checkout group order"}
                    </button>
                  </div>
                )}
              </Panel>
            )}
          </div>

          <div className="space-y-6">
            <Panel title="Your groups">
              {baskets.length === 0 ? (
                <p className="text-sm text-muted-foreground">You are not in an open group order yet.</p>
              ) : (
                <ul className="space-y-2">
                  {baskets.map((basket) => (
                    <li key={basket.id}>
                      <button
                        type="button"
                        onClick={() => setActive(basket)}
                        className={`min-h-11 w-full rounded-2xl px-4 py-3 text-left text-sm ${active?.id === basket.id ? "bg-primary/10 font-semibold" : "glass-soft"}`}
                      >
                        {basket.joinCode} · {basket.hostName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Add from menu">
              {!canEdit ? (
                <p className="text-sm text-muted-foreground">Join or create a group to add items.</p>
              ) : (
                <ul className="space-y-2">
                  {menu.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {item.name}
                        <span className="block text-xs text-muted-foreground">{currency(item.price)}</span>
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => add(item)}
                        className="bg-gradient-brand size-11 rounded-lg font-bold text-primary-foreground disabled:opacity-60"
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
