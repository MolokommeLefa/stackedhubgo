import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  to: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", roles: ["Admin", "Staff"] },
  { label: "Orders", to: "/orders", roles: ["Admin", "Staff"] },
  { label: "Menu & Inventory", to: "/menu", roles: ["Admin", "Staff"] },
  { label: "Customers", to: "/customers", roles: ["Admin", "Staff"] },
  { label: "Promotions", to: "/promotions", roles: ["Admin"] },
  { label: "Reports", to: "/reports", roles: ["Admin"] },
  { label: "Audit Logs", to: "/audit-logs", roles: ["Admin"] },
  { label: "Customer Portal", to: "/portal", roles: ["Admin", "Staff", "Customer"] },
];

export function AppShell({
  title,
  subtitle,
  allow,
  children,
}: {
  title: string;
  subtitle: string;
  allow: Role[];
  children: ReactNode;
}) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!user) void navigate({ to: "/" });
    else if (!allow.includes(user.role)) void navigate({ to: "/portal" });
  }, [ready, user, allow, navigate]);

  if (!ready || !user || !allow.includes(user.role)) {
    return (
      <div className="app-backdrop grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  const links = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="app-backdrop relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="pointer-events-none absolute -top-24 -left-16 size-[420px] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 size-[380px] rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-[360px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-[1440px] gap-6 p-6">
        <aside className="glass hidden w-60 shrink-0 self-start rounded-3xl p-5 lg:block">
          <Link to="/" className="flex items-center gap-2.5 px-1">
            <div className="bg-gradient-brand grid size-9 place-items-center rounded-xl font-display text-sm font-bold text-primary-foreground">
              S
            </div>
            <div>
              <p className="font-display text-sm leading-none font-semibold">StackedHub</p>
              <p className="mt-1 text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Stacked Foods
              </p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {links.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    active
                      ? "flex items-center gap-3 rounded-xl bg-card/70 px-3 py-2.5 text-sm font-semibold text-primary shadow-sm"
                      : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card/50"
                  }
                >
                  <span
                    className={
                      active ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-border"
                    }
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="glass-soft mt-8 rounded-2xl p-3">
            <p className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              AI Assistant
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gemini meal recommendations ready
            </p>
            <Link
              to="/portal"
              className="bg-gradient-brand mt-3 block rounded-lg py-2 text-center text-xs font-semibold text-primary-foreground"
            >
              Open assistant
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <header className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-4">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                {subtitle}
              </p>
              <h1 className="font-display text-2xl font-bold">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2">
                <span
                  className={
                    isLiveApi()
                      ? "size-2 rounded-full bg-success"
                      : "size-2 rounded-full bg-warning"
                  }
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {isLiveApi() ? "Live · API connected" : "Demo data · API not connected"}
                </span>
              </div>
              <div className="glass-soft hidden items-center gap-2 rounded-xl px-3 py-2 sm:flex">
                <span className="text-xs font-semibold">{user.name}</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  signOut();
                  void navigate({ to: "/" });
                }}
                className="glass-soft rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`glass rounded-3xl p-6 ${className ?? ""}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Placed: "bg-secondary text-muted-foreground",
    "In kitchen": "bg-warning/20 text-foreground",
    Ready: "bg-success/20 text-foreground",
    Completed: "bg-primary/15 text-primary",
    Cancelled: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${tone[status] ?? "bg-secondary text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
