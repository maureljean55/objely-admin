import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminSession } from "@/lib/auth";

/** Records a sensitive admin action for accountability. Never throws — a logging failure shouldn't roll back the action itself. */
export async function logAdminAction(
  session: AdminSession,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_id: session.sub,
    admin_email: session.email,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  });
  if (error) console.error("Failed to write admin audit log:", error.message);
}
