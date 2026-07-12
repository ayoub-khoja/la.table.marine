import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import { getGa4Config } from "@library/analytics/ga4-config";
import { mapGa4ErrorResponse } from "@library/analytics/ga4-errors";
import { parsePeriodFromSearchParams } from "@library/analytics/ga4-periods";

/**
 * @param {Request} request
 * @param {(ctx: { period: import('./ga4-periods').AnalyticsPeriod, refresh: boolean }) => Promise<Record<string, unknown>>} handler
 */
export async function handleAnalyticsRoute(request, handler) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  const config = getGa4Config();
  if (!config.isConfigured) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: config.message,
      },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const { period, refresh } = parsePeriodFromSearchParams(searchParams);
    const data = await handler({ period, refresh });
    return NextResponse.json({
      success: true,
      configured: true,
      period,
      ...data,
    });
  } catch (error) {
    const mapped = mapGa4ErrorResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
