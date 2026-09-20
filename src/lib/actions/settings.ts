"use server";

import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

export type ChangePasswordResult = { error?: string; success?: boolean };

export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  if (newPassword.length < 10) return { error: "Le nouveau mot de passe doit contenir au moins 10 caractères." };

  const supabase = createAdminClient();
  const { data: admin } = await supabase.from("admin_users").select("password_hash").eq("id", session.sub).maybeSingle<{ password_hash: string }>();
  if (!admin) return { error: "Compte introuvable." };

  const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isValid) return { error: "Mot de passe actuel incorrect." };

  const newHash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase.from("admin_users").update({ password_hash: newHash }).eq("id", session.sub);
  if (error) return { error: error.message };

  await logAdminAction(session, "admin.password_change", "admin_user", session.sub);

  return { success: true };
}
