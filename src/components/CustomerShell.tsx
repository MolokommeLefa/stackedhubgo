import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { BasketButton, BasketProvider } from "@/components/BasketSheet";
import { HOURS_SUMMARY } from "@/components/site-info";
import { homeRouteForRole, useAuth } from "@/lib/auth";

export function CustomerShell({
  children,
  hideCart,
  requireAuth,
}: {
  children: ReactNode;
  hideCart?: boolean;
  requireAuth?: boolean;
}) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const returnPath = useRef(pathname);

  useEffect(() => {
    if (!requireAuth || !ready || user) return;
    const dest = returnPath.current;
    void navigate({
      to: "/login",
      search: dest && dest !== "/login" ? { redirect: dest } : {},
    });
  }, [requireAuth, ready, user, navigate]);

  if (requireAuth && (!ready || !user)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  return (
    <BasketProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 bg-brand text-cream">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2" aria-label="Stacked Foods home">
              <BrandMark className="size-8" onDark />
              <span className="text-lg font-bold tracking-tight">Stacked Foods</span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to={user?.role === "Customer" ? "/portal" : "/order"}
                className="inline-flex min-h-11 items-center rounded-full px-2.5 text-sm font-semibold text-cream/80 hover:text-cream sm:px-3"
              >
                Menu & order
              </Link>
              <Link
                to="/rewards"
                className="inline-flex min-h-11 items-center rounded-full px-2.5 text-sm font-semibold text-cream/80 hover:text-cream sm:px-3"
              >
                Rewards
              </Link>
              <Link
                to="/directions"
                className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-cream/80 hover:text-cream md:inline-flex"
              >
                Hours
              </Link>
              {user ? (
                <>
                  <Link
                    to={homeRouteForRole(user.role)}
                    className="inline-flex min-h-11 items-center rounded-full px-2.5 text-sm font-semibold text-cream/80 hover:text-cream sm:px-3"
                  >
                    {user.role === "Customer" ? "Portal" : "Workspace"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      void navigate({ to: "/login", search: {} });
                    }}
                    className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-cream/80 hover:text-cream"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  search={{}}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-cream/80 hover:text-cream"
                >
                  Sign in
                </Link>
              )}
              {!hideCart && <BasketButton />}
            </nav>
          </div>
        </header>
        <main id="main-content" className="page-enter">
          {children}
        </main>
        <footer className="mt-16 border-t border-border bg-card py-8 text-center text-xs text-muted-foreground">
          <p>Stacked Foods · Johannesburg</p>
          <p className="mt-1">{HOURS_SUMMARY}</p>
          <nav
            className="mt-3 flex flex-wrap justify-center gap-4 text-sm font-semibold text-foreground"
            aria-label="Footer"
          >
            <Link to="/about" className="min-h-11 inline-flex items-center">
              About
            </Link>
            <Link to="/contact" className="min-h-11 inline-flex items-center">
              Contact
            </Link>
            <Link to="/directions" className="min-h-11 inline-flex items-center">
              Directions
            </Link>
          </nav>
        </footer>
      </div>
    </BasketProvider>
  );
}
