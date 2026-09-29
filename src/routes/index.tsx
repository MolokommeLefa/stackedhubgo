import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthCard, fieldClass, primaryBtnClass } from "@/components/AuthCard";
import { demoEmailForRole, homeRouteForRole, useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import { validateEmail, validatePassword } from "@/lib/validation";
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
    const emailError = validateEmail(email);
    const passwordError = live ? validatePassword(password) : null;
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const next = await signIn({ email, password, role });
      void navigate({ to: homeRouteForRole(next.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to manage Stacked Foods.">
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" role="group" aria-label="Choose a role">
          {roles.map((r) => (
            <button
              type="button"
              key={r}
              aria-pressed={role === r}
              onClick={() => pickRole(r)}
              className={
                role === r
                  ? "min-h-11 rounded-lg bg-card py-2 text-sm font-semibold shadow-sm"
                  : "min-h-11 rounded-lg py-2 text-sm font-medium text-muted-foreground"
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
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className={primaryBtnClass}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to="/forgot-password" className="min-h-11 font-semibold text-primary underline-offset-2 hover:underline">
          Forgot password
        </Link>
        <Link to="/register" className="min-h-11 font-semibold text-primary underline-offset-2 hover:underline">
          Create an account
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className={live ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} />
          {live ? "Using the live API" : "Demo mode — any password works"}
        </span>
        <Link to="/settings" className="font-semibold text-primary">
          Connect API
        </Link>
      </div>
    </AuthCard>
  );
}
