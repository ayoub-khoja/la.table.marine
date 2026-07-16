import { NextResponse } from "next/server";
import { groupWinesBySection, listAllWines } from "@library/wines/store";

export async function GET() {
  try {
    const wines = await listAllWines();
    const sections = groupWinesBySection(wines);

    return NextResponse.json(
      {
        success: true,
        sections,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[api/wines]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger la carte des vins." },
      { status: 500 }
    );
  }
}
