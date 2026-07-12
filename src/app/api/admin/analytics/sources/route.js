import {
  analyticsDynamic,
  analyticsRuntime,
  handleAnalyticsRoute,
} from "@library/analytics/analytics-route";
import { fetchSourcesReport } from "@library/analytics/ga4-reports";

export const runtime = analyticsRuntime;
export const dynamic = analyticsDynamic;

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const sources = await fetchSourcesReport(period, { force: refresh });
    return { sources };
  });
}
