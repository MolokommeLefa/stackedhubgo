import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getPromotions, savePromotion, setPromotionActive } from "@/lib/data";
import { formatDate } from "@/lib/mock-data";
import type { Promotion } from "@/lib/types";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — StackedHub" },
      { name: "description", content: "Create, schedule and switch restaurant promotions and loyalty offers." },
    ],
  }),
  component: PromotionsPage,
});

const blank = { title: "", description: "", discountPercent: 10, startsAt: "", endsAt: "" };

function PromotionsPage() {
  const [list, setList] = useState<Promotion[]>([]);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Enter a promotion title.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await savePromotion(form);
      setList((p) => [created, ...p]);
      setForm(blank);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Promotions" subtitle="Offers" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Live offers">
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">No promotions yet — launch one on the right.</p>
            ) : (
              <div className="space-y-3">
                {list.map((p) => (
                  <div key={p.id} className="glass-soft rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{p.title}</p>
                      <button
                        type="button"
                        aria-pressed={p.active}
                        onClick={() => {
                          void setPromotionActive(p.id, !p.active);
                          setList((l) => l.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
                        }}
                        className={`min-h-11 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${p.active ? "bg-success/20" : "bg-secondary text-muted-foreground"}`}
                      >
                        {p.active ? "Active" : "Paused"}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.discountPercent > 0 ? `${p.discountPercent}% off · ` : ""}
                      {p.startsAt && formatDate(p.startsAt)} – {p.endsAt && formatDate(p.endsAt)}
                    </p>
                    <p className="mt-1 text-xs">{p.redemptions} redemptions</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Launch promotion">
            <form onSubmit={add} className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-soft mt-1 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  rows={3}
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Discount %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  className="glass-soft mt-1 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Starts
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="glass-soft mt-1 min-h-11 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Ends
                  <input
                    type="date"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="glass-soft mt-1 min-h-11 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <button
                disabled={saving}
                className="bg-gradient-brand min-h-11 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Launching…" : "Launch promotion"}
              </button>
            </form>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
