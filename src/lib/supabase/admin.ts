import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses every RLS policy on the shared
 * Objely database. This is what lets the admin portal see every user's
 * items, matches and support conversations rather than just its own. Never
 * import this file from a Client Component: `server-only` makes that a
 * build error instead of a leaked secret key in the browser bundle.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
