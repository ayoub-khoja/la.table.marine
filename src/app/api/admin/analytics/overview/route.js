import {
  analyticsDynamic,
  analyticsRuntime,
  handleAnalyticsRoute,
} from "@library/analytics/analytics-route";
import { buildPeriodSummary } from "@library/analytics/ga4-summary";
import {
  fetchOverviewReport,
  fetchPagesReport,
  fetchSourcesReport,
} from "@library/analytics/ga4-reports";

export const runtime = analyticsRuntime;
export const dynamic = analyticsDynamic;

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const [overview, sources, pages] = await Promise.all([
      fetchOverviewReport(period, { force: refresh }),
      fetchSourcesReport(period, { force: refresh }),
      fetchPagesReport(period, { force: refresh }),
    ]);

    const summary = buildPeriodSummary({
      period,
      kpis: overview.kpis,
      sources: sources.items,
      pages: pages.items,
      sessions: overview.sessions,
    });

    return {
      overview,
      summary,
      goals: buildGoals(overview),
    };
  });
}

/**
 * @param {{ kpis: Array<{ id: string, value: number, previousValue: number, evolution: object }>, sessions: number }} overview
 */
function buildGoals(overview) {
  const sessions = overview.sessions || 0;
  const getValue = (id) => overview.kpis.find((k) => k.id === id)?.value || 0;
  const getPrev = (id) => overview.kpis.find((k) => k.id === id)?.previousValue || 0;
  const getEvo = (id) => overview.kpis.find((k) => k.id === id)?.evolution;

  const items = [
    {
      id: "reservation_completed",
      label: "Réservations terminées",
      value: getValue("reservation_completed"),
      previousValue: getPrev("reservation_completed"),
      evolution: getEvo("reservation_completed"),
      conversionRate: sessions > 0 ? Math.round((getValue("reservation_completed") / sessions) * 1000) / 10 : 0,
      formula: "reservation_completed / sessions × 100",
    },
    {
      id: "contact_form_submitted",
      label: "Formulaires de contact",
      value: getValue("contact_form_submitted"),
      previousValue: getPrev("contact_form_submitted"),
      evolution: getEvo("contact_form_submitted"),
      conversionRate: sessions > 0 ? Math.round((getValue("contact_form_submitted") / sessions) * 1000) / 10 : 0,
      formula: "contact_form_submitted / sessions × 100",
    },
    {
      id: "phone_clicked",
      label: "Clics téléphone",
      value: getValue("phone_clicked"),
      previousValue: getPrev("phone_clicked"),
      evolution: getEvo("phone_clicked"),
      conversionRate: sessions > 0 ? Math.round((getValue("phone_clicked") / sessions) * 1000) / 10 : 0,
      formula: "phone_clicked / sessions × 100",
    },
    {
      id: "directions_clicked",
      label: "Clics itinéraire",
      value: getValue("directions_clicked"),
      previousValue: getPrev("directions_clicked"),
      evolution: getEvo("directions_clicked"),
      conversionRate: sessions > 0 ? Math.round((getValue("directions_clicked") / sessions) * 1000) / 10 : 0,
      formula: "directions_clicked / sessions × 100",
    },
  ];

  return { items, sessions };
}
