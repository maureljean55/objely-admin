"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import { OrganizationForm } from "@/components/OrganizationForm";
import { deleteOrganization, updateOrganization } from "@/lib/actions/organizations";
import { formatDate } from "@/lib/format";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/queries/organizations-shared";

export type OrganizationRowData = {
  id: string;
  name: string;
  type: OrganizationType;
  city: string | null;
  contactEmail: string | null;
  createdAt: string;
};

export function OrganizationRow({ organization }: { organization: OrganizationRowData }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteOrganization(organization.id);
      if (result.error) {
        setError(result.error);
        setMode("view");
      }
    });
  }

  if (mode === "edit") {
    return (
      <div className="p-4 bg-surface-bg/60">
        <OrganizationForm
          initial={{
            name: organization.name,
            type: organization.type,
            city: organization.city ?? "",
            contactEmail: organization.contactEmail ?? "",
          }}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          onSubmit={(input) => updateOrganization(organization.id, input)}
          onCancel={() => setMode("view")}
          onDone={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[20px]">school</span>
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-md text-on-surface font-semibold truncate">{organization.name}</span>
          <Badge variant="tertiary">{ORGANIZATION_TYPES[organization.type]}</Badge>
        </div>
        <p className="text-body-sm text-on-surface-variant truncate">
          {[organization.city, organization.contactEmail].filter(Boolean).join(" · ") || "Aucun contact renseigné"}
        </p>
        {error && (
          <p role="alert" className="text-label-sm text-danger-crimson mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-label-sm text-on-surface-variant">Inscrit le</p>
        <p className="text-label-md text-on-surface">{formatDate(organization.createdAt)}</p>
      </div>

      {mode === "confirm-delete" ? (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-label-sm text-on-surface-variant mr-1">Supprimer ?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-danger-crimson text-white text-label-sm font-semibold hover:brightness-105 disabled:opacity-60"
          >
            {isPending ? "Suppression…" : "Oui, supprimer"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-bg disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("edit");
            }}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-bg transition-colors"
            title="Modifier"
            aria-label={`Modifier ${organization.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("confirm-delete");
            }}
            className="p-2 rounded-lg text-danger-crimson hover:bg-danger-container transition-colors"
            title="Supprimer"
            aria-label={`Supprimer ${organization.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
