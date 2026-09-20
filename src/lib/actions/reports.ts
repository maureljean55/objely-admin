"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

export async function setReportResolved(reportId: string, resolved: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("problem_reports")
    .update({ resolved_at: resolved ? new Date().toISOString() : null, resolved_by: resolved ? session.fullName : null })
    .eq("id", reportId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, resolved ? "report.resolve" : "report.reopen", "problem_report", reportId);

  revalidatePath("/signalements");
}
