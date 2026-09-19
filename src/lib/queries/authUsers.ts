import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthUserInfo = { id: string; email: string | null; createdAt: string };

/** Looks up email + signup date for a small set of user ids via the Supabase Admin API (one call per id). */
export async function getAuthUsersByIds(ids: string[]): Promise<Map<string, AuthUserInfo>> {
  const supabase = createAdminClient();
  const uniqueIds = Array.from(new Set(ids));

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      if (!data?.user) return null;
      return { id, email: data.user.email ?? null, createdAt: data.user.created_at } satisfies AuthUserInfo;
    }),
  );

  const map = new Map<string, AuthUserInfo>();
  for (const result of results) {
    if (result) map.set(result.id, result);
  }
  return map;
}
