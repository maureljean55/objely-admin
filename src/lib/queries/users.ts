import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type AdminUserRow = {
  id: string;
  publicId: number | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  sharePhone: boolean;
  avatarUrl: string | null;
  trustScore: number;
  createdAt: string;
  suspended: boolean;
  lostCount: number;
  foundCount: number;
  recoveredCount: number;
};

export type UsersPage = { rows: AdminUserRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;

export async function listUsers(page: number, search: string): Promise<UsersPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("profiles")
    .select("id, public_id, full_name, phone, share_phone, avatar_url, trust_score, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search.trim()) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }

  const { data: profiles, count } = await query;
  const rows = profiles ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const ids = rows.map((r) => r.id);
  const [authUsers, { data: items }] = await Promise.all([
    getAuthUsersByIds(ids),
    supabase.from("items").select("user_id, type, status").in("user_id", ids).is("deleted_at", null),
  ]);

  const itemCounts = new Map<string, { lost: number; found: number; recovered: number }>();
  for (const item of items ?? []) {
    const entry = itemCounts.get(item.user_id) ?? { lost: 0, found: 0, recovered: 0 };
    if (item.type === "lost") entry.lost += 1;
    if (item.type === "found") entry.found += 1;
    if (item.status === "recovered" || item.status === "returned") entry.recovered += 1;
    itemCounts.set(item.user_id, entry);
  }

  const bannedStatuses = await Promise.all(
    ids.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      const bannedUntil = (data?.user as { banned_until?: string } | undefined)?.banned_until;
      return [id, Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now())] as const;
    }),
  );
  const bannedMap = new Map(bannedStatuses);

  const result: AdminUserRow[] = rows.map((p) => {
    const counts = itemCounts.get(p.id) ?? { lost: 0, found: 0, recovered: 0 };
    return {
      id: p.id,
      publicId: p.public_id,
      fullName: p.full_name,
      email: authUsers.get(p.id)?.email ?? null,
      phone: p.phone,
      sharePhone: p.share_phone,
      avatarUrl: p.avatar_url,
      trustScore: p.trust_score,
      createdAt: p.created_at,
      suspended: bannedMap.get(p.id) ?? false,
      lostCount: counts.lost,
      foundCount: counts.found,
      recoveredCount: counts.recovered,
    };
  });

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
