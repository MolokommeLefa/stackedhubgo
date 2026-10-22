import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { PHONE_DISPLAY, PHONE_HREF, WHATSAPP_DISPLAY, WHATSAPP_HREF } from "@/components/site-info";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Stacked Foods" },
      {
        name: "description",
        content: "Call or WhatsApp Stacked Foods to order or enquire about catering.",
      },
      { property: "og:title", content: "Contact — Stacked Foods" },
      { property: "og:description", content: "Phone 073 330 9881 or WhatsApp 079 279 0592." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Get in touch
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Contact
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Call or message us to order, book catering, or ask where the trailer is today. There is no
          contact form on this page — the numbers below open your phone or WhatsApp.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={PHONE_HREF}
            className="surface-card flex flex-col items-start rounded-3xl p-6 transition-shadow hover:shadow-md"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-brand">
              <Phone className="size-5" aria-hidden />
            </span>
            <span className="mt-5 text-sm font-semibold text-muted-foreground">Phone</span>
            <span className="mt-1 font-display text-2xl font-semibold">{PHONE_DISPLAY}</span>
            <span className="mt-4 text-sm font-semibold text-primary">Tap to call</span>
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="surface-card flex flex-col items-start rounded-3xl p-6 transition-shadow hover:shadow-md"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-brand">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <span className="mt-5 text-sm font-semibold text-muted-foreground">WhatsApp</span>
            <span className="mt-1 font-display text-2xl font-semibold">{WHATSAPP_DISPLAY}</span>
            <span className="mt-4 text-sm font-semibold text-primary">Open WhatsApp</span>
          </a>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Looking for the trailer? See{" "}
          <Link to="/directions" className="font-semibold text-primary">
            opening hours and directions
          </Link>
          .
        </p>
      </div>
    </PublicShell>
  );
}
