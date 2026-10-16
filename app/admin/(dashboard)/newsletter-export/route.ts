import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { torontoDate } from "@/lib/member-sheet";

// "Download for Resend" on Admin → Email sign-ups (signed-in admins only).
// Columns match Resend's contact import (email, first_name). People marked
// "Unsubscribed" are left out.
export const dynamic = "force-dynamic";

function cell(value: string | null | undefined): string {
  const v = (value ?? "").replace(/\r?\n/g, " ");
  // Quote everything; also stop spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("newsletter_signups")
    .select("email, first_name, created_at, unsubscribed")
    .eq("unsubscribed", false)
    .order("created_at", { ascending: true });
  if (error) return new NextResponse(`Couldn't load sign-ups: ${error.message}`, { status: 500 });

  const rows = (data ?? []) as { email: string; first_name: string | null }[];
  const csv = ["email,first_name", ...rows.map((r) => `${cell(r.email)},${cell(r.first_name)}`)].join("\r\n");
  return new NextResponse(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clubhouse-email-signups-${torontoDate(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
