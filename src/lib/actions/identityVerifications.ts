"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

export async function approveIdentityVerification(verificationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("approve_identity_verification", {
    p_verification_id: verificationId,
    p_reviewer: session.fullName,
  });
  if (error) throw new Error(error.message);

  await logAdminAction(session, "identity_verification.approve", "identity_verification", verificationId);
  revalidatePath("/verifications-identite");
}

export async function rejectIdentityVerification(verificationId: string, reason: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const trimmedReason = reason.trim() || null;
  const { error } = await supabase.rpc("reject_identity_verification", {
    p_verification_id: verificationId,
    p_reviewer: session.fullName,
    p_reason: trimmedReason,
  });
  if (error) throw new Error(error.message);

  await logAdminAction(session, "identity_verification.reject", "identity_verification", verificationId, { reason: trimmedReason });
  revalidatePath("/verifications-identite");
}

/** Undoes an approval — misclick, or a detail noticed after the fact. Puts the submission back to "pending" and reverses the badge/trust bonus. */
export async function revokeIdentityVerification(verificationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("revoke_identity_verification", { p_verification_id: verificationId });
  if (error) throw new Error(error.message);

  await logAdminAction(session, "identity_verification.revoke", "identity_verification", verificationId);
  revalidatePath("/verifications-identite");
}
