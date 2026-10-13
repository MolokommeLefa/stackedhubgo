import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Flame, MapPin } from "lucide-react";
import hero from "@/assets/hero-spread.jpg";
import { CustomerShell } from "@/components/CustomerShell";
import { getMenu } from "@/lib/data";
import { categoryImage } from "@/lib/menu-extras";
import { currency } from "@/lib/mock-data";
import { useLoad } from "@/lib/use-load";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stacked Foods — Order burgers, bunny chow & more" },
      { name: "description", content: "Order peri-peri chicken, smash burgers, bunny chow and chakalaka fries from Stacked Foods for collection or delivery." },
      { property: "og:title", content: "Stacked Foods — Order online" },
      { property: "og:description", content: "Proudly South African street food. Order for collection or delivery in a few taps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const menu = useLoad(getMenu, []);
  const featured = menu.data.filter((m) => m.available).slice(0, 3);

  return (
    <CustomerShell>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 lg:grid-cols-2 lg:items-center lg:pt-14">
        <div>
          <p className="text-sm font-semibold text-primary">Proudly South African street food</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight lg:text-5xl">Stacked high. Made fresh. Ready fast.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Peri-peri chicken, smash burgers, bunny chow and loaded chakalaka fries — order in a few taps for collection or delivery.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/order" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground">
              Order now
            </Link>
            <Link to="/order" className="inline-flex min-h-12 items-center rounded-xl bg-card px-6 text-sm font-semibold">
              View menu
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><Clock className="size-4" aria-hidden /> Ready in about 15 min</li>
            <li className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden /> Collection or delivery</li>
          </ul>
        </div>
        <img src={hero} alt="A spread of Stacked Foods burgers, chakalaka fries, bunny chow and lemonade" width={1600} height={912} className="w-full rounded-3xl object-cover" />
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Customer favourites</h2>
          <Link to="/order" className="text-sm font-semibold text-primary">Full menu</Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {menu.loading &&
            [0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-card" />)}
          {featured.map((item) => (
            <Link key={item.id} to="/order" className="overflow-hidden rounded-3xl bg-card transition-shadow hover:shadow-lg">
              <img src={categoryImage[item.category]} alt={item.name} loading="lazy" width={944} height={704} className="aspect-[4/3] w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <p className="font-bold">{currency(item.price)}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                {item.spicy && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive"><Flame className="size-3" aria-hidden /> Spicy</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </CustomerShell>
  );
}
