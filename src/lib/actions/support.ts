"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportStatus } from "@/lib/queries/support";
import { logAdminAction } from "@/lib/audit";

export async function replyToConversation(conversationId: string, body: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");
  const trimmed = body.trim();
  if (!trimmed) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("support_messages").insert({
    conversation_id: conversationId,
    sender: "admin",
    sender_name: session.fullName,
    kind: "text",
    body: trimmed,
  });
  if (error) throw new Error(error.message);

  // A human has now replied — escalate out of the bot flow (if it wasn't
  // already) so it stops auto-answering this conversation, and bump
  // updated_at either way so it resurfaces at the top of the list.
  await supabase
    .from("support_conversations")
    .update({ status: "escalated", updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .neq("status", "closed");

  await logAdminAction(session, "support.reply", "support_conversation", conversationId);

  revalidatePath(`/service-client/${conversationId}`);
  revalidatePath("/service-client");
}

export async function setConversationStatus(conversationId: string, status: SupportStatus) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("support_conversations").update({ status }).eq("id", conversationId);
  if (error) throw new Error(error.message);

  await logAdminAction(session, "support.status_change", "support_conversation", conversationId, { status });

  revalidatePath(`/service-client/${conversationId}`);
  revalidatePath("/service-client");
}
