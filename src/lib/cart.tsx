import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cartTotals, type CartLine } from "./order-rules";

const KEY = "stackedhub.cart";

interface CartValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  bump: number;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore broken cart */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartValue>(() => {
    const { count, subtotal } = cartTotals(lines);
    return {
      lines,
      count,
      subtotal,
      bump,
      add: (line) => {
        const key = `${line.menuItemId}|${[...line.options].sort().join(",")}|${line.note ?? ""}`;
        setLines((prev) => {
          const existing = prev.find((l) => l.key === key);
          if (existing)
            return prev.map((l) =>
              l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l,
            );
          return [...prev, { ...line, key }];
        });
        setBump((b) => b + 1);
      },
      setQuantity: (key, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
        ),
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    };
  }, [lines, bump]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
