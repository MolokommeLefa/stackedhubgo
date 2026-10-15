import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Sparkles } from "lucide-react";
import burger from "@/assets/food-mains.jpg";
import sides from "@/assets/food-sides.jpg";
import { PublicShell } from "@/components/PublicShell";
import { SLOGAN } from "@/components/site-info";
import { homeRouteForRole, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stacked Foods — Smash burgers & gas-fired pizza" },
      {
        name: "description",
        content:
          "Stacked Foods is a Johannesburg mobile food trailer serving smash burgers and gas-fired pizzas. Bold, halaal flavour wherever we go.",
      },
      { property: "og:title", content: "Stacked Foods — Stacked high. Tastes higher." },
      {
        property: "og:description",
        content: "Smash burgers and gas-fired pizzas from a mobile food trailer. Log in to order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, ready } = useAuth();
  const orderHref = ready && user ? homeRouteForRole(user.role) : "/login";

  return (
    <PublicShell>
      <section className="relative isolate min-h-[32rem] overflow-hidden md:mx-4 md:mt-4 md:min-h-[36rem] md:rounded-[2rem] lg:min-h-[40rem]">
        <img
          src={burger}
          alt="A double smash burger with melted cheddar on a toasted bun"
          width={1600}
          height={1200}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/75" />
        <div className="relative z-10 mx-auto flex min-h-[32rem] max-w-6xl flex-col justify-end px-5 py-14 text-cream md:min-h-[36rem] lg:min-h-[40rem] lg:px-10 lg:py-20">
          <p className="text-xs font-semibold tracking-[0.2em] text-cream/75 uppercase">
            Made fresh in Johannesburg
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {SLOGAN.replace(". ", ".\n")
              .split("\n")
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </h1>
          <p className="mt-5 max-w-md text-base text-cream/85">
            Bold, halaal flavour wherever we go — smash burgers and gas-fired pizzas from a mobile
            food trailer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {orderHref === "/login" ? (
              <Link
                to="/login"
                search={{}}
                className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                Log in to order
              </Link>
            ) : (
              <Link
                to={orderHref}
                className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                {user?.role === "Customer" ? "Order now" : "Open workspace"}
              </Link>
            )}
            <Link
              to="/about"
              className="inline-flex min-h-12 items-center rounded-full bg-cream/15 px-6 text-sm font-semibold text-cream"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        <article className="surface-card overflow-hidden rounded-3xl">
          <img
            src={burger}
            alt="Smash burger with pickles and cheddar"
            width={944}
            height={704}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="p-5">
            <h2 className="font-display text-xl font-semibold">Smash burgers</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Freshly ground beef, unique ingredients and in-house sauces on a lightly toasted bun.
            </p>
          </div>
        </article>
        <article className="flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-3xl bg-brand p-6 text-cream">
          <h2 className="font-display text-xl font-semibold">Gas-fired pizzas</h2>
          <p className="mt-2 text-sm text-cream/80">
            Pizzas cooked in a gas-fired oven and topped with fresh ingredients bursting with
            flavour.
          </p>
        </article>
        <article className="surface-card overflow-hidden rounded-3xl">
          <img
            src={sides}
            alt="Loaded chakalaka fries in a paper tray"
            width={944}
            height={704}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="p-5">
            <h2 className="font-display text-xl font-semibold">Wherever we go</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We cater pop-ups, campus events, private functions and corporate gatherings.
            </p>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4">
        <div className="surface-card flex flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Sparkles className="size-4" aria-hidden />
              Ready when you are
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">
              Log in to browse the menu and place an order.
            </p>
            <ul className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden /> Collection from the trailer
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> Weltevredenpark, Johannesburg
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/directions"
              className="inline-flex min-h-12 items-center rounded-full bg-secondary px-5 text-sm font-semibold"
            >
              Opening hours
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center rounded-full bg-brand px-5 text-sm font-semibold text-cream"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
