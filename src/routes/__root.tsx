import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card page-enter max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto grid size-14 animate-pulse place-items-center rounded-2xl bg-primary/10 text-2xl">
          🚧
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">Still in development</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is being built and will be available soon. Check back later or head back to the
          dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
          <Link
            to="/login"
            search={{}}
            className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
          >
            Sign in page
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Stacked Foods — Stacked high. Tastes higher." },
      {
        name: "description",
        content:
          "Stacked Foods smash burgers and gas-fired pizzas, with StackedHub for orders, menu, staff and reporting.",
      },
      { name: "author", content: "Stacked Foods" },
      { property: "og:title", content: "Stacked Foods — Stacked high. Tastes higher." },
      {
        property: "og:description",
        content:
          "Stacked Foods smash burgers and gas-fired pizzas, with StackedHub for orders, menu, staff and reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="flex min-h-screen flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full border-t border-border bg-card py-6 mt-auto">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Stacked Foods. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm font-medium">
                <a 
                  href="https://www.instagram.com/bruv_burger" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-[#E1306C]"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
                <a 
                  href="https://wa.me/27782941439" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-[#25D366]"
                  aria-label="WhatsApp"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </footer>
          <Scripts />
        </body>
      </html>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}