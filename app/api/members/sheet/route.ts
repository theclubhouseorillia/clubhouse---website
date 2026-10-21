import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { toCsv, toSheetRow, type MemberSheetSource } from "@/lib/member-sheet";
import { getPublicClient } from "@/lib/supabase/public";

// Private CSV of every membership and 10-hour pack, for an auto-updating Google Sheet
// (=IMPORTDATA(...)) or Excel "From Web". Needs ?key=MEMBERS_SHEET_KEY; the
// full link is shown only to admins on Admin → Members & packs spreadsheet.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function keyMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const expected = process.env.MEMBERS_SHEET_KEY;
  const given = new URL(request.url).searchParams.get("key");
  if (!expected || !keyMatches(given, expected)) {
    return new NextResponse("Not allowed", { status: 401, headers: { "X-Robots-Tag": "noindex" } });
  }

  const db = getPublicClient();
  const secret = process.env.FORM_SECRET;
  if (!db || !secret) return new NextResponse("Not configured", { status: 500 });

  const { data, error } = await db.rpc("members_sheet", { p_secret: secret });
  if (error) {
    console.error("[members sheet] failed:", error.message);
    return new NextResponse("Couldn't load members", { status: 500 });
  }

  const rows = ((data ?? []) as MemberSheetSource[]).map(toSheetRow);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
