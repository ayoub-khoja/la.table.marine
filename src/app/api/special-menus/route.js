import { NextResponse } from "next/server";
import { listPublishedSpecialMenus } from "@library/special-menus/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menus = await listPublishedSpecialMenus();

    return NextResponse.json(
      {
        success: true,
        menus,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[api/special-menus]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les menus spéciaux." },
      { status: 500 }
    );
  }
}
