import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { listReservations } from "@library/reservations/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listReservations(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/reservations]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les réservations." },
      { status: 500 }
    );
  }
}
