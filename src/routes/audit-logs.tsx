import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getAuditLog } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/mock-data";
import type { AuditLogEntry } from "@/lib/types";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — StackedHub" },
      { name: "description", content: "Track every sensitive action taken by admins and staff for accountability." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [role, setRole] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await getAuditLog());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = entries.filter((a) => role === "All" || a.role === role);

  return (
    <AppShell title="Audit Logs" subtitle="Security" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <Panel
          title={`${shown.length} entries`}
          action={
            <select
              aria-label="Filter by role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="glass-soft min-h-11 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="All">All roles</option>
              <option>Admin</option>
              <option>Staff</option>
            </select>
          }
        >
          {shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events for that filter.</p>
          ) : (
            <div className="space-y-2">
              {shown.map((a) => (
                <div key={a.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{a.actor}</span> {a.action.toLowerCase()} —{" "}
                      <span className="text-primary">{a.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{a.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.at)} · {formatTime(a.at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
