import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/CustomerShell";
import { LoadState } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getLoyaltyWallet } from "@/lib/data";
import { formatDate } from "@/lib/mock-data";
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
    balance: 0,
    tier: "New",
    earnRule: "Earn 1 point for every R10 on a completed order.",
    rewards: [],
    transactions: [],
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
                <p className="mt-2 font-display text-4xl font-semibold">{wallet.data.balance} pts</p>
                {wallet.data.nextReward ? (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {wallet.data.nextReward.remaining} pts until {wallet.data.nextReward.label}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (wallet.data.nextReward.current / wallet.data.nextReward.target) * 100,
                            ),
                          )}%`,
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
                {wallet.data.transactions.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{entry.reason}</p>
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
                {wallet.data.transactions.length === 0 && (
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
              {wallet.data.rewards.map((reward) => (
                <li key={reward.id} className="rounded-2xl bg-secondary px-3 py-2">
                  <p className="font-semibold">{reward.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Redeem {reward.pointsCost} pts{reward.affordable ? " · available now" : ""}.
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card rounded-[2rem] p-6">
            <h2 className="text-sm font-semibold">Rules</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>{wallet.data.earnRule}</li>
              {wallet.data.nextTier && (
                <li>
                  {wallet.data.nextTier.remaining} points to {wallet.data.nextTier.label}.
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </CustomerShell>
  );
}
