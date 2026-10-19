import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { markAllRead, useEngagement } from "@/lib/engagement";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const list = useEngagement((s) => s.notifications.filter((n) => n.userId === userId)) ?? [];
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead(userId);
        }}
        className="relative inline-flex size-11 items-center justify-center rounded-full text-cream/80 hover:text-cream"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-border bg-card p-2 text-foreground shadow-lg">
          <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Notifications
          </p>
          {list.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No updates yet. Order updates and rewards will show here.
            </p>
          )}
          <ul className="max-h-80 overflow-auto">
            {list.slice(0, 12).map((n) => (
              <li key={n.id} className="rounded-xl px-2 py-2 hover:bg-secondary">
                {n.orderId ? (
                  <Link
                    to="/track/$reference"
                    params={{ reference: n.orderId }}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {new Date(n.at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
