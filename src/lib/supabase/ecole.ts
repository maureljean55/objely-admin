import "server-only";
import { createClient } from "@supabase/supabase-js";

// The school database (Supabase project "objely-ecole"), separate from the main Objely database that the rest of
// this portal uses. Service role: it can create sign-in accounts for establishments and bypasses row-level
// security, so it must never be imported from a Client Component (server-only makes that a build error).

export function isEcoleConfigured(): boolean {
  return Boolean(process.env.ECOLE_SUPABASE_URL && process.env.ECOLE_SUPABASE_SECRET_KEY);
}

export function createEcoleClient() {
  const url = process.env.ECOLE_SUPABASE_URL;
  const key = process.env.ECOLE_SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Where establishments sign in. Shown next to the generated password. */
export const ECOLE_ADMIN_URL = process.env.ECOLE_ADMIN_URL ?? "https://objely-ecole-admin.vercel.app";
