import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { fieldClass, primaryBtnClass } from "@/components/AuthCard";
import { endpoints, getApiBaseUrl, setApiBaseUrl, tokenStore } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

/** Hosted Azure Web API (deployed by .github/workflows/deploy-api.yml). */
export const HOSTED_API_URL = "https://stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StackedHub" },
      { name: "description", content: "Profile and API connection for StackedHub." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut, ready } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Pre-fill the hosted Azure API unless a custom address is already saved.
  useEffect(() => setUrl(getApiBaseUrl() || HOSTED_API_URL), []);

  const test = async () => {
    const clean = url.trim().replace(/\/+$/, "");
    if (!clean) return setStatus({ ok: false, text: "Enter the API address first." });
    setTesting(true);
    try {
      const res = await fetch(`${clean}${endpoints.health}`);
      setStatus(
        res.ok
          ? { ok: true, text: "The API answered — you're good to go." }
          : { ok: false, text: `The API answered with an error (${res.status}). Check the path and try again.` },
      );
    } catch {
      setStatus({
        ok: false,
        text: "Couldn't reach the API. Confirm it is running and that the address includes http://.",
      });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    setApiBaseUrl(url);
    window.localStorage.removeItem("stackedhub.user");
    tokenStore.clear();
    window.location.href = "/";
  };

  return (
    <div id="main-content" className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {ready && user && (
          <section className="rounded-3xl bg-card p-8 shadow-sm">
            <h1 className="text-2xl font-bold">Your profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.role}.</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                signOut();
                void navigate({ to: "/" });
              }}
              className="mt-4 min-h-11 rounded-xl bg-secondary px-4 text-sm font-semibold"
            >
              Sign out
            </button>
          </section>
        )}

        <section className="rounded-3xl bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-lg font-bold">StackedHub</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold">Connect the API</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The hosted Azure API is filled in below. Test the connection, then save to sign in with live data. Clear it
            to use demo data instead.
          </p>
          <label className="mt-6 block text-xs font-medium text-muted-foreground">
            API base URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={HOSTED_API_URL}
              className={fieldClass}
            />
          </label>
          {status && (
            <p
              className={`mt-3 rounded-xl px-3 py-2 text-sm ${status.ok ? "bg-success/15" : "bg-destructive/10 text-destructive"}`}
              role="status"
            >
              {status.text}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={() => void test()}
              className="min-h-11 flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {testing ? "Testing…" : "Test connection"}
            </button>
            <button type="button" onClick={save} className={`${primaryBtnClass} flex-1`}>
              Save & sign in again
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setUrl(HOSTED_API_URL);
              setStatus(null);
            }}
            className="mt-3 min-h-11 text-xs font-semibold text-primary"
          >
            Use hosted API address
          </button>
          <div className="mt-4 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Hosted API</p>
            <p className="mt-1">
              The StackedHub API runs on Azure at{" "}
              <code className="break-all">stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net</code>.
              Demo logins: thandi@stackedfoods.co.za (Admin), jason@stackedfoods.co.za (Staff),
              priya.nair@example.co.za (Customer), password <code>Stacked123!</code>.
            </p>
          </div>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
            ← Back to sign in
          </Link>
        </section>
      </div>
    </div>
  );
}
