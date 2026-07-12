import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchEventsReport, fetchFunnelReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const [events, funnel] = await Promise.all([
      fetchEventsReport(period, { force: refresh }),
      fetchFunnelReport(period, { force: refresh }),
    ]);
    return { events, funnel };
  });
}
