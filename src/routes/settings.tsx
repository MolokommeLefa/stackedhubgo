import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { wsBtnGhost, wsBtnPrimary, wsField } from "@/components/workspace";
import { endpoints, getApiBaseUrl, isLiveApi, setApiBaseUrl, tokenStore } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

/** Hosted Azure Web API (deployed by .github/workflows/deploy-api.yml). */
export const HOSTED_API_URL =
  "https://stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net";

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
  const [confirmLeave, setConfirmLeave] = useState(false);
  const demoMode = !isLiveApi();

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
          : {
              ok: false,
              text: `The API answered with an error (${res.status}). Check the path and try again.`,
            },
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

  const requestSave = () => {
    const leavingDemo = demoMode && url.trim().length > 0;
    if (leavingDemo) {
      setConfirmLeave(true);
      return;
    }
    save();
  };

  const body = (
    <>
      {user && (
        <Panel title="Personal details">
          <p className="mb-4 text-sm text-muted-foreground">
            Signed in as {user.role}. Keep your collection details up to date with the kitchen.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Name
              </dt>
              <dd className="mt-1 text-sm font-semibold">{user.name}</dd>
            </div>
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Email
              </dt>
              <dd className="mt-1 text-sm font-semibold">{user.email}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              signOut();
              void navigate({ to: "/login", search: {} });
            }}
            className={`${wsBtnGhost} mt-4`}
          >
            Sign out
          </button>
        </Panel>
      )}

      <Panel title="API connection">
        {demoMode ? (
          <p className="mb-4 rounded-2xl bg-secondary px-4 py-3 text-sm" role="status">
            <span className="font-semibold text-foreground">Demo mode</span>
            <span className="mt-1 block text-muted-foreground">
              This tab is using local demo data. The hosted API address is prefilled for testing.
              Saving it will leave demo mode.
            </span>
          </p>
        ) : (
          <p className="mb-4 rounded-2xl bg-secondary px-4 py-3 text-sm" role="status">
            <span className="font-semibold text-foreground">Live API</span>
            <span className="mt-1 block text-muted-foreground">
              The app is connected to a hosted API. Clear the address and save to return to demo
              data.
            </span>
          </p>
        )}
        <p className="mb-4 text-sm text-muted-foreground">
          The hosted Azure API is filled in below. Test the connection, then save to sign in with
          live data. Clear it to use demo data instead.
        </p>
        <label className="block text-xs font-semibold text-muted-foreground">
          API base URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={HOSTED_API_URL}
            className={`${wsField} mt-1`}
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={testing}
            onClick={() => void test()}
            className={wsBtnGhost}
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          <button type="button" onClick={requestSave} className={wsBtnPrimary}>
            Save & sign in again
          </button>
        </div>
        {confirmLeave && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-demo-title"
          >
            <div className="w-full max-w-md rounded-[2rem] bg-card p-6 shadow-xl">
              <h2 id="leave-demo-title" className="font-display text-2xl font-semibold">
                Leave demo mode?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Saving this API address will switch StackedHub from local demo data to the hosted
                API. The app may then read or write shared live data. Demo orders in this tab will
                no longer be used.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setConfirmLeave(false)} className={wsBtnGhost}>
                  Stay in demo
                </button>
                <button type="button" onClick={save} className={wsBtnPrimary}>
                  Leave demo mode
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="mt-4 rounded-2xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Hosted API</p>
          <p className="mt-1">
            The StackedHub API runs on Azure at{" "}
            <code className="break-all">
              stackedhub-api-2026-hxh8cdbuhzcbhbhg.uaenorth-01.azurewebsites.net
            </code>
            . Demo logins: thandi@stackedfoods.co.za (Admin), jason@stackedfoods.co.za (Staff),
            priya.nair@example.co.za (Customer), password <code>Stacked123!</code>.
          </p>
        </div>
      </Panel>
    </>
  );

  if (ready && user) {
    return (
      <AppShell
        title="Profile & settings"
        subtitle="Account"
        allow={["Admin", "Staff", "Customer"]}
      >
        {body}
      </AppShell>
    );
  }

  return (
    <div id="main-content" className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-lg font-bold">StackedHub</span>
        </div>
        {body}
        <Link
          to="/login"
          search={{}}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
