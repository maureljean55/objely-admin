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
  const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, "match.status_change", "match", matchId, { status });

  revalidatePath("/correspondances");
}
