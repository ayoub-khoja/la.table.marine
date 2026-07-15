import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createSpecialMenu, listSpecialMenus } from "@library/special-menus/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listSpecialMenus(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/special-menus]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les menus spéciaux." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const menu = await createSpecialMenu({
      name: body?.name,
      price: body?.price,
      image: body?.image,
      subtitle: body?.subtitle,
      courses: body?.courses,
      accompaniments: body?.accompaniments,
    });

    return NextResponse.json({ success: true, menu });
  } catch (error) {
    console.error("[api/admin/special-menus]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter le menu.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
