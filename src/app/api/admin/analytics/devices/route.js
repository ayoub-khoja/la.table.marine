import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchDevicesReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const devices = await fetchDevicesReport(period, { force: refresh });
    return { devices };
  });
}
