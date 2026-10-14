"use server";

import { headers } from "next/headers";
import { escapeHtml, sendEmail } from "@/lib/email";
import { formatLongDate, todayISO } from "@/lib/format";
import { hashIp, verifyTurnstile } from "@/lib/spam";
import { getServiceClient } from "@/lib/supabase/service";

export interface InquiryState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
  submissionId: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 3000;
const RATE_LIMIT = 3; // submissions
const RATE_WINDOW_MIN = 10; // minutes

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
  const db = getServiceClient();

  if (db && ipHash) {
    const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const { count } = await db
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT) {
      return fail("You've sent a few messages already. Please wait a few minutes or give us a call.");
    }
  }

  // 4. Save to the database so nothing is lost, even if email fails.
  let savedId: string | null = null;
  if (db) {
    const { data, error } = await db
      .from("inquiries")
      .insert({
        kind,
        name,
        email,
        phone: phone || null,
        preferred_date: kind === "event" && preferredDate ? preferredDate : null,
        guest_count: guestCount,
        package: kind === "event" && pkg ? pkg : null,
        message: message || null,
        ip_hash: ipHash,
      })
      .select("id")
      .single();
    if (error) console.error("[inquiry] save failed:", error.message);
    else savedId = (data as { id: string }).id;
  }

  // 5. Email the business.
  let recipient = process.env.INQUIRY_EMAIL || "";
  if (db) {
    const { data } = await db.from("site_settings").select("inquiry_email, business_name").eq("id", 1).maybeSingle();
    const settings = data as { inquiry_email: string | null; business_name: string } | null;
    if (settings?.inquiry_email) recipient = settings.inquiry_email;
  }

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

  if (savedId && emailed && db) {
    await db.from("inquiries").update({ email_sent: true }).eq("id", savedId);
  }

  if (!savedId && !emailed) {
    return fail("Sorry, we couldn't send your message right now. Please call us instead.");
  }

  return success;
}
