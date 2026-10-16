import { NextResponse } from "next/server";
import { handleStripeEvent, type StripeEvent } from "@/lib/members";
import { verifyStripeSignature } from "@/lib/stripe-signature";

// Stripe calls this after a membership or 10-hour pack is bought, and when a
// membership changes or is cancelled. Every request must carry a valid Stripe
// signature (STRIPE_WEBHOOK_SECRET; several secrets can be comma-separated,
// e.g. live and sandbox).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secrets = (process.env.STRIPE_WEBHOOK_SECRET ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (secrets.length === 0) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!secrets.some((s) => verifyStripeSignature(payload, signature, s))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    // A 500 makes Stripe retry later; the handlers are safe to run twice.
    console.error(`[stripe] ${event.type} ${event.id} failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
