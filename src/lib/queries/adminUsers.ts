import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin";
  createdAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
};

export async function listAdmins(): Promise<AdminUserSummary[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, created_at, last_login_at, avatar_url")
    .order("created_at", { ascending: true });

  return (data ?? []).map((a) => ({
    id: a.id,
    email: a.email,
    fullName: a.full_name,
    role: a.role,
    createdAt: a.created_at,
    lastLoginAt: a.last_login_at,
    avatarUrl: a.avatar_url,
  }));
}

/** Just the current photo, for chrome (sidebar/header) that already has the session and doesn't need the rest of the row. */
export async function getAdminAvatarUrl(adminId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("admin_users").select("avatar_url").eq("id", adminId).maybeSingle<{ avatar_url: string | null }>();
  return data?.avatar_url ?? null;
}
