import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { auditLog, formatDate, formatTime } from "@/lib/mock-data";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — StackedHub" },
      { name: "description", content: "Track every sensitive action taken by admins and staff for accountability." },
      { property: "og:title", content: "Audit Logs — StackedHub" },
      { property: "og:description", content: "Track every sensitive action taken by admins and staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [role, setRole] = useState("All");
  const shown = auditLog.filter((a) => role === "All" || a.role === role);
  return (
    <AppShell title="Audit Logs" subtitle="Security" allow={["Admin"]}>
      <Panel
        title={`${shown.length} entries`}
        action={
          <select value={role} onChange={(e) => setRole(e.target.value)} className="glass-soft rounded-xl px-3 py-2 text-sm outline-none">
            <option value="All">All roles</option><option>Admin</option><option>Staff</option>
          </select>
        }
      >
        <div className="space-y-2">
          {shown.map((a) => (
            <div key={a.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm"><span className="font-semibold">{a.actor}</span> {a.action.toLowerCase()} — <span className="text-primary">{a.target}</span></p>
                <p className="text-xs text-muted-foreground">{a.role}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(a.at)} · {formatTime(a.at)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
