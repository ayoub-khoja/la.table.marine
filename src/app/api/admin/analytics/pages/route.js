import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchPagesReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const pages = await fetchPagesReport(period, { force: refresh });
    return { pages };
  });
}
