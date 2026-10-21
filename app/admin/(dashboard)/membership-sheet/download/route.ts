import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { SHEET_SELECT, toCsv, toSheetRow, torontoDate, type MemberSheetSource } from "@/lib/member-sheet";

// "Download for Excel" on Admin → Members & packs spreadsheet (signed-in admins only).
export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("members")
    .select(SHEET_SELECT)
    .not("stripe_checkout_id", "like", "cs_test_%")
    .order("created_at", { ascending: false });
  if (error) return new NextResponse(`Couldn't load members: ${error.message}`, { status: 500 });

  const rows = ((data ?? []) as MemberSheetSource[]).map(toSheetRow);
  // A byte-order mark helps Excel open the file as UTF-8 (accents in names).
  return new NextResponse(`﻿${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clubhouse-memberships-and-packs-${torontoDate(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
