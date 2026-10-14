import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { HOURS_SUMMARY } from "@/components/site-info";
import { homeRouteForRole, useAuth } from "@/lib/auth";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/directions", label: "Directions" },
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const workspace = user ? homeRouteForRole(user.role) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-brand text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Stacked Foods home">
            <BrandMark className="size-8" onDark />
            <span className="text-lg font-bold tracking-tight">Stacked Foods</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Public pages">
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={pathname === link.to ? "page" : undefined}
                className={
                  pathname === link.to
                    ? "inline-flex min-h-11 items-center rounded-full bg-cream/15 px-3 text-sm font-semibold"
                    : "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-cream/80 hover:bg-cream/10 hover:text-cream"
                }
              >
                {link.label}
              </Link>
            ))}
            {ready && workspace ? (
              <Link
                to={workspace}
                className="ml-2 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                {user?.role === "Customer" ? "Order now" : "Open workspace"}
              </Link>
            ) : (
              <Link
                to="/login"
                search={{}}
                className="ml-2 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Log in to order
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl text-cream md:hidden"
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>

        {open && (
          <nav
            id="public-mobile-nav"
            className="border-t border-cream/15 px-4 py-3 md:hidden"
            aria-label="Public pages"
          >
            <div className="flex flex-col gap-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.to ? "page" : undefined}
                  className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold"
                >
                  {link.label}
                </Link>
              ))}
              {ready && workspace ? (
                <Link
                  to={workspace}
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  {user?.role === "Customer" ? "Order now" : "Open workspace"}
                </Link>
              ) : (
                <Link
                  to="/login"
                  search={{}}
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Log in to order
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="page-enter">
        {children}
      </main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold">Stacked Foods</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{SLOGAN_LINE}</p>
            <p className="mt-3 text-xs text-muted-foreground">{HOURS_SUMMARY}</p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold" aria-label="Footer">
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="min-h-11 inline-flex items-center text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {ready && workspace ? (
              <Link to={workspace} className="min-h-11 inline-flex items-center text-primary">
                {user?.role === "Customer" ? "Portal" : "Workspace"}
              </Link>
            ) : (
              <Link
                to="/login"
                search={{}}
                className="min-h-11 inline-flex items-center text-primary"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}

const SLOGAN_LINE = "Stacked high. Tastes higher. Bold, halaal flavour wherever we go.";
