"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import { CredentialsDialog } from "@/components/CredentialsDialog";
import { OrganizationForm } from "@/components/OrganizationForm";
import { deleteOrganization, resetOrganizationPassword, updateOrganization } from "@/lib/actions/organizations";
import { formatDate, formatDateTime } from "@/lib/format";
import { ORGANIZATION_TYPES, type Credentials, type OrganizationSummary } from "@/lib/organizations-shared";

export function OrganizationRow({ organization: o, isSuperAdmin }: { organization: OrganizationSummary; isSuperAdmin: boolean }) {
  const [mode, setMode] = useState<"view" | "edit" | "reset" | "delete">("view");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setError(null);
    startTransition(async () => {
      const result = await resetOrganizationPassword(o.id);
      if (result.ok) {
        setCredentials(result.credentials);
        setMode("view");
      } else {
        setError(result.error);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteOrganization(o.id, confirmName);
      if (!result.ok) setError(result.error);
      else if (result.accountsLeft > 0) alert(`Établissement supprimé, mais ${result.accountsLeft} compte(s) de connexion n'ont pas pu être supprimés.`);
    });
  }

  if (mode === "edit") {
    return (
      <div className="bg-surface-bg/60 p-5">
        <OrganizationForm
          mode="edit"
          initial={{ name: o.name, type: o.type, city: o.city ?? "", address: o.address ?? "", phone: o.phone ?? "", contactEmail: o.contactEmail ?? "", retentionDays: o.retentionDays, helpDesk: o.helpDesk ?? "" }}
          onCancel={() => setMode("view")}
          onSubmit={async (input) => {
            const result = await updateOrganization(o.id, input);
            if (result.ok) setMode("view");
            return result;
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-[20px]">school</span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-label-md font-semibold text-on-surface">{o.name}</span>
            <Badge variant="tertiary">{ORGANIZATION_TYPES[o.type]}</Badge>
            {o.admin && !o.admin.lastSeenAt && <Badge variant="warning">Jamais connecté</Badge>}
          </div>
          <p className="truncate text-body-sm text-on-surface-variant">
            {[o.city, o.phone, o.contactEmail].filter(Boolean).join(" · ") || "Aucune coordonnée renseignée"}
          </p>
          <p className="truncate text-body-sm text-on-surface-variant">
            {o.admin ? `Accès : ${o.admin.name} · ${o.admin.email}` : "Aucun compte administrateur"}
            {o.admin?.lastSeenAt && ` · connecté ${formatDateTime(o.admin.lastSeenAt)}`}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-label-sm text-on-surface-variant">Inscrit le</p>
          <p className="text-label-md text-on-surface">{formatDate(o.createdAt)}</p>
        </div>

        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => { setError(null); setMode("edit"); }} title="Modifier" aria-label={`Modifier ${o.name}`} className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-bg">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          {isSuperAdmin && (
            <>
              <button type="button" onClick={() => { setError(null); setMode("reset"); }} title="Nouveau mot de passe" aria-label={`Nouveau mot de passe pour ${o.name}`} className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-bg">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </button>
              <button type="button" onClick={() => { setError(null); setConfirmName(""); setMode("delete"); }} title="Supprimer" aria-label={`Supprimer ${o.name}`} className="rounded-lg p-2 text-danger-crimson transition-colors hover:bg-danger-container">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {mode === "reset" && (
        <div className="mx-4 mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-warning-container px-4 py-3 text-body-sm text-warning-amber">
          <span className="flex-1">Générer un nouveau mot de passe ? L&apos;ancien cessera de fonctionner immédiatement.</span>
          <button type="button" onClick={reset} disabled={isPending} className="rounded-lg bg-primary px-3 py-1.5 text-label-sm font-semibold text-white disabled:opacity-60">
            {isPending ? "Génération…" : "Générer"}
          </button>
          <button type="button" onClick={() => setMode("view")} disabled={isPending} className="px-3 py-1.5 text-label-sm text-on-surface-variant">Annuler</button>
        </div>
      )}

      {mode === "delete" && (
        <div className="mx-4 mb-4 flex flex-col gap-3 rounded-lg bg-danger-container px-4 py-3 text-body-sm text-danger-crimson">
          <p>
            <strong>Supprimer définitivement {o.name} ?</strong> Tous ses objets, déclarations, restitutions et comptes de connexion seront effacés. Cette action est irréversible.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`Tapez « ${o.name} » pour confirmer`}
              aria-label="Nom de l'établissement à confirmer"
              className="min-w-[260px] flex-1 rounded-lg border border-danger-crimson/40 bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-danger-crimson/30"
            />
            <button type="button" onClick={remove} disabled={isPending || confirmName.trim().toLowerCase() !== o.name.trim().toLowerCase()} className="rounded-lg bg-danger-crimson px-3 py-2 text-label-sm font-semibold text-white disabled:opacity-40">
              {isPending ? "Suppression…" : "Supprimer"}
            </button>
            <button type="button" onClick={() => setMode("view")} disabled={isPending} className="px-3 py-2 text-label-sm text-on-surface-variant">Annuler</button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mx-4 mb-3 text-body-sm font-medium text-danger-crimson">{error}</p>}
      {credentials && <CredentialsDialog title="Nouveau mot de passe" credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}
