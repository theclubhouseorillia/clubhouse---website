import { NextResponse } from "next/server";
import { sendDueMemberCodes } from "@/lib/members";

// Runs every morning (see vercel.json). Emails the current member code to new
// members whose first day has passed, and to every active member when the code
// is changed in Admin. Vercel sends "Authorization: Bearer <CRON_SECRET>".
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  try {
    const result = await sendDueMemberCodes();
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[cron] member codes failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
