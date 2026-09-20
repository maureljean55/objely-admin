"use client";

import { useState, useTransition } from "react";
import { createAdmin } from "@/lib/actions/adminUsers";

export function CreateAdminForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await createAdmin(email, fullName, role);
      if (result.error) {
        setError(result.error);
      } else if (result.email && result.password) {
        setCreated({ email: result.email, password: result.password });
        setEmail("");
        setFullName("");
        setRole("admin");
      }
    });
  }

  if (created) {
    return (
      <div className="bg-success-container border border-success-emerald/30 rounded-xl p-4 flex flex-col gap-2">
        <p className="text-body-md text-on-surface font-medium">Compte créé pour {created.email}</p>
        <p className="text-body-sm text-on-surface-variant">
          Mot de passe temporaire (à communiquer une seule fois, il ne sera plus jamais affiché) :
        </p>
        <code className="bg-surface-card px-3 py-2 rounded-lg text-body-md font-mono select-all">{created.password}</code>
        <button type="button" onClick={() => setCreated(null)} className="self-start text-label-sm text-primary hover:underline mt-1">
          Créer un autre administrateur
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        type="text"
        placeholder="Nom complet"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
        className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>
      {error && <p className="text-sm text-danger-crimson">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-105 disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer l'administrateur"}
      </button>
    </form>
  );
}
