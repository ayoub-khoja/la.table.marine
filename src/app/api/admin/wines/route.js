import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createWine, listWines } from "@library/wines/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listWines(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/wines]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger la carte des vins." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const wine = await createWine({
      title: body?.title,
      price: body?.price,
      short: body?.short,
      section: body?.section,
      image: body?.image,
    });

    return NextResponse.json({ success: true, wine });
  } catch (error) {
    console.error("[api/admin/wines]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter le vin.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
