import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthCard, fieldClass, primaryBtnClass } from "@/components/AuthCard";
import { homeRouteForRole, useAuth } from "@/lib/auth";
import { isLiveApi } from "@/lib/api-client";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — StackedHub" },
      { name: "description", content: "Register a StackedHub customer account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => setLive(isLiveApi()), []);
  useEffect(() => {
    if (ready && user) void navigate({ to: homeRouteForRole(user.role) });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextError = validateName(name) ?? validateEmail(email) ?? validatePassword(password);
    if (nextError) {
      setError(nextError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const next = await register({ name: name.trim(), email: email.trim(), password });
      void navigate({ to: homeRouteForRole(next.role) });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the account. Try a different email or sign in instead.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create an account" subtitle="Customer accounts can order from the portal.">
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={fieldClass} />
        </label>
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
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className={fieldClass}
          />
        </label>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className={primaryBtnClass}>
          {busy ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        {live ? "This will create a customer on the API." : "Demo mode stores this account in this browser only."}{" "}
        <Link to="/" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
