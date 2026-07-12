import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchTimeseriesReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const timeseries = await fetchTimeseriesReport(period, { force: refresh });
    return { timeseries };
  });
}
