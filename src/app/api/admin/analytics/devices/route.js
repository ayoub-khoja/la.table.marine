import {
  analyticsDynamic,
  analyticsRuntime,
  handleAnalyticsRoute,
} from "@library/analytics/analytics-route";
import { fetchDevicesReport } from "@library/analytics/ga4-reports";

export const runtime = analyticsRuntime;
export const dynamic = analyticsDynamic;

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const devices = await fetchDevicesReport(period, { force: refresh });
    return { devices };
  });
}
