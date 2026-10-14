import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged client using the service-role key. SERVER ONLY.
 * Used exclusively to store website form submissions and check rate limits.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
