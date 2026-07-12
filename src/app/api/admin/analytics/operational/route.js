import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import { getOperationalStats } from "@library/analytics/operational-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const operational = await getOperationalStats();
    return NextResponse.json({ success: true, operational });
  } catch (error) {
    console.error("[api/admin/analytics/operational]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les données opérationnelles." },
      { status: 500 }
    );
  }
}
