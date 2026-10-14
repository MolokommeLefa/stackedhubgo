import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/mock-data";

export function CustomerShell({ children, hideCart }: { children: ReactNode; hideCart?: boolean }) {
  const { user } = useAuth();
  const { count, subtotal, bump } = useCart();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="Stacked Foods home">
            <BrandMark className="size-8" />
            <span className="text-base font-bold sm:text-lg">Stacked Foods</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link to="/order" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">
              Menu
            </Link>
            <Link to="/track" className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold text-muted-foreground sm:px-3 sm:text-sm">Track order</Link>
            <Link to={user ? (user.role === "Customer" ? "/portal" : "/dashboard") : "/login"} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
              {user ? "My account" : "Sign in"}
            </Link>
            {!hideCart && (
              <Link
                to="/checkout"
                aria-label={`Cart: ${count} items, ${currency(subtotal)}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <span key={bump} className={bump ? "cart-bump inline-flex items-center gap-2" : "inline-flex items-center gap-2"}>
                  <ShoppingBag className="size-4" aria-hidden />
                  {count}
                </span>
                <span className="hidden sm:inline">· {currency(subtotal)}</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" className="page-enter">{children}</main>
      <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4"><span className="font-semibold">Stacked Foods · South African street food</span><Link to="/login" className="inline-flex items-center gap-1">Staff & admin <ArrowUpRight className="size-3" /></Link></div>
      </footer>
    </div>
  );
}
