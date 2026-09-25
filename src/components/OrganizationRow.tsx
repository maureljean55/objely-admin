"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import { CredentialsDialog } from "@/components/CredentialsDialog";
import { OrganizationForm } from "@/components/OrganizationForm";
import { useRouter } from "next/navigation";
import { deleteOrganization, resetOrganizationPassword, setOrganizationSuspended, updateOrganization } from "@/lib/actions/organizations";
import { formatDate, formatDateTime } from "@/lib/format";
import { ORGANIZATION_TYPES, type Credentials, type OrganizationSummary } from "@/lib/organizations-shared";

export function OrganizationRow({ organization: o, isSuperAdmin }: { organization: OrganizationSummary; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "reset" | "suspend" | "delete">("view");
  const suspended = Boolean(o.suspendedAt);
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

  function toggleSuspension() {
    setError(null);
    startTransition(async () => {
      const result = await setOrganizationSuspended(o.id, !suspended);
      if (!result.ok) return setError(result.error);
      setMode("view");
      router.refresh();
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

  const COLUMNS = 7;
  const panel = (children: React.ReactNode) => (
    <tr className="border-t border-border-subtle">
      <td colSpan={COLUMNS} className="bg-surface-bg/60 px-5 py-4">
        {children}
      </td>
    </tr>
  );

  return (
    <>
      <tr className="border-t border-border-subtle align-top transition-colors hover:bg-surface-bg/50">
        <td className="px-5 py-3.5">
          {/* The establishment's name opens its dashboard. */}
          <Link href={`/organisation/${o.id}`} className="group flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-label-md font-semibold text-on-surface group-hover:text-primary group-hover:underline">{o.name}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="tertiary">{ORGANIZATION_TYPES[o.type]}</Badge>
                {o.suspendedAt ? <Badge variant="danger">Suspendu</Badge> : <Badge variant="success">Actif</Badge>}
              </span>
            </span>
          </Link>
        </td>
        <td className="px-3 py-3.5 text-body-sm text-on-surface">{o.city || <span className="text-muted">—</span>}</td>
        <td className="px-3 py-3.5 text-body-sm">
          {o.phone || o.contactEmail ? (
            <>
              {o.phone && <span className="block text-on-surface">{o.phone}</span>}
              {o.contactEmail && <span className="block text-on-surface-variant">{o.contactEmail}</span>}
            </>
          ) : (
            <span className="text-muted">Non renseigné</span>
          )}
        </td>
        <td className="px-3 py-3.5 text-body-sm">
          {o.admin ? (
            <>
              <span className="block text-on-surface">{o.admin.name}</span>
              <span className="block text-on-surface-variant">{o.admin.email}</span>
              {o.admin.lastSeenAt ? (
                <span className="block text-muted">Connecté {formatDateTime(o.admin.lastSeenAt)}</span>
              ) : (
                <span className="mt-1 inline-block"><Badge variant="warning">Jamais connecté</Badge></span>
              )}
            </>
          ) : (
            <span className="text-muted">Aucun compte</span>
          )}
        </td>
        <td className="px-3 py-3.5 text-body-sm tabular-nums text-on-surface">
          {o.kioskCount}
          {o.maxKiosks !== null && <span className="text-muted"> / {o.maxKiosks}</span>}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 text-body-sm text-on-surface">{formatDate(o.createdAt)}</td>
        <td className="px-5 py-3.5">
          <div className="flex justify-end">
            <button type="button" onClick={() => { setError(null); setMode("edit"); }} title="Modifier" aria-label={`Modifier ${o.name}`} className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-bg">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            {isSuperAdmin && (
              <button type="button" onClick={() => { setError(null); setMode("reset"); }} title="Nouveau mot de passe" aria-label={`Nouveau mot de passe pour ${o.name}`} className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-bg">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setError(null); setMode("suspend"); }}
              title={suspended ? "Réactiver" : "Suspendre"}
              aria-label={`${suspended ? "Réactiver" : "Suspendre"} ${o.name}`}
              className={`rounded-lg p-2 transition-colors ${suspended ? "text-success-emerald hover:bg-success-container" : "text-warning-amber hover:bg-warning-container"}`}
            >
              <span className="material-symbols-outlined text-[18px]">{suspended ? "play_circle" : "block"}</span>
            </button>
            {isSuperAdmin && (
              <button type="button" onClick={() => { setError(null); setConfirmName(""); setMode("delete"); }} title="Supprimer" aria-label={`Supprimer ${o.name}`} className="rounded-lg p-2 text-danger-crimson transition-colors hover:bg-danger-container">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {mode === "edit" &&
        panel(
          <OrganizationForm
            mode="edit"
            initial={{ name: o.name, type: o.type, city: o.city ?? "", address: o.address ?? "", phone: o.phone ?? "", contactEmail: o.contactEmail ?? "", retentionDays: o.retentionDays, helpDesk: o.helpDesk ?? "" }}
            onCancel={() => setMode("view")}
            onSubmit={async (input) => {
              const result = await updateOrganization(o.id, input);
              if (result.ok) setMode("view");
              return result;
            }}
          />,
        )}

      {mode === "reset" &&
        panel(
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-warning-container px-4 py-3 text-body-sm text-warning-amber">
            <span className="flex-1">Générer un nouveau mot de passe ? L&apos;ancien cessera de fonctionner immédiatement.</span>
            <button type="button" onClick={reset} disabled={isPending} className="rounded-lg bg-primary px-3 py-1.5 text-label-sm font-semibold text-white disabled:opacity-60">
              {isPending ? "Génération…" : "Générer"}
            </button>
            <button type="button" onClick={() => setMode("view")} disabled={isPending} className="px-3 py-1.5 text-label-sm text-on-surface-variant">Annuler</button>
          </div>,
        )}

      {mode === "suspend" &&
        panel(
          <div
            className={`flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-body-sm ${
              suspended ? "bg-success-container text-success-emerald" : "bg-warning-container text-warning-amber"
            }`}
          >
            <span className="min-w-[240px] flex-1">
              {suspended ? (
                <>
                  <strong>Réactiver {o.name} ?</strong> Son personnel pourra de nouveau se connecter et ses bornes recevoir des déclarations.
                </>
              ) : (
                <>
                  <strong>Suspendre {o.name} ?</strong> Son personnel ne pourra plus se connecter et ses bornes refuseront les déclarations. Rien n&apos;est
                  supprimé : vous pourrez le réactiver à tout moment.
                </>
              )}
            </span>
            <button
              type="button"
              onClick={toggleSuspension}
              disabled={isPending}
              className={`rounded-lg px-3 py-1.5 text-label-sm font-semibold text-white disabled:opacity-60 ${suspended ? "bg-success-emerald" : "bg-warning-amber"}`}
            >
              {isPending ? "Enregistrement…" : suspended ? "Réactiver" : "Suspendre"}
            </button>
            <button type="button" onClick={() => setMode("view")} disabled={isPending} className="px-3 py-1.5 text-label-sm text-on-surface-variant">Annuler</button>
          </div>,
        )}

      {mode === "delete" &&
        panel(
          <div className="flex flex-col gap-3 rounded-lg bg-danger-container px-4 py-3 text-body-sm text-danger-crimson">
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
          </div>,
        )}

      {error &&
        panel(<p role="alert" className="text-body-sm font-medium text-danger-crimson">{error}</p>)}
      {credentials && (
        <tr>
          <td colSpan={COLUMNS} className="p-0">
            <CredentialsDialog title="Nouveau mot de passe" credentials={credentials} onClose={() => setCredentials(null)} />
          </td>
        </tr>
      )}
    </>
  );
}
