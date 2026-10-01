import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getUsers, setUserActive } from "@/lib/data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users — StackedHub" },
      { name: "description", content: "Admins view staff and customer accounts and switch access on or off." },
      { property: "og:title", content: "Users — StackedHub" },
      { property: "og:description", content: "Admins view accounts and switch access on or off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { data: users, setData, loading, error } = useLoad(getUsers, []);
  const [role, setRole] = useState("All");
  const [actionError, setActionError] = useState<unknown>(null);
  const shown = users.filter((u) => role === "All" || u.role === role);

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
    <AppShell title="Users" subtitle="Management" allow={["Admin"]}>
      <Panel
        title={`${shown.length} users`}
        action={
          <select value={role} onChange={(e) => setRole(e.target.value)} className="glass-soft rounded-xl px-3 py-2 text-sm outline-none">
            <option value="All">All roles</option>
            <option>Admin</option>
            <option>Staff</option>
            <option>Customer</option>
          </select>
        }
      >
        <LoadState loading={loading} error={error ?? actionError} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase">
              <tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-3 font-semibold">{u.name}</td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button
                      onClick={() => toggle(u.id, !u.active)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.active ? "bg-success/20 text-foreground" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {u.active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
