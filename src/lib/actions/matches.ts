"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MatchStatus } from "@/lib/queries/matches";
import { logAdminAction } from "@/lib/audit";

export async function setMatchStatus(matchId: string, status: MatchStatus) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  // admin_set_match_status (not a bare `.update()`) mirrors the same
  // side effects the user-facing resolve_match applies — auto-rejecting
  // sibling pending matches on the same found item, flipping items between
  // 'matched'/'searching', and notifying both participants — so an admin
  // decision here can't leave the database in a state the normal flow would
  // never produce (e.g. two confirmed matches on one found item).
  const { error } = await supabase.rpc("admin_set_match_status", { p_match_id: matchId, p_status: status });
  if (error) throw new Error(error.message);

  await logAdminAction(session, "match.status_change", "match", matchId, { status });

  revalidatePath("/correspondances");
}
