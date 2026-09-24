"use client";

import { useState, useTransition } from "react";
import type { OrganizationResult, OrganizationInput } from "@/lib/actions/organizations";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/queries/organizations-shared";

const INPUT =
  "rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

// Shared by "Inscrire un établissement" and the inline edit of a row.
export function OrganizationForm({
  initial,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  onDone,
}: {
  initial?: OrganizationInput;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (input: OrganizationInput) => Promise<OrganizationResult>;
  onCancel?: () => void;
  onDone?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<OrganizationType>(initial?.type ?? "lycee");
  const [city, setCity] = useState(initial?.city ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({ name, type, city, contactEmail });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!initial) {
        setName("");
        setCity("");
        setContactEmail("");
        setType("lycee");
      }
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">Nom de l&apos;établissement</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            placeholder="Ex : Lycée Jean Moulin"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as OrganizationType)} className={INPUT}>
            {Object.entries(ORGANIZATION_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">Ville (facultatif)</span>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">E-mail de contact (facultatif)</span>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={160} className={INPUT} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger-crimson">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-105 disabled:opacity-60"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-bg disabled:opacity-60"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
