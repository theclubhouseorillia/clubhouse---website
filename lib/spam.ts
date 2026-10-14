import "server-only";
import { createHash } from "node:crypto";

/** One-way hash of the visitor's IP so we can rate-limit without storing it. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "website";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function turnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

/** Verifies a Cloudflare Turnstile token. Returns true when Turnstile isn't set up. */
export async function verifyTurnstile(token: string | null, ip: string | null): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
