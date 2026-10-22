import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import burger from "@/assets/food-mains.jpg";
import { BrandMark } from "@/components/BrandMark";
import { SLOGAN } from "@/components/site-info";

const [sloganLead, sloganTail] = SLOGAN.split(". ");

export function StandaloneWelcome() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const previous = meta.getAttribute("content");
    if (previous != null && !previous.includes("viewport-fit=cover")) {
      meta.setAttribute("content", `${previous}, viewport-fit=cover`);
    }
    return () => {
      if (previous != null) meta.setAttribute("content", previous);
    };
  }, []);

  return (
    <main
      id="main-content"
      className="relative isolate flex h-dvh max-h-dvh flex-col overflow-hidden bg-brand text-cream"
      style={{
        paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.35rem))",
        paddingRight: "max(1.5rem, calc(env(safe-area-inset-right) + 0.5rem))",
        paddingBottom: "max(1.35rem, calc(env(safe-area-inset-bottom) + 0.45rem))",
        paddingLeft: "max(1.5rem, calc(env(safe-area-inset-left) + 0.5rem))",
      }}
    >
      <style>{`
        @keyframes standalone-welcome-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .standalone-welcome-in {
          animation: standalone-welcome-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .standalone-hero {
          object-fit: cover;
          object-position: center 46%;
        }
        @media (max-height: 700px) {
          .standalone-hero { object-position: center 50%; }
        }
        @media (min-height: 800px) {
          .standalone-hero { object-position: center 40%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .standalone-welcome-in { animation: none; }
        }
      `}</style>

      <img
        src={burger}
        alt="A double smash burger with melted cheddar on a toasted bun"
        width={1600}
        height={1200}
        className="standalone-hero pointer-events-none absolute inset-0 size-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-brand/80 via-brand/35 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/80 via-brand/70 to-transparent"
      />

      <div className="standalone-welcome-in relative z-10 flex items-center gap-3.5">
        <BrandMark className="size-14 shrink-0" onDark />
        <p className="font-display text-[1.7rem] leading-none font-semibold tracking-tight">
          Stacked Foods
        </p>
      </div>

      <div className="relative z-10 mt-auto w-full max-w-md">
        <h1
          className="standalone-welcome-in font-display text-[clamp(2.65rem,11.5vw,4.25rem)] leading-[0.9] font-semibold tracking-[-0.03em] text-cream"
          style={{ animationDelay: "80ms" }}
        >
          <span className="block">{sloganLead}.</span>
          <span className="block">{sloganTail}</span>
        </h1>
        <Link
          to="/login"
          search={{}}
          className="standalone-welcome-in mt-7 inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_color-mix(in_oklab,var(--color-primary)_85%,black)] active:scale-[0.985] active:bg-primary/90"
          style={{ animationDelay: "150ms" }}
        >
          Get Started
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    </main>
  );
}
