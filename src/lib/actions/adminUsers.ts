"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { generatePassword } from "@/lib/generatePassword";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");
  if (session.role !== "super_admin") throw new Error("Réservé aux super admins.");
  return session;
}

export type CreateAdminResult = { error?: string; email?: string; password?: string };

export async function createAdmin(email: string, fullName: string, role: "admin" | "super_admin"): Promise<CreateAdminResult> {
  const session = await requireSuperAdmin();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !fullName.trim()) return { error: "E-mail et nom requis." };

  const password = generatePassword();
  const password_hash = await bcrypt.hash(password, 12);

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").insert({ email: normalizedEmail, password_hash, full_name: fullName.trim(), role });
  if (error) {
    if (error.code === "23505") return { error: "Un administrateur avec cet e-mail existe déjà." };
    return { error: error.message };
  }

  await logAdminAction(session, "admin.create", "admin_user", normalizedEmail, { role });

  revalidatePath("/administrateurs");
  return { email: normalizedEmail, password };
}

export async function removeAdmin(adminId: string) {
  const session = await requireSuperAdmin();
  if (adminId === session.sub) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");

  const supabase = createAdminClient();
  const { count } = await supabase.from("admin_users").select("id", { count: "exact", head: true }).eq("role", "super_admin");
  const { data: target } = await supabase.from("admin_users").select("role, email").eq("id", adminId).maybeSingle();

  if (target?.role === "super_admin" && (count ?? 0) <= 1) {
    throw new Error("Impossible de supprimer le dernier super admin.");
  }

  const { error } = await supabase.from("admin_users").delete().eq("id", adminId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, "admin.remove", "admin_user", adminId, { email: target?.email });

  revalidatePath("/administrateurs");
}
