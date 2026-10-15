import { NextResponse } from "next/server";
import { emailConfigured } from "@/lib/email";

// Quick health check: shows whether forms can be saved and emailed.
// Only yes/no answers; it never reveals any keys or addresses.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      formsSave: !!process.env.FORM_SECRET,
      emailReady: emailConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
