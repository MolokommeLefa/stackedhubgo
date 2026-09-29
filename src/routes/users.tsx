import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell, LoadState, Panel } from "@/components/AppShell";
import { getUsers, setUserActive, type ManagedUser } from "@/lib/data";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [{ title: "Users — StackedHub" }, { name: "description", content: "Activate or deactivate StackedHub accounts." }],
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
    </AppShell>
  );
}
