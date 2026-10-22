import { createFileRoute, Link } from "@tanstack/react-router";
import burger from "@/assets/food-mains.jpg";
import { PublicShell } from "@/components/PublicShell";
import { SLOGAN } from "@/components/site-info";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Stacked Foods" },
      {
        name: "description",
        content:
          "Stacked Foods is a mobile food trailer serving smash burgers and gas-fired pizzas. Bold, halaal flavour wherever we go.",
      },
      { property: "og:title", content: "About — Stacked Foods" },
      {
        property: "og:description",
        content: "Smash burgers, gas-fired pizzas, and catering across Johannesburg.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">About us</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Stacked Foods
        </h1>
        <img
          src={burger}
          alt="A Stacked Foods smash burger with melted cheddar and pickles"
          width={1600}
          height={1200}
          className="mx-auto mt-10 w-full max-w-xl rounded-3xl object-cover"
        />
        <div className="mt-10 space-y-5 text-left text-base leading-relaxed text-foreground/90 sm:text-lg">
          <p>Stacked Foods is a mobile food trailer serving smash burgers and gas-fired pizzas.</p>
          <p>
            Our burgers are made with freshly ground beef, unique ingredients and in-house sauces,
            served on lightly toasted buns.
          </p>
          <p>
            Our pizzas are cooked in a gas-fired oven and topped with fresh ingredients bursting
            with flavour.
          </p>
          <p>
            We cater to pop-ups, campus events, private functions and corporate gatherings —
            bringing bold, halaal flavour wherever we go.
          </p>
        </div>
        <p className="mt-10 font-display text-2xl font-semibold tracking-tight">{SLOGAN}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            search={{}}
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Log in to order
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center rounded-full bg-secondary px-6 text-sm font-semibold"
          >
            Contact
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
