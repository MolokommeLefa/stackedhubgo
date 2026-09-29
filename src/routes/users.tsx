import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getUsers, setUserActive, type ManagedUser } from "@/lib/data";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [{ title: "Users — StackedHub" }, { name: "description", content: "Activate or deactivate StackedHub accounts." }],
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
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (user: ManagedUser) => {
    setBusyId(user.id);
    try {
      await setUserActive(user.id, !user.active);
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)));
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
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
    <AppShell title="Users" subtitle="Access" allow={["Admin"]}>
      <LoadState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <Panel title={`${users.length} accounts`}>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet. Ask Role 2 to seed the API.</p>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.id} className="glass-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email} · {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => void toggle(user)}
                    className={`min-h-11 rounded-full px-4 text-xs font-semibold disabled:opacity-60 ${
                      user.active ? "bg-success/20" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {user.active ? "Active" : "Deactivated"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
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
