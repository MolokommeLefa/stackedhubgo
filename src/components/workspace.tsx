import type { ReactNode } from "react";
import { formatTimeAgo } from "@/lib/mock-data";
import type { OrderStatus } from "@/lib/types";

export const wsField =
  "min-h-11 w-full rounded-2xl bg-secondary px-4 text-sm outline-none disabled:opacity-60";
export const wsBtnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60";
export const wsBtnGhost =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-secondary px-4 text-sm font-semibold";

export function greeting(name: string) {
  const first = name.split(" ")[0] || name;
  const hour = new Date().getHours();
  const when = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${when}, ${first}`;
}

export function timeAgo(iso: string) {
  return formatTimeAgo(iso);
}

export const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  Placed: "In kitchen",
  "In kitchen": "Ready",
  Ready: "Completed",
  Completed: null,
  Cancelled: null,
};

export const actionLabel: Partial<Record<OrderStatus, string>> = {
  "In kitchen": "Accept order",
  Ready: "Mark as ready",
  Completed: "Complete order",
};

export const statusAccent: Record<string, string> = {
  Placed: "bg-primary",
  "In kitchen": "bg-warning",
  Ready: "bg-success",
  Completed: "bg-muted-foreground/35",
  Cancelled: "bg-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  dark,
}: {
  label: string;
  value: string;
  hint?: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? "rounded-3xl bg-brand p-5 text-cream" : "surface-card rounded-3xl p-5"}>
      <p
        className={
          dark
            ? "text-[11px] font-semibold tracking-[0.14em] text-cream/65 uppercase"
            : "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
        }
      >
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p className={dark ? "mt-1 text-xs text-cream/70" : "mt-1 text-xs text-muted-foreground"}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto border-b border-border"
      role="tablist"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={
            value === option.id
              ? "min-h-11 shrink-0 border-b-2 border-primary px-4 text-sm font-semibold"
              : "min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-full bg-card px-4 ring-1 ring-border">
      <span className="sr-only">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
    </label>
  );
}

export function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-[background-color,border-color,opacity] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-70 ${
        checked ? "border-primary bg-primary" : "border-brand bg-brand"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] left-[3px] size-[22px] rounded-full bg-cream shadow-md ring-1 ring-black/15 transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-secondary px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function Initials({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
