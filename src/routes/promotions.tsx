import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { formatDate, promotions as seed } from "@/lib/mock-data";
import type { Promotion } from "@/lib/types";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — StackedHub" },
      { name: "description", content: "Create, schedule and switch restaurant promotions and loyalty offers." },
      { property: "og:title", content: "Promotions — StackedHub" },
      { property: "og:description", content: "Create, schedule and switch restaurant promotions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromotionsPage,
});

const blank = { title: "", description: "", discountPercent: 10, startsAt: "", endsAt: "" };

function PromotionsPage() {
  const [list, setList] = useState<Promotion[]>(seed);
  const [form, setForm] = useState(blank);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setList((p) => [{ ...form, id: `p${Date.now()}`, active: true, redemptions: 0 }, ...p]);
    setForm(blank);
  };

  return (
    <AppShell title="Promotions" subtitle="Marketing" allow={["Admin"]}>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Campaigns">
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((p) => (
              <div key={p.id} className="glass-soft rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold">{p.title}</h3>
                  <button
                    onClick={() => setList((l) => l.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${p.active ? "bg-success/20" : "bg-secondary text-muted-foreground"}`}
                  >
                    {p.active ? "Active" : "Paused"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                <p className="mt-3 text-xs">
                  {p.discountPercent > 0 ? `${p.discountPercent}% off · ` : ""}
                  {p.startsAt && formatDate(p.startsAt)} – {p.endsAt && formatDate(p.endsAt)}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">{p.redemptions} redemptions</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="New promotion">
          <form onSubmit={add} className="space-y-3">
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-soft w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-soft w-full rounded-xl px-4 py-2.5 text-sm outline-none" rows={3} />
            <label className="block text-xs text-muted-foreground">Discount %
              <input type="number" min={0} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className="glass-soft mt-1 w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input required type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="glass-soft rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input required type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="glass-soft rounded-xl px-3 py-2.5 text-sm outline-none" />
            </div>
            <button className="bg-gradient-brand w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground">Launch promotion</button>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
