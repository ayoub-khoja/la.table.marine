import { NextResponse } from "next/server";
import { getOnlineOrderMenu } from "@library/online-order/menu";

export async function GET() {
  try {
    const menu = await getOnlineOrderMenu();

    return NextResponse.json({
      success: true,
      ...menu,
    });
  } catch (error) {
    console.error("[api/online-order/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le menu." },
      { status: 500 }
    );
  }
}
