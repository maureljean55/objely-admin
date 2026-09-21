import Link from "next/link";
import { listIdentityVerifications, type IdentityVerificationStatus } from "@/lib/queries/identityVerifications";
import { approveIdentityVerification, rejectIdentityVerification, revokeIdentityVerification } from "@/lib/actions/identityVerifications";
import { Badge } from "@/components/Badge";
import { formatNumber, formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const STATUS_LABEL: Record<IdentityVerificationStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

const STATUS_BADGE_VARIANT: Record<IdentityVerificationStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const FILTERS: { value: IdentityVerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Refusés" },
  { value: "all", label: "Tous" },
];

export default async function VerificationsIdentitePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filter = (FILTERS.some((f) => f.value === params.filter) ? params.filter : "pending") as IdentityVerificationStatus | "all";

  const { rows, total, pageSize } = await listIdentityVerifications(page, filter);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Vérification d&apos;identité</h1>
        <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} documents soumis par les utilisateurs</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card self-start">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "pending" ? "/verifications-identite" : `/verifications-identite?filter=${f.value}`}
            className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
              filter === f.value ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
        {rows.map((verification) => (
          <div key={verification.id} className="flex flex-col sm:flex-row gap-4 p-4">
            {verification.documentUrl ? (
              <a href={verification.documentUrl} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed URL from a private bucket, not a whitelisted image domain */}
                <img
                  src={verification.documentUrl}
                  alt="Document d'identité"
                  className="w-full sm:w-48 aspect-[4/3] object-cover rounded-lg bg-surface-bg hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <div className="w-full sm:w-48 aspect-[4/3] rounded-lg bg-surface-bg flex items-center justify-center text-on-surface-variant shrink-0 text-body-sm">
                Document indisponible
              </div>
            )}

            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={STATUS_BADGE_VARIANT[verification.status]}>{STATUS_LABEL[verification.status]}</Badge>
                  <h3 className="text-title-md text-on-surface">
                    {verification.userName} {verification.userEmail ? `(${verification.userEmail})` : ""}
                  </h3>
                </div>
                <span className="text-label-sm text-on-surface-variant shrink-0">{formatDateTime(verification.createdAt)}</span>
              </div>

              {verification.status !== "pending" && (
                <p className="text-label-sm text-on-surface-variant">
                  {verification.status === "approved" ? "Approuvé" : "Refusé"} le {formatDateTime(verification.reviewedAt!)} par{" "}
                  {verification.reviewedBy}
                  {verification.status === "rejected" && verification.rejectionReason && ` — ${verification.rejectionReason}`}
                </p>
              )}

              {verification.status === "approved" && (
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border-subtle">
                  <form
                    action={async () => {
                      "use server";
                      await revokeIdentityVerification(verification.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-surface-bg text-on-surface-variant hover:bg-surface-bg/70 transition-colors"
                    >
                      Annuler l&apos;approbation
                    </button>
                  </form>
                </div>
              )}

              {verification.status === "pending" && (
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border-subtle">
                  <form
                    action={async () => {
                      "use server";
                      await approveIdentityVerification(verification.id);
                    }}
                  >
                    <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-success-container text-success-emerald hover:brightness-95 transition-colors">
                      Approuver
                    </button>
                  </form>
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await rejectIdentityVerification(verification.id, String(formData.get("reason") ?? ""));
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <input
                      name="reason"
                      placeholder="Raison du refus (optionnel)"
                      className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg bg-surface-bg border border-border-subtle text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button type="submit" className="shrink-0 px-3 py-1.5 rounded-lg text-label-sm font-medium bg-danger-container text-danger-crimson hover:brightness-95 transition-colors">
                      Refuser
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-10 text-center text-body-sm text-on-surface-variant">Aucune vérification dans cette catégorie.</p>}
        <Pagination page={page} totalPages={totalPages} basePath="/verifications-identite" extraParams={{ filter: filter === "pending" ? undefined : filter }} />
      </div>
    </div>
  );
}
