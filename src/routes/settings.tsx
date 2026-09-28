import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { endpoints, getApiBaseUrl, setApiBaseUrl } from "@/lib/api-client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "API Connection — StackedHub" },
      { name: "description", content: "Connect StackedHub to the Stacked Foods ASP.NET Core API." },
      { property: "og:title", content: "API Connection — StackedHub" },
      { property: "og:description", content: "Connect StackedHub to the Stacked Foods ASP.NET Core API." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setUrl(getApiBaseUrl()), []);

  const test = async () => {
    const clean = url.trim().replace(/\/+$/, "");
    if (!clean) return setStatus({ ok: false, text: "Enter the API address first." });
    try {
      const res = await fetch(`${clean}${endpoints.health}`);
      setStatus(res.ok ? { ok: true, text: "The API answered — you're good to go." } : { ok: false, text: `The API answered with an error (${res.status}).` });
    } catch {
      setStatus({ ok: false, text: "Couldn't reach the API. Check it's running and the address is right." });
    }
  };

  const save = () => {
    setApiBaseUrl(url);
    // Signing in again is required: demo tokens don't work against the real API.
    window.localStorage.removeItem("stackedhub.user");
    window.localStorage.removeItem("stackedhub.jwt");
    window.location.href = "/";
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Connect the API</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste the address where the StackedHub API is running. Leave it empty to use demo data.
        </p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:5032"
          className="mt-6 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        {status && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${status.ok ? "bg-success/15" : "bg-destructive/10 text-destructive"}`}>
            {status.text}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={test} className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold">
            Test connection
          </button>
          <button onClick={save} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Save & sign in again
          </button>
        </div>
        <div className="mt-6 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Running it on your computer</p>
          <p className="mt-1">
            In the backend folder run <code>dotnet run --project StackedHub.Api</code>, then use{" "}
            <code>http://localhost:5032</code>. Demo logins: thandi@stackedfoods.co.za (Admin),
            jason@stackedfoods.co.za (Staff), password <code>Stacked123!</code>.
          </p>
        </div>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
          ← Back
        </Link>
      </div>
    </div>
  );
}
