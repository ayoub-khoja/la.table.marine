import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { getDashboardStats } from "@library/admin/stats";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("[api/admin/stats]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les statistiques." },
      { status: 500 }
    );
  }
}
