import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/** The signed-in user and whether they are on the admin list. */
export async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { supabase, user, isAdmin: !!data };
}

/** Use at the top of every admin page and admin action. */
export async function requireAdmin() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isAdmin) redirect("/admin/login?error=not_authorized");
  return ctx;
}
