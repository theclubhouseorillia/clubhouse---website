"use server";

import { headers } from "next/headers";
import { escapeHtml, sendEmail } from "@/lib/email";
import { formatLongDate, todayISO } from "@/lib/format";
import { hashIp, verifyTurnstile } from "@/lib/spam";
import { getPublicClient } from "@/lib/supabase/public";

export interface InquiryState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
  submissionId: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 3000;

function str(formData: FormData, key: string, max: number): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function submitInquiry(prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const submissionId = prev.submissionId + 1;
  const fail = (message: string, fieldErrors: Record<string, string> = {}): InquiryState => ({
    status: "error",
    message,
    fieldErrors,
    submissionId,
  });
  const success: InquiryState = {
    status: "success",
    message: "Thanks! Your message has been sent. We'll get back to you soon.",
    fieldErrors: {},
    submissionId,
  };

  const kind = formData.get("kind") === "event" ? "event" : "contact";

  // 1. Spam traps. Bots that fill the hidden field get a fake "success".
  if (str(formData, "company_website", 200)) return success;
  const startedAt = Number(formData.get("started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return fail("That was quick! Please check your details and press send again.");
  }

  // 2. Validate.
  const name = str(formData, "name", 120);
  const email = str(formData, "email", 200);
  const phone = str(formData, "phone", 40);
  const preferredDate = str(formData, "preferred_date", 10);
  const guestRaw = str(formData, "guest_count", 6);
  const pkg = str(formData, "package", 120);
  const message = str(formData, "message", 4000);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (phone && !/^[\d\s()+.\-x]{7,40}$/i.test(phone)) errors.phone = "Please enter a valid phone number.";

  let guestCount: number | null = null;
  if (kind === "event") {
    if (!phone) errors.phone = "Please enter a phone number so we can reach you.";
    if (preferredDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferred_date = "Please choose a valid date.";
      else if (preferredDate < todayISO()) errors.preferred_date = "Please choose a date in the future.";
    }
    if (guestRaw) {
      const n = Number(guestRaw);
      if (!Number.isInteger(n) || n < 1 || n > 1000) errors.guest_count = "Please enter a number of guests.";
      else guestCount = n;
    }
  } else if (message.length < 5) {
    errors.message = "Please enter a message.";
  }

  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  // 3. Bot check (if Cloudflare Turnstile is set up) and rate limit.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const token = formData.get("cf-turnstile-response");
  const human = await verifyTurnstile(typeof token === "string" ? token : null, ip);
  if (!human) return fail("We couldn't verify you're human. Please try again.");

  const ipHash = ip ? hashIp(ip) : null;

  // 3b. Save to the database so nothing is lost, even if email fails. The
  // database applies the rate limit (3 per visitor per 10 minutes) and tells
  // us where to send the notification. FORM_SECRET proves the request came
  // from this website.
  const db = getPublicClient();
  const formSecret = process.env.FORM_SECRET;
  let savedId: string | null = null;
  let recipient = process.env.INQUIRY_EMAIL || "";

  if (db && formSecret) {
    const { data, error } = await db.rpc("submit_inquiry", {
      p_secret: formSecret,
      p_kind: kind,
      p_name: name,
      p_email: email,
      p_phone: phone || null,
      p_preferred_date: kind === "event" && preferredDate ? preferredDate : null,
      p_guest_count: guestCount,
      p_package: kind === "event" && pkg ? pkg : null,
      p_message: message || null,
      p_ip_hash: ipHash,
    });
    if (error) {
      console.error("[inquiry] save failed:", error.message);
    } else {
      const result = (data ?? {}) as { status?: string; id?: string; recipient?: string | null };
      if (result.status === "rate_limited") {
        return fail("You've sent a few messages already. Please wait a few minutes or give us a call.");
      }
      savedId = result.id ?? null;
      if (result.recipient) recipient = result.recipient;
    }
  } else {
    console.warn("[inquiry] FORM_SECRET is not set, so submissions can't be saved.");
  }

  // 4. Email the business.
  let emailed = false;
  if (recipient) {
    const rows: [string, string][] = [
      ["Type", kind === "event" ? "Private event inquiry" : "Contact message"],
      ["Name", name],
      ["Email", email],
      ["Phone", phone || "Not provided"],
    ];
    if (kind === "event") {
      rows.push(["Preferred date", preferredDate ? formatLongDate(preferredDate) : "Not specified"]);
      rows.push(["Guests", guestCount ? String(guestCount) : "Not specified"]);
      rows.push(["Package", pkg || "Not specified"]);
    }
    rows.push(["Message", message || "—"]);

    const subject =
      kind === "event" ? `New private event inquiry from ${name}` : `New website message from ${name}`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 16px">${escapeHtml(subject)}</h2>
<table cellpadding="8" style="border-collapse:collapse">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="vertical-align:top;font-weight:bold;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td style="border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
      )
      .join("")}</table>
<p style="color:#666;font-size:13px;margin-top:16px">Reply to this email to respond directly. This inquiry is also saved in your admin dashboard.</p>
</div>`;
    const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

    const result = await sendEmail({ to: recipient, subject, html, text, replyTo: email });
    if (result.ok) emailed = true;
    else console.error("[inquiry] email failed:", result.error);
  } else {
    console.warn("[inquiry] No inquiry email set (Admin → Settings) and no INQUIRY_EMAIL env var.");
  }

  if (savedId && emailed && db && formSecret) {
    const { error } = await db.rpc("mark_inquiry_emailed", { p_secret: formSecret, p_id: savedId });
    if (error) console.error("[inquiry] couldn't mark as emailed:", error.message);
  }

  if (!savedId && !emailed) {
    return fail("Sorry, we couldn't send your message right now. Please call us instead.");
  }

  return success;
}
