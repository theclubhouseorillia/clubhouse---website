import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for admin screens in the browser (sign-in, photo uploads). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
