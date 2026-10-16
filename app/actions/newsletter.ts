"use server";

import { headers } from "next/headers";
import { getSettings } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { real } from "@/lib/format";
import { newsletterWelcomeEmail } from "@/lib/member-emails";
import { emailContext } from "@/lib/members";
import { newsletterConsentText } from "@/lib/newsletter";
import { fullAddress, hasRealAddress } from "@/lib/site";
import { hashIp } from "@/lib/spam";
import { getPublicClient } from "@/lib/supabase/public";

export interface NewsletterState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
  submissionId: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 1500;

function str(formData: FormData, key: string, max: number): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** The footer "Stay in the loop" box: saves the sign-up, then sends a welcome email. */
export async function subscribeNewsletter(prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const submissionId = prev.submissionId + 1;
  const fail = (message: string, fieldErrors: Record<string, string> = {}): NewsletterState => ({
    status: "error",
    message,
    fieldErrors,
    submissionId,
  });
  const success: NewsletterState = {
    status: "success",
    message: "You're on the list! Check your inbox for a welcome email.",
    fieldErrors: {},
    submissionId,
  };

  // Spam traps: bots that fill the hidden field get a fake "success".
  if (str(formData, "company_website", 200)) return success;
  const startedAt = Number(formData.get("started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return fail("That was quick! Please press the button again.");
  }

  const email = str(formData, "email", 200).toLowerCase();
  const name = str(formData, "first_name", 60);
  const source = str(formData, "source", 200).replace(/[^\w\-/#?=&.%]/g, "").slice(0, 200);
  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (formData.get("consent") !== "yes") errors.consent = "Please tick the box so we have your permission to email you.";
  if (Object.keys(errors).length) return fail(errors.email ?? errors.consent, errors);

  const db = getPublicClient();
  const formSecret = process.env.FORM_SECRET;
  if (!db || !formSecret) {
    console.warn("[newsletter] FORM_SECRET or Supabase is not set, so sign-ups can't be saved.");
    return fail("Sorry, sign-ups aren't working right now. Please try again later.");
  }

  const settings = await getSettings();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || null;

  const { data, error } = await db.rpc("newsletter_subscribe", {
    p_secret: formSecret,
    p_email: email,
    p_first_name: name || null,
    p_source: source || null,
    p_consent_text: newsletterConsentText(settings.business_name),
    p_ip_hash: ip ? hashIp(ip) : null,
  });
  if (error) {
    console.error("[newsletter] save failed:", error.message);
    return fail("Sorry, we couldn't sign you up right now. Please try again in a minute.");
  }
  const result = (data ?? {}) as { status?: string; id?: string; welcome_sent?: boolean };
  if (result.status === "rate_limited") {
    return fail("You've tried a few times already. Please wait a few minutes and try again.");
  }

  // Welcome email (only once per person).
  if (result.id && !result.welcome_sent) {
    try {
      const ctx = await emailContext();
      const welcome = newsletterWelcomeEmail({
        business: ctx.business,
        firstName: name || null,
        address: hasRealAddress(settings) ? fullAddress(settings) : null,
      });
      const sent = await sendEmail({
        to: email,
        ...welcome,
        from: ctx.from,
        replyTo: ctx.replyTo ?? real(settings.public_email) ?? undefined,
        idempotencyKey: `newsletter-welcome-${result.id}`,
      });
      if (sent.ok) {
        const { error: markError } = await db.rpc("newsletter_mark_welcomed", { p_secret: formSecret, p_id: result.id });
        if (markError) console.error("[newsletter] couldn't mark as welcomed:", markError.message);
      } else {
        console.error("[newsletter] welcome email failed:", sent.error);
      }
    } catch (err) {
      console.error("[newsletter] welcome email error:", err instanceof Error ? err.message : err);
    }
  }

  return success;
}
