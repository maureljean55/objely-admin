"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

// ~100 years — GoTrue has no permanent-ban duration, only a very long one.
const INDEFINITE_BAN = "876000h";

export async function setUserSuspended(userId: string, suspended: boolean, reason?: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? INDEFINITE_BAN : "none",
  });
  if (error) throw new Error(error.message);

  // Supabase Auth's ban only blocks the *next* token refresh/sign-in — an
  // already-issued session stays valid until it naturally expires. These two
  // columns are what the app itself checks on every request (see
  // src/lib/supabase/middleware.ts in the main repo) to show the suspended
  // screen right away instead of waiting that out.
  const trimmedReason = reason?.trim() || null;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ suspended_at: suspended ? new Date().toISOString() : null, suspended_reason: suspended ? trimmedReason : null })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  await logAdminAction(session, suspended ? "user.suspend" : "user.unsuspend", "user", userId, suspended ? { reason: trimmedReason } : undefined);

  revalidatePath("/utilisateurs");
}
