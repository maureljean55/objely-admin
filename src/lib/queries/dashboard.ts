import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type DashboardMetrics = {
  totalUsers: number;
  lostItems: number;
  foundItems: number;
  recoveredItems: number;
  activeMatches: number;
  openReports: number;
  escalatedTickets: number;
};

export type CategoryBreakdown = { label: string; count: number; percent: number };

export type RecentActivityRow = {
  id: string;
  type: "lost" | "found";
  status: string;
  title: string;
  categoryIcon: string | null;
  location: string | null;
  createdAt: string;
  userName: string;
  userEmail: string | null;
};

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createAdminClient();

  const [totalUsers, lostItems, foundItems, recoveredItems, activeMatches, openReports, escalatedTickets] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "lost").is("deleted_at", null),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "found").is("deleted_at", null),
    supabase.from("items").select("id", { count: "exact", head: true }).in("status", ["recovered", "returned"]),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("problem_reports").select("id", { count: "exact", head: true }).gte("created_at", SEVEN_DAYS_AGO()),
    supabase.from("support_conversations").select("id", { count: "exact", head: true }).eq("status", "escalated"),
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    lostItems: lostItems.count ?? 0,
    foundItems: foundItems.count ?? 0,
    recoveredItems: recoveredItems.count ?? 0,
    activeMatches: activeMatches.count ?? 0,
    openReports: openReports.count ?? 0,
    escalatedTickets: escalatedTickets.count ?? 0,
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("items").select("category_label").is("deleted_at", null).limit(5000);
  const rows = data ?? [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row.category_label || "Autre";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = rows.length || 1;
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityRow[]> {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, type, status, title, category_icon, location_public, location, user_id, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = items ?? [];
  if (rows.length === 0) return [];

  const userIds = rows.map((r) => r.user_id);
  const [{ data: profiles }, authUsers] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    getAuthUsersByIds(userIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    categoryIcon: row.category_icon,
    location: row.location_public ?? row.location,
    createdAt: row.created_at,
    userName: profileMap.get(row.user_id) || "Utilisateur",
    userEmail: authUsers.get(row.user_id)?.email ?? null,
  }));
}
