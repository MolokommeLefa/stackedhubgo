import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import burger from "@/assets/food-mains.jpg";
import { BrandMark } from "@/components/BrandMark";
import { fieldClass, primaryBtnClass } from "@/components/AuthCard";
import { SLOGAN } from "@/components/site-info";
import { demoEmailForRole, homeRouteForRole, useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import { validateEmail, validatePassword } from "@/lib/validation";
import type { Role } from "@/lib/types";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

const roles: Role[] = ["Staff", "Admin", "Customer"];

const RETURN_PATHS = {
  Customer: ["/order", "/checkout", "/portal", "/settings"],
  Staff: ["/dashboard", "/orders", "/availability", "/settings"],
  Admin: [
    "/dashboard",
    "/orders",
    "/availability",
    "/menu",
    "/users",
    "/reports",
    "/audit-logs",
    "/customers",
    "/promotions",
    "/settings",
  ],
} as const satisfies Record<Role, readonly string[]>;
type ReturnPath = (typeof RETURN_PATHS)[Role][number];

function destinationAfterLogin(
  role: Role,
  redirect?: string,
): ReturnPath | ReturnType<typeof homeRouteForRole> {
  if (redirect && (RETURN_PATHS[role] as readonly string[]).includes(redirect)) {
    return redirect as ReturnPath;
  }
  return homeRouteForRole(role);
}

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — StackedHub" },
      {
        name: "description",
        content: "Sign in to StackedHub to run Stacked Foods orders, menu, users and reports.",
      },
      { property: "og:title", content: "Sign in — StackedHub" },
      {
        property: "og:description",
        content: "Sign in to StackedHub to run Stacked Foods orders, menu, users and reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [live, setLive] = useState(false);
  const [role, setRole] = useState<Role>("Staff");
  const [email, setEmail] = useState(demoEmailForRole("Staff"));
  const [password, setPassword] = useState("Stacked123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLive(isLiveApi()), []);
  useEffect(() => {
    if (ready && user) void navigate({ to: destinationAfterLogin(user.role, redirect) });
  }, [ready, user, navigate, redirect]);

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
      void navigate({ to: destinationAfterLogin(next.role, redirect) });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign in failed. Check your email and password.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="main-content" className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src={burger}
          alt="A double smash burger with melted cheddar on a toasted bun"
          width={1600}
          height={1200}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/70" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-cream">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Stacked Foods home">
            <BrandMark className="size-9" onDark />
            <span className="text-lg font-bold tracking-tight">StackedHub</span>
          </Link>
          <div className="max-w-md">
            <p className="text-xs font-semibold tracking-[0.2em] text-cream/70 uppercase">
              Johannesburg neighbourhood kitchen
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] font-semibold">
              {SLOGAN.split(". ").map((part, i, all) => (
                <span key={part} className="block">
                  {part}
                  {i < all.length - 1 ? "." : ""}
                </span>
              ))}
            </h1>
            <p className="mt-4 text-sm text-cream/80">
              One hub for good food, fast service and the people who make it happen.
            </p>
          </div>
          <p className="text-xs text-cream/60">Johannesburg, South Africa</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
            aria-label="Stacked Foods home"
          >
            <BrandMark />
            <span className="text-lg font-bold tracking-tight">StackedHub</span>
          </Link>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Welcome to StackedHub
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Good to see you.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your workspace and sign in to continue.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div
              className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1"
              role="group"
              aria-label="Choose a role"
            >
              {roles.map((r) => (
                <button
                  type="button"
                  key={r}
                  aria-pressed={role === r}
                  onClick={() => pickRole(r)}
                  className={
                    role === r
                      ? "min-h-11 rounded-full bg-card py-2 text-sm font-semibold shadow-sm"
                      : "min-h-11 rounded-full py-2 text-sm font-medium text-muted-foreground"
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
              <p
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
            <button disabled={busy} className={primaryBtnClass}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              to="/forgot-password"
              className="min-h-11 font-semibold text-primary underline-offset-2 hover:underline"
            >
              Forgot password
            </Link>
            <Link
              to="/register"
              className="min-h-11 font-semibold text-primary underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className={
                  live ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"
                }
              />
              {live ? "Using the live API" : "Demo mode — any password works"}
            </span>
            <Link to="/settings" className="font-semibold text-primary">
              Connect API
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
