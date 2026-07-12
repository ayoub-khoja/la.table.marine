import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import {
  getGa4Config,
  getGa4PrivateKey,
  getGa4ServiceAccountEmail,
  loadServiceAccountFromFile,
  validateGa4Credentials,
} from "@library/analytics/ga4-config";
import { getGa4Client, getGa4PropertyName } from "@library/analytics/ga4-client";
import { mapGa4ErrorResponse } from "@library/analytics/ga4-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic de connexion GA4 (admin uniquement).
 */
export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  const config = getGa4Config();
  const validation = validateGa4Credentials();

  if (!config.isConfigured) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: config.message,
      checks: {
        GA4_PROPERTY_ID: Boolean(process.env.GA4_PROPERTY_ID?.trim()),
        GOOGLE_SERVICE_ACCOUNT_EMAIL: Boolean(getGa4ServiceAccountEmail()),
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: Boolean(getGa4PrivateKey()),
        service_account_json: Boolean(loadServiceAccountFromFile()),
      },
    });
  }

  if (!validation.valid) {
    return NextResponse.json({
      success: false,
      configured: true,
      connected: false,
      error: validation.error,
    });
  }

  try {
    const client = getGa4Client();
    const property = getGa4PropertyName();

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });

    const users = Number(response?.rows?.[0]?.metricValues?.[0]?.value) || 0;

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      property,
      sampleActiveUsers7d: users,
      message: "Connexion Google Analytics Data API opérationnelle.",
    });
  } catch (error) {
    const mapped = mapGa4ErrorResponse(error);
    return NextResponse.json(
      {
        ...mapped.body,
        configured: true,
        connected: false,
      },
      { status: mapped.status }
    );
  }
}
