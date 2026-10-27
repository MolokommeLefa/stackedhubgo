import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Award, Gift, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/CustomerShell";
import { LoadState } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getLoyaltyWallet, getPromotions } from "@/lib/data";
import { formatDate } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";
import type { Promotion } from "@/lib/types";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Stacked Foods" },
      { name: "description", content: "Track loyalty progress, active campaigns and rewards." },
    ],
  }),
  component: RewardsPage,
});

function campaignIsCurrent(promotion: Promotion, now = new Date()) {
  if (!promotion.active) return false;
  const start = promotion.startsAt ? new Date(promotion.startsAt) : null;
  const end = promotion.endsAt ? new Date(promotion.endsAt) : null;
  if (start && !Number.isNaN(start.getTime()) && start > now) return false;
  if (end && !Number.isNaN(end.getTime()) && end < new Date(now.toDateString())) return false;
  return true;
}

function RewardsPage() {
  const { user } = useAuth();
  const wallet = useLoad(async () => getLoyaltyWallet(user?.id ?? ""), {
    balance: 0,
    tier: "New",
    earnRule: "Earn 1 point for every R10 on a completed order.",
    rewards: [],
    transactions: [],
  });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [campaignError, setCampaignError] = useState<unknown>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    try {
      setPromotions(await getPromotions());
    } catch (err) {
      setCampaignError(err);
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);

  const points = wallet.data.balance;
  const currentPromotions = promotions.filter(campaignIsCurrent).filter((p) => {
    const audience = p.eligibleGroup ?? "Everyone";
    return audience === "Everyone" || audience === wallet.data.tier;
  });
  const milestones = currentPromotions.filter((p) => p.campaignType === "Points milestone" && (p.pointsTarget ?? 0) > 0);
  const offers = currentPromotions.filter((p) => p.campaignType !== "Points milestone");

  return (
    <CustomerShell requireAuth>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Your StackedHub rewards</p>
            <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Every order gets you closer.</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">See what you've earned, how close you are to the next milestone, and which campaigns are made for you.</p>
          </div>
          <Link to="/portal" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary sm:self-auto">Order now <ArrowUpRight className="size-4" /></Link>
        </header>

        <LoadState loading={wallet.loading} error={wallet.error} onRetry={() => void wallet.reload()} />
        {!wallet.loading && !wallet.error && (
          <>
            <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground sm:p-8">
                <div className="pointer-events-none absolute -right-8 -top-10 size-48 rounded-full border-[24px] border-white/10" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">Available points</p>
                    <p className="mt-2 font-display text-5xl font-semibold">{points.toLocaleString()}</p>
                    <p className="mt-2 text-sm opacity-85">{wallet.data.tier} member · {wallet.data.earnRule}</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3"><Award className="size-7" /></div>
                </div>
                {wallet.data.nextReward && (
                  <div className="relative mt-7 rounded-2xl bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">Next reward: {wallet.data.nextReward.label}</span>
                      <span className="shrink-0 text-xs">{wallet.data.nextReward.remaining} pts left</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/15" role="progressbar" aria-label="Progress to next reward" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((wallet.data.nextReward.current / wallet.data.nextReward.target) * 100))}>
                      <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, Math.round((wallet.data.nextReward.current / wallet.data.nextReward.target) * 100))}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="surface-card flex flex-col justify-between rounded-[2rem] p-6">
                <div>
                  <div className="flex items-center gap-2 text-primary"><Sparkles className="size-5" /><p className="text-xs font-semibold uppercase tracking-[0.14em]">Your member journey</p></div>
                  <h2 className="mt-3 font-display text-2xl font-semibold">{wallet.data.nextTier ? `${wallet.data.nextTier.remaining} points to ${wallet.data.nextTier.label}` : "You've reached our top tier!"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Complete orders to earn points. Points are added after an order is marked completed, keeping your progress fair and transparent.</p>
                </div>
                {wallet.data.nextTier && (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{wallet.data.tier}</span><span>{wallet.data.nextTier.label}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Tier progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((wallet.data.nextTier.current / wallet.data.nextTier.target) * 100))}>
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.round((wallet.data.nextTier.current / wallet.data.nextTier.target) * 100))}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div><h2 className="font-display text-2xl font-semibold">Your missions</h2><p className="mt-1 text-sm text-muted-foreground">Progress toward milestones created by the StackedHub team.</p></div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{milestones.length} active</span>
              </div>
              {campaignLoading ? <p className="py-6 text-sm text-muted-foreground">Loading campaigns…</p> : campaignError ? (
                <div className="rounded-2xl border border-border p-4 text-sm"><p>Campaigns could not be loaded right now.</p><button type="button" onClick={() => void loadCampaigns()} className="mt-2 font-semibold text-primary">Try again</button></div>
              ) : milestones.length === 0 ? (
                <div className="surface-card rounded-2xl p-5"><p className="font-semibold">New missions are on the way</p><p className="mt-1 text-sm text-muted-foreground">When a points milestone is available for your member tier, your progress will appear here.</p></div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {milestones.map((promotion) => {
                    const target = Math.max(1, promotion.pointsTarget ?? 100);
                    const progress = Math.min(100, Math.round((points / target) * 100));
                    const remaining = Math.max(0, target - points);
                    const unlocked = remaining === 0;
                    return (
                      <article key={promotion.id} className="surface-card rounded-[1.5rem] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Gift className="size-5" /></div><div><h3 className="font-semibold">{promotion.title}</h3><p className="mt-1 text-sm text-muted-foreground">{promotion.description || "Keep earning points to unlock this milestone."}</p></div></div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${unlocked ? "bg-success/15 text-success" : "bg-secondary"}`}>{unlocked ? "Unlocked" : `${progress}%`}</span>
                        </div>
                        <div className="mt-5 flex items-center justify-between text-xs"><span className="font-semibold">{points.toLocaleString()} / {target.toLocaleString()} points</span><span className="text-muted-foreground">{unlocked ? "Milestone reached" : `${remaining.toLocaleString()} to go`}</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={`${promotion.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                        <p className="mt-3 text-xs text-muted-foreground">{promotion.endsAt ? `Ends ${formatDate(promotion.endsAt)}` : "No end date"} · For {promotion.eligibleGroup ?? "Everyone"}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3"><h2 className="font-display text-2xl font-semibold">Member offers</h2><p className="mt-1 text-sm text-muted-foreground">Offers currently available for your tier.</p></div>
              {offers.length === 0 ? <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">No active offers for your tier at the moment.</p> : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((promotion) => <article key={promotion.id} className="surface-card rounded-2xl p-4"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{promotion.campaignType === "Double points" ? `${promotion.pointsMultiplier ?? 2}× points` : `${promotion.discountPercent}% off`}</span><h3 className="mt-2 font-semibold">{promotion.title}</h3><p className="mt-1 text-sm text-muted-foreground">{promotion.description}</p><p className="mt-3 text-xs text-muted-foreground">{promotion.endsAt ? `Ends ${formatDate(promotion.endsAt)}` : "Limited-time offer"}</p></article>)}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="surface-card rounded-[2rem] p-6">
                <h2 className="font-display text-2xl font-semibold">Points activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">A transparent history of points earned and redeemed.</p>
                <ul className="mt-4 divide-y divide-border">
                  {wallet.data.transactions.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{entry.reason}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.at)}</p></div><span className={entry.points >= 0 ? "shrink-0 font-semibold text-success" : "shrink-0 font-semibold text-destructive"}>{entry.points >= 0 ? "+" : ""}{entry.points} pts</span></li>)}
                  {wallet.data.transactions.length === 0 && <li className="py-5 text-sm text-muted-foreground">No loyalty activity yet. Complete your first order to start earning.</li>}
                </ul>
              </section>
              <section className="surface-card rounded-[2rem] p-6">
                <h2 className="font-display text-2xl font-semibold">Rewards catalogue</h2>
                <p className="mt-1 text-sm text-muted-foreground">Use your points on your next order.</p>
                <ul className="mt-4 space-y-3">
                  {wallet.data.rewards.map((reward) => <li key={reward.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3"><div className="min-w-0"><p className="font-semibold">{reward.title}</p><p className="mt-1 text-xs text-muted-foreground">{reward.description}</p><p className="mt-1 text-xs font-semibold">{reward.pointsCost} pts</p></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${reward.affordable ? "bg-success/15 text-success" : "bg-background text-muted-foreground"}`}>{reward.affordable ? "Available" : `${reward.pointsCost - points} pts left`}</span></li>)}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">{wallet.data.earnRule} Tier and campaign progress are based on your current points balance.</p>
              </section>
            </div>

            <section className="surface-card rounded-2xl p-5">
              <h2 className="font-semibold">How loyalty works</h2>
              <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <p className="rounded-xl bg-secondary p-3"><span className="mb-1 block font-semibold text-foreground">1. Order</span>Choose your favourites from the menu.</p>
                <p className="rounded-xl bg-secondary p-3"><span className="mb-1 block font-semibold text-foreground">2. Complete</span>Points are awarded when the order is completed.</p>
                <p className="rounded-xl bg-secondary p-3"><span className="mb-1 block font-semibold text-foreground">3. Unlock</span>Track progress and redeem eligible rewards.</p>
              </div>
            </section>
          </>
        )}
      </div>
    </CustomerShell>
  );
}
