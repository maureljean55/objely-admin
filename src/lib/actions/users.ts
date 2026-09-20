"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

// ~100 years — GoTrue has no permanent-ban duration, only a very long one.
const INDEFINITE_BAN = "876000h";

export async function setUserSuspended(userId: string, suspended: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? INDEFINITE_BAN : "none",
  });
  if (error) throw new Error(error.message);

  await logAdminAction(session, suspended ? "user.suspend" : "user.unsuspend", "user", userId);

  revalidatePath("/utilisateurs");
}
