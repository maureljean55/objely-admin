import Image from "next/image";
import { listUsers } from "@/lib/queries/users";
import { setUserSuspended } from "@/lib/actions/users";
import { Badge } from "@/components/Badge";
import { formatNumber, formatDateTime, initials } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

export default async function UtilisateursPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q ?? "";

  const { rows, total, pageSize } = await listUsers(page, search);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Gestion des utilisateurs</h1>
          <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} utilisateurs inscrits sur Objely</p>
        </div>
        <form className="relative" action="/utilisateurs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Rechercher par nom..."
            className="h-9 pl-9 pr-3 rounded-lg bg-surface-card border border-border-subtle text-body-sm w-64 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-bg text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Utilisateur</th>
                <th className="py-3 px-3">Coordonnées</th>
                <th className="py-3 px-3">Inscription</th>
                <th className="py-3 px-3">Objets déclarés</th>
                <th className="py-3 px-3">Confiance</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {rows.map((user) => (
                <tr key={user.id} className="border-t border-border-subtle hover:bg-surface-bg/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-semibold shrink-0">
                          {initials(user.fullName)}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-label-md text-on-surface font-semibold truncate">{user.fullName || "Sans nom"}</span>
                        <span className="text-body-sm text-on-surface-variant truncate">#{user.publicId ?? "—"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col text-body-sm">
                      <span className="text-on-surface truncate max-w-[200px]">{user.email || "—"}</span>
                      <span className="text-on-surface-variant">{user.sharePhone ? user.phone || "—" : "Téléphone privé"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-body-sm text-on-surface-variant whitespace-nowrap">{formatDateTime(user.createdAt)}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2 text-body-sm">
                      <span title="Objets perdus" className="inline-flex items-center gap-1 text-warning-amber">
                        <span className="material-symbols-outlined text-[15px]">search</span>
                        {user.lostCount}
                      </span>
                      <span title="Objets trouvés" className="inline-flex items-center gap-1 text-sky-blue">
                        <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                        {user.foundCount}
                      </span>
                      <span title="Objets restitués" className="inline-flex items-center gap-1 text-success-emerald">
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        {user.recoveredCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-bg overflow-hidden">
                        <div
                          className={`h-full rounded-full ${user.trustScore >= 70 ? "bg-success-emerald" : user.trustScore >= 40 ? "bg-warning-amber" : "bg-danger-crimson"}`}
                          style={{ width: `${Math.min(100, Math.max(0, user.trustScore))}%` }}
                        />
                      </div>
                      <span className="text-label-sm text-on-surface-variant">{user.trustScore}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    {user.suspended ? <Badge variant="danger">Suspendu</Badge> : <Badge variant="success">Actif</Badge>}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await setUserSuspended(user.id, !user.suspended);
                      }}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors ${
                          user.suspended
                            ? "bg-success-container text-success-emerald hover:brightness-95"
                            : "bg-danger-container text-danger-crimson hover:brightness-95"
                        }`}
                      >
                        {user.suspended ? "Réactiver" : "Suspendre"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-body-sm text-on-surface-variant">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} basePath="/utilisateurs" extraParams={{ q: search }} />
      </div>
    </div>
  );
}
