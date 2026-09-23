import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { homeRouteForRole, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — StackedHub" },
      {
        name: "description",
        content:
          "Sign in to StackedHub to manage Stacked Foods orders, menu, inventory, customers and loyalty.",
      },
      { property: "og:title", content: "Sign in — StackedHub" },
      {
        property: "og:description",
        content:
          "Sign in to StackedHub to manage Stacked Foods orders, menu, inventory, customers and loyalty.",
      },
    ],
  }),
  component: SignInPage,
});

const roles: { role: Role; blurb: string }[] = [
  { role: "Admin", blurb: "Reports, promotions, users, audit logs" },
  { role: "Staff", blurb: "Order board, menu and inventory" },
  { role: "Customer", blurb: "Menu, ordering, loyalty, AI assistant" },
];

function SignInPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("Admin");
  const [email, setEmail] = useState("thandi@stackedfoods.co.za");
  const [password, setPassword] = useState("demo1234");
  const [mode, setMode] = useState<"signin" | "register" | "forgot">("signin");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) void navigate({ to: homeRouteForRole(user.role) });
  }, [ready, user, navigate]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "forgot") {
      setNotice(`Password reset link sent to ${email}.`);
      return;
    }
    if (mode === "register") {
      setNotice(`Verification email sent to ${email}. Confirm it to activate the account.`);
      setMode("signin");
      return;
    }
    const next = signIn(role, email);
    void navigate({ to: homeRouteForRole(next.role) });
  };

  return (
    <div className="app-backdrop relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="pointer-events-none absolute -top-24 -left-16 size-[420px] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 size-[380px] rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-[360px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] items-center gap-6 p-6 lg:grid-cols-2">
        <section className="glass rounded-3xl p-8 lg:p-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-brand grid size-10 place-items-center rounded-xl font-display text-base font-bold text-primary-foreground">
              S
            </div>
            <div>
              <p className="font-display text-base leading-none font-semibold">StackedHub</p>
              <p className="mt-1 text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Stacked Foods
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-bold">
            One workspace for every <span className="text-gradient-brand">Stacked Foods</span> order
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Instagram, WhatsApp, phone, Uber Eats and Mr D orders land in one board. Menu,
            inventory, customers, loyalty and reporting live alongside them.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Channels in one board", v: "5" },
              { k: "Roles supported", v: "3" },
              { k: "AI meal assistant", v: "Gemini" },
            ].map((item) => (
              <div key={item.k} className="glass-soft rounded-2xl p-4">
                <p className="font-display text-xl font-bold">{item.v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.k}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl p-8 lg:p-10">
          <h2 className="text-xl font-bold">
            {mode === "signin"
              ? "Sign in"
              : mode === "register"
                ? "Create an account"
                : "Reset your password"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll email you a link to set a new password."
              : "Choose the role you want to explore."}
          </p>

          {mode !== "forgot" && (
            <div className="mt-6 grid gap-2">
              {roles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setRole(item.role)}
                  className={
                    role === item.role
                      ? "flex items-center justify-between rounded-2xl border border-primary/40 bg-card/70 px-4 py-3 text-left"
                      : "glass-soft flex items-center justify-between rounded-2xl px-4 py-3 text-left"
                  }
                >
                  <span>
                    <span className="block text-sm font-semibold">{item.role}</span>
                    <span className="block text-xs text-muted-foreground">{item.blurb}</span>
                  </span>
                  <span
                    className={
                      role === item.role
                        ? "size-3 rounded-full bg-primary"
                        : "size-3 rounded-full border border-border"
                    }
                  />
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-soft mt-1 w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            </label>
            {mode !== "forgot" && (
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-soft mt-1 w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </label>
            )}

            <button
              type="submit"
              className="bg-gradient-brand w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground"
            >
              {mode === "signin"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : "Send reset link"}
            </button>
          </form>

          {notice && (
            <p className="mt-4 rounded-xl bg-success/15 px-4 py-3 text-xs font-medium">{notice}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} className="font-semibold text-primary">
                Back to sign in
              </button>
            )}
            {mode !== "register" && (
              <button onClick={() => setMode("register")} className="font-semibold text-primary">
                Create an account
              </button>
            )}
            {mode !== "forgot" && (
              <button onClick={() => setMode("forgot")} className="font-semibold text-primary">
                Forgot password?
              </button>
            )}
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground">
            Running on demo data. Once the .NET API is live, sign-in swaps to the JWT returned by
            the API with no screen changes.
          </p>
        </section>
      </div>
    </div>
  );
}
