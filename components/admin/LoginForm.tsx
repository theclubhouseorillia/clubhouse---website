"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.includes("@")) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) {
          setError(
            /invalid/i.test(signInError.message)
              ? "That email and password don't match. Please try again."
              : signInError.message,
          );
          return;
        }
        router.replace("/admin");
        router.refresh();
      } else {
        const redirectTo = `${window.location.origin}/admin/auth/callback?next=/admin/account`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setMessage("If that email has an account, a password reset link is on its way. Open it on this device.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="login-email" className="field-label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </div>
      {mode === "signin" && (
        <div>
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>
      )}

      <div role="status" aria-live="polite">
        {error && <p className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {message && <p className="rounded-[3px] border border-gold/50 bg-forest px-4 py-3 text-sm text-cream">{message}</p>}
      </div>

      <button type="submit" className="btn btn-gold w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Email me a reset link"}
      </button>

      <button
        type="button"
        className="link-gold self-center py-2 text-sm"
        onClick={() => {
          setMode(mode === "signin" ? "forgot" : "signin");
          setError(null);
          setMessage(null);
        }}
      >
        {mode === "signin" ? "Forgot your password?" : "Back to sign in"}
      </button>
    </form>
  );
}
