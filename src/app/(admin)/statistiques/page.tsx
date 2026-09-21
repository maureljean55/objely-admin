import Link from "next/link";
import { getAnalyticsSummary } from "@/lib/queries/analytics";
import { StatCard } from "@/components/StatCard";
import { formatNumber } from "@/lib/format";
import { TopPagesChart } from "@/components/charts/TopPagesChart";
import { HourlyChart } from "@/components/charts/HourlyChart";
import { DailyChart } from "@/components/charts/DailyChart";

const RANGE_OPTIONS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

function truncatePath(path: string, max = 22) {
  return path.length > max ? `${path.slice(0, max - 1)}…` : path;
}

/** "+12% vs période précédente" — undefined when there's nothing to compare (both periods empty). */
function periodTrend(current: number, previous: number): { label: string; positive: boolean } | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) return { label: "Nouveau", positive: true };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { label: "Stable vs période précédente", positive: true };
  return { label: `${percent > 0 ? "+" : ""}${percent}% vs période précédente`, positive: percent > 0 };
}

export default async function StatistiquesPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = RANGE_OPTIONS.some((o) => String(o.value) === params.days) ? Number(params.days) : 30;

  const summary = await getAnalyticsSummary(days);
  const topPage = summary.topPages[0] ?? null;
  const busiestHour = summary.hourly.reduce<{ hour: number; visits: number } | null>(
    (best, h) => (h.visits > (best?.visits ?? -1) ? h : best),
    null,
  );

  const previousTopPageVisits = topPage ? summary.previous.topPages.find((p) => p.path === topPage.path)?.visits ?? 0 : 0;
  const previousBusiestHourVisits = busiestHour ? summary.previous.hourly.find((h) => h.hour === busiestHour.hour)?.visits ?? 0 : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-on-surface">Statistiques</h1>
          <p className="text-body-sm text-on-surface-variant">Fréquentation réelle de l&apos;application, sur les {days} derniers jours</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card self-start">
          {RANGE_OPTIONS.map((o) => (
            <Link
              key={o.value}
              href={`/statistiques?days=${o.value}`}
              className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
                days === o.value ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Visites totales"
          value={formatNumber(summary.totalVisits)}
          icon="visibility"
          iconColorClass="text-primary"
          trend={periodTrend(summary.totalVisits, summary.previous.totalVisits)}
        />
        <StatCard
          label="Visiteurs connectés"
          value={formatNumber(summary.uniqueVisitors)}
          icon="group"
          iconColorClass="text-tertiary"
          trend={periodTrend(summary.uniqueVisitors, summary.previous.uniqueVisitors)}
        />
        <StatCard
          label="Page la plus visitée"
          value={topPage ? truncatePath(topPage.path) : "—"}
          icon="trending_up"
          iconColorClass="text-success-emerald"
          trend={topPage ? periodTrend(topPage.visits, previousTopPageVisits) : undefined}
        />
        <StatCard
          label="Heure la plus active"
          value={busiestHour && busiestHour.visits > 0 ? `${String(busiestHour.hour).padStart(2, "0")}h` : "—"}
          icon="schedule"
          iconColorClass="text-warning-amber"
          trend={busiestHour && busiestHour.visits > 0 ? periodTrend(busiestHour.visits, previousBusiestHourVisits) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-surface-card p-6 rounded-xl shadow-card">
          <h2 className="text-headline-sm text-on-surface">Pages les plus visitées</h2>
          <p className="text-body-sm text-on-surface-variant mb-4">Nombre de visites par page sur la période</p>
          <TopPagesChart data={summary.topPages} />
        </div>

        <div className="lg:col-span-5 bg-surface-card p-6 rounded-xl shadow-card">
          <h2 className="text-headline-sm text-on-surface">Visites par heure</h2>
          <p className="text-body-sm text-on-surface-variant mb-4">Heures de la journée les plus actives (heure de Paris)</p>
          <HourlyChart data={summary.hourly} />
        </div>
      </div>

      <div className="bg-surface-card p-6 rounded-xl shadow-card">
        <h2 className="text-headline-sm text-on-surface">Visites par jour</h2>
        <p className="text-body-sm text-on-surface-variant mb-4">Évolution du trafic sur les {days} derniers jours</p>
        <DailyChart data={summary.daily} />
      </div>
    </div>
  );
}
