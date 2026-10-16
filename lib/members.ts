import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSettings } from "./data";
import { fromWithName, sendEmail } from "./email";
import { real, telHref, TIMEZONE } from "./format";
import {
  codeEmail,
  ownerNewPurchaseEmail,
  ownerRenewalEmail,
  ownerStatusEmail,
  ownerWaitingEmail,
  welcomeEmail,
  type EmailBusiness,
} from "./member-emails";
import { getPublicClient } from "./supabase/public";

// Handles Stripe events for memberships and 10-hour packs:
//  - checkout.session.completed -> save the buyer, email them a YourGolfBooking
//    sign-up link, and tell the owner to create their personal member code.
//  - customer.subscription.updated/deleted -> keep status in step, tell the
//    owner about cancellations and failed payments.
//  - invoice.paid (monthly renewal) -> last month's code is finished; remind
//    the owner to create the next one.
// Each member has their own code: the owner types it into Admin → Members,
// and it's emailed straight away (emailMemberCodeIfReady), or by the daily job.
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

/** One calendar month after `from`, in Toronto time ("YYYY-MM-DD"), e.g. Jan 31 -> Feb 28. */
function oneMonthAfter(from: Date): string {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(from)
    .split("-")
    .map(Number);
  const month = m === 12 ? 1 : m + 1;
  const year = m === 12 ? y + 1 : y;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A member's code is good until their next renewal: one month from purchase, then one month from each renewal. */
function memberValidUntil(renewsOn: string | null | undefined, createdAt: string | null | undefined): string | null {
  if (renewsOn) return renewsOn.slice(0, 10);
  if (createdAt) return oneMonthAfter(new Date(createdAt));
  return null;
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
  // The member's code is good for one month from today (then renewed monthly).
  const validUntil = kind === "membership" ? oneMonthAfter(new Date()) : null;

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
        validUntil,
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

interface Invoice {
  id: string;
  billing_reason?: string | null;
  subscription?: string | null;
  parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  lines?: {
    data?: {
      subscription?: string | null;
      period?: { end?: number | null } | null;
      parent?: { subscription_item_details?: { subscription?: string | null } | null } | null;
    }[];
  } | null;
}

interface RenewalResult {
  found: boolean;
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: string | null;
  status?: string;
  renews_on?: string | null;
  notify_email?: string | null;
}

/** A membership renewed: last month's code is finished, so remind the owner to create the next one. */
async function handleInvoicePaid(inv: Invoice): Promise<void> {
  if (inv.billing_reason !== "subscription_cycle") return;
  const line = inv.lines?.data?.[0];
  const subscriptionId =
    inv.subscription ??
    inv.parent?.subscription_details?.subscription ??
    line?.subscription ??
    line?.parent?.subscription_item_details?.subscription ??
    null;
  if (!subscriptionId) return;

  const renewal = await rpc<RenewalResult>("member_record_renewal", {
    p_subscription_id: subscriptionId,
    p_renews_on: isoDate(line?.period?.end ?? null),
  });
  if (!renewal.found || renewal.status !== "active" || !renewal.notify_email) return;

  const ctx = await emailContext();
  const msg = ownerRenewalEmail({
    business: ctx.business,
    name: renewal.name ?? null,
    email: renewal.email ?? null,
    phone: renewal.phone ?? null,
    plan: renewal.plan ?? null,
    validUntil: renewal.renews_on ?? null,
  });
  const sent = await sendEmail({
    to: renewal.notify_email,
    ...msg,
    ...(renewal.email ? { replyTo: renewal.email } : {}),
    idempotencyKey: `renewal-${inv.id}`,
  });
  if (!sent.ok) console.error("[members] renewal reminder failed:", sent.error);
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
    case "invoice.paid":
      await handleInvoicePaid(obj as unknown as Invoice);
      break;
    default:
      break;
  }
}

interface MemberRef {
  id: string;
  name: string | null;
  email: string;
  plan: string | null;
  renews_on: string | null;
  created_at: string | null;
}

interface CodeQueue {
  notify_email: string | null;
  to_send: (MemberRef & { code: string })[];
  waiting: MemberRef[];
}

/**
 * Runs every morning: emails any personal codes that haven't gone out yet
 * (e.g. entered directly in the database), and reminds the owner about
 * members still waiting for a code.
 */
export async function runDailyMemberJob(): Promise<{ sent: number; failed: number; waiting: number }> {
  const queue = await rpc<CodeQueue>("member_code_queue", {});
  const ctx = await emailContext();
  let sent = 0;
  let failed = 0;

  for (const m of queue.to_send) {
    const msg = codeEmail({
      business: ctx.business,
      name: m.name,
      plan: m.plan,
      code: m.code,
      validUntil: memberValidUntil(m.renews_on, m.created_at),
      bookingUrl: ctx.business.bookingUrl,
    });
    const res = await sendEmail({
      to: m.email,
      ...msg,
      from: ctx.from,
      replyTo: ctx.replyTo,
      idempotencyKey: `code-${m.id}-${m.code}-${memberValidUntil(m.renews_on, m.created_at) ?? ""}`,
    });
    if (res.ok) {
      await rpc("member_mark_code_sent", { p_id: m.id, p_code: m.code });
      sent++;
    } else {
      console.error("[members] code email failed:", res.error);
      failed++;
    }
  }

  if (queue.waiting.length > 0 && queue.notify_email) {
    const msg = ownerWaitingEmail({
      business: ctx.business,
      members: queue.waiting.map((m) => ({
        name: m.name,
        email: m.email,
        plan: m.plan,
        validUntil: memberValidUntil(m.renews_on, m.created_at),
      })),
    });
    const res = await sendEmail({ to: queue.notify_email, ...msg });
    if (!res.ok) console.error("[members] waiting reminder failed:", res.error);
  }

  return { sent, failed, waiting: queue.waiting.length };
}

interface MemberRow {
  id: string;
  kind: string;
  name: string | null;
  email: string;
  plan: string | null;
  status: string;
  member_code: string | null;
  code_sent: string | null;
  needs_new_code: boolean;
  renews_on: string | null;
  created_at: string | null;
}

/**
 * Called after the owner saves a member in Admin (with their signed-in admin
 * client): if the member has a new code that hasn't been emailed for this
 * period, email it now. Returns a short message for the Admin screen.
 */
export async function emailMemberCodeIfReady(client: SupabaseClient, id: string): Promise<string | undefined> {
  const { data, error } = await client
    .from("members")
    .select("id, kind, name, email, plan, status, member_code, code_sent, needs_new_code, renews_on, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  const m = data as MemberRow;
  const code = m.member_code?.trim();
  if (!code || m.kind !== "membership") return undefined;
  if (!m.needs_new_code && code === m.code_sent) return undefined;
  if (m.status !== "active" && m.status !== "ending") {
    return "Saved. The code wasn't emailed because this membership isn't active.";
  }

  const ctx = await emailContext();
  const validUntil = memberValidUntil(m.renews_on, m.created_at);
  const msg = codeEmail({
    business: ctx.business,
    name: m.name,
    plan: m.plan,
    code,
    validUntil,
    bookingUrl: ctx.business.bookingUrl,
  });
  const res = await sendEmail({
    to: m.email,
    ...msg,
    from: ctx.from,
    replyTo: ctx.replyTo,
    idempotencyKey: `code-${m.id}-${code}-${validUntil ?? ""}`,
  });
  if (!res.ok) {
    console.error("[members] code email failed:", res.error);
    return "Saved, but the code email didn't send. It will be retried tomorrow morning.";
  }
  await client
    .from("members")
    .update({ code_sent: code, code_sent_at: new Date().toISOString(), needs_new_code: false, updated_at: new Date().toISOString() })
    .eq("id", m.id);
  return `Saved. ${code} was emailed to ${m.email}.`;
}
