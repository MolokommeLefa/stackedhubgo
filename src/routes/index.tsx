import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, MapPin } from "lucide-react";
import hero from "@/assets/hero-spread.jpg";
import { CustomerShell } from "@/components/CustomerShell";
import { getMenu } from "@/lib/data";
import { imageFor } from "@/lib/menu-extras";
import { Button } from "@/components/ui/button";
import { LoadState } from "@/components/AppShell";
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
      <section className="relative isolate flex min-h-[340px] items-center overflow-hidden bg-hero-overlay lg:min-h-[410px]">
        <img src={hero} alt="A spread of burgers, chakalaka fries, bunny chow and lemonade" width={1600} height={912} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay/65" />
        <div className="mx-auto w-full max-w-6xl px-6 py-10 text-hero-foreground">
          <p className="text-xs font-semibold uppercase">South African street food</p>
          <h1 className="mt-3 text-4xl font-extrabold lg:text-5xl">Stacked Foods</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed">Your favourites, stacked high. Burgers, bunny chow and loaded fries — made for a proper appetite.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/order">Explore the menu <ArrowRight /></Link></Button>
          <p className="mt-5 flex items-center gap-2 text-sm"><MapPin className="size-4" /> Collection or delivery</p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Customer favourites</h2>
          <Link to="/order" className="text-sm font-semibold text-primary">Full menu</Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {menu.loading &&
            [0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-card" />)}
          {featured.map((item) => (
            <Link key={item.id} to="/order" className="overflow-hidden rounded-3xl bg-card transition-shadow hover:shadow-lg">
              <img src={imageFor(item)} alt={item.name} loading="lazy" width={768} height={768} className="aspect-[4/3] w-full object-cover" />
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
        <LoadState loading={false} error={menu.error} onRetry={() => void menu.reload()} />
      </section>
    </CustomerShell>
  );
}
