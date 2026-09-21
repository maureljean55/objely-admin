import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type NavCounts = {
  users: number;
  activeMatches: number;
  escalatedTickets: number;
  openReports: number;
  pendingIdentityVerifications: number;
};

export async function getNavCounts(): Promise<NavCounts> {
  const supabase = createAdminClient();

  const [users, activeMatches, escalatedTickets, openReports, pendingIdentityVerifications] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("support_conversations").select("id", { count: "exact", head: true }).eq("status", "escalated"),
    supabase.from("problem_reports").select("id", { count: "exact", head: true }),
    supabase.from("identity_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    users: users.count ?? 0,
    activeMatches: activeMatches.count ?? 0,
    escalatedTickets: escalatedTickets.count ?? 0,
    openReports: openReports.count ?? 0,
    pendingIdentityVerifications: pendingIdentityVerifications.count ?? 0,
  };
}
