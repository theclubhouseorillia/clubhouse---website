import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Password-reset and invite emails land here. We swap the one-time code for a
// session, then continue to the requested admin page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("next") ?? "/admin";
  const next = requested.startsWith("/admin") ? requested : "/admin";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/admin/login?error=link_expired`);
}
