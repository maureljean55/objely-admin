import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/queries/authUsers";

export type SupportStatus = "bot" | "escalated" | "closed";

export type ConversationSummary = {
  id: string;
  status: SupportStatus;
  userName: string;
  userEmail: string | null;
  updatedAt: string;
  lastMessagePreview: string;
};

export type ConversationsPage = { rows: ConversationSummary[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;

function previewFor(message: { kind: string; body: string | null; attachment_name: string | null } | undefined): string {
  if (!message) return "Aucun message";
  if (message.kind === "attachment") return `📎 ${message.attachment_name ?? "Pièce jointe"}`;
  return message.body ?? "";
}

export async function listConversations(page: number, status: SupportStatus | "all"): Promise<ConversationsPage> {
  const supabase = createAdminClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("support_conversations")
    .select("id, status, user_id, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data: conversations, count } = await query;
  const rows = conversations ?? [];
  if (rows.length === 0) return { rows: [], total: count ?? 0, page, pageSize: PAGE_SIZE };

  const ids = rows.map((c) => c.id);
  const userIds = rows.map((c) => c.user_id);

  const [{ data: profiles }, authUsers, { data: lastMessages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    getAuthUsersByIds(userIds),
    supabase
      .from("support_messages")
      .select("conversation_id, kind, body, attachment_name, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  type LastMessageRow = { conversation_id: string; kind: string; body: string | null; attachment_name: string | null; created_at: string };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const lastMessageMap = new Map<string, LastMessageRow>();
  for (const msg of (lastMessages ?? []) as LastMessageRow[]) {
    if (!lastMessageMap.has(msg.conversation_id)) lastMessageMap.set(msg.conversation_id, msg);
  }

  const result: ConversationSummary[] = rows.map((c) => ({
    id: c.id,
    status: c.status,
    userName: profileMap.get(c.user_id) || "Utilisateur",
    userEmail: authUsers.get(c.user_id)?.email ?? null,
    updatedAt: c.updated_at,
    lastMessagePreview: previewFor(lastMessageMap.get(c.id)),
  }));

  return { rows: result, total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export type SupportMessage = {
  id: string;
  sender: "user" | "bot" | "admin";
  kind: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  status: SupportStatus;
  userName: string;
  userEmail: string | null;
  messages: SupportMessage[];
};

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const supabase = createAdminClient();
  const { data: conversation } = await supabase.from("support_conversations").select("id, status, user_id").eq("id", id).maybeSingle();
  if (!conversation) return null;

  const [{ data: profile }, authUsers, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", conversation.user_id).maybeSingle(),
    getAuthUsersByIds([conversation.user_id]),
    supabase
      .from("support_messages")
      .select("id, sender, kind, body, attachment_url, attachment_name, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    id: conversation.id,
    status: conversation.status,
    userName: profile?.full_name || "Utilisateur",
    userEmail: authUsers.get(conversation.user_id)?.email ?? null,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      sender: m.sender,
      kind: m.kind,
      body: m.body,
      attachmentUrl: m.attachment_url,
      attachmentName: m.attachment_name,
      createdAt: m.created_at,
    })),
  };
}
