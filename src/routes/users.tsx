import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { FilterTabs, Initials, SearchField } from "@/components/workspace";
import { getUsers, setUserActive } from "@/lib/data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users — StackedHub" },
      {
        name: "description",
        content: "Admins view staff and customer accounts and switch access on or off.",
      },
      { property: "og:title", content: "Users — StackedHub" },
      { property: "og:description", content: "Admins view accounts and switch access on or off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

const tabs = [
  { id: "All", label: "All" },
  { id: "Admin", label: "Admin" },
  { id: "Staff", label: "Staff" },
  { id: "Customer", label: "Customer" },
] as const;

function UsersPage() {
  const { data: users, setData, loading, error } = useLoad(getUsers, []);
  const [role, setRole] = useState<(typeof tabs)[number]["id"]>("All");
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<unknown>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "All" || u.role === role) &&
        (!q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)),
    );
  }, [users, role, query]);

  const toggle = async (id: string, active: boolean) => {
    setActionError(null);
    try {
      await setUserActive(id, active);
      setData((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    } catch (e) {
      setActionError(e);
    }
  };

  return (
    <AppShell title="Users & roles" subtitle="Access control" allow={["Admin"]}>
      <Panel
        title={`${shown.length} users`}
        action={
          <SearchField
            id="user-search"
            value={query}
            onChange={setQuery}
            placeholder="Search"
            label="Search users"
          />
        }
      >
        <FilterTabs options={[...tabs]} value={role} onChange={setRole} label="User role" />
        <LoadState loading={loading} error={error ?? actionError} />
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="py-3">Name</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={u.name} />
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggle(u.id, !u.active)}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                        u.active
                          ? "bg-success/20 text-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${u.active ? "bg-success" : "bg-destructive"}`}
                        aria-hidden
                      />
                      {u.active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-3 md:hidden">
          {shown.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
              <Initials name={u.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · {u.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(u.id, !u.active)}
                className={`min-h-11 rounded-full px-3 text-xs font-semibold ${
                  u.active ? "bg-card text-foreground" : "bg-destructive/10 text-destructive"
                }`}
              >
                {u.active ? "Active" : "Deactivated"}
              </button>
            </li>
          ))}
        </ul>
        {!loading && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No users match that filter.
          </p>
        )}
      </Panel>
    </AppShell>
  );
}
