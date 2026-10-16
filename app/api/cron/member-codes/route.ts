import { NextResponse } from "next/server";
import { runDailyMemberJob } from "@/lib/members";

// Runs every morning (see vercel.json). Emails any personal member codes that
// haven't gone out yet and reminds the owner about members still waiting for a
// code. Vercel sends "Authorization: Bearer <CRON_SECRET>".
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  try {
    const result = await runDailyMemberJob();
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[cron] member codes failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
