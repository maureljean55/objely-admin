import { listAuditLog } from "@/lib/queries/auditLog";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const ACTION_ICON: Record<string, string> = {
  "user.suspend": "block",
  "user.unsuspend": "check_circle",
  "match.status_change": "link",
  "report.resolve": "task_alt",
  "report.reopen": "flag",
  "support.reply": "chat_bubble",
  "support.status_change": "support_agent",
  "admin.password_change": "password",
  "admin.create": "person_add",
  "admin.remove": "person_remove",
  "item.moderate_delete": "delete",
  "item.restore": "restore",
  "identity_verification.approve": "verified",
  "identity_verification.reject": "gpp_bad",
  "identity_verification.revoke": "undo",
  "admin.avatar_update": "photo_camera",
  "organization.create": "add_business",
  "organization.update": "edit",
  "organization.delete": "delete",
};

const ACTION_LABEL: Record<string, string> = {
  "user.suspend": "Utilisateur suspendu",
  "user.unsuspend": "Utilisateur réactivé",
  "match.status_change": "Statut de correspondance modifié",
  "report.resolve": "Signalement résolu",
  "report.reopen": "Signalement rouvert",
  "support.reply": "Réponse envoyée en support",
  "support.status_change": "Statut de conversation modifié",
  "admin.password_change": "Mot de passe modifié",
  "admin.create": "Administrateur créé",
  "admin.remove": "Administrateur supprimé",
  "item.moderate_delete": "Annonce supprimée (modération)",
  "item.restore": "Annonce restaurée",
  "identity_verification.approve": "Vérification d'identité approuvée",
  "identity_verification.reject": "Vérification d'identité refusée",
  "identity_verification.revoke": "Approbation d'identité annulée",
  "admin.avatar_update": "Photo de profil modifiée",
  "organization.create": "Établissement inscrit",
  "organization.update": "Établissement modifié",
  "organization.delete": "Établissement supprimé",
};

export default async function JournalActivitePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { rows, total, pageSize } = await listAuditLog(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Journal d&apos;activité</h1>
        <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} actions administratives enregistrées</p>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
        {rows.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-4">
            <span className="p-2 rounded-lg bg-surface-bg text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-[18px]">{ACTION_ICON[entry.action] || "info"}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-md text-on-surface">
                <span className="font-semibold">{entry.adminEmail}</span> — {ACTION_LABEL[entry.action] || entry.action}
              </p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                {entry.targetType}
                {entry.targetId ? ` #${entry.targetId.slice(0, 8)}` : ""}
                {entry.details && Object.keys(entry.details).length > 0 ? ` · ${JSON.stringify(entry.details)}` : ""}
              </p>
            </div>
            <span className="text-label-sm text-on-surface-variant shrink-0 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-10 text-center text-body-sm text-on-surface-variant">Aucune action enregistrée pour le moment.</p>}
        <Pagination page={page} totalPages={totalPages} basePath="/journal-activite" />
      </div>
    </div>
  );
}
