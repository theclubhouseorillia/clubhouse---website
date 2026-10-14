"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (password.length < 10) {
      setError("Please use at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-5">
      <div>
        <label htmlFor="new-password" className="field-label">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
        <p className="mt-1.5 text-xs text-mist">At least 10 characters. A short phrase is easier to remember.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="field-label">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field"
        />
      </div>
      <div role="status" aria-live="polite">
        {error && <p className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {done && <p className="rounded-[3px] border border-gold/50 bg-forest px-4 py-3 text-sm text-cream">Password updated.</p>}
      </div>
      <button type="submit" className="btn btn-gold w-fit" disabled={busy}>
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
