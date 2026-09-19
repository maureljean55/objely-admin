import Link from "next/link";
import { listReports, type ReportCategory } from "@/lib/queries/reports";
import { setReportResolved } from "@/lib/actions/reports";
import { Badge } from "@/components/Badge";
import { formatNumber, formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  tech: "Problème technique",
  fake: "Objet ou annonce suspecte",
  info: "Information incorrecte",
  other: "Autre",
};

export default async function SignalementsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const onlyOpen = params.filter !== "all";

  const { rows, total, pageSize } = await listReports(page, onlyOpen);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Signalements</h1>
        <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} signalements soumis par les utilisateurs</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card self-start">
        <Link
          href="/signalements"
          className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${onlyOpen ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          À traiter
        </Link>
        <Link
          href="/signalements?filter=all"
          className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${!onlyOpen ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          Tous
        </Link>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
        {rows.map((report) => (
          <div key={report.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${report.resolvedAt ? "bg-success-container text-success-emerald" : "bg-danger-crimson/10 text-danger-crimson"}`}>
                <span className="material-symbols-outlined text-[20px]">flag</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-title-md text-on-surface">{CATEGORY_LABEL[report.category]}</h3>
                  {report.itemTitle && <Badge variant="neutral">{report.itemTitle}</Badge>}
                </div>
                <p className="text-body-sm text-on-surface mt-1">{report.description}</p>
                <p className="text-label-sm text-on-surface-variant mt-1.5">
                  Par {report.reporterName} {report.reporterEmail ? `(${report.reporterEmail})` : ""} · {formatDateTime(report.createdAt)}
                </p>
                {report.resolvedAt && (
                  <p className="text-label-sm text-success-emerald mt-1">
                    Résolu par {report.resolvedBy ?? "un administrateur"} le {formatDateTime(report.resolvedAt)}
                  </p>
                )}
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await setReportResolved(report.id, !report.resolvedAt);
              }}
              className="shrink-0"
            >
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors ${
                  report.resolvedAt ? "bg-surface-bg text-on-surface-variant hover:bg-surface-bg/70" : "bg-success-container text-success-emerald hover:brightness-95"
                }`}
              >
                {report.resolvedAt ? "Rouvrir" : "Marquer résolu"}
              </button>
            </form>
          </div>
        ))}
        {rows.length === 0 && <p className="p-10 text-center text-body-sm text-on-surface-variant">Aucun signalement dans cette catégorie.</p>}
        <Pagination page={page} totalPages={totalPages} basePath="/signalements" extraParams={{ filter: onlyOpen ? undefined : "all" }} />
      </div>
    </div>
  );
}
