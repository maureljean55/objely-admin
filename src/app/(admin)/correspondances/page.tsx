import Link from "next/link";
import { listMatches, type MatchStatus } from "@/lib/queries/matches";
import { setMatchStatus } from "@/lib/actions/matches";
import { Badge } from "@/components/Badge";
import { formatNumber, formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const STATUS_TABS: { key: MatchStatus | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmées" },
  { key: "rejected", label: "Rejetées" },
];

const STATUS_BADGE: Record<MatchStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "En attente", variant: "warning" },
  confirmed: { label: "Confirmée", variant: "success" },
  rejected: { label: "Rejetée", variant: "danger" },
};

export default async function CorrespondancesPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = (["pending", "confirmed", "rejected"].includes(params.status ?? "") ? params.status : "all") as MatchStatus | "all";

  const { rows, total, pageSize } = await listMatches(page, status);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Correspondances détectées</h1>
        <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} correspondances IA entre objets perdus et trouvés</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card self-start">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/correspondances" : `/correspondances?status=${tab.key}`}
            className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
              status === tab.key ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-bg text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Objet perdu</th>
                <th className="py-3 px-3">Objet trouvé</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Détecté</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {rows.map((match) => {
                const badge = STATUS_BADGE[match.status];
                return (
                  <tr key={match.id} className="border-t border-border-subtle hover:bg-surface-bg/50 transition-colors align-top">
                    <td className="py-3.5 px-5">
                      <ItemCell icon={match.lostItem.categoryIcon} title={match.lostItem.title} owner={match.lostItem.ownerName} location={match.lostItem.location} />
                    </td>
                    <td className="py-3.5 px-3">
                      <ItemCell icon={match.foundItem.categoryIcon} title={match.foundItem.title} owner={match.foundItem.ownerName} location={match.foundItem.location} />
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-title-md text-primary font-bold">{match.matchPercent}%</span>
                    </td>
                    <td className="py-3.5 px-3 text-body-sm text-on-surface-variant whitespace-nowrap">{formatDateTime(match.createdAt)}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {match.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await setMatchStatus(match.id, "confirmed");
                            }}
                          >
                            <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-success-container text-success-emerald hover:brightness-95">
                              Confirmer
                            </button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await setMatchStatus(match.id, "rejected");
                            }}
                          >
                            <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-danger-container text-danger-crimson hover:brightness-95">
                              Rejeter
                            </button>
                          </form>
                        </div>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await setMatchStatus(match.id, "pending");
                          }}
                        >
                          <button type="submit" className="px-3 py-1.5 rounded-lg text-label-sm font-medium bg-surface-bg text-on-surface-variant hover:bg-surface-bg/70">
                            Rouvrir
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-body-sm text-on-surface-variant">
                    Aucune correspondance dans cette catégorie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} basePath="/correspondances" extraParams={{ status: status !== "all" ? status : undefined }} />
      </div>
    </div>
  );
}

function ItemCell({ icon, title, owner, location }: { icon: string | null; title: string; owner: string; location: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="p-1.5 rounded-lg bg-surface-bg text-primary shrink-0">
        <span className="material-symbols-outlined text-[18px]">{icon || "inventory_2"}</span>
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-label-md text-on-surface font-medium truncate">{title}</span>
        <span className="text-body-sm text-on-surface-variant truncate">
          {owner} {location ? `· ${location}` : ""}
        </span>
      </div>
    </div>
  );
}
