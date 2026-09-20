"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

/** Admin moderation removal — distinct from the owner's own soft-delete (see src/lib/supabase/items.ts in the main app): always reason "moderation", never marked resolved. */
export async function moderateDeleteItem(itemId: string, reason: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString(), resolved_before_deletion: false, deletion_reason: reason.trim() || "Modération administrateur" })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, "item.moderate_delete", "item", itemId, { reason });

  revalidatePath("/objets");
  revalidatePath(`/objets/${itemId}`);
}

export async function restoreItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: null, resolved_before_deletion: null, deletion_reason: null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, "item.restore", "item", itemId);

  revalidatePath("/objets");
  revalidatePath(`/objets/${itemId}`);
}
