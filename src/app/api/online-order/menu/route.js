import { NextResponse } from "next/server";
import { getOnlineOrderMenu } from "@library/online-order/menu";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menu = await getOnlineOrderMenu();

    return NextResponse.json(
      {
        success: true,
        ...menu,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[api/online-order/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le menu." },
      { status: 500 }
    );
  }
}
