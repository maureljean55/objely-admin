import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditLogRow = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogPage = { rows: AuditLogRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 30;

export async function listAuditLog(page: number): Promise<AuditLogPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from("admin_audit_log")
    .select("id, admin_email, action, target_type, target_id, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const rows: AuditLogRow[] = (data ?? []).map((r) => ({
    id: r.id,
    adminEmail: r.admin_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    details: r.details,
    createdAt: r.created_at,
  }));

  return { rows, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
