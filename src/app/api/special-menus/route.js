import { NextResponse } from "next/server";
import { listPublishedSpecialMenus } from "@library/special-menus/store";

export async function GET() {
  try {
    const menus = await listPublishedSpecialMenus();

    return NextResponse.json({
      success: true,
      menus,
    });
  } catch (error) {
    console.error("[api/special-menus]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les menus spéciaux." },
      { status: 500 }
    );
  }
}
