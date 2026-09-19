import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversation } from "@/lib/queries/support";
import { setConversationStatus } from "@/lib/actions/support";
import { Badge } from "@/components/Badge";
import { formatDateTime, initials } from "@/lib/format";
import { ReplyForm } from "@/components/ReplyForm";

const SENDER_STYLE: Record<string, string> = {
  user: "bg-surface-bg text-on-surface self-start",
  bot: "bg-tertiary-container text-tertiary self-start",
  admin: "bg-primary text-white self-end",
};

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/service-client" className="p-2 rounded-lg hover:bg-surface-bg text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-semibold shrink-0">
            {initials(conversation.userName)}
          </span>
          <div>
            <h1 className="text-title-md text-on-surface">{conversation.userName}</h1>
            {conversation.userEmail && <p className="text-body-sm text-on-surface-variant">{conversation.userEmail}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status !== "closed" ? (
            <form
              action={async () => {
                "use server";
                await setConversationStatus(conversation.id, "closed");
              }}
            >
              <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-surface-bg text-on-surface-variant hover:bg-surface-bg/70">
                Clôturer
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await setConversationStatus(conversation.id, "escalated");
              }}
            >
              <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-primary-container text-on-primary-container hover:brightness-95">
                Rouvrir
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 bg-surface-card rounded-xl shadow-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {conversation.messages.map((message) => (
            <div key={message.id} className={`max-w-[70%] flex flex-col gap-1 ${message.sender === "admin" ? "items-end self-end" : "items-start self-start"}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-body-md ${SENDER_STYLE[message.sender]}`}>
                {message.kind === "attachment" ? (
                  <a href={message.attachmentUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline">
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    {message.attachmentName ?? "Pièce jointe"}
                  </a>
                ) : (
                  message.body
                )}
              </div>
              <span className="text-label-sm text-on-surface-variant px-1">
                {message.sender === "bot" ? "Assistant Objely" : message.sender === "admin" ? "Vous" : conversation.userName} ·{" "}
                {formatDateTime(message.createdAt)}
              </span>
            </div>
          ))}
          {conversation.messages.length === 0 && <p className="text-body-sm text-on-surface-variant text-center mt-10">Aucun message.</p>}
        </div>
        <ReplyForm conversationId={conversation.id} />
      </div>

      <div className="flex justify-end">
        <Badge variant={conversation.status === "escalated" ? "warning" : conversation.status === "closed" ? "success" : "primary"}>
          {conversation.status === "bot" ? "Bot" : conversation.status === "escalated" ? "Escaladée" : "Fermée"}
        </Badge>
      </div>
    </div>
  );
}
