import "server-only";
import { getSettings } from "./data";
import { fromWithName, sendEmail } from "./email";
import { real, telHref, TIMEZONE } from "./format";
import {
  codeEmail,
  ownerNewPurchaseEmail,
  ownerStatusEmail,
  welcomeEmail,
  type EmailBusiness,
} from "./member-emails";
import { getPublicClient } from "./supabase/public";

// Handles Stripe events for memberships and 10-hour packs:
//  - checkout.session.completed -> save the buyer, email them a YourGolfBooking
//    sign-up link, schedule the member code for 24 hours later, tell the owner.
//  - customer.subscription.updated/deleted -> keep status in step, tell the
//    owner about cancellations and failed payments.
// Database access goes through secret-protected functions (FORM_SECRET).

/** Stripe product IDs -> plan names (live and sandbox), for plan switches. */
const PLAN_BY_PRODUCT: Record<string, string> = {
  prod_VRtLBWQfhbQw6l: "10-Hour Open Bay Pack",
  prod_VRtLeWCn4vGxVg: "Weekday Membership",
  prod_VRtLUfbG7DGIQ1: "Weekday/Weekend Membership",
  prod_VRra79eqqMWMWq: "10-Hour Open Bay Pack",
  prod_VRraDVyostwFmG: "Weekday Membership",
  prod_VRraksY0YQmdpt: "Weekday/Weekend Membership",
};

function planName(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (v === "Open Bay Hour Pack") return "10-Hour Open Bay Pack";
  if (v === "7-Day Membership") return "Weekday/Weekend Membership";
  return v;
}

export interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

interface CheckoutSession {
  id: string;
  mode?: string;
  status?: string;
  payment_status?: string;
  customer?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string> | null;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null } | null;
  custom_fields?: { key?: string; text?: { value?: string | null } | null }[] | null;
}

interface Subscription {
  id: string;
  status?: string;
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  current_period_end?: number | null;
  metadata?: Record<string, string> | null;
  items?: {
    data?: {
      current_period_end?: number | null;
      price?: { product?: string | { id?: string } | null } | null;
    }[];
  } | null;
}

function secret(): string {
  const s = process.env.FORM_SECRET;
  if (!s) throw new Error("FORM_SECRET is not set, so members can't be saved.");
  return s;
}

function db() {
  const client = getPublicClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, { p_secret: secret(), ...args });
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return data as T;
}

function formatPhone(raw: string | null | undefined): string | null {
  const v = real(raw);
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : v;
}

async function emailContext() {
  const s = await getSettings();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || real(s.website_url) || "https://theclubhouseorillia.ca").replace(/\/+$/, "");
  const bookingUrl = real(s.booking_url) ?? `${siteUrl}/contact`;
  const business: EmailBusiness = {
    name: real(s.business_name) ?? "The Clubhouse Bar & Golf Sim",
    phoneDisplay: formatPhone(s.phone),
    tel: telHref(s.phone),
    siteUrl,
    bookingUrl,
    portalUrl: s.membership_portal_url,
  };
  return {
    business,
    from: fromWithName(business.name),
    replyTo: real(s.public_email) ?? undefined,
  };
}

/** Unix seconds -> "YYYY-MM-DD" in Toronto time. */
function isoDate(unix: number | null | undefined): string | null {
  if (!unix) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(unix * 1000),
  );
}

function stripeCustomerUrl(customer: string | null | undefined, live: boolean): string | null {
  if (!customer) return null;
  return `https://dashboard.stripe.com/${live ? "" : "test/"}customers/${customer}`;
}

interface CheckoutResult {
  id: string;
  is_new: boolean;
  setup_email_sent: boolean;
  code_sent: string | null;
  code: string | null;
  valid_until: string | null;
  ygb_signup_url: string | null;
  notify_email: string | null;
}

async function handleCheckout(session: CheckoutSession, event: StripeEvent): Promise<void> {
  if (session.status && session.status !== "complete") return;
  const kind: "membership" | "pack" = session.mode === "subscription" ? "membership" : "pack";
  if (kind === "pack" && session.payment_status && session.payment_status !== "paid") return;

  const email = session.customer_details?.email?.trim();
  if (!email) {
    console.warn("[members] checkout without an email, skipped:", session.id);
    return;
  }
  const name = session.customer_details?.name?.trim() || null;
  const phone = session.customer_details?.phone?.trim() || null;
  const golferName = session.custom_fields?.find((f) => f.key === "golfername")?.text?.value?.trim() || null;
  const plan = planName(session.metadata?.website_plan) ?? (kind === "pack" ? "10-Hour Open Bay Pack" : "Membership");

  const saved = await rpc<CheckoutResult>("member_record_checkout", {
    p_checkout_id: session.id,
    p_kind: kind,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_golfer_name: golferName,
    p_plan: plan,
    p_customer_id: session.customer ?? null,
    p_subscription_id: session.subscription ?? null,
  });

  const ctx = await emailContext();
  const signupUrl = real(saved.ygb_signup_url) ?? ctx.business.bookingUrl;

  // 1. Welcome email with the YourGolfBooking sign-up link (once).
  if (!saved.setup_email_sent) {
    const welcome = welcomeEmail({ business: ctx.business, kind, name, email, plan, golferName, signupUrl });
    const sent = await sendEmail({
      to: email,
      ...welcome,
      from: ctx.from,
      replyTo: ctx.replyTo,
      idempotencyKey: `welcome-${session.id}`,
    });
    if (!sent.ok) throw new Error(`Welcome email failed: ${sent.error}`);
    await rpc("member_mark_setup_sent", { p_id: saved.id });

    // Tell the owner (first successful pass only).
    if (saved.notify_email) {
      const owner = ownerNewPurchaseEmail({
        business: ctx.business,
        kind,
        name,
        email,
        phone,
        golferName,
        plan,
        code: saved.code,
        validUntil: saved.valid_until,
        stripeUrl: stripeCustomerUrl(session.customer, event.livemode),
      });
      const ownerSent = await sendEmail({
        to: saved.notify_email,
        ...owner,
        replyTo: email,
        idempotencyKey: `owner-new-${session.id}`,
      });
      if (!ownerSent.ok) console.error("[members] owner email failed:", ownerSent.error);
    }
  }

  // 2. Member code, scheduled for 24 hours from now. If no code is set yet (or
  //    scheduling fails), the daily job sends it once one is available.
  if (kind === "membership" && saved.code && !saved.code_sent) {
    const at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const msg = codeEmail({
      business: ctx.business,
      name,
      plan,
      code: saved.code,
      validUntil: saved.valid_until,
      bookingUrl: ctx.business.bookingUrl,
    });
    const scheduled = await sendEmail({
      to: email,
      ...msg,
      from: ctx.from,
      replyTo: ctx.replyTo,
      scheduledAt: at.toISOString(),
      idempotencyKey: `code-first-${session.id}`,
    });
    if (scheduled.ok) {
      await rpc("member_mark_code_sent", { p_id: saved.id, p_code: saved.code, p_at: at.toISOString() });
    } else {
      console.error("[members] scheduling the code email failed (the daily job will retry):", scheduled.error);
    }
  }
}

interface SyncResult {
  found: boolean;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: string | null;
  old_status?: string;
  new_status?: string;
  renews_on?: string | null;
  notify_email?: string | null;
}

function memberStatus(sub: Subscription, deleted: boolean): string {
  if (deleted || sub.status === "canceled" || sub.status === "incomplete_expired") return "canceled";
  if (sub.status === "past_due" || sub.status === "unpaid" || sub.status === "incomplete") return "past_due";
  if (sub.status === "paused") return "paused";
  if (sub.cancel_at_period_end || sub.cancel_at) return "ending";
  return "active";
}

async function handleSubscription(sub: Subscription, deleted: boolean, event: StripeEvent): Promise<void> {
  const item = sub.items?.data?.[0];
  const product = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const plan = (product && PLAN_BY_PRODUCT[product]) || planName(sub.metadata?.website_plan);
  const status = memberStatus(sub, deleted);
  const renewsOn = isoDate(item?.current_period_end ?? sub.current_period_end ?? sub.cancel_at ?? null);

  const result = await rpc<SyncResult>("member_sync_subscription", {
    p_subscription_id: sub.id,
    p_status: status,
    p_plan: plan,
    p_renews_on: renewsOn,
  });
  if (!result.found || result.old_status === result.new_status) return;

  const notifyStatus = result.new_status;
  if (notifyStatus !== "ending" && notifyStatus !== "canceled" && notifyStatus !== "past_due") return;
  if (!result.notify_email) return;

  const ctx = await emailContext();
  const msg = ownerStatusEmail({
    business: ctx.business,
    status: notifyStatus,
    name: result.name ?? null,
    email: result.email ?? null,
    phone: result.phone ?? null,
    plan: result.plan ?? null,
    renewsOn: result.renews_on ?? null,
  });
  const sent = await sendEmail({
    to: result.notify_email,
    ...msg,
    ...(result.email ? { replyTo: result.email } : {}),
    idempotencyKey: `status-${event.id}`,
  });
  if (!sent.ok) console.error("[members] owner status email failed:", sent.error);
}

/** Routes a verified Stripe event. Unknown event types are ignored. */
export async function handleStripeEvent(event: StripeEvent): Promise<void> {
  const obj = event.data?.object ?? {};
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(obj as unknown as CheckoutSession, event);
      break;
    case "customer.subscription.updated":
      await handleSubscription(obj as unknown as Subscription, false, event);
      break;
    case "customer.subscription.deleted":
      await handleSubscription(obj as unknown as Subscription, true, event);
      break;
    default:
      break;
  }
}

interface CodeQueue {
  code: string | null;
  valid_until: string | null;
  members: { id: string; name: string | null; email: string; plan: string | null }[];
}

/**
 * Emails the current member code to every active member who hasn't had it yet
 * (new members after their first day, and everyone when the code changes).
 */
export async function sendDueMemberCodes(): Promise<{ sent: number; failed: number; code: boolean }> {
  const queue = await rpc<CodeQueue>("member_code_queue", {});
  if (!queue.code || queue.members.length === 0) return { sent: 0, failed: 0, code: !!queue.code };

  const ctx = await emailContext();
  let sent = 0;
  let failed = 0;
  for (const m of queue.members) {
    const msg = codeEmail({
      business: ctx.business,
      name: m.name,
      plan: m.plan,
      code: queue.code,
      validUntil: queue.valid_until,
      bookingUrl: ctx.business.bookingUrl,
    });
    const res = await sendEmail({
      to: m.email,
      ...msg,
      from: ctx.from,
      replyTo: ctx.replyTo,
      idempotencyKey: `code-${m.id}-${queue.code}`,
    });
    if (res.ok) {
      await rpc("member_mark_code_sent", { p_id: m.id, p_code: queue.code });
      sent++;
    } else {
      console.error("[members] code email failed:", res.error);
      failed++;
    }
  }
  return { sent, failed, code: true };
}
