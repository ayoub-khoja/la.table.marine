import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { listOrders } from "@library/orders/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listOrders(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/orders]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les commandes." },
      { status: 500 }
    );
  }
}
