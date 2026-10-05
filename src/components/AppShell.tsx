import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  UserRound,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutGrid, roles: ["Admin", "Staff"] },
      { label: "Order Queue", to: "/orders", icon: ClipboardList, roles: ["Admin", "Staff"] },
      { label: "Item Availability", to: "/availability", icon: ToggleRight, roles: ["Staff", "Admin"] },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Menu Catalogue", to: "/menu", icon: UtensilsCrossed, roles: ["Admin"] },
      { label: "Users", to: "/users", icon: Users, roles: ["Admin"] },
      { label: "Reports", to: "/reports", icon: BarChart3, roles: ["Admin"] },
      { label: "Audit Logs", to: "/audit-logs", icon: ShieldCheck, roles: ["Admin"] },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Customers", to: "/customers", icon: UserRound, roles: ["Admin"] },
      { label: "Promotions", to: "/promotions", icon: Megaphone, roles: ["Admin"] },
      { label: "Customer Portal", to: "/portal", icon: Sparkles, roles: ["Admin", "Customer"] },
      { label: "Settings", to: "/settings", icon: Settings, roles: ["Admin", "Staff", "Customer"] },
    ],
  },
];

export function AppShell({
  title,
  subtitle,
  allow,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  allow: Role[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!user) void navigate({ to: "/" });
    else if (!allow.includes(user.role)) void navigate({ to: user.role === "Customer" ? "/portal" : "/dashboard" });
  }, [ready, user, allow, navigate]);

  if (!ready || !user || !allow.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  const live = isLiveApi();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-6 p-4 lg:p-6">
        <aside className="hidden w-60 shrink-0 flex-col self-start rounded-3xl bg-card p-5 lg:sticky lg:top-6 lg:flex lg:min-h-[calc(100vh-3rem)]">
          <Link to="/dashboard" className="flex items-center gap-2.5 px-2" aria-label="StackedHub dashboard">
            <BrandMark className="size-9" />
            <span className="text-lg font-bold tracking-tight">StackedHub</span>
          </Link>

          <nav className="mt-8 flex-1 space-y-6">
            {groups.map((group) => {
              const items = group.items.filter((i) => i.roles.includes(user.role));
              if (!items.length) return null;
              return (
                <div key={group.title}>
                  <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const active = pathname === item.to;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          className={
                            active
                              ? "flex min-h-11 items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-foreground"
                              : "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          }
                        >
                          <Icon className={active ? "size-[18px] text-primary" : "size-[18px]"} aria-hidden />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-3">
            <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => {
                signOut();
                void navigate({ to: "/" });
              }}
              className="min-h-11 min-w-11 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        <main key={pathname} id="main-content" className="page-enter min-w-0 flex-1 space-y-6 rounded-3xl lg:bg-secondary/60 lg:p-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <Link
                to="/settings"
                className="flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-medium text-muted-foreground"
              >
                <span className={live ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} />
                {live ? "Connected to API" : "Demo data"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  void navigate({ to: "/" });
                }}
                className="min-h-11 rounded-full bg-card px-3 py-2 text-xs font-medium text-muted-foreground lg:hidden"
              >
                Sign out
              </button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto lg:hidden">
            {groups
              .flatMap((g) => g.items)
              .filter((i) => i.roles.includes(user.role))
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={pathname === item.to ? "page" : undefined}
                  className={
                    pathname === item.to
                      ? "inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      : "inline-flex min-h-11 shrink-0 items-center rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {item.label}
                </Link>
              ))}
          </nav>

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
    <section className={`rounded-3xl bg-card p-6 ${className ?? ""}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Placed: "bg-primary/10 text-primary",
    "In kitchen": "bg-warning/20 text-foreground",
    Ready: "bg-success/20 text-foreground",
    Completed: "bg-secondary text-muted-foreground",
    Cancelled: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone[status] ?? "bg-secondary text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function LoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground" role="status">
        Loading…
      </p>
    );
  }
  if (error) {
    const message =
      error instanceof Error ? error.message : "The request failed. Check your connection and try again.";
    return (
      <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
        <p>{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-11 rounded-xl bg-card px-4 text-xs font-semibold text-foreground"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  return null;
}
