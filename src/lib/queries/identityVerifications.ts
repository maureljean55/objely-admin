import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type IdentityVerificationStatus = "pending" | "approved" | "rejected";

export type IdentityVerificationRow = {
  id: string;
  status: IdentityVerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  documentUrl: string | null;
  userName: string;
  userEmail: string | null;
};

export type IdentityVerificationsPage = { rows: IdentityVerificationRow[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;
// Long enough to cover viewing the page and clicking through to the
// full-size document, short enough that a copied link goes stale quickly.
const SIGNED_URL_TTL_SECONDS = 300;

export async function listIdentityVerifications(
  page: number,
  status: IdentityVerificationStatus | "all",
): Promise<IdentityVerificationsPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("identity_verifications")
    .select("id, user_id, document_path, status, rejection_reason, created_at, reviewed_at, reviewed_by", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data: verifications, count } = await query;
  const rows = verifications ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const userIds = rows.map((r) => r.user_id);
  const [{ data: profiles }, authUsers] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    getAuthUsersByIds(userIds),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const result: IdentityVerificationRow[] = await Promise.all(
    rows.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from("identity-documents")
        .createSignedUrl(r.document_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: r.id,
        status: r.status,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at,
        reviewedBy: r.reviewed_by,
        documentUrl: signed?.signedUrl ?? null,
        userName: profileMap.get(r.user_id) || "Utilisateur",
        userEmail: authUsers.get(r.user_id)?.email ?? null,
      };
    }),
  );

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}
