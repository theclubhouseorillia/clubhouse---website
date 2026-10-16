import "server-only";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/**
 * The EMAIL_FROM address with a different display name, e.g. so customer
 * emails come from "The Clubhouse Bar & Golf Sim <website@…>".
 */
export function fromWithName(name: string): string | undefined {
  const from = process.env.EMAIL_FROM;
  if (!from) return undefined;
  const address = from.match(/<([^>]+)>/)?.[1] ?? from.trim();
  const safeName = name.replace(/["<>]/g, "").trim();
  return safeName ? `${safeName} <${address}>` : address;
}

/** Sends an email through Resend (resend.com). */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Overrides EMAIL_FROM (must use the same verified domain). */
  from?: string;
  /** ISO time to deliver later (Resend scheduled sending). */
  scheduledAt?: string;
  /** Stops duplicate sends if the same email is attempted twice within 24 hours. */
  idempotencyKey?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = options.from || process.env.EMAIL_FROM;
  if (!key || !from) {
    return { ok: false, error: "Email is not configured (set RESEND_API_KEY and EMAIL_FROM)." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
        ...(options.scheduledAt ? { scheduled_at: options.scheduledAt } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend responded ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}
