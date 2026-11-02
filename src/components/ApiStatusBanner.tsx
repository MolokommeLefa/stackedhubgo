import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  checkApiConnection,
  getApiConnectionState,
  subscribeToApiState,
  type ApiConnectionState,
} from "@/lib/api-client";

/** App-wide outage notice. It stays visible until a health check succeeds. */
export function ApiStatusBanner() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ApiConnectionState>(getApiConnectionState());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToApiState(setState);
    if (getApiConnectionState() !== "online") {
      void checkApiConnection();
    }
    return unsubscribe;
  }, []);

  const retry = async () => {
    setChecking(true);
    const recovered = await checkApiConnection();
    if (recovered) {
      await queryClient.invalidateQueries();
    }
    setChecking(false);
  };

  if (state !== "offline") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm"
    >
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        Can't reach the restaurant system — showing demo data
      </span>
      <button
        type="button"
        onClick={retry}
        disabled={checking}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-amber-400 bg-white px-4 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Checking…" : "Retry"}
      </button>
    </div>
  );
}
