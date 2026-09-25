"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CredentialsDialog } from "@/components/CredentialsDialog";
import { OrganizationForm } from "@/components/OrganizationForm";
import {
  deleteOrganization,
  resetOrganizationPassword,
  revokeOrganizationKiosk,
  setOrganizationKioskLimit,
  setOrganizationMemberActive,
  setOrganizationSuspended,
  updateOrganization,
} from "@/lib/actions/organizations";
import type { Credentials, OrganizationEdit } from "@/lib/organizations-shared";

type Mode = "view" | "edit" | "reset" | "suspend" | "delete";

const BUTTON = "inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-2 text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-bg disabled:opacity-50";

/** Header actions of an establishment's page: edit, new password, suspend / reactivate, delete. */
export function OrganizationActions({
  id,
  name,
  initial,
  suspended,
  canSuspend,
  isSuperAdmin,
}: {
  id: string;
  name: string;
  initial: OrganizationEdit;
  suspended: boolean;
  /** false until the suspension migration is applied on the school database. */
  canSuspend: boolean;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = (next: Mode) => {
    setError(null);
    setConfirmName("");
    setMode(next);
  };

  const run = (action: () => Promise<void>) => {
    setError(null);
    startTransition(action);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => open("edit")} className={BUTTON}>
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Modifier
        </button>
        {isSuperAdmin && (
          <>
            <button type="button" onClick={() => open("reset")} className={BUTTON}>
              <span className="material-symbols-outlined text-[18px]">key</span>
              Nouveau mot de passe
            </button>
            {canSuspend && (
              <button type="button" onClick={() => open("suspend")} className={BUTTON}>
                <span className="material-symbols-outlined text-[18px]">{suspended ? "play_circle" : "block"}</span>
                {suspended ? "Réactiver" : "Suspendre"}
              </button>
            )}
          </>
        )}
        <button type="button" onClick={() => open("delete")} className={`${BUTTON} text-danger-crimson hover:bg-danger-container`}>
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Supprimer
        </button>
      </div>

      {mode === "edit" && (
        <div className="rounded-xl bg-surface-card p-5 shadow-card">
          <OrganizationForm
            mode="edit"
            initial={initial}
            onCancel={() => setMode("view")}
            onSubmit={async (input) => {
              const result = await updateOrganization(id, input);
              if (result.ok) {
                setMode("view");
                router.refresh();
              }
              return result;
            }}
          />
        </div>
      )}

      {mode === "reset" && (
        <Confirm tone="warning" pending={isPending} onCancel={() => setMode("view")} confirmLabel={isPending ? "Génération…" : "Générer"}
          onConfirm={() => run(async () => {
            const result = await resetOrganizationPassword(id);
            if (!result.ok) return setError(result.error);
            setCredentials(result.credentials);
            setMode("view");
          })}
        >
          Générer un nouveau mot de passe ? L&apos;ancien cessera de fonctionner immédiatement.
        </Confirm>
      )}

      {mode === "suspend" && (
        <Confirm tone={suspended ? "warning" : "danger"} pending={isPending} onCancel={() => setMode("view")}
          confirmLabel={isPending ? "Enregistrement…" : suspended ? "Réactiver" : "Suspendre"}
          onConfirm={() => run(async () => {
            const result = await setOrganizationSuspended(id, !suspended);
            if (!result.ok) return setError(result.error);
            setMode("view");
            router.refresh();
          })}
        >
          {suspended
            ? <>Réactiver <strong>{name}</strong> ? Son personnel pourra de nouveau se connecter et ses bornes recevoir des déclarations.</>
            : <>Suspendre <strong>{name}</strong> ? Son personnel ne pourra plus se connecter et ses bornes refuseront les déclarations. Rien n&apos;est supprimé : vous pourrez réactiver à tout moment.</>}
        </Confirm>
      )}

      {mode === "delete" && (
        <div className="flex flex-col gap-3 rounded-lg bg-danger-container px-4 py-3 text-body-sm text-danger-crimson">
          <p>
            <strong>Supprimer définitivement {name} ?</strong> Tous ses objets, déclarations, restitutions et comptes de connexion seront effacés. Cette action est irréversible.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`Tapez « ${name} » pour confirmer`}
              aria-label="Nom de l'établissement à confirmer"
              className="min-w-[260px] flex-1 rounded-lg border border-danger-crimson/40 bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-danger-crimson/30"
            />
            <button
              type="button"
              disabled={isPending || confirmName.trim().toLowerCase() !== name.trim().toLowerCase()}
              onClick={() => run(async () => {
                const result = await deleteOrganization(id, confirmName);
                if (!result.ok) return setError(result.error);
                if (result.accountsLeft > 0) alert(`Établissement supprimé, mais ${result.accountsLeft} compte(s) de connexion n'ont pas pu être supprimés.`);
                router.push("/organisation");
              })}
              className="rounded-lg bg-danger-crimson px-3 py-2 text-label-sm font-semibold text-white disabled:opacity-40"
            >
              {isPending ? "Suppression…" : "Supprimer"}
            </button>
            <button type="button" onClick={() => setMode("view")} disabled={isPending} className="px-3 py-2 text-label-sm text-on-surface-variant">Annuler</button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-body-sm font-medium text-danger-crimson">{error}</p>}
      {credentials && <CredentialsDialog title="Nouveau mot de passe" credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

function Confirm({
  tone,
  pending,
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: {
  tone: "warning" | "danger";
  pending: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-body-sm ${tone === "danger" ? "bg-danger-container text-danger-crimson" : "bg-warning-container text-warning-amber"}`}>
      <span className="min-w-[240px] flex-1">{children}</span>
      <button type="button" onClick={onConfirm} disabled={pending} className={`rounded-lg px-3 py-1.5 text-label-sm font-semibold text-white disabled:opacity-60 ${tone === "danger" ? "bg-danger-crimson" : "bg-primary"}`}>
        {confirmLabel}
      </button>
      <button type="button" onClick={onCancel} disabled={pending} className="px-3 py-1.5 text-label-sm text-on-surface-variant">Annuler</button>
    </div>
  );
}

/** Turn a staff account of the establishment off or back on. */
export function MemberToggle({ organizationId, memberId, active, name }: { organizationId: string; memberId: string; active: boolean; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      {error && <span role="alert" className="text-body-sm text-danger-crimson">{error}</span>}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (active && !confirm(`Désactiver le compte de ${name} ? Il ne pourra plus se connecter.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await setOrganizationMemberActive(organizationId, memberId, !active);
            if (result.ok) router.refresh();
            else setError(result.error);
          });
        }}
        className={`rounded-lg px-2.5 py-1 text-label-sm font-semibold transition-colors disabled:opacity-50 ${active ? "text-danger-crimson hover:bg-danger-container" : "text-primary hover:bg-primary/10"}`}
      >
        {isPending ? "…" : active ? "Désactiver" : "Réactiver"}
      </button>
    </span>
  );
}

/** Remove a borne: it goes back to its pairing screen. */
export function KioskRevoke({ organizationId, kioskId, name }: { organizationId: string; kioskId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      {error && <span role="alert" className="text-body-sm text-danger-crimson">{error}</span>}
      <button
        type="button"
        disabled={isPending}
        title="Révoquer la borne"
        aria-label={`Révoquer la borne ${name}`}
        onClick={() => {
          if (!confirm(`Révoquer la borne « ${name} » ? Elle revient à l'écran d'appairage et l'établissement devra l'appairer à nouveau.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await revokeOrganizationKiosk(organizationId, kioskId);
            if (result.ok) router.refresh();
            else setError(result.error);
          });
        }}
        className="rounded-lg p-1.5 text-danger-crimson transition-colors hover:bg-danger-container disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">link_off</span>
      </button>
    </span>
  );
}

/** How many bornes the establishment may add. Empty = no limit. */
export function KioskLimitForm({ organizationId, limit, count }: { organizationId: string; limit: number | null; count: number }) {
  const router = useRouter();
  const [value, setValue] = useState(limit === null ? "" : String(limit));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const next = value.trim() === "" ? null : Number(value);
  const changed = next !== limit;

  return (
    <form
      className="flex flex-col gap-2 border-t border-border-subtle px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await setOrganizationKioskLimit(organizationId, next);
          if (!result.ok) return setMessage({ ok: false, text: result.error });
          setMessage({
            ok: true,
            text:
              next === null
                ? "Enregistré : aucune limite."
                : next <= count
                  ? `Enregistré. L'établissement a déjà ${count} borne${count > 1 ? "s" : ""} : il ne pourra plus en ajouter (les existantes sont gardées).`
                  : `Enregistré : il peut encore ajouter ${next - count} borne${next - count > 1 ? "s" : ""}.`,
          });
          router.refresh();
        });
      }}
    >
      <label htmlFor="max-kiosks" className="text-label-md font-semibold text-on-surface">Nombre maximum de bornes</label>
      <div className="flex items-center gap-2">
        <input
          id="max-kiosks"
          type="number"
          inputMode="numeric"
          min={0}
          max={1000}
          step={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setMessage(null);
          }}
          placeholder="Illimité"
          className="w-32 rounded-lg border border-border-subtle bg-white px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button type="submit" disabled={isPending || !changed} className="rounded-lg bg-primary px-3 py-2 text-label-sm font-semibold text-white disabled:opacity-50">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {value !== "" && (
          <button type="button" disabled={isPending} onClick={() => setValue("")} className="px-2 py-2 text-label-sm text-on-surface-variant hover:text-on-surface">
            Sans limite
          </button>
        )}
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Une fois ce nombre atteint, l&apos;établissement ne peut plus ajouter de borne depuis son espace. Laissez vide pour ne pas limiter.
      </p>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-body-sm font-medium ${message.ok ? "text-success-emerald" : "text-danger-crimson"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
