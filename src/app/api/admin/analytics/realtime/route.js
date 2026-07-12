import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import { getGa4Config } from "@library/analytics/ga4-config";
import { mapGa4ErrorResponse } from "@library/analytics/ga4-errors";
import { fetchRealtimeReport } from "@library/analytics/ga4-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  const config = getGa4Config();
  if (!config.isConfigured) {
    return NextResponse.json(
      { success: false, configured: false, error: config.message },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "1";
    const realtime = await fetchRealtimeReport({ force: refresh });
    return NextResponse.json({ success: true, configured: true, realtime });
  } catch (error) {
    const mapped = mapGa4ErrorResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
