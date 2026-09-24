"use client";

import { useState, useTransition } from "react";
import {
  DEFAULT_RETENTION_DAYS,
  ORGANIZATION_TYPES,
  type ActionResult,
  type FieldName,
  type OrganizationEdit,
  type OrganizationInput,
  type OrganizationType,
} from "@/lib/organizations-shared";

const INPUT =
  "rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-label-sm text-on-surface">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-danger-crimson">*</span>}
      </span>
      {children}
      {error ? <span role="alert" className="text-label-sm font-medium text-danger-crimson">{error}</span> : hint && <span className="text-label-sm text-on-surface-variant">{hint}</span>}
    </label>
  );
}

const border = (error?: string) => (error ? "border-danger-crimson" : "border-border-subtle");

type Props =
  | { mode: "create"; onSubmit: (input: OrganizationInput) => Promise<ActionResult<object>>; onCancel: () => void; initial?: undefined }
  | { mode: "edit"; onSubmit: (input: OrganizationEdit) => Promise<ActionResult<object>>; onCancel: () => void; initial: OrganizationEdit };

// One form for both registering an establishment (with its administrator) and editing one afterwards.
export function OrganizationForm(props: Props) {
  const { mode, onCancel } = props;
  const initial = props.initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<OrganizationType>(initial?.type ?? "lycee");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [retentionDays, setRetentionDays] = useState(String(initial?.retentionDays ?? DEFAULT_RETENTION_DAYS));
  const [helpDesk, setHelpDesk] = useState(initial?.helpDesk ?? "");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState<{ field?: FieldName; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldError = (f: FieldName) => (error?.field === f ? error.message : undefined);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Quick checks so the obvious mistakes never leave the page; the server checks everything again.
    if (!name.trim()) return setError({ field: "name", message: "Le nom de l'établissement est requis." });
    const days = Number(retentionDays);
    if (!Number.isInteger(days) || days < 1 || days > 730) return setError({ field: "retentionDays", message: "Entre 1 et 730 jours." });
    if (mode === "create") {
      if (!adminName.trim()) return setError({ field: "adminName", message: "Le nom du responsable est requis." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) return setError({ field: "adminEmail", message: "Saisissez un e-mail valide : il servira d'identifiant." });
    }

    const base = { name, type, city, address, phone, contactEmail, retentionDays: days, helpDesk };
    startTransition(async () => {
      const result = props.mode === "create" ? await props.onSubmit({ ...base, adminName, adminEmail }) : await props.onSubmit(base);
      if (!result.ok) setError({ field: result.field, message: result.error });
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label-md font-semibold text-on-surface">Établissement</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Nom" required error={fieldError("name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex : Lycée Jean Moulin" className={`${INPUT} ${border(fieldError("name"))}`} autoFocus />
          </Field>
          <Field label="Type" required error={fieldError("type")}>
            <select value={type} onChange={(e) => setType(e.target.value as OrganizationType)} className={`${INPUT} ${border(fieldError("type"))}`}>
              {Object.entries(ORGANIZATION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Adresse" error={fieldError("address")}>
            <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="Ex : 12 rue de la République" className={`${INPUT} ${border(fieldError("address"))}`} />
          </Field>
          <Field label="Ville" error={fieldError("city")}>
            <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="Ex : Lyon" className={`${INPUT} ${border(fieldError("city"))}`} />
          </Field>
          <Field label="Téléphone" error={fieldError("phone")}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" placeholder="Ex : 04 72 00 00 00" className={`${INPUT} ${border(fieldError("phone"))}`} />
          </Field>
          <Field label="E-mail de contact" hint="Celui de la vie scolaire ou du secrétariat." error={fieldError("contactEmail")}>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={160} placeholder="vie-scolaire@etablissement.fr" className={`${INPUT} ${border(fieldError("contactEmail"))}`} />
          </Field>
        </div>
      </fieldset>

      {mode === "create" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-label-md font-semibold text-on-surface">Responsable de l&apos;accès</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Nom complet" required error={fieldError("adminName")}>
              <input value={adminName} onChange={(e) => setAdminName(e.target.value)} maxLength={80} autoComplete="off" className={`${INPUT} ${border(fieldError("adminName"))}`} />
            </Field>
            <Field label="E-mail de connexion" required hint="C'est l'identifiant de l'établissement." error={fieldError("adminEmail")}>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} maxLength={160} autoComplete="off" className={`${INPUT} ${border(fieldError("adminEmail"))}`} />
            </Field>
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-body-sm text-primary">
            <span className="material-symbols-outlined mt-px text-[18px]">key</span>
            Un mot de passe sera généré à l&apos;inscription. Il s&apos;affichera une seule fois : vous pourrez le copier et le transmettre à l&apos;établissement.
          </p>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label-md font-semibold text-on-surface">Réglages de départ</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Durée de conservation des objets (jours)" hint="Passé ce délai, un objet non réclamé peut être donné." error={fieldError("retentionDays")}>
            <input type="number" min={1} max={730} value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} className={`${INPUT} ${border(fieldError("retentionDays"))}`} />
          </Field>
          <Field label="Numéro d'aide affiché sur la borne" hint="Facultatif. Ex : Poste 204." error={fieldError("helpDesk")}>
            <input value={helpDesk} onChange={(e) => setHelpDesk(e.target.value)} maxLength={60} className={`${INPUT} ${border(fieldError("helpDesk"))}`} />
          </Field>
        </div>
        <p className="text-label-sm text-on-surface-variant">L&apos;établissement pourra modifier ces réglages lui-même.</p>
      </fieldset>

      {error && !error.field && (
        <p role="alert" className="rounded-lg bg-danger-container px-3 py-2.5 text-body-sm font-medium text-danger-crimson">{error.message}</p>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60">
          {isPending ? (mode === "create" ? "Inscription…" : "Enregistrement…") : mode === "create" ? "Inscrire et générer le mot de passe" : "Enregistrer"}
        </button>
        <button type="button" onClick={onCancel} disabled={isPending} className="rounded-lg px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-bg disabled:opacity-60">
          Annuler
        </button>
      </div>
    </form>
  );
}
