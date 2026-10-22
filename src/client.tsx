import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Client entry only. TanStack Start never loads this module during SSR.
let serviceWorkerRegistered = false;

if (typeof window !== "undefined" && "serviceWorker" in navigator && !serviceWorkerRegistered) {
  serviceWorkerRegistered = true;
  void navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.warn("PWA registration failed", error);
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
