import { NextResponse } from "next/server";

import { getActiveCarteMenu } from "@library/menu/store";
import { getPermanentMenuUrl } from "@library/menu/public-url";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menu = await getActiveCarteMenu();

    return NextResponse.json(
      {
        success: true,
        menu,
        permanentUrl: getPermanentMenuUrl(),
        publicPath: "/menu",
        available: Boolean(menu),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger la carte menu." },
      { status: 500 }
    );
  }
}
