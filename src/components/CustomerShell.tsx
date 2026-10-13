import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShoppingBag } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/mock-data";

export function CustomerShell({ children, hideCart }: { children: ReactNode; hideCart?: boolean }) {
  const { count, subtotal, bump } = useCart();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Stacked Foods home">
            <BrandMark className="size-8" />
            <span className="text-lg font-bold tracking-tight">Stacked Foods</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/order" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">
              Menu
            </Link>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Sign in
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
        Stacked Foods · Johannesburg · Open daily 10:00–22:00
      </footer>
    </div>
  );
}
