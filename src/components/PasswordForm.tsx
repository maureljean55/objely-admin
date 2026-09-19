"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/settings";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (next !== confirm) {
      setMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    startTransition(async () => {
      const result = await changePassword(current, next);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Mot de passe mis à jour." });
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        type="password"
        placeholder="Mot de passe actuel"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={10}
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <input
        type="password"
        placeholder="Confirmer le nouveau mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={10}
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {message && <p className={`text-sm ${message.type === "error" ? "text-danger-crimson" : "text-success-emerald"}`}>{message.text}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-105 disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Mettre à jour"}
      </button>
    </form>
  );
}
