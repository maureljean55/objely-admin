"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

export type ChangePasswordResult = { error?: string; success?: boolean };

export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  if (newPassword.length < 10) return { error: "Le nouveau mot de passe doit contenir au moins 10 caractères." };
  if (newPassword === currentPassword) return { error: "Le nouveau mot de passe doit être différent de l'actuel." };

  const supabase = createAdminClient();
  const { data: admin, error: fetchError } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("id", session.sub)
    .maybeSingle<{ password_hash: string }>();
  if (fetchError) {
    console.error("changePassword: failed to load admin_users row", fetchError);
    return { error: "Une erreur est survenue, réessayez." };
  }
  if (!admin) return { error: "Compte introuvable." };

  const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isValid) return { error: "Mot de passe actuel incorrect." };

  const newHash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase.from("admin_users").update({ password_hash: newHash }).eq("id", session.sub);
  if (error) {
    console.error("changePassword: failed to update password_hash", error);
    return { error: "Une erreur est survenue, réessayez." };
  }

  await logAdminAction(session, "admin.password_change", "admin_user", session.sub);

  return { success: true };
}

export type UpdateAvatarResult = { error?: string; avatarUrl?: string };

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateAdminAvatar(formData: FormData): Promise<UpdateAvatarResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Sélectionnez une image." };
  if (!file.type.startsWith("image/")) return { error: "Le fichier doit être une image." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "L'image ne doit pas dépasser 5 Mo." };

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${session.sub}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("admin-avatars").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    console.error("updateAdminAvatar: upload failed", uploadError);
    return { error: "Échec de l'envoi de l'image." };
  }

  const { data: publicUrlData } = supabase.storage.from("admin-avatars").getPublicUrl(path);

  const { error: updateError } = await supabase.from("admin_users").update({ avatar_url: publicUrlData.publicUrl }).eq("id", session.sub);
  if (updateError) {
    console.error("updateAdminAvatar: failed to update admin_users", updateError);
    return { error: "Une erreur est survenue, réessayez." };
  }

  await logAdminAction(session, "admin.avatar_update", "admin_user", session.sub);

  revalidatePath("/parametres");
  revalidatePath("/", "layout");

  return { avatarUrl: publicUrlData.publicUrl };
}
