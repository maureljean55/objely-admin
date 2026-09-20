import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin";
  createdAt: string;
  lastLoginAt: string | null;
};

export async function listAdmins(): Promise<AdminUserSummary[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("admin_users").select("id, email, full_name, role, created_at, last_login_at").order("created_at", { ascending: true });

  return (data ?? []).map((a) => ({
    id: a.id,
    email: a.email,
    fullName: a.full_name,
    role: a.role,
    createdAt: a.created_at,
    lastLoginAt: a.last_login_at,
  }));
}
