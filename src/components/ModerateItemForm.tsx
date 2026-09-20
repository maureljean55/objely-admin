"use client";

import { useState, useTransition } from "react";
import { moderateDeleteItem, restoreItem } from "@/lib/actions/items";

export function ModerateItemForm({ itemId, isDeleted }: { itemId: string; isDeleted: boolean }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (isDeleted) {
    return (
      <div className="bg-surface-card rounded-xl shadow-card p-5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => restoreItem(itemId))}
          className="px-4 py-2 rounded-lg bg-success-container text-success-emerald text-label-md font-semibold hover:brightness-95 disabled:opacity-60"
        >
          {isPending ? "Restauration…" : "Restaurer cette annonce"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl shadow-card p-5 flex flex-col gap-3">
      <h2 className="text-title-md text-on-surface">Modération</h2>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif de suppression (annonce frauduleuse, contenu inapproprié...)"
        rows={2}
        className="rounded-lg border border-border-subtle bg-surface-bg px-3 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => moderateDeleteItem(itemId, reason))}
        className="self-start px-4 py-2 rounded-lg bg-danger-container text-danger-crimson text-label-md font-semibold hover:brightness-95 disabled:opacity-60"
      >
        {isPending ? "Suppression…" : "Supprimer cette annonce"}
      </button>
    </div>
  );
}
