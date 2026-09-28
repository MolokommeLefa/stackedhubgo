import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { demoEmailForRole, homeRouteForRole, useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — StackedHub" },
      { name: "description", content: "Sign in to StackedHub to run Stacked Foods orders, menu, users and reports." },
      { property: "og:title", content: "Sign in — StackedHub" },
      { property: "og:description", content: "Sign in to StackedHub to run Stacked Foods orders, menu, users and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

const roles: Role[] = ["Staff", "Admin", "Customer"];

function SignInPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [live, setLive] = useState(false);
  const [role, setRole] = useState<Role>("Staff");
  const [email, setEmail] = useState(demoEmailForRole("Staff"));
  const [password, setPassword] = useState("Stacked123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLive(isLiveApi()), []);
  useEffect(() => {
    if (ready && user) void navigate({ to: homeRouteForRole(user.role) });
  }, [ready, user, navigate]);

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(demoEmailForRole(r));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const next = await signIn({ email, password, role });
      void navigate({ to: homeRouteForRole(next.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">S</div>
          <span className="text-xl font-bold tracking-tight">StackedHub</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage Stacked Foods.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
            {roles.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => pickRole(r)}
                className={
                  role === r
                    ? "rounded-lg bg-card py-2 text-sm font-semibold shadow-sm"
                    : "rounded-lg py-2 text-sm font-medium text-muted-foreground"
                }
              >
                {r}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className={live ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} />
            {live ? "Using the live API" : "Demo mode — any password works"}
          </span>
          <Link to="/settings" className="font-semibold text-primary">
            Connect API
          </Link>
        </div>
      </div>
    </div>
  );
}
