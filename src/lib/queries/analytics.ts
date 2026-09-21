import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsPeriodTotals = {
  totalVisits: number;
  uniqueVisitors: number;
  topPages: { path: string; visits: number }[];
  hourly: { hour: number; visits: number }[];
};

export type AnalyticsSummary = AnalyticsPeriodTotals & {
  daily: { day: string; visits: number }[];
  /** Same-length window immediately preceding the current one, for "+12% vs période précédente" trends. */
  previous: AnalyticsPeriodTotals;
};

const EMPTY_PERIOD: AnalyticsPeriodTotals = { totalVisits: 0, uniqueVisitors: 0, topPages: [], hourly: [] };
const EMPTY_SUMMARY: AnalyticsSummary = { ...EMPTY_PERIOD, daily: [], previous: EMPTY_PERIOD };

/** Real page-view stats aggregated in Postgres (get_analytics_summary) — see the page_views table in the main objely repo. */
export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_analytics_summary", { p_days: days });
  if (error || !data) {
    console.error("Failed to load analytics summary", error);
    return EMPTY_SUMMARY;
  }
  return data as AnalyticsSummary;
}
