"use client";

import { useRef, useState, useTransition } from "react";
import { replyToConversation } from "@/lib/actions/support";

export function ReplyForm({ conversationId }: { conversationId: string }) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = value.trim();
    if (!body) return;
    setValue("");
    startTransition(async () => {
      await replyToConversation(conversationId, body);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-3 p-4 border-t border-border-subtle bg-surface-card">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        rows={1}
        placeholder="Répondre en tant qu'administrateur..."
        className="flex-1 resize-none rounded-lg border border-border-subtle bg-surface-bg px-3 py-2.5 text-body-md text-on-surface placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-32"
      />
      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="h-10 px-4 rounded-lg bg-primary text-white text-label-md font-semibold hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
      >
        Envoyer
      </button>
    </form>
  );
}
