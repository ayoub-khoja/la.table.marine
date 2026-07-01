import { NextResponse } from "next/server";
import { getActiveCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menu = await getActiveCarteMenu();

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error) {
    console.error("[api/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger la carte menu." },
      { status: 500 }
    );
  }
}
