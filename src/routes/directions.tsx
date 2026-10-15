import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import {
  ADDRESS_LINES,
  DIRECTIONS_HREF,
  OPENING_HOURS,
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_DISPLAY,
  WHATSAPP_HREF,
} from "@/components/site-info";

export const Route = createFileRoute("/directions")({
  head: () => ({
    meta: [
      { title: "Directions & hours — Stacked Foods" },
      {
        name: "description",
        content:
          "Find Stacked Foods on Hendrik Potgieter Road, Weltevredenpark, Johannesburg, 1709.",
      },
      { property: "og:title", content: "Directions & hours — Stacked Foods" },
      {
        property: "og:description",
        content: "Opening hours and directions to the Stacked Foods trailer.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DirectionsPage,
});

function DirectionsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Visit us</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Hours & directions
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Visit us or order for collection from the trailer.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-brand p-6 text-cream sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-cream/70">
              <Clock className="size-4" aria-hidden />
              Opening hours
            </p>
            <ul className="mt-6 space-y-2">
              {OPENING_HOURS.map((row) => (
                <li
                  key={row.days}
                  className="flex items-center justify-between gap-4 rounded-full bg-cream/10 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{row.days}</span>
                  <span className="font-semibold">{row.hours}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-4">
            <section className="surface-card rounded-3xl p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                Location
              </p>
              <p className="mt-3 font-display text-2xl font-semibold">Stacked Foods</p>
              <address className="mt-2 text-sm leading-relaxed text-muted-foreground not-italic">
                {ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </section>
            <a href={PHONE_HREF} className="surface-card block rounded-3xl p-6">
              <p className="text-sm font-semibold text-muted-foreground">Phone</p>
              <p className="mt-2 text-lg font-semibold">{PHONE_DISPLAY}</p>
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="surface-card block rounded-3xl p-6"
            >
              <p className="text-sm font-semibold text-muted-foreground">WhatsApp</p>
              <p className="mt-2 text-lg font-semibold">{WHATSAPP_DISPLAY}</p>
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={DIRECTIONS_HREF}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Get directions
          </a>
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-12 items-center rounded-full bg-secondary px-6 text-sm font-semibold"
          >
            Call the trailer
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
