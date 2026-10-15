import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MenuPhoto } from "@/components/MenuPhoto";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/mock-data";

const BasketUi = createContext<{ openBasket: () => void } | null>(null);

export function useBasketUi() {
  return useContext(BasketUi);
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <BasketUi.Provider value={{ openBasket: () => setOpen(true) }}>
      {children}
      <BasketSheet open={open} onOpenChange={setOpen} />
    </BasketUi.Provider>
  );
}

export function BasketButton() {
  const { count, subtotal, bump } = useCart();
  const basket = useBasketUi();
  return (
    <button
      type="button"
      onClick={() => basket?.openBasket()}
      aria-label={`Basket: ${count} items, ${currency(subtotal)}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-cream"
    >
      <span
        key={bump}
        className={
          bump ? "cart-bump inline-flex items-center gap-2" : "inline-flex items-center gap-2"
        }
      >
        <ShoppingBag className="size-4" aria-hidden />
        Basket
        <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
          {count}
        </span>
      </span>
    </button>
  );
}

function BasketSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, setQuantity, count, subtotal } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l-0 bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Your order
          </p>
          <SheetTitle className="font-display text-4xl font-semibold">Basket</SheetTitle>
          <SheetDescription>
            {count === 0
              ? "Your basket is empty."
              : `${count} ${count === 1 ? "item" : "items"} ready for checkout.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <p className="py-10 text-sm text-muted-foreground">
              Add something from the menu — smash burgers, sides and drinks land here.
            </p>
          ) : (
            <ul className="space-y-6">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <MenuPhoto
                    item={{ id: l.menuItemId, category: "Mains" }}
                    className="size-16 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{l.name}</p>
                        {(l.options.length > 0 || l.note) && (
                          <p className="text-xs text-muted-foreground">
                            {[...l.options, l.note].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {currency(l.unitPrice * l.quantity)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Remove one ${l.name}`}
                        onClick={() => setQuantity(l.key, l.quantity - 1)}
                        className="grid size-9 place-items-center rounded-full bg-secondary"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold" aria-live="polite">
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${l.name}`}
                        onClick={() => setQuantity(l.key, Math.min(20, l.quantity + 1))}
                        className="grid size-9 place-items-center rounded-full bg-secondary"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display text-2xl font-semibold">{currency(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Collection or delivery fees appear at checkout.
          </p>
          <Link
            to="/checkout"
            onClick={() => onOpenChange(false)}
            className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            Continue to checkout →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
