import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type ReportCategory = "tech" | "fake" | "info" | "other";

export type ReportRow = {
  id: string;
  category: ReportCategory;
  description: string;
  itemTitle: string | null;
  reporterName: string;
  reporterEmail: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type ReportsPage = { rows: ReportRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;

export async function listReports(page: number, onlyOpen: boolean): Promise<ReportsPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("problem_reports")
    .select("id, reporter_id, category, description, item_id, created_at, resolved_at, resolved_by", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (onlyOpen) query = query.is("resolved_at", null);

  const { data: reports, count } = await query;
  const rows = reports ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const reporterIds = rows.map((r) => r.reporter_id);
  const itemIds = rows.map((r) => r.item_id).filter((id): id is string => Boolean(id));

  const [{ data: profiles }, authUsers, { data: items }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", reporterIds),
    getAuthUsersByIds(reporterIds),
    itemIds.length > 0 ? supabase.from("items").select("id, title").in("id", itemIds) : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i.title]));

  const result: ReportRow[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    itemTitle: r.item_id ? itemMap.get(r.item_id) ?? "Objet supprimé" : null,
    reporterName: profileMap.get(r.reporter_id) || "Utilisateur",
    reporterEmail: authUsers.get(r.reporter_id)?.email ?? null,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
  }));

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
