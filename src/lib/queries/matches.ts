import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type MatchStatus = "pending" | "confirmed" | "rejected";

export type MatchItemInfo = {
  id: string;
  title: string;
  categoryIcon: string | null;
  location: string | null;
  ownerName: string;
};

export type MatchRow = {
  id: string;
  status: MatchStatus;
  matchPercent: number;
  createdAt: string;
  lostItem: MatchItemInfo;
  foundItem: MatchItemInfo;
};

export type MatchesPage = { rows: MatchRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 15;

export async function listMatches(page: number, status: MatchStatus | "all"): Promise<MatchesPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("matches")
    .select("id, lost_item_id, found_item_id, match_percent, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data: matches, count } = await query;
  const rows = matches ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const itemIds = Array.from(new Set(rows.flatMap((m) => [m.lost_item_id, m.found_item_id])));
  const { data: items } = await supabase.from("items").select("id, title, category_icon, location_public, location, user_id").in("id", itemIds);
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

  const ownerIds = Array.from(new Set((items ?? []).map((i) => i.user_id)));
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ownerIds);
  const ownerMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Utilisateur"]));

  function toItemInfo(itemId: string): MatchItemInfo {
    const item = itemMap.get(itemId);
    return {
      id: itemId,
      title: item?.title ?? "Objet supprimé",
      categoryIcon: item?.category_icon ?? null,
      location: item ? item.location_public ?? item.location : null,
      ownerName: item ? ownerMap.get(item.user_id) ?? "Utilisateur" : "—",
    };
  }

  const result: MatchRow[] = rows.map((m) => ({
    id: m.id,
    status: m.status,
    matchPercent: m.match_percent,
    createdAt: m.created_at,
    lostItem: toItemInfo(m.lost_item_id),
    foundItem: toItemInfo(m.found_item_id),
  }));

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
