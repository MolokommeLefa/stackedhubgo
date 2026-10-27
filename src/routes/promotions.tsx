import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { wsBtnPrimary, wsField } from "@/components/workspace";
import { getPromotions, savePromotion, setPromotionActive } from "@/lib/data";
import { formatDate } from "@/lib/mock-data";
import type { Promotion, PromotionAudience, PromotionCampaignType } from "@/lib/types";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — StackedHub" },
      { name: "description", content: "Create scheduled offers and loyalty campaigns." },
    ],
  }),
  component: PromotionsPage,
});

const blank = {
  title: "",
  description: "",
  discountPercent: 10,
  startsAt: "",
  endsAt: "",
  campaignType: "Discount" as PromotionCampaignType,
  pointsMultiplier: 2,
  pointsTarget: 100,
  eligibleGroup: "Everyone" as PromotionAudience,
};

function PromotionsPage() {
  const [list, setList] = useState<Promotion[]>([]);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(await getPromotions());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Enter a promotion title.");
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      setFormError("The end date must be on or after the start date.");
      return;
    }
    if (form.campaignType === "Points milestone" && form.pointsTarget < 1) {
      setFormError("Set a points target greater than zero.");
      return;
    }
    if (form.campaignType === "Double points" && form.pointsMultiplier < 2) {
      setFormError("Double-points campaigns must use a multiplier of at least 2.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await savePromotion({
        ...form,
        title: form.title.trim(),
        campaignType: form.campaignType,
        ...(form.campaignType === "Points milestone" ? { pointsTarget: form.pointsTarget } : {}),
        ...(form.campaignType === "Double points" ? { pointsMultiplier: form.pointsMultiplier } : {}),
      });
      setList((items) => [created, ...items]);
      setForm(blank);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (promotion: Promotion) => {
    setToggling(promotion.id);
    setError(null);
    try {
      await setPromotionActive(promotion.id, !promotion.active);
      setList((items) => items.map((item) => item.id === promotion.id ? { ...item, active: !item.active } : item));
    } catch (err) {
      setError(err);
    } finally {
      setToggling(null);
    }
  };

  return (
    <AppShell title="Promotions" subtitle="Campaign studio · Admin" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Panel title="Create a campaign">
            <p className="mb-5 text-sm text-muted-foreground">
              Build a clear offer customers can follow. Loyalty milestones appear as progress cards on the Rewards page.
            </p>
            <form onSubmit={add} className="space-y-4">
              <label className="block text-xs font-semibold text-muted-foreground">
                Campaign name
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lunch Club milestone" className={`${wsField} mt-1`} />
              </label>
              <label className="block text-xs font-semibold text-muted-foreground">
                Customer-facing details
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell customers what they can unlock." className={`${wsField} mt-1 py-3`} rows={3} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Campaign type
                  <select value={form.campaignType} onChange={(e) => setForm({ ...form, campaignType: e.target.value as PromotionCampaignType })} className={`${wsField} mt-1`}>
                    <option>Discount</option>
                    <option>Double points</option>
                    <option>Points milestone</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-muted-foreground">
                  Eligible customers
                  <select value={form.eligibleGroup} onChange={(e) => setForm({ ...form, eligibleGroup: e.target.value as PromotionAudience })} className={`${wsField} mt-1`}>
                    <option>Everyone</option>
                    <option>New</option>
                    <option>Regular</option>
                    <option>VIP</option>
                  </select>
                </label>
              </div>
              {form.campaignType === "Discount" && (
                <label className="block text-xs font-semibold text-muted-foreground">
                  Discount percent
                  <input type="number" min={0} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className={`${wsField} mt-1`} />
                </label>
              )}
              {form.campaignType === "Double points" && (
                <label className="block text-xs font-semibold text-muted-foreground">
                  Points multiplier
                  <select value={form.pointsMultiplier} onChange={(e) => setForm({ ...form, pointsMultiplier: Number(e.target.value) })} className={`${wsField} mt-1`}>
                    <option value={2}>2× points</option>
                    <option value={3}>3× points</option>
                    <option value={4}>4× points</option>
                  </select>
                </label>
              )}
              {form.campaignType === "Points milestone" && (
                <label className="block text-xs font-semibold text-muted-foreground">
                  Points target
                  <input type="number" min={1} value={form.pointsTarget} onChange={(e) => setForm({ ...form, pointsTarget: Number(e.target.value) })} className={`${wsField} mt-1`} />
                  <span className="mt-1 block font-normal">Customers see progress toward this milestone on Rewards.</span>
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Start date
                  <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={`${wsField} mt-1`} />
                </label>
                <label className="block text-xs font-semibold text-muted-foreground">
                  End date
                  <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={`${wsField} mt-1`} />
                </label>
              </div>
              {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
              <button disabled={saving} className={`${wsBtnPrimary} w-full`}>{saving ? "Saving campaign…" : "Create campaign"}</button>
            </form>
          </Panel>

          <Panel title="Campaigns">
            <p className="mb-3 text-sm text-muted-foreground">Pause or reactivate a campaign without deleting its history.</p>
            {list.length === 0 ? (
              <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">No campaigns yet. Create the first one to engage your customers.</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((p) => (
                  <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{p.title}</p>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold">{p.campaignType ?? "Discount"}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description || "No description provided."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(p.campaignType === "Points milestone" ? `${p.pointsTarget ?? 100} point target` : p.campaignType === "Double points" ? `${p.pointsMultiplier ?? 2}× points` : `${p.discountPercent}% off`)}
                        {" · "}{p.eligibleGroup ?? "Everyone"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.startsAt ? formatDate(p.startsAt) : "Starts now"} – {p.endsAt ? formatDate(p.endsAt) : "No end date"} · {p.redemptions} redemptions
                      </p>
                    </div>
                    <button type="button" disabled={toggling === p.id} aria-pressed={p.active} onClick={() => void toggle(p)} className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold ${p.active ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}>
                      {toggling === p.id ? "Updating…" : p.active ? "Active · Pause" : "Paused · Activate"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
