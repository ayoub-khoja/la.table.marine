import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchLocationsReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const locations = await fetchLocationsReport(period, { force: refresh });
    return { locations };
  });
}
