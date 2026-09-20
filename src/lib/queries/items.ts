import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type ItemType = "lost" | "found";
export type ItemStatus = "searching" | "matched" | "recovered" | "returned";

export type ItemRow = {
  id: string;
  type: ItemType;
  status: ItemStatus;
  title: string;
  categoryLabel: string;
  categoryIcon: string | null;
  location: string | null;
  photoCount: number;
  ownerName: string;
  ownerEmail: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type ItemsPage = { rows: ItemRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;

export type ItemFilter = { type: ItemType | "all"; status: ItemStatus | "all"; search: string; includeDeleted: boolean };

export async function listItems(page: number, filter: ItemFilter): Promise<ItemsPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("items")
    .select("id, type, status, title, category_label, category_icon, location_public, location, photos, user_id, created_at, deleted_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (!filter.includeDeleted) query = query.is("deleted_at", null);
  if (filter.type !== "all") query = query.eq("type", filter.type);
  if (filter.status !== "all") query = query.eq("status", filter.status);
  if (filter.search.trim()) query = query.ilike("title", `%${filter.search.trim()}%`);

  const { data: items, count } = await query;
  const rows = items ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const userIds = rows.map((r) => r.user_id);
  const [{ data: profiles }, authUsers] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    getAuthUsersByIds(userIds),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const result: ItemRow[] = rows.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    categoryLabel: item.category_label,
    categoryIcon: item.category_icon,
    location: item.location_public ?? item.location,
    photoCount: item.photos?.length ?? 0,
    ownerName: profileMap.get(item.user_id) || "Utilisateur",
    ownerEmail: authUsers.get(item.user_id)?.email ?? null,
    createdAt: item.created_at,
    deletedAt: item.deleted_at,
  }));

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export type ItemDetail = ItemRow & {
  description: string | null;
  brand: string | null;
  colors: string[] | null;
  photos: string[];
  hasSecret: boolean;
  deletionReason: string | null;
};

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const supabase = createAdminClient();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (!item) return null;

  const [{ data: profile }, authUsers, { data: secret }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", item.user_id).maybeSingle(),
    getAuthUsersByIds([item.user_id]),
    supabase.from("item_secrets").select("item_id").eq("item_id", id).maybeSingle(),
  ]);

  return {
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    categoryLabel: item.category_label,
    categoryIcon: item.category_icon,
    location: item.location_public ?? item.location,
    photoCount: item.photos?.length ?? 0,
    ownerName: profile?.full_name || "Utilisateur",
    ownerEmail: authUsers.get(item.user_id)?.email ?? null,
    createdAt: item.created_at,
    deletedAt: item.deleted_at,
    description: item.description,
    brand: item.brand,
    colors: item.colors,
    photos: item.photos ?? [],
    hasSecret: Boolean(secret),
    deletionReason: item.deletion_reason,
  };
}
