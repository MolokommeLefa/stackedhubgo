import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/CustomerShell";
import { LoadState } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getLoyaltyWallet } from "@/lib/data";
import { currency, formatDate } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Stacked Foods" },
      {
        name: "description",
        content: "View your loyalty points balance, reward progress and redemption history.",
      },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { user } = useAuth();
  const wallet = useLoad(async () => getLoyaltyWallet(user?.id ?? ""), {
    points: 0,
    next: { reward: null, progress: 0, needed: 0 },
    availableRewards: [],
    history: [],
    rules: [],
  });

  return (
    <CustomerShell requireAuth>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-8 lg:grid-cols-[1fr_22rem]">
        <section className="surface-card rounded-[2rem] p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Loyalty wallet
          </p>
          <h1 className="font-display text-3xl font-semibold">Rewards</h1>
          <LoadState
            loading={wallet.loading}
            error={wallet.error}
            onRetry={() => void wallet.reload()}
          />
          {!wallet.loading && !wallet.error && (
            <>
              <p className="mt-4 text-sm text-muted-foreground">Signed in as {user?.name}.</p>
              <div className="mt-5 rounded-2xl bg-secondary p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Balance
                </p>
                <p className="mt-2 font-display text-4xl font-semibold">{wallet.data.points} pts</p>
                {wallet.data.next.reward ? (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {wallet.data.next.needed} pts until {wallet.data.next.reward.title}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, Math.round(wallet.data.next.progress * 100))}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    You've unlocked all listed rewards.
                  </p>
                )}
              </div>

              <h2 className="mt-6 text-sm font-semibold">History</h2>
              <ul className="mt-3 space-y-2">
                {wallet.data.history.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.at)}</p>
                    </div>
                    <span
                      className={
                        entry.points >= 0
                          ? "font-semibold text-success"
                          : "font-semibold text-destructive"
                      }
                    >
                      {entry.points >= 0 ? `+${entry.points}` : entry.points} pts
                    </span>
                  </li>
                ))}
                {wallet.data.history.length === 0 && (
                  <li className="text-sm text-muted-foreground">No loyalty activity yet.</li>
                )}
              </ul>
            </>
          )}
        </section>

        <aside className="space-y-6">
          <section className="surface-card rounded-[2rem] p-6">
            <h2 className="text-sm font-semibold">Available rewards</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {wallet.data.availableRewards.map((reward) => (
                <li key={reward.id} className="rounded-2xl bg-secondary px-3 py-2">
                  <p className="font-semibold">{reward.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Redeem {reward.points} pts for {currency(reward.value)} off at checkout.
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card rounded-[2rem] p-6">
            <h2 className="text-sm font-semibold">Rules</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {wallet.data.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </CustomerShell>
  );
}
