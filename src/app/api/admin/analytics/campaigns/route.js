import { handleAnalyticsRoute } from "@library/analytics/analytics-route";
import { fetchCampaignsReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  return handleAnalyticsRoute(request, async ({ period, refresh }) => {
    const campaigns = await fetchCampaignsReport(period, { force: refresh });
    return { campaigns };
  });
}
