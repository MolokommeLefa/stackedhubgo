import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div id="main-content" className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5" aria-label="StackedHub home">
          <BrandMark />
          <span className="text-xl font-bold tracking-tight">StackedHub</span>
        </Link>
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const primaryBtnClass =
  "min-h-11 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60";
