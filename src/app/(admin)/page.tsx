import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDashboardMetrics, getCategoryBreakdown, getRecentActivity } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/StatCard";
import { Badge, Dot } from "@/components/Badge";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const CATEGORY_COLORS = ["#087BEA", "#4FA8FF", "#8D6CF3", "#10B981", "#F59E0B", "#CBD5E1"];

const STATUS_LABEL: Record<string, { label: string; variant: "warning" | "tertiary" | "success" | "primary" }> = {
  searching: { label: "En attente", variant: "warning" },
  matched: { label: "Correspondance trouvée", variant: "tertiary" },
  recovered: { label: "Retrouvé", variant: "success" },
  returned: { label: "Restitué", variant: "success" },
};

export default async function DashboardPage() {
  const session = await getSession();
  const [metrics, categories, activity] = await Promise.all([getDashboardMetrics(), getCategoryBreakdown(), getRecentActivity(8)]);

  const totalCategoryItems = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  let cumulativePercent = 0;
  const gradientStops = categories
    .map((c, i) => {
      const start = cumulativePercent;
      cumulativePercent += (c.count / totalCategoryItems) * 100;
      return `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} ${start}% ${cumulativePercent}%`;
    })
    .join(", ");

  const successRate = metrics.lostItems > 0 ? Math.round((metrics.recoveredItems / (metrics.lostItems + metrics.foundItems || 1)) * 1000) / 10 : 0;

  return (
    <div className="flex flex-col w-full gap-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-label-sm text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Plateforme en temps réel
          </div>
          <h1 className="text-display-lg text-on-surface tracking-tight">Bonjour {session?.fullName.split(" ")[0]} 👋</h1>
          <p className="text-body-md text-on-surface-variant">Voici ce qui se passe actuellement sur Objely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Utilisateurs" value={formatNumber(metrics.totalUsers)} icon="group" iconColorClass="text-primary" />
        <StatCard label="Objets perdus" value={formatNumber(metrics.lostItems)} icon="search" iconColorClass="text-warning-amber" />
        <StatCard label="Objets trouvés" value={formatNumber(metrics.foundItems)} icon="inventory_2" iconColorClass="text-sky-blue" />
        <StatCard
          label="Objets restitués"
          value={formatNumber(metrics.recoveredItems)}
          icon="verified"
          iconColorClass="text-success-emerald"
          trend={{ label: `Succès ${successRate}%`, positive: true }}
        />
        <StatCard label="Correspondances actives" value={formatNumber(metrics.activeMatches)} icon="link" iconColorClass="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-surface-card p-6 rounded-xl shadow-card flex flex-col">
          <div>
            <h2 className="text-headline-sm text-on-surface">Répartition des déclarations</h2>
            <p className="text-body-sm text-on-surface-variant">Objets actifs par catégorie (hors supprimés)</p>
          </div>
          <div className="flex-1 flex items-center gap-8 mt-4 flex-wrap">
            {categories.length > 0 ? (
              <>
                <div
                  className="w-40 h-40 rounded-full shrink-0"
                  style={{ background: `conic-gradient(${gradientStops})` }}
                  role="img"
                  aria-label="Répartition des catégories"
                >
                  <div className="w-full h-full rounded-full bg-surface-card scale-[0.62] flex flex-col items-center justify-center text-center">
                    <span className="text-label-sm text-on-surface-variant uppercase">Total</span>
                    <span className="text-headline-md text-on-surface font-bold">{formatNumber(totalCategoryItems)}</span>
                  </div>
                </div>
                <div className="space-y-2 text-body-sm flex-1 min-w-[200px]">
                  {categories.map((c, i) => (
                    <div key={c.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-on-surface">{c.label}</span>
                      </div>
                      <span className="text-label-md text-on-surface font-semibold">
                        {c.percent}% <span className="font-normal text-on-surface-variant">({formatNumber(c.count)})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-variant">Aucune déclaration pour le moment.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <AlertCard
            href="/signalements"
            icon="flag"
            iconColorClass="bg-danger-crimson/10 text-danger-crimson"
            title={`${metrics.openReports} signalement${metrics.openReports === 1 ? "" : "s"}`}
            subtitle="Reçus ces 7 derniers jours, à examiner."
            badge={{ label: metrics.openReports > 0 ? "À traiter" : "RAS", variant: metrics.openReports > 0 ? "danger" : "success" }}
          />
          <AlertCard
            href="/correspondances"
            icon="link"
            iconColorClass="bg-warning-amber/10 text-warning-amber"
            title={`${metrics.activeMatches} correspondance${metrics.activeMatches === 1 ? "" : "s"}`}
            subtitle="En attente de confirmation par les deux parties."
            badge={{ label: "À suivre", variant: "warning" }}
          />
          <AlertCard
            href="/service-client"
            icon="chat_bubble"
            iconColorClass="bg-primary/10 text-primary"
            title={`${metrics.escalatedTickets} ticket${metrics.escalatedTickets === 1 ? "" : "s"} escaladé${metrics.escalatedTickets === 1 ? "" : "s"}`}
            subtitle="Conversations passées en support humain."
            badge={{ label: "Support", variant: "primary" }}
          />
        </div>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-headline-sm text-on-surface">Activité récente</h2>
            <p className="text-body-sm text-on-surface-variant">Dernières déclarations publiées sur la plateforme</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-bg text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Utilisateur</th>
                <th className="py-3 px-3">Objet</th>
                <th className="py-3 px-3">Lieu</th>
                <th className="py-3 px-3">Horodatage</th>
                <th className="py-3 px-5">Statut</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {activity.map((row) => {
                const status = STATUS_LABEL[row.status] ?? { label: row.status, variant: "primary" as const };
                return (
                  <tr key={row.id} className="hover:bg-surface-bg/50 transition-colors border-t border-border-subtle">
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-label-md text-on-surface font-semibold truncate">{row.userName}</span>
                        {row.userEmail && <span className="text-body-sm text-on-surface-variant truncate">{row.userEmail}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg bg-surface-bg ${row.type === "lost" ? "text-warning-amber" : "text-sky-blue"}`}>
                          <span className="material-symbols-outlined text-[18px]">{row.categoryIcon || "inventory_2"}</span>
                        </span>
                        <span className="text-label-md text-on-surface font-medium">{row.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-body-sm text-on-surface-variant">{row.location || "—"}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
                        <Dot variant={row.type === "lost" ? "warning" : "primary"} />
                        {formatRelativeTime(row.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              {activity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-body-sm text-on-surface-variant">
                    Aucune activité récente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  href,
  icon,
  iconColorClass,
  title,
  subtitle,
  badge,
}: {
  href: string;
  icon: string;
  iconColorClass: string;
  title: string;
  subtitle: string;
  badge: { label: string; variant: "danger" | "warning" | "primary" | "success" };
}) {
  return (
    <Link
      href={href}
      className="bg-surface-card p-5 rounded-xl shadow-card flex items-start justify-between gap-4 hover:bg-surface-bg/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${iconColorClass}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-title-md text-on-surface">{title}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">arrow_forward</span>
    </Link>
  );
}
