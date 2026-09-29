import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, fieldClass, primaryBtnClass } from "@/components/AuthCard";
import { apiRequest, endpoints, isLiveApi } from "@/lib/api-client";
import { validateEmail } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — StackedHub" },
      { name: "description", content: "Request a StackedHub password reset." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isLiveApi()) {
        await apiRequest(endpoints.forgotPassword, {
          method: "POST",
          body: JSON.stringify({ email: email.trim() }),
        });
      }
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit the reset request. Check the API connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the email on the account. This prototype does not send a real email."
    >
      {done ? (
        <p className="mt-6 rounded-xl bg-success/15 px-4 py-3 text-sm" role="status">
          If that email is registered, a reset link would be sent. Check with your admin if you still cannot sign in.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} className={primaryBtnClass}>
            {busy ? "Sending…" : "Send reset request"}
          </button>
        </form>
      )}
      <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
