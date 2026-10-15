import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { FilterTabs, SearchField } from "@/components/workspace";
import { getAuditLog } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — StackedHub" },
      {
        name: "description",
        content: "Track every sensitive action taken by admins and staff for accountability.",
      },
      { property: "og:title", content: "Audit Logs — StackedHub" },
      {
        property: "og:description",
        content: "Track every sensitive action taken by admins and staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

const tabs = [
  { id: "All", label: "All roles" },
  { id: "Admin", label: "Admin" },
  { id: "Staff", label: "Staff" },
] as const;

function AuditPage() {
  const { data, loading, error } = useLoad(getAuditLog, []);
  const [role, setRole] = useState<(typeof tabs)[number]["id"]>("All");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(
      (a) =>
        (role === "All" || a.role === role) &&
        (!q || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q)),
    );
  }, [data, role, query]);

  return (
    <AppShell title="Audit log" subtitle="Security & activity" allow={["Admin"]}>
      <Panel
        title="Recent activity"
        action={
          <SearchField
            id="audit-search"
            value={query}
            onChange={setQuery}
            placeholder="Search activity"
            label="Search audit log"
          />
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          System and user actions across StackedHub.
        </p>
        <FilterTabs options={[...tabs]} value={role} onChange={setRole} label="Actor role" />
        <LoadState loading={loading} error={error} />
        <ul className="mt-4 divide-y divide-border">
          {shown.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {a.actor.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.target} · {a.actor} ({a.role})
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(a.at)} · {formatTime(a.at)}
              </p>
            </li>
          ))}
        </ul>
        {!loading && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No matching activity.</p>
        )}
      </Panel>
    </AppShell>
  );
}
