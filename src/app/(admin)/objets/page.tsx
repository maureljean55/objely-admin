import Link from "next/link";
import { listItems, type ItemType, type ItemStatus } from "@/lib/queries/items";
import { Badge } from "@/components/Badge";
import { formatNumber, formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const STATUS_BADGE: Record<ItemStatus, { label: string; variant: "warning" | "tertiary" | "success" }> = {
  searching: { label: "En attente", variant: "warning" },
  matched: { label: "Correspondance", variant: "tertiary" },
  recovered: { label: "Retrouvé", variant: "success" },
  returned: { label: "Restitué", variant: "success" },
};

export default async function ObjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; status?: string; q?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const type = (["lost", "found"].includes(params.type ?? "") ? params.type : "all") as ItemType | "all";
  const status = (["searching", "matched", "recovered", "returned"].includes(params.status ?? "") ? params.status : "all") as ItemStatus | "all";
  const search = params.q ?? "";
  const includeDeleted = params.deleted === "1";

  const { rows, total, pageSize } = await listItems(page, { type, status, search, includeDeleted });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function tabHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { type: type !== "all" ? type : undefined, status: status !== "all" ? status : undefined, q: search || undefined, deleted: includeDeleted ? "1" : undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/objets?${p.toString()}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-on-surface">Objets déclarés</h1>
          <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} annonces perdues et trouvées</p>
        </div>
        <form className="relative" action="/objets">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Rechercher un objet..."
            className="h-9 pl-9 pr-3 rounded-lg bg-surface-card border border-border-subtle text-body-sm w-64 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card">
          {[
            { key: undefined, label: "Tous types" },
            { key: "lost", label: "Perdus" },
            { key: "found", label: "Trouvés" },
          ].map((t) => (
            <Link
              key={t.label}
              href={tabHref({ type: t.key })}
              className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
                (t.key ?? "all") === type ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card">
          {[
            { key: undefined, label: "Tous statuts" },
            { key: "searching", label: "En attente" },
            { key: "matched", label: "Correspondance" },
            { key: "recovered", label: "Retrouvé" },
            { key: "returned", label: "Restitué" },
          ].map((t) => (
            <Link
              key={t.label}
              href={tabHref({ status: t.key })}
              className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
                (t.key ?? "all") === status ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link
          href={tabHref({ deleted: includeDeleted ? undefined : "1" })}
          className={`px-3.5 py-1.5 rounded-xl text-label-md transition-all shadow-card ${
            includeDeleted ? "bg-danger-crimson text-white font-semibold" : "bg-surface-card text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {includeDeleted ? "Masquer supprimés" : "Voir supprimés"}
        </Link>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-bg text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Objet</th>
                <th className="py-3 px-3">Propriétaire</th>
                <th className="py-3 px-3">Lieu</th>
                <th className="py-3 px-3">Déclaré</th>
                <th className="py-3 px-3">Statut</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-border-subtle hover:bg-surface-bg/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <Link href={`/objets/${item.id}`} className="flex items-center gap-2.5">
                      <span className={`p-1.5 rounded-lg bg-surface-bg shrink-0 ${item.type === "lost" ? "text-warning-amber" : "text-sky-blue"}`}>
                        <span className="material-symbols-outlined text-[18px]">{item.categoryIcon || "inventory_2"}</span>
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-label-md text-on-surface font-medium truncate hover:underline">{item.title}</span>
                        <span className="text-body-sm text-on-surface-variant truncate">
                          {item.categoryLabel} · {item.photoCount} photo{item.photoCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col text-body-sm">
                      <span className="text-on-surface truncate">{item.ownerName}</span>
                      <span className="text-on-surface-variant truncate">{item.ownerEmail}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-body-sm text-on-surface-variant">{item.location || "—"}</td>
                  <td className="py-3.5 px-3 text-body-sm text-on-surface-variant whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                  <td className="py-3.5 px-3">
                    {item.deletedAt ? <Badge variant="danger">Supprimé</Badge> : <Badge variant={STATUS_BADGE[item.status].variant}>{STATUS_BADGE[item.status].label}</Badge>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-body-sm text-on-surface-variant">
                    Aucun objet trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/objets"
          extraParams={{ type: type !== "all" ? type : undefined, status: status !== "all" ? status : undefined, q: search, deleted: includeDeleted ? "1" : undefined }}
        />
      </div>
    </div>
  );
}
